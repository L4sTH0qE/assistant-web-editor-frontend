import React, { useEffect, useRef, useState } from 'react';


export const TextBlock = ({ content }) => {
    const containerRef = useRef(null);
    const [warnings, setWarnings] = useState([]);


    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;


        const checkImages = () => {
            if (!containerRef.current) return;
            const images = container.querySelectorAll('img');
            const containerRect = container.getBoundingClientRect();
            const newWarnings = [];


            images.forEach((img, index) => {
                const imgRect = img.getBoundingClientRect();
                // Игнорируем картинки, которые еще не отрендерились
                if (imgRect.width === 0) return;


                const containerWidth = containerRect.width;

                // Берем ширину, которую пользователь жестко задал в редакторе (если есть)
                const explicitWidthStr = img.style.width || img.getAttribute('width');
                const explicitWidth = explicitWidthStr ? parseInt(explicitWidthStr) : null;

                // Фактическая физическая ширина картинки на экране
                const visualWidth = imgRect.width;


                let exceedWidth = 0;
                let displayWidth = 0;


                // Логика: ошибка только если жестко задана ширина больше контейнера,
                // ЛИБО картинка физически вылезла за край (допуск 2px на дробные пиксели)
                if (explicitWidth && explicitWidth > containerWidth) {
                    exceedWidth = explicitWidth - containerWidth;
                    displayWidth = explicitWidth;
                } else if (visualWidth > containerWidth + 2) {
                    exceedWidth = visualWidth - containerWidth;
                    displayWidth = Math.round(visualWidth);
                }


                if (exceedWidth > 0) {
                    newWarnings.push({
                        id: `warning-${index}-${displayWidth}`,
                        // Высчитываем координаты относительно контейнера текстового блока
                        top: Math.round(imgRect.top - containerRect.top),
                        left: Math.round(containerWidth), // Стартуем ровно от правого края текста
                        width: Math.round(exceedWidth),
                        height: Math.round(imgRect.height),
                        imgWidth: displayWidth,
                    });
                }
            });


            // Обновляем стейт только если данные реально изменились (чтобы избежать лишних ререндеров)
            setWarnings((prev) => {
                const isSame = prev.length === newWarnings.length &&
                    prev.every((w, i) => w.id === newWarnings[i].id && w.top === newWarnings[i].top && w.width === newWarnings[i].width);
                return isSame ? prev : newWarnings;
            });
        };


        // Первичная проверка
        checkImages();


        // Проверка при дозагрузке самих картинок
        const images = container.querySelectorAll('img');
        images.forEach(img => {
            if (!img.complete) {
                img.addEventListener('load', checkImages);
            }
        });


        // Следим за изменением ширины контейнера (если пользователь меняет размер окна)
        const resizeObserver = new ResizeObserver(() => checkImages());
        resizeObserver.observe(container);


        return () => {
            resizeObserver.disconnect();
            images.forEach(img => img.removeEventListener('load', checkImages));
        };
    }, [content]);


    const isEmpty = !content || content.trim() === '' || content === '<p></p>';


    const displayContent = isEmpty
        ? '<p style="color: #bfbfbf;"><em>Начните вводить текст страницы...</em></p>'
        : content;


    return (
        <div style={{ position: 'relative' }}>
            <div
                ref={containerRef}
                className="hse-text-content"
                style={{
                    fontSize: '16px',
                    fontFamily: 'HSE Sans',
                    lineHeight: '1.6',
                    color: '#333',
                    wordBreak: 'break-word',
                }}
                dangerouslySetInnerHTML={{__html: displayContent}}
            />


            {/* Оверлеи предупреждений (рисуются поверх контента) */}
            {warnings.map((warning) => (
                <div
                    key={warning.id}
                    style={{
                        position: 'absolute',
                        top: warning.top,
                        left: warning.left,
                        width: warning.width,
                        height: warning.height,
                        // Красивая полупрозрачная штриховка опасной зоны
                        background: 'repeating-linear-gradient(-45deg, rgba(255, 77, 79, 0.1), rgba(255, 77, 79, 0.1) 8px, rgba(255, 77, 79, 0.25) 8px, rgba(255, 77, 79, 0.25) 16px)',
                        border: '2px dashed #ff4d4f',
                        borderLeft: 'none', // Примыкает бесшовно к краю контента
                        borderTopRightRadius: '4px',
                        borderBottomRightRadius: '4px',
                        zIndex: 10,
                        pointerEvents: 'none', // Чтобы сквозь выделение можно было кликнуть
                        boxSizing: 'border-box'
                    }}
                >
                    {/* Плашка с текстом предупреждения */}
                    <div style={{
                        position: 'absolute',
                        top: -28,
                        right: -2,
                        background: '#ff4d4f',
                        color: '#fff',
                        fontSize: '12px',
                        padding: '4px 8px',
                        borderRadius: '4px 4px 0 4px',
                        fontFamily: 'HSE Sans, sans-serif',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 6px rgba(255, 77, 79, 0.3)',
                        fontWeight: 500
                    }}>
                        Ширина изображения ({warning.imgWidth}px) превышает ширину страницы
                    </div>
                </div>
            ))}
        </div>
    );
};