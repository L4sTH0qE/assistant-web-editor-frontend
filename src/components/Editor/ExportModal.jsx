import React, {useEffect, useState} from 'react';
import {Button, Input, List, message, Modal, Typography} from 'antd';
import {CopyOutlined} from '@ant-design/icons';

const {Text} = Typography;
const {TextArea} = Input;

export const ExportModal = ({isOpen, onClose, blocksData, name}) => {
    const [processedData, setProcessedData] = useState([]);

    const processHtmlForExport = (html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const links = doc.querySelectorAll('a');
        links.forEach(link => {
            if (link.hasAttribute('name')) return;

            if (link.classList.contains('hse-file-stub')) return;

            const href = link.getAttribute('href');

            while (link.attributes.length > 0) {
                link.removeAttribute(link.attributes[0].name);
            }

            if (href) {
                link.setAttribute('href', href);
            }
        });

        const headers = doc.querySelectorAll('h2, h3, h4, h5, h6');
        headers.forEach(header => {
            const anchorId = header.getAttribute('id');
            if (anchorId) {
                const anchorTag = doc.createElement('a');
                anchorTag.setAttribute('name', anchorId);
                header.removeAttribute('id');
                header.prepend(anchorTag);
            }
        });

        const images = doc.querySelectorAll('img');
        images.forEach(img => {
            // Извлекаем параметры из style (так надежнее для Tiptap) или атрибутов
            const w = img.style.width || img.getAttribute('width') || 'auto';
            const h = img.style.height || img.getAttribute('height') || 'auto';
            const l = img.style.left || '0px';
            const t = img.style.top || '0px';

            // Описание
            const title = img.getAttribute('title') || img.getAttribute('alt') || 'Файл';

            // Если это blob (локальная картинка) - меняем на инструкцию
            if (img.src && (img.src.startsWith('blob:') || img.src.startsWith('data:'))) {
                const placeholder = doc.createElement('p');
                // Красный жирный текст
                placeholder.style.color = '#d32f2f';
                placeholder.style.fontWeight = 'bold';

                // Формируем полную строку параметров
                // Пример: [ФОТО: "Стол" | W: 736px | H: 490.9px | L: 0px | T: 0px]
                placeholder.innerHTML = `[ПРИКРЕПИТЬ ФОТО: "${title}" | W: ${w} | H: ${h} | L: ${l} | T: ${t}]`;

                img.replaceWith(placeholder);
            }
        });


        const fileStubs = doc.querySelectorAll('a.hse-file-stub');
        fileStubs.forEach(stub => {
            let cleanText = stub.innerText
                .replace('[ФАЙЛ:', '')
                .replace(']', '')
                .trim();

            const placeholder = doc.createElement('p');
            placeholder.style.color = '#1976d2';
            placeholder.style.fontWeight = 'bold';

            placeholder.innerHTML = `[ПРИКРЕПИТЬ ФАЙЛ: ${cleanText}]`;

            if (stub.parentNode.tagName === 'P' && stub.parentNode.innerText.trim() === stub.innerText.trim()) {
                stub.parentNode.replaceWith(placeholder);
            } else {
                stub.replaceWith(placeholder);
            }
        });

        return doc.body.innerHTML;
    };

    useEffect(() => {
        if (blocksData && isOpen) {
            const processed = blocksData.map(block => ({
                ...block,
                exportHtml: processHtmlForExport(block.htmlContent)
            }));
            if (name) {
                const titleBlock = {
                    blockName: 'Заголовок страницы',
                    exportHtml: name,
                    htmlContent: name
                };
                processed.unshift(titleBlock);
            }
            setProcessedData(processed);
        }
    }, [blocksData, isOpen, name]);

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        message.success('HTML скопирован!');
    };

    return (
        <Modal
            title="Экспорт HTML"
            open={isOpen}
            onCancel={onClose}
            footer={[
                <Button key="close" onClick={onClose}>Закрыть</Button>
            ]}
            width={800}
        >
            <div style={{marginBottom: 16}}>
                <Text type="secondary">
                    В коде оставлены текстовые метки для вставки файлов (синие) и картинок (красные).
                </Text>
            </div>

            <List
                itemLayout="horizontal"
                dataSource={processedData}
                bordered
                style={{maxHeight: '60vh', overflowY: 'auto'}}
                renderItem={(item, index) => (
                    <List.Item
                        actions={[
                            <Button
                                icon={<CopyOutlined/>}
                                onClick={() => handleCopy(item.exportHtml)}
                            >
                                Копировать
                            </Button>
                        ]}
                    >
                        <List.Item.Meta
                            title={`${item.blockName} ${item.blockName === 'Заголовок страницы' ? '' : index}`}
                            description={
                                <TextArea
                                    value={item.exportHtml}
                                    readOnly
                                    autoSize={{minRows: 2, maxRows: 8}}
                                    style={{fontFamily: 'monospace', fontSize: 12, marginTop: 8, color: '#333'}}
                                />
                            }
                        />
                    </List.Item>
                )}
            />
        </Modal>
    );
};


