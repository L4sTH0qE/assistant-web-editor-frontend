import React, {useEffect, useState} from 'react';
import {Alert, Button, Checkbox, Input, message, Modal, Typography} from 'antd';
import {CheckCircleFilled, CopyOutlined} from '@ant-design/icons';
import {useSelector} from 'react-redux';

const {Text, Paragraph} = Typography;
const {TextArea} = Input;

export const TransferModal = ({isOpen, onClose}) => {
    const {title, metadata, blocks} = useSelector(state => state.editor);
    const [checkedSteps, setCheckedSteps] = useState([]);
    const [processedBlocks, setProcessedBlocks] = useState([]);

    // Логика очистки HTML перед выдачей кода редактору
    const processHtmlForExport = (html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const links = doc.querySelectorAll('a');
        links.forEach(link => {
            if (link.hasAttribute('name') || link.classList.contains('hse-file-stub')) return;
            const href = link.getAttribute('href');
            while (link.attributes.length > 0) link.removeAttribute(link.attributes[0].name);
            if (href) link.setAttribute('href', href);
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

        const tables = doc.querySelectorAll('table, th, td, tr, tbody, thead');
        tables.forEach(el => {
            while (el.attributes.length > 0) {
                if (el.attributes[0].name === 'colspan' || el.attributes[0].name === 'rowspan') {
                    break;
                }
                el.removeAttribute(el.attributes[0].name);
            }
            if (el.tagName === 'TABLE') {
                el.setAttribute('border', '1');
            }
        });

        const images = doc.querySelectorAll('img');
        images.forEach(img => {
            const w = img.style.width || img.getAttribute('width') || 'auto';
            const h = img.style.height || img.getAttribute('height') || 'auto';
            const title = img.getAttribute('title') || img.getAttribute('alt') || 'Файл';

            const placeholder = doc.createElement('p');
            placeholder.style.color = '#d32f2f';
            placeholder.style.fontWeight = 'bold';
            placeholder.innerHTML = `[ОПТИМИЗИРОВАТЬ И ПРИКРЕПИТЬ ФОТО: "${title}" | W: ${w} | H: ${h} ]`;
            img.replaceWith(placeholder);
        });

        const fileStubs = doc.querySelectorAll('a.hse-file-stub');
        fileStubs.forEach(stub => {
            const cleanText = stub.innerText.replace('[ФАЙЛ:', '').replace(']', '').trim();
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
        if (isOpen) {
            const processed = blocks.map(block => ({
                id: block.id,
                exportHtml: processHtmlForExport(block.props.content)
            }));
            setProcessedBlocks(processed);
            setCheckedSteps([]);
        }
    }, [isOpen, blocks]);

    const handleCopy = (text, stepId) => {
        navigator.clipboard.writeText(text);
        message.success('Скопировано в буфер обмена!');
        if (stepId && !checkedSteps.includes(stepId)) {
            setCheckedSteps([...checkedSteps, stepId]);
        }
    };

    const handleCheck = (id) => {
        if (checkedSteps.includes(id)) {
            setCheckedSteps(checkedSteps.filter(s => s !== id));
        } else {
            setCheckedSteps([...checkedSteps, id]);
        }
    };

    // Формирование шагов чек-листа
    const steps = [
        {id: 'title', label: '1. Скопируйте Заголовок', content: title, isCode: false},
        {
            id: 'annot',
            label: '2. Перенесите Аннотацию',
            content: metadata.annotation || '(Аннотация не заполнена)',
            isCode: false
        },
        {
            id: 'tags',
            label: '3. Проставьте Метаданные вручную',
            content: `Рубрика: ${metadata.rubric || 'Нет'}\nТеги: ${metadata.tags?.join(', ') || 'Нет'}\nSEO: ${metadata.keywords?.join(', ') || 'Нет'}`,
            isCode: false
        },
        ...processedBlocks.map((b, index) => ({
            id: `html_${index}`,
            label: `4.${index + 1} Вставьте HTML код блока (Текст)`,
            content: b.exportHtml,
            isCode: true
        }))
    ];

    const allChecked = steps.length > 0 && steps.length === checkedSteps.length;

    return (
        <Modal
            title={<Typography.Title level={4} style={{fontFamily: 'HSE Sans'}}>Мастер переноса в Редакторский интерфейс
                ВШЭ</Typography.Title>}
            open={isOpen}
            onCancel={onClose}
            footer={[
                <Button key="close" style={{minWidth: '140px', fontSize: 16}} onClick={onClose}>Отменить</Button>,
                <Button key="done" style={{minWidth: '140px', fontSize: 16}} disabled={!allChecked} onClick={onClose}
                        icon={<CheckCircleFilled/>}>
                    Завершить
                </Button>
            ]}
            width={850}
        >
            <Alert
                title="Пошаговый чеклист экспорта страницы"
                description="Последовательно скопируйте метаданные и очищенный HTML код в Редакторский интерфейс ВШЭ."
                type="info" showIcon style={{marginBottom: 20}}
            />

            <ul style={{padding: 0, margin: 0}}>
                {steps.map((item) => (
                    <li
                        key={item.id}
                        style={{
                            background: checkedSteps.includes(item.id) ? '#f6ffed' : '#fff',
                            transition: '0.3s',
                            padding: 12,
                            border: '1px solid var(--hse-gray)',
                            borderRadius: 4,
                            marginBottom: 8,
                            listStyle: 'none',
                        }}
                    >
                        <Checkbox
                            checked={checkedSteps.includes(item.id)}
                            onChange={() => handleCheck(item.id)}
                        >
                            <Text strong style={{fontSize: 15}}>
                                {item.label}
                            </Text>
                        </Checkbox>

                        <div
                            style={{
                                background: item.isCode ? '#fff' : '#fafafa',
                                border: item.isCode ? '1px dashed #ccc' : 'none',
                                padding: 10,
                                marginTop: 10,
                                borderRadius: 4,
                                display: 'flex',
                                gap: 10,
                                alignItems: 'flex-start',
                            }}
                        >
                            {item.isCode ? (
                                <TextArea
                                    value={item.content}
                                    readOnly
                                    autoSize={{minRows: 2, maxRows: 6}}
                                    style={{fontFamily: 'monospace', fontSize: 12}}
                                />
                            ) : (
                                <Paragraph style={{margin: 0, flex: 1, whiteSpace: 'pre-wrap'}}>
                                    {item.content}
                                </Paragraph>
                            )}
                            {item.id !== 'tags' ? (<Button
                                    icon={<CopyOutlined/>}
                                    onClick={() => handleCopy(item.content, item.id)}
                                >
                                    Скопировать
                                </Button>
                            ) : (<p/>)}
                        </div>
                    </li>
                ))}
            </ul>
        </Modal>
    );
};
