import React, {useEffect, useRef, useState} from 'react';
import {EditorContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor} from '@tiptap/react';
import {StarterKit} from '@tiptap/starter-kit';
import {Underline} from '@tiptap/extension-underline';
import {Link} from '@tiptap/extension-link';
import {Image} from '@tiptap/extension-image';
import Heading from '@tiptap/extension-heading';
import {Button, Divider, Input, Select, Space, Tooltip} from 'antd';
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


// --- Компонент ввода якоря ---
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
        <Tooltip title="Название якоря (id)">
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
            {/* Отображаем название файла серым цветом */}
            {title && (
                <span style={{
                    display: 'block',
                    marginTop: '4px',
                    color: '#999',
                    fontSize: '11px',
                    textAlign: 'center',
                    fontFamily: 'HSE Sans',
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

// --- Расширение IMG с title и размерами ---
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
        styles.push('display: inline-block');
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

    const setLink = () => {
        if (editor.isActive('link')) {
            editor.chain().focus().unsetLink().run();
            return;
        }
        const url = window.prompt('Введите URL страницы или Якорь (например, #anchor):');
        if (url) editor.chain().focus().extendMarkRange('link').setLink({href: url}).run();
    };

    const addFilePlaceholder = () => {
        const name = window.prompt('Введите название файла:', 'Документ.pdf');
        if (name) {
            editor.chain().focus()
                .insertContent(`<a href="#" class="hse-file-stub">[${name}]</a> `)
                .run();
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);

        const fileName = file.name.split('.')[0];
        const altText = window.prompt('Описание картинки (Alt/Title):', fileName);
        const userWidth = window.prompt('Ширина (px)?', '600');
        const userLeft = window.prompt('Отступ слева (px)?', '0');
        const userTop = window.prompt('Отступ сверху (px)?', '0');

        const img = new window.Image();
        img.src = objectUrl;

        img.onload = () => {
            let finalWidth = parseFloat(userWidth) || img.naturalWidth;
            let finalHeight = (finalWidth / img.naturalWidth) * img.naturalHeight;
            finalHeight = Math.round(finalHeight * 1000) / 1000;
            let finalLeft = parseFloat(userLeft) || 0;
            let finalTop = parseFloat(userTop) || 0;

            console.error("handleImageSelect");
            editor.chain().focus().setImage({
                src: objectUrl,
                alt: altText || '',
                title: altText || '',
                width: finalWidth,
                height: finalHeight,
                left: finalLeft,
                top: finalTop
            }).run();
        };

        e.target.value = '';
    };

    const isHeading = editor.isActive('heading');

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

            <Select
                value={isHeading ? editor.getAttributes('heading').level : 'p'}
                style={{width: 130, fontFamily: "HSE Sans"}}
                onChange={(value) => {
                    if (value === 'p') editor.chain().focus().setParagraph().run();
                    else editor.chain().focus().setHeading({level: value}).run();
                }}
                options={[
                    {value: 'p', label: 'Обычный'},
                    {value: 2, label: 'Заголовок H2'},
                    {value: 3, label: 'Заголовок H3'},
                    {value: 4, label: 'Заголовок H4'},
                    {value: 5, label: 'Заголовок H5'},
                    {value: 6, label: 'Заголовок H6'},
                ]}
            />

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
            <Button size="small" icon={<LinkOutlined/>} type={editor.isActive('link') ? 'primary' : 'text'}
                    onClick={setLink}/>
            {editor.isActive('link') && (
                <Tooltip title="Убрать ссылку">
                    <Button size="small" icon={<DisconnectOutlined/>}
                            onClick={() => editor.chain().focus().unsetLink().run()}/>
                </Tooltip>
            )}
            <Button size="small" icon={<PictureOutlined/>} onClick={() => fileInputRef.current?.click()}/>
            <Button size="small" icon={<FileTextOutlined/>} onClick={addFilePlaceholder}/>

            <Divider orientation="vertical"/>
            <Button size="small" icon={<UnorderedListOutlined/>}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}/>
            <Button size="small" icon={<OrderedListOutlined/>}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}/>

            <Divider orientation="vertical"/>
            <Button size="small" icon={<UndoOutlined/>} onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}/>
            <Button size="small" icon={<RedoOutlined/>} onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}/>
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


