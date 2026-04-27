import React from 'react';

export const TextBlock = ({content}) => {
    const defaultText = '<p style="color: #999; font-style: italic;">Нажмите, чтобы начать редактировать текст...</p>';

    return (
        <div
            className="hse-text-content"
            style={{
                fontSize: '16px',
                fontFamily: 'HSE Sans',
                lineHeight: '1.6',
                color: '#333'
            }}
            // Опасно, но необходимо для рендера HTML из редактора
            // Так как контент создает админ, XSS маловероятен
            dangerouslySetInnerHTML={{__html: content || defaultText}}
        />
    );
};