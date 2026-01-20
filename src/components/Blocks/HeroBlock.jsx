import React from 'react';

export const HeroBlock = ({ title, imageUrl }) => {
    return (
        <div style={{
            height: '200px',
            background: imageUrl ? `url(${imageUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #0F2D69 0%, #234B9B 100%)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            padding: '40px',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {imageUrl && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />}

            <h1 style={{
                position: 'relative',
                zIndex: 1,
                fontSize: '32px',
                margin: 0,
                color: 'white'
            }}>
                {title}
            </h1>
        </div>
    );
};