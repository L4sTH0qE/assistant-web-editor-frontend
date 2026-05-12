import React, {useEffect, useState} from 'react';
import {Alert, Button, Checkbox, Input, message, Modal, Typography} from 'antd';
import {CheckCircleFilled, CopyOutlined} from '@ant-design/icons';
import {useSelector} from 'react-redux';

const {Text, Paragraph} = Typography;
const {TextArea} = Input;

export const TransferModal = ({isOpen, onClose}) => {
    const {title, metadata, blocks, type, slug} = useSelector(state => state.editor);
    const [checkedSteps, setCheckedSteps] = useState([]);
    const [processedBlocks, setProcessedBlocks] = useState([]);

    const processHtmlForExport = (html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

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

        doc.querySelectorAll('colgroup').forEach(el => el.remove());
        const tables = doc.querySelectorAll('table, th, td, tr, tbody, thead');
        tables.forEach(el => {
            while (el.attributes.length > 0) {
                if (el.attributes[0].name === 'colspan' || el.attributes[0].name === 'rowspan') break;
                el.removeAttribute(el.attributes[0].name);
            }
            if (el.tagName === 'TABLE') el.setAttribute('border', '1');
        });

        const images = Array.from(doc.querySelectorAll('img'));
        images.forEach(img => {
            const src = img.getAttribute('src');
            const alt = img.getAttribute('alt') || img.getAttribute('title') || 'image';

            let w = img.getAttribute('width') || img.style.width?.replace('px', '');
            let h = img.getAttribute('height') || img.style.height?.replace('px', '');

            const cleanImg = doc.createElement('img');
            cleanImg.setAttribute('src', src);
            if (alt) cleanImg.setAttribute('alt', alt);
            if (w && w !== 'auto') cleanImg.setAttribute('width', parseInt(w, 10));
            if (h && h !== 'auto') cleanImg.setAttribute('height', parseInt(h, 10));

            const parentFigure = img.closest('figure');
            if (parentFigure) {
                parentFigure.replaceWith(cleanImg);
            } else {
                img.replaceWith(cleanImg);
            }
        });

        const docLinks = Array.from(doc.querySelectorAll('span[data-type="document-link"]'));
        docLinks.forEach(span => {
            const href = span.getAttribute('href');
            const name = span.getAttribute('name');
            const ext = span.getAttribute('ext');
            const size = span.getAttribute('size');

            const p = doc.createElement('p');

            const a = doc.createElement('a');
            a.setAttribute('class', 'link');
            a.setAttribute('href', href);
            a.setAttribute('target', '_blank');
            a.innerText = name;

            const nobr = doc.createElement('nobr');
            nobr.innerText = `(${ext}, ${size})`;

            p.appendChild(a);
            p.appendChild(doc.createTextNode(' '));
            p.appendChild(nobr);

            span.replaceWith(p);
        });

        const allLinks = doc.querySelectorAll('a');
        allLinks.forEach(link => {
            if (!link.hasAttribute('name') && !link.classList.contains('link')) {
                link.removeAttribute('class');
            }
        });

        return doc.body.innerHTML;
    };

    useEffect(() => {
        if (isOpen) {
            const processed = blocks.map(block => {
                if (block.type === 'person') {
                    return {
                        id: block.id,
                        blockName: 'Карточка персоны',
                        exportHtml: `<p style="text-align: center;">\n  <img alt="" class="g-pic" height="200" src="${block.props.photoUrl}" width="200" style="border-radius: 50%; object-fit: cover;">\n</p>\n<p class="h4 c" style="text-align: center;">\n  ${block.props.name}\n</p>`
                    };
                }
                return {
                    id: block.id,
                    blockName: 'Текстовый блок',
                    exportHtml: processHtmlForExport(block.props.content)
                };
            });
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

    let eventDatesString = 'Не задана';
    if (metadata.eventDates && Array.isArray(metadata.eventDates)) {
        const formatDate = (iso) => iso ? new Date(iso).toLocaleString('ru-RU', { 
            day: '2-digit', month: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        }) : '';
        
        const start = formatDate(metadata.eventDates[0]);
        const end = formatDate(metadata.eventDates[1]);

        if (start && end) {
            eventDatesString = `с ${start} по ${end}`;
        } else if (start) {
            eventDatesString = start;
        }
    }

    const steps = [
        {id: 'title', label: '1. Перенесите Заголовок', content: title, isCode: false},
        ...(type === 'BASIC' ? [{
            id: 'slug',
            label: '2. Перенесите Уникальный путь страницы',
            content: slug || '(Путь не задан)',
            isCode: false
        }] : []),
        ...(type !== 'BASIC' ? [{
            id: 'annot',
            label: '2.1. Перенесите Аннотацию',
            content: metadata.annotation || '(Аннотация не заполнена)',
            isCode: false
        }] : []),
        ...(type === 'NEWS' ? [{
            id: 'tags',
            label: '2.2. Проставьте Метаданные вручную',
            content: `Рубрики: ${metadata.rubrics?.join(', ') || 'Нет'}\nТемы: ${metadata.tags?.join(', ') || 'Нет'}\nКлючевые слова: ${metadata.keywords?.join(', ') || 'Нет'}`,
            isCode: false
        }] : []),
        ...(type === 'ANNOUNCEMENT' ? [{
            id: 'tags',
            label: '2.2. Проставьте Метаданные вручную',
            content: `Темы: ${metadata.tags?.join(', ') || 'Нет'}\nКлючевые слова: ${metadata.keywords?.join(', ') || 'Нет'}\nДата проведения: ${eventDatesString}\nВозрастное ограничение: ${metadata.ageLimit || 'Не задано'}`,
            isCode: false
        }] : []),
        ...processedBlocks.map((b, index) => ({
            id: `html_${index}`,
            label: `3.${index + 1}. Вставьте HTML код блока`,
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
