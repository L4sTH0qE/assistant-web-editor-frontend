import api from '../../utils/api';
import {Button, Divider, Input, message, Select, Space, Tooltip} from 'antd';
import React, {useEffect, useRef, useState} from 'react';
import {EditorContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor} from '@tiptap/react';
import {StarterKit} from '@tiptap/starter-kit';
import {Underline} from '@tiptap/extension-underline';
import {Link} from '@tiptap/extension-link';
import {Image} from '@tiptap/extension-image';
import Heading from '@tiptap/extension-heading';
import {
    BoldOutlined,
    DisconnectOutlined,
    FileTextOutlined,
    ItalicOutlined,
    LinkOutlined,
    NumberOutlined,
    OrderedListOutlined,
    PictureOutlined,
    RedoOutlined,
    StrikethroughOutlined,
    UnderlineOutlined,
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

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') e.target.blur();
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
                onKeyDown={handleKeyDown}
                style={{width: 120, fontSize: 13}}
            />
        </Tooltip>
    );
};

const ImageNodeView = ({node}) => {
    const {src, alt, title, width, height, left, top} = node.attrs;

    return (
        <NodeViewWrapper as="span" style={{display: 'inline-block', margin: '10px 0', verticalAlign: 'bottom'}}>
            <img
                src={src}
                alt={alt}
                title={title}
                style={{
                    left: left,
                    top: top,
                    position: 'relative',
                }}
            />
            {title && (
                <span style={{
                    display: 'block',
                    marginTop: '4px',
                    color: 'var(--hse-gray)',
                    fontSize: '12px',
                    fontFamily: 'HSE Sans',
                    fontStyle: 'italic',
                    lineHeight: '1.2',
                    maxWidth: width ? `${width}px` : '100%',
                    wordWrap: 'break-word'
                }}>
                    {title}
                </span>
            )}
        </NodeViewWrapper>
    );
};

const ResizableImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            alt: {default: null},
            title: {default: null},
            width: {
                default: null,
                parseHTML: element => element.style.width.replace('px', '') || element.getAttribute('width'),
            },
            height: {
                default: null,
                parseHTML: element => element.style.height.replace('px', '') || element.getAttribute('height'),
            },
            left: {
                default: null,
                parseHTML: element => element.style.left || 0,
            },
            top: {
                default: null,
                parseHTML: element => element.style.top || 0,
            },
        };
    },
    addNodeView() {
        return ReactNodeViewRenderer(ImageNodeView);
    },
    renderHTML({HTMLAttributes}) {
        const {width, height, left, top, style, ...rest} = HTMLAttributes;

        const styles = [];
        styles.push(`position: relative`);
        if (width) {
            styles.push(`width: ${width}px`);
        }
        if (height) {
            styles.push(`height: ${height}px`);
        }
        if (left) {
            styles.push(`left: ${left}px`);
        }
        if (top) {
            styles.push(`top: ${top}px`);
        }

        return ['img', {
            ...rest,
            style: styles.join('; '),
        }];
    }
});


const CustomHeading = Heading.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            id: {
                default: null,
                parseHTML: element => {
                    const id = element.getAttribute('id');
                    const anchor = element.querySelector('a[name]');
                    return id || (anchor ? anchor.getAttribute('name') : null);
                },
                renderHTML: attributes => attributes.id ? {id: attributes.id} : {},
            },
        };
    },
});

