import api from '../../utils/api';
import {Button, Divider, Form, Input, InputNumber, message, Modal, Select, Space, Tooltip, Typography} from 'antd';
import React, {useEffect, useRef, useState} from 'react';
import {EditorContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor} from '@tiptap/react';
import {StarterKit} from '@tiptap/starter-kit';
import {Underline} from '@tiptap/extension-underline';
import {Link} from '@tiptap/extension-link';
import {Image} from '@tiptap/extension-image';
import {Heading} from '@tiptap/extension-heading';
import {Table} from '@tiptap/extension-table';
import {TableRow} from '@tiptap/extension-table-row';
import {TableCell} from '@tiptap/extension-table-cell';
import {TableHeader} from '@tiptap/extension-table-header';


import {
    BoldOutlined,
    DeleteColumnOutlined,
    DeleteRowOutlined,
    DisconnectOutlined,
    FileTextOutlined,
    InsertRowBelowOutlined,
    InsertRowRightOutlined,
    ItalicOutlined,
    LinkOutlined,
    NumberOutlined,
    PictureOutlined,
    RedoOutlined,
    StrikethroughOutlined,
    TableOutlined,
    UnderlineOutlined,
    UndoOutlined
} from '@ant-design/icons';


const AnchorInput = ({editor}) => {
    const headingAttrs = editor.getAttributes('heading');
    const [localValue, setLocalValue] = useState(headingAttrs.id || '');


    useEffect(() => {
        const docActive = document.activeElement;
        if (docActive && docActive.getAttribute('id') !== 'anchor-input-field') {
            setLocalValue(headingAttrs.id || '');
        }
    }, [headingAttrs.id]);


    const handleBlur = () => {
        const newSlug = localValue.trim().replace(/\s+/g, '-');
        if (newSlug !== (headingAttrs.id || '')) {
            editor.chain().focus().updateAttributes('heading', {id: newSlug}).run();
        }
    };


    return (
        <Tooltip title="Название якоря">
            <Input
                id="anchor-input-field"
                prefix={<NumberOutlined style={{color: 'var(--hse-gray)'}}/>}
                placeholder="anchor"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                onPressEnter={(e) => e.target.blur()}
                style={{width: 120, fontSize: 13}}
            />
        </Tooltip>
    );
};


const ImageNodeView = ({ node, selected, editor, getPos }) => {
    const { src, alt, title, width, height } = node.attrs;


    const handleClick = () => {
        if (typeof getPos === 'function') {
            editor.chain().focus().setNodeSelection(getPos()).run();
        }
    };


    return (
        <NodeViewWrapper
            as="span"
            style={{
                display: 'inline-block',
                margin: '10px 0',
                verticalAlign: 'bottom',
                lineHeight: 0
            }}
        >
            <img
                src={src}
                alt={alt}
                title={title}
                data-drag-handle
                onClick={handleClick}
                style={{
                    width: width ? `${width}px` : 'auto',
                    height: height ? `${height}px` : 'auto',
                    maxWidth: '100%',
                    outline: selected ? '2px solid #1677ff' : '1px solid #eee',
                    outlineOffset: selected ? '-2px' : '-1px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                }}
            />
            {title && (
                <span style={{
                    display: 'block',
                    marginTop: '4px',
                    color: 'var(--hse-gray)',
                    fontSize: '12px',
                    fontStyle: 'italic',
                    lineHeight: 'normal'
                }}>
                {title}
            </span>
            )}
        </NodeViewWrapper>
    );
};


const ResizableImage = Image.extend({
    draggable: true,


    addAttributes() {
        return {
            ...this.parent?.(),
            alt: { default: null },
            title: { default: null },
            width: { default: null },
            height: { default: null },
        };
    },
    addNodeView() {
        return ReactNodeViewRenderer(ImageNodeView);
    },
});


const CustomHeading = Heading.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            id: {
                default: null,
                parseHTML: element => element.getAttribute('id') || element.querySelector('a[name]')?.getAttribute('name') || null,
                renderHTML: attributes => attributes.id ? {id: attributes.id} : {},
            },
        };
    },
});


