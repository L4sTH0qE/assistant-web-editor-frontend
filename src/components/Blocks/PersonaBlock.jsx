import React from 'react';

export const PersonBlock = ({ name, photoUrl }) => {
    return (
        <div style={{ pointerEvents: 'none', background: '#fafafa', padding: '20px', border: '1px dashed #d9d9d9', borderRadius: '8px' }}>
            <p style={{ textAlign: 'center', margin: 0 }}>
                <img
                    alt={name}
                    className="g-pic"
                    height="200"
                    src={photoUrl}
                    width="200"
                    style={{ objectFit: 'cover', borderRadius: '4px' }}
                />
            </p>
            <p className="h4 c" style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold', margin: '16px 0 0 0' }}>
                {name}
            </p>
        </div>
    );
};