const MenuBar = ({editor}) => {
    const fileInputRef = useRef(null);
    if (!editor) return null;

    // ОБНОВЛЕННАЯ ЛОГИКА РАБОТЫ СО ССЫЛКАМИ
    const setLink = () => {
        // Если ссылка уже есть, получаем ее текущий URL, чтобы показать в prompt
        const previousUrl = editor.getAttributes('link').href;
        const promptText = previousUrl ? 'Изменить URL страницы или Якорь:' : 'Введите URL страницы или Якорь (например, #anchor):';

        const url = window.prompt(promptText, previousUrl || '');

        // Если пользователь нажал "Отмена"
        if (url === null) {
            return;
        }

        // Если пользователь стер адрес и нажал ОК - удаляем ссылку
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        // Устанавливаем или обновляем ссылку (выделяем весь текст ссылки и применяем новый URL)
        editor.chain().focus().extendMarkRange('link').setLink({href: url}).run();
    };

    // ФУНКЦИЯ ЯВНОГО УДАЛЕНИЯ ССЫЛКИ
    const removeLink = () => {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
    };

    const addFilePlaceholder = () => {
        const name = window.prompt('Введите название файла:', 'Документ.pdf');
        if (name) {
            editor.chain().focus()
                .insertContent(`<a href="#" class="hse-file-stub">[${name}]</a> `)
                .run();
        }
    };

    const handleImageSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileName = file.name.split('.')[0];
        const altText = window.prompt('Описание картинки (Alt/Title):', fileName);
        const userWidth = window.prompt('Ширина (px)? Оставьте пустым для авто', '');
        const userLeft = window.prompt('Отступ слева (px)?', '0');
        const userTop = window.prompt('Отступ сверху (px)?', '0');

        const hideLoading = message.loading('Загрузка изображения...', 0);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const {data} = await api.post('/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const permanentUrl = data.url;
            const img = new window.Image();
            img.src = permanentUrl;

            img.onload = () => {
                let finalWidth = parseFloat(userWidth) || img.naturalWidth;
                let finalHeight = (finalWidth / img.naturalWidth) * img.naturalHeight;
                finalHeight = Math.round(finalHeight * 1000) / 1000;

                let finalLeft = parseFloat(userLeft) || 0;
                let finalTop = parseFloat(userTop) || 0;

                editor.chain().focus().setImage({
                    src: permanentUrl,
                    alt: altText || '',
                    title: altText || '',
                    width: finalWidth,
                    height: finalHeight,
                    left: finalLeft,
                    top: finalTop
                }).run();

                hideLoading();
                message.success('Изображение загружено');
            };

            img.onerror = () => {
                hideLoading();
                message.error('Ошибка обработки изображения');
            }

        } catch (error) {
            hideLoading();
            console.error(error);
            message.error('Ошибка загрузки на сервер');
        }

        e.target.value = '';
    };

    const isHeading = editor.isActive('heading');
    const isLinkActive = editor.isActive('link');

    return (
        <Space wrap style={{
            padding: '8px',
            borderBottom: '1px solid #eee',
            background: '#fafafa',
            width: '100%',
            gap: 4,
            alignItems: 'center'
        }}>
            <input type="file" ref={fileInputRef} style={{display: 'none'}} accept="image/*"
                   onChange={handleImageSelect}/>
            <Tooltip title="Абзац (Стиль)">
                <Select
                    value={isHeading ? editor.getAttributes('heading').level : 'p'}
                    style={{width: 140, fontFamily: "HSE Sans"}}
                    onChange={(value) => {
                        if (value === 'p') editor.chain().focus().setParagraph().run();
                        else editor.chain().focus().setHeading({level: value}).run();
                    }}
                    options={[
                        {value: 'p', label: 'Обычный текст'},
                        {value: 2, label: 'Заголовок H2'},
                        {value: 3, label: 'Заголовок H3'},
                        {value: 4, label: 'Заголовок H4'},
                        {value: 5, label: 'Заголовок H5'},
                        {value: 6, label: 'Заголовок H6'},
                    ]}
                />
            </Tooltip>
            {isHeading && <AnchorInput editor={editor}/>}

            <Divider orientation="vertical"/>

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

            <Tooltip title={isLinkActive ? "Изменить ссылку" : "Вставить ссылку"}>
                <Button size="small" icon={<LinkOutlined/>} type={isLinkActive ? 'primary' : 'text'} onClick={setLink}/>
            </Tooltip>

            <Tooltip title="Удалить ссылку">
                <Button size="small" icon={<DisconnectOutlined/>} type="text"
                        
                        onClick={removeLink}/>
            </Tooltip>

            <Tooltip title="Вставить изображение">
                <Button size="small" icon={<PictureOutlined/>} onClick={() => fileInputRef.current?.click()}/>
            </Tooltip>
            <Tooltip title="Загрузить файл">
                <Button size="small" icon={<FileTextOutlined/>} onClick={addFilePlaceholder}/>
            </Tooltip>

            <Divider orientation="vertical"/>

            <Tooltip title="Маркированный список">
                <Button size="small" icon={<UnorderedListOutlined/>}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}/>
            </Tooltip>
            <Tooltip title="Нумерованный список">
                <Button size="small" icon={<OrderedListOutlined/>}
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}/>
            </Tooltip>

            <Divider orientation="vertical"/>

            <Tooltip title="Отменить">
                <Button size="small" icon={<UndoOutlined/>} onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}/>
            </Tooltip>
            <Tooltip title="Повторить">
                <Button size="small" icon={<RedoOutlined/>} onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}/>
            </Tooltip>
        </Space>
    );
};

export const RichTextEditor = ({value, onChange}) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({heading: false, blockquote: false, codeBlock: false}),
            CustomHeading.configure({levels: [2, 3, 4, 5, 6]}),
            Underline,
            Link.configure({
                openOnClick: false,
                addTarget: false,
                HTMLAttributes: {
                    target: null,
                    rel: null,
                    class: null,
                },
            }),
            ResizableImage.configure({inline: false, allowBase64: true}),
        ],
        content: value,
        editorProps: {
            transformPastedHTML(html) {
                return html
                    .replace(/ style="[^"]*"/g, "")
                    .replace(/ class="[^"]*"/g, "")
                    .replace(/align="[^"]*"/g, "")
                    .replace(/face="[^"]*"/g, "")
                    .replace(/size="[^"]*"/g, "");
            },
        },
        onUpdate: ({editor}) => {
            onChange(editor.getHTML());
        },
    });

    useEffect(() => {
        if (editor && value !== undefined && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    return (
        <div style={{border: '1px solid #d9d9d9', borderRadius: '4px', overflow: 'hidden', background: '#fff'}}>
            <MenuBar editor={editor}/>
            <div style={{
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
