import React from 'react';
import { HeaderBlock } from './HeaderBlock';
import { TextBlock } from './TextBlock';
import { HeroBlock } from './HeroBlock';

export const BlockRenderer = ({ block }) => {
    const { type, props } = block;

    switch (type) {
        case 'header':
            return <HeaderBlock {...props} />;
        case 'text':
            return <TextBlock {...props} />;
        case 'hero':
            return <HeroBlock {...props} />;
        default:
            return <div style={{ color: 'red' }}>Unknown component: {type}</div>;
    }
};