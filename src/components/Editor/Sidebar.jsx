import React from 'react';
import { Button, Card, Space, Typography } from 'antd';
import { PlusOutlined, FontSizeOutlined, AlignLeftOutlined, PictureOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { addBlock } from '../../store/editorSlice';

const { Text } = Typography;

const TOOLS = [
    { type: 'header', label: 'Заголовок', icon: <FontSizeOutlined />, props: { text: 'Новый заголовок', level: 2 } },
    { type: 'text', label: 'Текст', icon: <AlignLeftOutlined />, props: { content: 'Абзац текста...' } },
    { type: 'hero', label: 'Баннер', icon: <PictureOutlined />, props: { title: 'Новый баннер' } },
];

export const Sidebar = () => {
    const dispatch = useDispatch();

    return (
        <div style={{ padding: '16px', background: '#fff', height: '100%', borderRight: '1px solid #eee' }}>
            <Text strong>Блоки</Text>
            <Space orientation="vertical" style={{ width: '100%', marginTop: '16px' }}>
                {TOOLS.map((tool) => (
                    <Button
                        key={tool.type}
                        block
                        icon={tool.icon}
                        style={{ textAlign: 'left', height: 'auto', padding: '12px' }}
                        onClick={() => dispatch(addBlock({ type: tool.type, props: tool.props }))}
                    >
                        {tool.label}
                    </Button>
                ))}
            </Space>
        </div>
    );
};