// --- ПАНЕЛЬ ИНСТРУМЕНТОВ ---
const MenuBar = ({editor}) => {
    const fileInputRef = useRef(null);


    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isFileModalOpen, setIsFileModalOpen] = useState(false);

    const [linkForm] = Form.useForm();
    const [imageForm] = Form.useForm();
    const [fileForm] = Form.useForm();
    const [currentImageSrc, setCurrentImageSrc] = useState(null);


    const [, setUpdateId] = useState(0);


    useEffect(() => {
        if (!editor) return;
        const handleTransaction = () => setUpdateId(prev => prev + 1);
        editor.on('transaction', handleTransaction);
        return () => editor.off('transaction', handleTransaction);
    }, [editor]);


    if (!editor) return null;


    const isHeading = editor.isActive('heading');
    const isLinkActive = editor.isActive('link');
    const isImageActive = editor.isActive('image');


    // --- ЛОГИКА ССЫЛОК ---
    const openLinkModal = () => {
        const previousUrl = editor.getAttributes('link').href;
        linkForm.setFieldsValue({ url: previousUrl || '' });
        setIsLinkModalOpen(true);
    };


    const handleLinkSubmit = (values) => {
        const { url } = values;

        if (!url || url.trim() === '') {
            // Если поле очистили, удаляем ссылку
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            // Добавляем или обновляем ссылку
            editor.chain().focus().extendMarkRange('link').setLink({href: url}).run();
        }
        setIsLinkModalOpen(false);
    };


    // --- ЛОГИКА ФАЙЛОВ ---
    const openFileModal = () => {
        fileForm.setFieldsValue({fileName: 'Документ.pdf'});
        setIsFileModalOpen(true);
    };


    const handleFileSubmit = (values) => {
        editor.chain().focus().insertContent(`<a href="#" class="hse-file-stub">[${values.fileName}]</a> `).run();
        setIsFileModalOpen(false);
    };


    // --- ЛОГИКА ИЗОБРАЖЕНИЙ ---
    const handleImageIconClick = () => {
        if (editor.isActive('image')) {
            const attrs = editor.getAttributes('image');
            setCurrentImageSrc(attrs.src);
            imageForm.setFieldsValue({title: attrs.title, width: attrs.width, height: attrs.height});
            setIsImageModalOpen(true);
        } else {
            fileInputRef.current?.click();
        }
    };


    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;


        const hideLoading = message.loading('Загрузка изображения на сервер...', 0);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const {data} = await api.post('/files/upload', formData, {headers: {'Content-Type': 'multipart/form-data'}});


            const permanentUrl = data.url;
            setCurrentImageSrc(permanentUrl);
            imageForm.setFieldsValue({title: file.name.split('.')[0], width: null, height: null});
            setIsImageModalOpen(true);
        } catch (error) {
            console.error(error);
            message.error('Ошибка загрузки на сервер');
        } finally {
            hideLoading();
            e.target.value = '';
        }
    };


    const handleImageSubmit = (values) => {
        editor.chain().focus().setImage({
            src: currentImageSrc,
            alt: values.title || '',
            title: values.title || '',
            width: values.width || null,
            height: values.height || null
        }).run();
        setIsImageModalOpen(false);
    };


    return (
        <>
            <Space wrap style={{
                padding: '8px',
                borderBottom: '1px solid #eee',
                background: '#fafafa',
                width: '100%',
                gap: 4
            }}>


                <input type="file" ref={fileInputRef} style={{display: 'none'}} accept="image/*"
                       onChange={handleImageUpload}/>


                {/* ЗАГОЛОВКИ */}
                <Select
                    value={isHeading ? editor.getAttributes('heading').level : 'p'}
                    style={{width: 140, fontFamily: "HSE Sans"}}
                    onChange={(val) => val === 'p' ? editor.chain().focus().setParagraph().run() : editor.chain().focus().setHeading({level: val}).run()}
                    options={[
                        {value: 'p', label: 'Обычный текст'},
                        {value: 2, label: 'Заголовок H2'},
                        {value: 3, label: 'Заголовок H3'},
                        {value: 4, label: 'Заголовок H4'},
                        {value: 5, label: 'Заголовок H5'},
                        {value: 6, label: 'Заголовок H6'},
                    ]}
                />
                {isHeading && <AnchorInput editor={editor}/>}


                <Divider orientation="vertical"/>


                {/* ТЕКСТ */}
                <Tooltip title="Жирный"><Button size="small" icon={<BoldOutlined/>}
                                                type={editor.isActive('bold') ? 'primary' : 'text'}
                                                onClick={() => editor.chain().focus().toggleBold().run()}/></Tooltip>
                <Tooltip title="Курсив"><Button size="small" icon={<ItalicOutlined/>}
                                                type={editor.isActive('italic') ? 'primary' : 'text'}
                                                onClick={() => editor.chain().focus().toggleItalic().run()}/></Tooltip>
                <Tooltip title="Подчеркнутый"><Button size="small" icon={<UnderlineOutlined/>}
                                                      type={editor.isActive('underline') ? 'primary' : 'text'}
                                                      onClick={() => editor.chain().focus().toggleUnderline().run()}/></Tooltip>
                <Tooltip title="Зачеркнутый"><Button size="small" icon={<StrikethroughOutlined/>}
                                                     type={editor.isActive('strike') ? 'primary' : 'text'}
                                                     onClick={() => editor.chain().focus().toggleStrike().run()}/></Tooltip>


                <Divider orientation="vertical"/>


                {/* ССЫЛКИ, КАРТИНКИ, ФАЙЛЫ */}
                <Tooltip
                    title={isLinkActive ? "Изменить ссылку" : "Вставить ссылку"}
                    trigger="hover"
                    key={`link-${isLinkActive}`}
                >
                    <Button size="small" icon={<LinkOutlined/>} type={isLinkActive ? 'primary' : 'text'}
                            onClick={openLinkModal}/>
                </Tooltip>
                <Tooltip title="Удалить ссылку">
                    <Button size="small" icon={<DisconnectOutlined/>} type="text" disabled={!isLinkActive}
                            onClick={() => editor.chain().focus().extendMarkRange('link').unsetLink().run()}/>
                </Tooltip>


                <Tooltip
                    title={isImageActive ? "Настройки изображения" : "Вставить изображение"}
                    trigger="hover"
                    key={`img-${isImageActive}`}
                >
                    <Button size="small" icon={<PictureOutlined/>} type={isImageActive ? 'primary' : 'text'}
                            onClick={handleImageIconClick}/>
                </Tooltip>
                <Tooltip title="Добавить файл для скачивания">
                    <Button size="small" icon={<FileTextOutlined/>} onClick={openFileModal}/>
                </Tooltip>


                <Divider orientation="vertical"/>


                {/* ТАБЛИЦЫ */}
                <Tooltip title="Создать таблицу 3x3">
                    <Button size="small" icon={<TableOutlined/>} onClick={() => editor.chain().focus().insertTable({
                        rows: 3,
                        cols: 3,
                        withHeaderRow: true
                    }).run()}/>
                </Tooltip>
                {editor.isActive('table') && (
                    <>
                        <Tooltip title="Добавить строку ниже"><Button size="small" icon={<InsertRowBelowOutlined/>}
                                                                      onClick={() => editor.chain().focus().addRowAfter().run()}/></Tooltip>
                        <Tooltip title="Добавить столбец справа"><Button size="small" icon={<InsertRowRightOutlined/>}
                                                                         onClick={() => editor.chain().focus().addColumnAfter().run()}/></Tooltip>
                        <Tooltip title="Удалить строку"><Button size="small" icon={<DeleteRowOutlined/>} danger
                                                                onClick={() => editor.chain().focus().deleteRow().run()}/></Tooltip>
                        <Tooltip title="Удалить столбец"><Button size="small" icon={<DeleteColumnOutlined/>} danger
                                                                 onClick={() => editor.chain().focus().deleteColumn().run()}/></Tooltip>
                    </>
                )}


                <Divider orientation="vertical"/>
                <Tooltip title="Отменить"><Button size="small" icon={<UndoOutlined/>}
                                                  onClick={() => editor.chain().focus().undo().run()}
                                                  disabled={!editor.can().undo()}/></Tooltip>
                <Tooltip title="Повторить"><Button size="small" icon={<RedoOutlined/>}
                                                   onClick={() => editor.chain().focus().redo().run()}
                                                   disabled={!editor.can().redo()}/></Tooltip>
            </Space>


            {/* МОДАЛКА ССЫЛКИ */}
            <Modal
                title={isLinkActive ? "Изменить ссылку" : "Вставить ссылку"}
                open={isLinkModalOpen}
                onOk={() => linkForm.submit()}
                onCancel={() => setIsLinkModalOpen(false)}
                okText="Сохранить"
                cancelText="Отмена"
            >
                <Form form={linkForm} layout="vertical" onFinish={handleLinkSubmit}>
                    <Form.Item
                        name="url"
                        label="URL или Якорь (#)"
                        extra="Оставьте поле пустым, чтобы удалить ссылку."
                    >
                        <Input placeholder="Например: https://example.com или #anchor" />
                    </Form.Item>
                </Form>
            </Modal>


            {/* МОДАЛКА ИЗОБРАЖЕНИЯ */}
            <Modal title="Настройки изображения" open={isImageModalOpen} onOk={() => imageForm.submit()}
                   onCancel={() => setIsImageModalOpen(false)} okText="Сохранить" cancelText="Отмена">
                <Form form={imageForm} layout="vertical" onFinish={handleImageSubmit}>
                    <Form.Item name="title" label="Описание (title/alt)"><Input
                        placeholder="Введите описание для слабовидящих"/></Form.Item>
                    <Space>
                        <Form.Item name="width" label="Ширина (px)"><InputNumber placeholder="Авто" min={10}
                                                                                 max={2000}/></Form.Item>
                        <Form.Item name="height" label="Высота (px)"><InputNumber placeholder="Авто" min={10}
                                                                                  max={2000}/></Form.Item>
                    </Space>
                </Form>
            </Modal>


            {/* МОДАЛКА ФАЙЛА */}
            <Modal title="Добавление файла" open={isFileModalOpen} onOk={() => fileForm.submit()}
                   onCancel={() => setIsFileModalOpen(false)} okText="Добавить" cancelText="Отмена">
                <Form form={fileForm} layout="vertical" onFinish={handleFileSubmit}>
                    <Form.Item name="fileName" label="Отображаемое имя файла" rules={[{required: true}]}>
                        <Input placeholder="Например: Регламент_2026.pdf"/>
                    </Form.Item>
                    <Typography.Text type="secondary">В редактор будет добавлена заглушка, которую при экспорте нужно
                        будет заменить на реальный файл.</Typography.Text>
                </Form>
            </Modal>
        </>
    );
};


