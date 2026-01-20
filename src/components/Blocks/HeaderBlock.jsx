import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

export const HeaderBlock = ({ text, level = 2 }) => {
    const safeLevel = Math.min(Math.max(level, 1), 5);

    return (
        <Title
            level={safeLevel}
            style={{
                margin: 0,
                color: 'var(--hse-blue)',
                paddingBottom: '8px'
            }}
        >
            {text}
        </Title>
    );
};