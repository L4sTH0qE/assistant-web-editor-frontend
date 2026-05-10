import React from 'react';
import {TextBlock} from './TextBlock';
import {PersonBlock} from './PersonBlock';

export const BlockRenderer = ({block}) => {
    const {type, props} = block;

    switch (type) {
        case 'text':
            return <TextBlock {...props} />;
        case 'person':
            return <PersonBlock {...props} />;
        default:
            return <div style={{color: 'red'}}>Unknown component: {type}</div>;
    }
};