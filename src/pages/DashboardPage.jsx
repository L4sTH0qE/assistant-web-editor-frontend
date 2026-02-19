import React, {useEffect, useState} from 'react';
import {Button, Form, Input, message, Modal, Popconfirm, Select, Space, Table, Tag, Tooltip, Typography} from 'antd';
import {
    CopyOutlined,
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
    QuestionCircleFilled,
    UserOutlined
} from '@ant-design/icons';
import {useNavigate} from 'react-router-dom';
import {v4 as uuidv4} from 'uuid';

import api from '../utils/api';

const {Title} = Typography;
const {Option} = Select;

const PAGE_TYPES = {
    BASIC: {label: 'Страница', color: 'var(--hse-blue-accent)'},
    NEWS: {label: 'Новость', color: 'var(--hse-green-accent)'},
    ANNOUNCEMENT: {label: 'Анонс', color: 'var(--hse-orange-accent)'}
};


const DashboardPage = () => {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editPage, setEditPage] = useState(null);

    const [authorsFilter, setAuthorsFilter] = useState([]);

    const [form] = Form.useForm();
    const typeValue = Form.useWatch('type', form);

    const navigate = useNavigate();

    const fetchPages = async () => {
        setLoading(true);
        try {
            const {data} = await api.get('/pages');
            setPages(data);

            const uniqueAuthors = [...new Set(data.map(p => p.ownerName))];
            setAuthorsFilter(uniqueAuthors.map(a => ({text: a, value: a})));
        } catch (error) {
            message.error('Не удалось загрузить список страниц');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPages();
    }, []);

    const handleDuplicate = async (id) => {
        try {
            await api.post(`/pages/${id}/duplicate`);
            message.success('Страница скопирована');
            fetchPages();
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

            const {data} = await api.post('/pages', payload);
            message.success('Страница создана');
            setIsModalOpen(false);
            form.resetFields();
            navigate(`/editor/${data.id}`);
        } catch (error) {
            message.error('Ошибка создания');
        }
    };

    const handleEdit = async (values) => {
        try {
            const payload = {
                ...values,
                slug: editPage?.type === 'BASIC' ? values.slug : editPage?.slug
            };

            const {data} = await api.put(`/pages/${editPage.id}`, payload);
            message.success('Страница обновлена');
            setIsEditModalOpen(false);
            form.resetFields();
            navigate(`/editor/${editPage.id}`);
        } catch (error) {
            message.error('Ошибка обновления');
        }
    };

    useEffect(() => {
        if (editPage) {
            form.setFieldsValue({
                type: editPage.type,
                title: editPage.title,
                slug: editPage.slug
            });
        }
    }, [editPage, form]);

    const handleDelete = async (id) => {
        try {
            await api.delete(`/pages/${id}`);
            message.success('Удалено');
            fetchPages();
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
                <a onClick={() => navigate(`/editor/${record.id}`)} style={{fontWeight: 600}}>{text}</a>
            ),
            sorter: (a, b) => a.title.localeCompare(b.title, "en-ru"),
        },
        {
            title: 'Тип',
            dataIndex: 'type',
            key: 'type',
            render: (type) => {
                const conf = PAGE_TYPES[type] || {label: type, color: 'default'};
                return <Tag color={conf.color}>{conf.label}</Tag>;
            },
            filters: [
                {text: 'Страница', value: 'BASIC'},
                {text: 'Новость', value: 'NEWS'},
                {text: 'Анонс', value: 'ANNOUNCEMENT'},
            ],
            onFilter: (value, record) => record.type === value,
        },
        {
            title: 'Slug',
            dataIndex: 'slug',
            key: 'slug',
            render: (slug) => <Typography.Text type="secondary" style={{fontSize: 13}}>{slug || '—'}</Typography.Text>
        },
        {
            title: 'Автор',
            dataIndex: 'ownerName',
            key: 'ownerName',
            render: (ownerName) => (
                <Space>
                    <UserOutlined/>
                    <span>{ownerName?.fullName || ownerName || 'Я'}</span>
                </Space>
            ),
            filters: authorsFilter,
            onFilter: (value, record) => record.ownerName === value,
        },
        {
            title: 'Обновлено',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            render: (date) => new Date(date).toLocaleDateString('ru-RU') + ' ' + new Date(date).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            }),
            sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
            defaultSortOrder: 'descend',
            okType: 'danger',
        },
        {
            title: '',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Редактировать">
                        <Button type="text" icon={<EditOutlined/>} onClick={() => {
                            setEditPage(record);
                            setIsEditModalOpen(true);
                        }}/>
                    </Tooltip>
                    <Tooltip title="Создать копию">
                        <Popconfirm
                            title="Создать копию страницы?"
                            icon={<QuestionCircleFilled style={{color: 'var(--hse-blue)'}}/>}
                            onConfirm={() => handleDuplicate(record.id)}
                            okText="Да"
                            cancelText="Нет"
                        >
                            <Button type="text" icon={<CopyOutlined/>}/>
                        </Popconfirm>
                    </Tooltip>
                    <Tooltip title="Удалить">
                        <Popconfirm
                            title="Удалить страницу?"
                            description="Это действие нельзя отменить."
                            onConfirm={() => handleDelete(record.id)}
                            okText="Да"
                            okType="danger"
                            cancelText="Нет"
                        >
                            <Button type="text" danger icon={<DeleteOutlined/>}/>
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
                <Title level={2} style={{margin: 0, color: 'var(--hse-blue)'}}>Доступные страницы</Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined/>}
                    size="large"
                    onClick={() => {
                        setEditPage({title: null, type: 'BASIC', slug: null});
                        setIsModalOpen(true);
                    }}
                >
                    Создать страницу
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={pages}
                rowKey="id"
                loading={loading}
                locale={{
                    triggerDesc: 'Отсортировать по убыванию',
                    triggerAsc: 'Отсортировать по возрастанию',
                    cancelSort: 'Сбросить сортировку'
                }}
                pagination={{pageSize: 10}}
            />

            <Modal
                title="Создание новой страницы"
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    setEditPage({title: null, type: 'BASIC', slug: null});
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                okText="Создать и перейти в редактор"
                cancelText="Отмена"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreate}
                    initialValues={{title: null, type: 'BASIC', slug: null}}
                >
                    <Form.Item name="type" label="Тип материала" rules={[{required: true}]}>
                        <Select>
                            <Option value="BASIC">Основная страница (с постоянным адресом)</Option>
                            <Option value="NEWS">Новость (попадет в ленту)</Option>
                            <Option value="ANNOUNCEMENT">Анонс (с датами)</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="title"
                        label="Заголовок"
                        rules={[{required: true, message: 'Укажите заголовок страницы'}]}
                    >
                        <Input placeholder="Например: О платформе MLOps"/>
                    </Form.Item>

                    {typeValue === 'BASIC' && (
                        <Form.Item
                            name="slug"
                            label="Адрес страницы"
                            rules={[{required: true, message: 'Укажите адрес страницы'}]}
                            helper="Латинские буквы, например: about_us"
                        >
                            <Space.Compact block className="input-group">
                                <Input defaultValue="hse.ru/" style={{width: '15%'}} readOnly/>
                                <Input placeholder="Например: about_us" style={{width: '85%'}}/>
                            </Space.Compact>
                        </Form.Item>
                    )}
                </Form>
            </Modal>
            <Modal
                title="Редактирование страницы"
                open={isEditModalOpen}
                onCancel={() => {
                    setIsEditModalOpen(false);
                    setEditPage({});
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                okText="Сохранить и перейти в редактор"
                cancelText="Отмена"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleEdit}
                    initialValues={{
                        type: editPage?.type,
                        title: editPage?.title,
                        slug: editPage?.slug
                    }}
                >
                    <Form.Item
                        name="title"
                        label="Заголовок"
                        rules={[{required: true, message: 'Укажите заголовок страницы'}]}
                    >
                        <Input placeholder="Например: О платформе MLOps"/>
                    </Form.Item>

                    {editPage?.type === 'BASIC' && (
                        <Form.Item
                            name="slug"
                            label="Адрес страницы"
                            rules={[{required: true, message: 'Укажите адрес страницы'}]}
                        >
                            <Input placeholder="Например: about_us"/>
                        </Form.Item>
                    )}
                </Form>
            </Modal>
        </div>
    );
};

export default DashboardPage;