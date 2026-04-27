import React from 'react';

export const TextBlock = ({content}) => {
    const isEmpty = !content || content.trim() === '' || content === '<p></p>';

    const displayContent = isEmpty
        ? '<p style="color: #bfbfbf;"><em>Начните вводить текст страницы...</em></p>'
        : content;

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
            dangerouslySetInnerHTML={{__html: displayContent}}
        />
    );
};