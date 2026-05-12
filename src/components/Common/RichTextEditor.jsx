import api from '../../utils/api';
import {Button, Divider, Form, Input, InputNumber, message, Modal, Select, Space, Tooltip, Typography} from 'antd';
import React, {useEffect, useRef, useState} from 'react';
import {EditorContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor} from '@tiptap/react';
import {StarterKit} from '@tiptap/starter-kit';
import {Link} from '@tiptap/extension-link';
import {Image} from '@tiptap/extension-image';
import {Heading} from '@tiptap/extension-heading';
import {Table} from '@tiptap/extension-table';
import {TableRow} from '@tiptap/extension-table-row';
import {TableCell} from '@tiptap/extension-table-cell';
import {TableHeader} from '@tiptap/extension-table-header';
import CharacterCount from '@tiptap/extension-character-count';
import { Node, mergeAttributes } from '@tiptap/core';

import {
    BoldOutlined,
    DeleteColumnOutlined,
    DeleteOutlined,
    DeleteRowOutlined,
    DisconnectOutlined,
    FileTextOutlined,
    InsertRowBelowOutlined,
    InsertRowRightOutlined,
    ItalicOutlined,
    LinkOutlined,
    NumberOutlined,
    OrderedListOutlined,
    PictureOutlined,
    RedoOutlined,
    StrikethroughOutlined,
    TableOutlined,
    UndoOutlined,
    UnorderedListOutlined
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

    parseHTML() {
        return [
            {
                tag: 'figure.hse-figure',
                getAttrs: (node) => {
                    const img = node.querySelector('img');
                    if (!img) return false;

                    const w = img.style.width || img.getAttribute('width');
                    const h = img.style.height || img.getAttribute('height');

                    return {
                        src: img.getAttribute('src'),
                        alt: img.getAttribute('alt'),
                        title: img.getAttribute('title'),
                        width: w ? parseInt(w, 10) : null,
                        height: h ? parseInt(h, 10) : null,
                    };
                },
            },
            {
                tag: 'img[src]',
                getAttrs: (node) => {
                    const w = node.style.width || node.getAttribute('width');
                    const h = node.style.height || node.getAttribute('height');
                    return {
                        src: node.getAttribute('src'),
                        alt: node.getAttribute('alt'),
                        title: node.getAttribute('title'),
                        width: w ? parseInt(w, 10) : null,
                        height: h ? parseInt(h, 10) : null,
                    };
                }
            },
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ImageNodeView);
    },

    renderHTML({ HTMLAttributes }) {
        const { width, height, title, alt, src, ...rest } = HTMLAttributes;

        const imgAttrs = { src, alt, title, ...rest };
        if (width) imgAttrs.width = width;
        if (height) imgAttrs.height = height;

        if (title) {
            return [
                'figure', { class: 'hse-figure', style: 'margin: 10px 0; text-align: left; padding: 0;' },
                ['img', imgAttrs],
                ['figcaption', { style: 'margin-top: 4px; color: var(--hse-gray, #808080); font-size: 12px; font-style: italic;' }, title]
            ];
        }
        return ['img', imgAttrs];
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


const DocumentNodeView = ({ node }) => {
    return (
        <NodeViewWrapper as="span" style={{ display: 'inline-block', margin: '2px 4px', userSelect: 'none' }}>
            <span style={{ color: 'var(--hse-blue-accent)', textDecoration: 'underline' }}>
                {node.attrs.name}
            </span>
            <span style={{ color: 'var(--hse-gray, #808080)', fontSize: '13px', marginLeft: '6px' }}>
                ({node.attrs.ext}, {node.attrs.size})
            </span>
        </NodeViewWrapper>
    );
};


const DocumentLink = Node.create({
    name: 'documentLink',
    group: 'inline',
    inline: true,
    atom: true,

    addAttributes() {
        return {
            href: { default: null },
            name: { default: 'Документ' },
            ext: { default: 'FILE' },
            size: { default: '0 Кб' }
        };
    },
    parseHTML() {
        return [{ tag: 'span[data-type="document-link"]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return [
            'span',
            mergeAttributes(HTMLAttributes, { 'data-type': 'document-link' }),
            ['span', { style: 'color: var(--hse-blue-accent); text-decoration: underline;' }, HTMLAttributes.name || 'Документ'],
            ['span', { style: 'color: var(--hse-gray, #808080); font-size: 13px; margin-left: 6px;' }, `(${HTMLAttributes.ext}, ${HTMLAttributes.size})`]
        ];
    },
    addNodeView() {
        return ReactNodeViewRenderer(DocumentNodeView);
    }
});


// --- ПАНЕЛЬ ИНСТРУМЕНТОВ ---
const MenuBar = ({editor}) => {
    const imageInputRef = useRef(null);
    const documentInputRef = useRef(null);

    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

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
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({href: url}).run();
        }
        setIsLinkModalOpen(false);
    };

    const handleFileUpload = async (e, type) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            message.error('Размер файла превышает 10 МБ!');
            e.target.value = '';
            return;
        }
        const hideLoading = message.loading(`Загрузка ${type === 'image' ? 'изображения' : 'документа'}...`, 0);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await api.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

            if (type === 'image') {
                setCurrentImageSrc(data.url);
                imageForm.setFieldsValue({ title: data.name.split('.')[0], width: null, height: null });
                setIsImageModalOpen(true);
            } else {
                editor.chain().focus()
                    .insertContent({
                        type: 'documentLink',
                        attrs: { href: data.url, name: data.name, ext: data.extension, size: data.size }
                    })
                    .insertContent(' ')
                    .run();
            }
        } catch (error) {
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
                <input type="file" ref={imageInputRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
                <input type="file" ref={documentInputRef} style={{ display: 'none' }} accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar" onChange={(e) => handleFileUpload(e, 'document')} />


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
                <Tooltip title="Зачеркнутый"><Button size="small" icon={<StrikethroughOutlined/>}
                                                     type={editor.isActive('strike') ? 'primary' : 'text'}
                                                     onClick={() => editor.chain().focus().toggleStrike().run()}/></Tooltip>

                
                <Divider orientation="vertical"/>


                {/* СПИСКИ */}
                <Tooltip title="Маркированный список">
                    <Button size="small" icon={<UnorderedListOutlined/>}
                            onClick={() => editor.chain().focus().toggleBulletList().run()}/>
                </Tooltip>
                <Tooltip title="Нумерованный список">
                    <Button size="small" icon={<OrderedListOutlined/>}
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}/>
                </Tooltip>


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

                <Tooltip title={isImageActive ? "Настройки изображения" : "Вставить изображение"}>
                    <Button size="small" icon={<PictureOutlined />} type={isImageActive ? 'primary' : 'text'} onClick={() => {
                        if (isImageActive) {
                            const attrs = editor.getAttributes('image');
                            setCurrentImageSrc(attrs.src);
                            imageForm.setFieldsValue({ title: attrs.title, width: attrs.width, height: attrs.height });
                            setIsImageModalOpen(true);
                        } else imageInputRef.current?.click();
                    }} />
                </Tooltip>

                <Tooltip title="Добавить документ">
                    <Button size="small" icon={<FileTextOutlined />} onClick={() => documentInputRef.current?.click()} />
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
                        <Tooltip title="Удалить таблицу"><Button size="small" icon={<DeleteOutlined/>} danger
                                                                 onClick={() => editor.chain().focus().deleteTable().run()}/></Tooltip>
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
                        placeholder="Введите описание"/></Form.Item>
                    <Space>
                        <Form.Item name="width" label="Ширина (px)"><InputNumber placeholder="Авто" min={10}
                                                                                 max={900}/></Form.Item>
                        <Form.Item name="height" label="Высота (px)"><InputNumber placeholder="Авто" min={10}
                                                                                  max={1200}/></Form.Item>
                    </Space>
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
            Link.configure({openOnClick: false}),
            ResizableImage.configure({inline: false, allowBase64: true}),
            DocumentLink,
            Table.configure({
                resizable: false,
                allowTableNodeSelection: false,
            }),
            TableRow,
            TableHeader,
            TableCell,
            CharacterCount,
        ],
        content: value,
        editorProps: {
            handleClick(view, pos, event) {
                const target = event.target;
                if (target.tagName === 'A' || target.closest('span[data-type="document-link"]')) {
                    event.preventDefault();
                    return false;
                }
            },
            transformPastedHTML(html) {
                return html
                    .replace(/<figcaption[^>]*>[\s\S]*?<\/figcaption>/gi, '')
                    .replace(/<\/?u>/gi, '')
                    .replace(/text-decoration\s*:\s*underline/gi, '')
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

            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '4px 12px',
                background: '#fafafa',
                borderTop: '1px solid #eee',
                fontSize: '12px',
                color: 'var(--hse-gray)'
            }}>
                {editor && (
                    <Typography.Text type="secondary" style={{fontSize: '12px', marginTop: '12px'}}>
                        Число слов: {editor.storage.characterCount.words()} |
                        Число символов: {editor.storage.characterCount.characters()}
                    </Typography.Text>
                )}
            </div>
        </div>
    );
};
