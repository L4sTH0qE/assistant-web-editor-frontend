import React from 'react';
import {Button, Space, Typography} from 'antd';
import {AlignLeftOutlined} from '@ant-design/icons';
import {useDispatch} from 'react-redux';
import {addBlock} from '../../store/editorSlice';

const {Title, Text} = Typography;

const TOOLS = [
    {
        type: 'text',
        label: 'Текстовый блок',
        icon: <AlignLeftOutlined/>,
        props: {content: 'Начните вводить текст страницы...'}
    },
];

export const Sidebar = () => {
    const dispatch = useDispatch();

    return (
        <div style={{padding: '16px', background: '#fff', height: '100%', borderRight: '1px solid #eee'}}>
            <Title level={4} style={{margin: 0, fontFamily: 'HSE Sans'}}>
                Добавить блоки
            </Title>
            <Space orientation="vertical" style={{width: '100%', marginTop: '16px'}}>
                {TOOLS.map((tool) => (
                    <Button
                        key={tool.type}
                        block
                        icon={tool.icon}
                        style={{textAlign: 'left', height: 'auto', padding: '12px', fontFamily: 'HSE Sans'}}
                        onClick={() => dispatch(addBlock({type: tool.type, props: tool.props}))}
                    >
                        {tool.label}
                    </Button>
                ))}
            </Space>
        </div>
    );
};