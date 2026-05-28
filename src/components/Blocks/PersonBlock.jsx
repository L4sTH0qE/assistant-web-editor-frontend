import React from 'react';

export const PersonBlock = ({ name, photoUrl }) => {
    return (
        <div style={{ pointerEvents: 'none', padding: '20px' }}>
            <p style={{ textAlign: 'center', margin: 0 }}>
                <img
                    alt={name}
                    className="g-pic"
                    height="200"
                    src={photoUrl}
                    width="200"
                    style={{ objectFit: 'cover', borderRadius: '50%' }}
                />
            </p>
            <p className="h4 c" style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold', margin: '16px 0 0 0' }}>
                {name}
            </p>
        </div>
    );
};