export const RichTextEditor = ({value, onChange}) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({heading: false, blockquote: false, codeBlock: false}),
            CustomHeading.configure({levels: [2, 3, 4, 5, 6]}),
            Underline,
            Link.configure({openOnClick: false}),
            ResizableImage.configure({inline: false, allowBase64: true}),
            Table.configure({
                resizable: false,
                allowTableNodeSelection: false,
            }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: value,
        editorProps: {
            // ОЧИСТКА MS WORD И EXCEL
            transformPastedHTML(html) {
                return html
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/ style="[^"]*"/gi, "")
                    .replace(/ class="[^"]*"/gi, "")
                    .replace(/ bgcolor="[^"]*"/gi, "")
                    .replace(/ width="[^"]*"/gi, "")
                    .replace(/ height="[^"]*"/gi, "")
                    .replace(/ valign="[^"]*"/gi, "")
                    .replace(/ align="[^"]*"/gi, "")
                    .replace(/&nbsp;/gi, " ")
                    .replace(/\u00A0/g, " ");
            },
        },
        onUpdate: ({editor}) => {
            onChange(editor.getHTML());
        },
    });

    useEffect(() => {
        if (!editor || value === undefined) return;

        if (editor.isFocused) return;

        if (value !== editor.getHTML()) {
            editor.commands.setContent(value, false);
        }
    }, [value, editor]);

    return (
        <div style={{border: '1px solid #d9d9d9', borderRadius: '4px', overflow: 'hidden', background: '#fff'}}>
            <MenuBar editor={editor}/>
            <div className="tiptap-wrapper" style={{
                minHeight: '200px',
                maxHeight: '500px',
                overflowY: 'auto',
                padding: '24px',
                fontFamily: 'HSE Sans, sans-serif'
            }}>
                <EditorContent editor={editor}/>
            </div>
        </div>
    );
};
