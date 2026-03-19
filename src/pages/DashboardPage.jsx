import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Row, Statistic, Form, Input, message, Modal, Popconfirm, Select, Space, Table, Tag, Tooltip, Typography, Tabs, Badge, List, Progress, Alert } from 'antd';
import { CopyOutlined, DeleteOutlined, EditOutlined, FileTextOutlined, PieChartOutlined, PlusOutlined, QuestionCircleFilled, UserOutlined, SyncOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import api from '../utils/api';

const { Title, Text } = Typography;
const { Option } = Select;

const PAGE_TYPES = {
    BASIC: { label: 'Простая страница', color: 'var(--hse-blue-accent)' },
    NEWS: { label: 'Новость', color: 'var(--hse-green-accent)' },
    ANNOUNCEMENT: { label: 'Анонс', color: 'var(--hse-orange-accent)' }
};

const SYNC_STATUSES = {
    DRAFT: { text: 'Черновик (Не выгружалось)', status: 'default' },
    SYNCED: { text: 'Синхронизировано', status: 'success' },
    DESYNCED: { text: 'Рассинхронизация', status: 'error' },
};

const DashboardPage = () => {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [stats, setStats] = useState({
        totalPages: 0, byType: {}, syncStatuses: {}, authorsActive: {}, rubrics: {}, tags: {}
    });

    const [form] = Form.useForm();
    const typeValue = Form.useWatch('type', form);
    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pagesRes, statsRes] = await Promise.all([
                api.get('/pages'),
                api.get('/analytics').catch(() => ({ data: { totalPages: 0, byType: {}, rubrics: {}, authorsActive: {} } })) // Фолбэк если API еще не готово
            ]);
            setPages(pagesRes.data);
            setStats(statsRes.data);
        } catch (error) {
            message.error('Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleDuplicate = async (id) => {
        try {
            const payload = {
                slug: uuidv4()
            };
            await api.post(`/pages/${id}/duplicate`, payload);
            message.success('Страница скопирована');
            fetchData();
        } catch (e) {
            message.error('Ошибка копирования');
        }
    }

    const handleCreate = async (values) => {
        try {
            const payload = {
                ...values,
                slug: values.type === 'BASIC' ? values.slug : uuidv4()
            };
            if (values.type === 'BASIC' && !(/^[a-z0-9_-]+$/.test(values.slug))) {
                message.error('Неверно указан путь');
                return;
            }
            const { data } = await api.post('/pages', payload);
            message.success('Страница создана');
            setIsModalOpen(false);
            form.resetFields();
            navigate(`/editor/${data.id}`);
        } catch (error) {
            message.error('Ошибка создания');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/pages/${id}`);
            message.success('Удалено');
            fetchData();
        } catch (error) {
            message.error('Не удалось удалить страницу');
        }
    };

    const columns = [
        {
            title: 'Заголовок',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <a onClick={() => navigate(`/editor/${record.id}`)} style={{ fontWeight: 600, color: 'var(--hse-blue)' }}>{text}</a>
            ),
            sorter: (a, b) => a.title.localeCompare(b.title, "ru-RU"),
        },
        {
            title: 'Тип',
            dataIndex: 'type',
            key: 'type',
            render: (type) => <Tag color={PAGE_TYPES[type]?.color || 'default'}>{PAGE_TYPES[type]?.label || type}</Tag>,
            filters: Object.keys(PAGE_TYPES).map(k => ({ text: PAGE_TYPES[k].label, value: k })),
            onFilter: (value, record) => record.type === value,
        },
        {
            title: 'Синхронизация',
            dataIndex: 'syncStatus',
            key: 'syncStatus',
            render: (status) => {
                const conf = SYNC_STATUSES[status || 'DRAFT'];
                return <Badge status={conf.status} text={conf.text} />;
            },
            filters: Object.keys(SYNC_STATUSES).map(k => ({ text: SYNC_STATUSES[k].text, value: k })),
            onFilter: (value, record) => (record.syncStatus || 'DRAFT') === value,
        },
        {
            title: 'Автор',
            dataIndex: 'ownerName',
            key: 'ownerName',
            render: (name) => <Space><UserOutlined /><span>{name || 'Unknown'}</span></Space>,
        },
        {
            title: 'Обновлено',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            render: (date) => new Date(date).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
            defaultSortOrder: 'descend',
        },
        {
            title: '',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Редактировать">
                        <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`/editor/${record.id}`)} />
                    </Tooltip>
                    <Tooltip title="Создать копию">
                        <Popconfirm title="Создать копию страницы?" icon={<QuestionCircleFilled style={{color: 'var(--hse-blue)'}}/>} onConfirm={() => handleDuplicate(record.id)} okText="Да" cancelText="Нет">
                            <Button type="text" icon={<CopyOutlined />} />
                        </Popconfirm>
                    </Tooltip>
                    <Tooltip title="Удалить">
                        <Popconfirm title="Удалить страницу?" onConfirm={() => handleDelete(record.id)} okText="Да" okType="danger" cancelText="Нет">
                            <Button type="text" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        }
    ];

    return (
        <div>
            <Title level={2} style={{ color: 'var(--hse-blue)', fontFamily: 'HSE Sans' }}>Каталог страниц</Title>
            <div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                    <Alert
                        title="Здесь хранятся все ваши черновики и подготовленные материалы"
                        type="info" showIcon
                    />
                    <Button type="create" icon={<PlusOutlined/>} onClick={() => setIsModalOpen(true)}>
                        Создать материал
                    </Button>
                </div>
                <Table
                    columns={columns}
                    dataSource={pages}
                    rowKey="id"
                    loading={loading}
                    pagination={{pageSize: 12}}
                    locale={{
                        triggerDesc: 'Нажмите для сортировки по убыванию',
                        triggerAsc: 'Нажмите для сортировки по возрастанию',
                        cancelSort: 'Нажмите, чтобы отменить сортировку'
                    }}
                />
            </div>

            <Modal
                title="Создание нового материала"
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                okText="Создать и перейти в редактор"
                cancelText="Отмена"
            >
                <Form form={form} layout="vertical" onFinish={handleCreate} initialValues={{type: 'NEWS'}}>
                    <Form.Item name="type" label="Тип материала" rules={[{required: true}]}>
                        <Select>
                            <Option value="NEWS">Новость (Новостная лента)</Option>
                            <Option value="ANNOUNCEMENT">Анонс (Мероприятия и события)</Option>
                            <Option value="BASIC">Простая статическая страница</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="title" label="Заголовок страницы" rules={[{ required: true, message: 'Укажите заголовок страницы' }]}>
                        <Input placeholder="Например: О платформе MLOps" />
                    </Form.Item>
                    {typeValue === 'BASIC' && (
                        <Form.Item name="slug" label="Путь страницы" rules={[{ required: true, message: 'Укажите путь страницы' }]}>
                            <Input addonBefore="hse.ru/" placeholder="about_us" />
                        </Form.Item>
                    )}
                </Form>
            </Modal>
        </div>
    );
};

export default DashboardPage;
