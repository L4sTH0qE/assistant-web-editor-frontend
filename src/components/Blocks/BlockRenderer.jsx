import React from 'react';
import {TextBlock} from './TextBlock';

export const BlockRenderer = ({block}) => {
    const {type, props} = block;

    switch (type) {
        case 'text':
            return <TextBlock {...props} />;
        default:
            return <div style={{color: 'red'}}>Unknown component: {type}</div>;
    }
};