import React, {useEffect, useState} from 'react';
import {Button, Form, Input, message, Modal, Popconfirm, Table, Tabs, Tag, Typography} from 'antd';
import {DeleteOutlined, PlusOutlined} from '@ant-design/icons';
import api from '../../utils/api';

const {Text} = Typography;

export const TaxonomyModal = ({isOpen, onClose}) => {
    const [taxonomy, setTaxonomy] = useState({rubrics: [], tags: [], keywords: []});
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState('rubric'); // rubric, tag, keyword

    const fetchTaxonomy = async () => {
        setLoading(true);
        try {
            const {data} = await api.get('/taxonomy');
            setTaxonomy(data);
        } catch (error) {
            message.error('Ошибка загрузки справочников');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) fetchTaxonomy();
    }, [isOpen]);

    const handleAdd = async (values) => {
        try {
            await api.post('/taxonomy', {
                type: activeTab, // Тип: 'rubric', 'tag', 'keyword'
                name: values.name.trim()
            });
            message.success('Добавлено в справочник');
            form.resetFields();
            fetchTaxonomy(); // Обновляем список
        } catch (error) {
            message.error('Сбой. Возможно, элемент уже существует.');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/taxonomy/${id}`);
            message.success('Удалено');
            fetchTaxonomy();
        } catch (error) {
            message.error('Ошибка удаления');
        }
    };

    // Универсальные колонки таблицы
    const columns = [
        {
            title: 'Название',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <Tag
                color={activeTab === 'rubric' ? 'blue' : activeTab === 'tag' ? 'green' : 'orange'}>{text}</Tag>,
            sorter: (a, b) => a.name.localeCompare(b.name, 'ru-RU')
        },
        {
            title: 'Действие',
            key: 'action',
            width: 100,
            render: (_, record) => (
                <Popconfirm title="Удалить из справочника?" onConfirm={() => handleDelete(record.id)} okText="Да"
                            cancelText="Нет">
                    <Button type="text" danger icon={<DeleteOutlined/>}/>
                </Popconfirm>
            ),
        },
    ];

    const renderForm = (placeholder) => (
        <Form form={form} layout="inline" onFinish={handleAdd}
              style={{marginBottom: 20, padding: 16, background: '#fafafa', borderRadius: 6}}>
            <Form.Item name="name" rules={[{required: true, message: 'Введите название'}]} style={{flex: 1}}>
                <Input placeholder={placeholder}/>
            </Form.Item>
            <Form.Item style={{marginRight: 0}}>
                <Button type="primary" htmlType="submit" icon={<PlusOutlined/>}>Добавить</Button>
            </Form.Item>
        </Form>
    );

    return (
        <Modal
            title={<Typography.Title level={4} style={{fontFamily: 'HSE Sans', margin: 0}}>Справочник
                метаданных</Typography.Title>}
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={700}
        >

            <Tabs
                defaultActiveKey="rubric"
                onChange={(key) => setActiveTab(key)}
                items={[
                    {
                        key: 'rubric',
                        label: 'Рубрики',
                        children: (
                            <>
                                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                                    Ограниченный набор рубрик для фильтрации новостей (Например: "Наука", "Студентам")
                                </Text>
                                {renderForm('Название рубрики')}
                                <Table
                                    columns={columns}
                                    dataSource={taxonomy.rubrics || []}
                                    rowKey="id"
                                    loading={loading}
                                    pagination={{ pageSize: 5 }}
                                    size="small"
                                    locale={{
                                        emptyText: 'Справочник рубрик пуст',
                                        triggerDesc: 'Нажмите для сортировки по убыванию',
                                        triggerAsc: 'Нажмите для сортировки по возрастанию',
                                        cancelSort: 'Нажмите, чтобы отменить сортировку'
                                    }}
                                />
                            </>
                        )
                    },
                    {
                        key: 'tag',
                        label: 'Теги',
                        children: (
                            <>
                                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                                    Внутренние теги для агрегации контента (Например: "Олимпиада", "Физтех")
                                </Text>
                                {renderForm('Название тега')}
                                <Table
                                    columns={columns}
                                    dataSource={taxonomy.tags || []}
                                    rowKey="id"
                                    loading={loading}
                                    pagination={{ pageSize: 5 }}
                                    size="small"
                                    locale={{
                                        emptyText: 'Справочник тегов пуст',
                                        triggerDesc: 'Нажмите для сортировки по убыванию',
                                        triggerAsc: 'Нажмите для сортировки по возрастанию',
                                        cancelSort: 'Нажмите, чтобы отменить сортировку'
                                    }}
                                />
                            </>
                        )
                    },
                    {
                        key: 'keyword',
                        label: 'Ключевые слова',
                        children: (
                            <>
                                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                                    SEO-слова для поиска
                                </Text>
                                {renderForm('Ключевое слово')}
                                <Table
                                    columns={columns}
                                    dataSource={taxonomy.keywords || []}
                                    rowKey="id"
                                    loading={loading}
                                    pagination={{ pageSize: 5 }}
                                    size="small"
                                    locale={{
                                        emptyText: 'Справочник ключевых слов пуст',
                                        triggerDesc: 'Нажмите для сортировки по убыванию',
                                        triggerAsc: 'Нажмите для сортировки по возрастанию',
                                        cancelSort: 'Нажмите, чтобы отменить сортировку'
                                    }}
                                />
                            </>
                        )
                    }
                ]}
            />
        </Modal>
    );
};
