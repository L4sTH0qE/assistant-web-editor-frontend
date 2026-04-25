import React, { useEffect, useState } from 'react';
import { Alert, Button, DatePicker, Divider, Form, Input, Select, Space, Spin, Typography, message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { updateMetadata, setSlug } from '../../store/editorSlice';
import { PlusOutlined } from '@ant-design/icons';

import dayjs from 'dayjs';
import api from '../../utils/api';

const { Text } = Typography;
const { RangePicker } = DatePicker;

// Возрастные маркировки согласно ст. 5-10 ФЗ от 29.12.2010 N 436-ФЗ
const AGE_LIMITS = [
    { value: '0+', label: '0+ (Для всех)' },
    { value: '6+', label: '6+ (Для детей старше 6 лет)' },
    { value: '12+', label: '12+ (Для детей старше 12 лет)' },
    { value: '16+', label: '16+ (Для детей старше 16 лет)' },
    { value: '18+', label: '18+ (Запрещено для детей)' }
];

export const MetadataTab = () => {
    const dispatch = useDispatch();
    const { metadata, type, slug } = useSelector(state => state.editor);
    const [form] = Form.useForm();

    const [taxonomy, setTaxonomy] = useState({ rubrics: [], tags: [], keywords: [] });
    const [loading, setLoading] = useState(true);

    const loadTaxonomy = async () => {
        try {
            const { data } = await api.get('/taxonomy');
            setTaxonomy(data || { rubrics: [], tags: [], keywords: [] });
        } catch (e) {
            console.error('Ошибка загрузки справочников:', e);
            message.error('Ошибка связи с сервером справочников');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTaxonomy();
    }, []);

    useEffect(() => {
        if (!metadata) return;

        let restoredMetadata = { ...metadata };

        if (restoredMetadata.eventDates && Array.isArray(restoredMetadata.eventDates) && restoredMetadata.eventDates.length === 2) {
            const startStr = restoredMetadata.eventDates[0];
            const endStr = restoredMetadata.eventDates[1];

            if (startStr && endStr) {
                restoredMetadata.eventDates = [dayjs(startStr), dayjs(endStr)];
            } else {
                restoredMetadata.eventDates = null;
            }
        }

        restoredMetadata.slug = slug;
        form.setFieldsValue(restoredMetadata);
    }, [metadata, slug, form]);

    const handleChange = (changedValues, allValues) => {
        const preparedMetadata = { ...allValues };

        if (changedValues.slug !== undefined) {
            dispatch(setSlug(changedValues.slug));
        }

        delete preparedMetadata.slug;

        if (preparedMetadata.eventDates && Array.isArray(preparedMetadata.eventDates)) {
            preparedMetadata.eventDates = [
                preparedMetadata.eventDates[0]?.toISOString() || null,
                preparedMetadata.eventDates[1]?.toISOString() || null
            ];
        }

        dispatch(updateMetadata(preparedMetadata));
    };

    // Функция быстрого добавления нового тега/рубрики прямо из редактора
    const handleQuickAdd = async (value, typeStr) => {
        if (!value || value.trim() === '') return;
        try {
            await api.post('/taxonomy', { type: typeStr, name: value.trim() });
            message.success(`Успешно добавлено в общий справочник`);
            await loadTaxonomy();
        } catch (e) {
            message.error('Сбой добавления или такой элемент уже существует');
        }
    };

    const customDropdownRender = (menu, currentInputText, taxonomyType) => {
        const currentInput = currentInputText || '';
        return (
            <>
                {menu}
                <Divider style={{ margin: '8px 0' }} />
                <Space style={{ padding: '0 8px 4px' }}>
                    <Button
                        type="text"
                        icon={<PlusOutlined />}
                        onClick={() => handleQuickAdd(currentInput, taxonomyType)}
                        disabled={!currentInput}
                    >
                        Добавить "{currentInput || 'новый'}" в справочник
                    </Button>
                </Space>
            </>
        );
    };

    const rubricOptions = taxonomy.rubrics?.map(r => ({ label: r.name, value: r.name })) || [];
    const tagOptions = taxonomy.tags?.map(t => ({ label: t.name, value: t.name })) || [];
    const keywordOptions = taxonomy.keywords?.map(k => ({ label: k.name, value: k.name })) || [];

    return (
        <Form
            form={form}
            layout="vertical"
            onValuesChange={handleChange}
            style={{ maxWidth: '100%' }}
        >
            {loading && <Spin style={{ display: 'block', marginBottom: 20 }} />}

            <Alert
                title="Метаданные"
                description="Эта информация необходима для корректного отображения превью и поиска порталом ВШЭ."
                type="info"
                style={{ marginBottom: 20 }}
            />

            <Form.Item label="Ссылка на публикацию (URL)" name="externalUrl"
                       tooltip="Для проверки синхронизации с сайтом портала">
                <Input placeholder="https://hse.ru/news/..." />
            </Form.Item>

            <Divider />

            {type === 'BASIC' && (
                <Form.Item
                    label="Уникальный путь страницы"
                    name="slug"
                    tooltip="Латинские буквы и дефис. Пример: about_us"
                    rules={[{ pattern: /^[a-z0-9_-]+$/, message: 'Только строчная латиница, цифры и дефис' }]}
                >
                    <Input addonBefore="hse.ru/" placeholder="about_us" />
                </Form.Item>
            )}

            {(type === 'NEWS' || type === 'ANNOUNCEMENT') && (
                <>
                    <Form.Item label="Краткая Аннотация" name="annotation">
                        <Input.TextArea rows={4} placeholder="Введите аннотацию..." />
                    </Form.Item>

                    <Form.Item label="Теги" name="tags" tooltip="Выберите или создайте новые теги">
                        <Select
                            mode="tags"
                            options={tagOptions}
                            placeholder="ФКН, ДПИ..."
                            popupRender={(menu) => customDropdownRender(menu, (form.getFieldValue('tags') || []).slice(-1)[0], 'tag')}
                        />
                    </Form.Item>

                    <Form.Item label="Ключевые слова (SEO)" name="keywords">
                        <Select
                            mode="tags"
                            options={keywordOptions}
                            placeholder="SEO слова"
                            popupRender={(menu) => customDropdownRender(menu, (form.getFieldValue('keywords') || []).slice(-1)[0], 'keyword')}
                        />
                    </Form.Item>
                </>
            )}

            {type === 'NEWS' && (
                <Form.Item label="Рубрика" name="rubric">
                    <Select
                        options={rubricOptions}
                        placeholder="Выберите рубрику"
                        popupRender={(menu) => customDropdownRender(menu, form.getFieldValue('rubric'), 'rubric')}
                    />
                </Form.Item>
            )}

            {type === 'ANNOUNCEMENT' && (
                <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 6 }}>
                    <Text strong>Обязательные параметры анонса</Text>
                    <Form.Item label="Дата проведения" name="eventDates" style={{marginTop: 8}}>
                        <RangePicker showTime format="DD.MM.YYYY HH:mm" style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="Возрастное ограничение" name="ageLimit">
                        <Select options={AGE_LIMITS} placeholder="Выберите возраст" />
                    </Form.Item>
                </div>
            )}
        </Form>
    );
};
