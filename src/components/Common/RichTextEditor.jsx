import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Button, Space, Tooltip, Select } from 'antd';
import {
    BoldOutlined,
    ItalicOutlined,
    UnderlineOutlined,
    StrikethroughOutlined,
    OrderedListOutlined,
    UnorderedListOutlined,
    UndoOutlined,
    RedoOutlined,
    AlignLeftOutlined,
    AlignCenterOutlined,
    AlignRightOutlined
} from '@ant-design/icons';

const MenuBar = ({ editor }) => {
    if (!editor) return null;

    return (
        <Space wrap
               style={{padding: '8px', borderBottom: '1px solid #eee', background: '#fafafa', width: '100%', gap: 4}}>

            <Tooltip title="Шрифт">
            <Select
                defaultValue='HSE Sans'
                style={{ width: 120 }}
                onChange={(value) => editor.chain().focus().setFontFamily(value).run()}
                options={[
                    { value: 'HSE Sans', label: 'HSE Sans' },
                    { value: 'Inter', label: 'Inter' },
                    { value: 'Arial', label: 'Arial' },
                    { value: 'Georgia', label: 'Georgia' },
                    { value: 'Times New Roman', label: 'Times New Roman' },
                ]}
            />
            </Tooltip>

            <div style={{width: 1, height: 16, background: '#ddd', margin: '0 4px'}}/>

            <Tooltip title="Жирный">
                <Button
                    size="small"
                    icon={<BoldOutlined/>}
                    type={editor.isActive('bold') ? 'primary' : 'text'}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                />
            </Tooltip>
            <Tooltip title="Курсив">
                <Button
                    size="small"
                    icon={<ItalicOutlined/>}
                    type={editor.isActive('italic') ? 'primary' : 'text'}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                />
            </Tooltip>
            <Tooltip title="Подчеркнутый">
                <Button
                    size="small"
                    icon={<UnderlineOutlined/>}
                    type={editor.isActive('underline') ? 'primary' : 'text'}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                />
            </Tooltip>
            <Tooltip title="Зачеркнутый">
                <Button
                    size="small"
                    icon={<StrikethroughOutlined/>}
                    type={editor.isActive('strike') ? 'primary' : 'text'}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                />
            </Tooltip>

            <div style={{width: 1, height: 16, background: '#ddd', margin: '0 4px'}}/>

            <Tooltip title="Маркированный список">
                <Button
                    size="small"
                    icon={<UnorderedListOutlined/>}
                    type={editor.isActive('bulletList') ? 'primary' : 'text'}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                />
            </Tooltip>
            <Tooltip title="Нумерованный список">
                <Button
                    size="small"
                    icon={<OrderedListOutlined/>}
                    type={editor.isActive('orderedList') ? 'primary' : 'text'}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                />
            </Tooltip>

            <div style={{width: 1, height: 16, background: '#ddd', margin: '0 4px'}}/>

            <Tooltip title="Выравнивание по левому краю">
            <Button size="small" icon={<AlignLeftOutlined/>}
                    type={editor.isActive({textAlign: 'left'}) ? 'primary' : 'text'}
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}/>
            </Tooltip>

            <Tooltip title="Выравнивание по центру">
            <Button size="small" icon={<AlignCenterOutlined/>}
                    type={editor.isActive({textAlign: 'center'}) ? 'primary' : 'text'}
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}/>
            </Tooltip>

            <Tooltip title="Выравнивание по правому краю">
            <Button size="small" icon={<AlignRightOutlined/>}
                    type={editor.isActive({textAlign: 'right'}) ? 'primary' : 'text'}
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}/>
            </Tooltip>

            <div style={{width: 1, height: 16, background: '#ddd', margin: '0 4px'}}/>

            <Tooltip title="Отменить">
                <Button
                    size="small"
                    icon={<UndoOutlined/>}
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                />
            </Tooltip>
            <Tooltip title="Повторить">
                <Button
                    size="small"
                    icon={<RedoOutlined/>}
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                />
            </Tooltip>
        </Space>
    );
};

export const RichTextEditor = ({value, onChange}) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextStyle,
            FontFamily,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    return (
        <div style={{ border: '1px solid #d9d9d9', borderRadius: '4px', overflow: 'hidden' }}>
            <MenuBar editor={editor} />
            <div style={{ minHeight: '150px', maxHeight: '400px', overflowY: 'auto', padding: '12px' }}>
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};