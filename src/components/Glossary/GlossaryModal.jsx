import React, {useEffect, useState} from 'react';
import {Button, Form, Input, message, Modal, Popconfirm, Table, Typography} from 'antd';
import {DeleteOutlined, PlusOutlined, SearchOutlined} from '@ant-design/icons';
import api from '../../utils/api';

const {Text} = Typography;

export const GlossaryModal = ({isOpen, onClose}) => {
    const [glossary, setGlossary] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [form] = Form.useForm();

    const fetchGlossary = async () => {
        setLoading(true);
        try {
            const {data} = await api.get('/glossary');
            setGlossary(data);
        } catch (error) {
            message.error('Ошибка загрузки глоссария');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchGlossary();
            form.resetFields();
            setSearchTerm('');
        }
    }, [isOpen]);

    const handleAdd = async (values) => {
        try {
            await api.post('/glossary', {
                term: values.term.trim(),
                url: values.url.trim()
            });
            message.success('Ключевое выражение добавлено в общий глоссарий');
            form.resetFields();
            fetchGlossary();
        } catch (error) {
            message.error('Ошибка добавления. Возможно, ключевое выражение уже существует.');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/glossary/${id}`);
            message.success('Ключевое выражение удалено');
            fetchGlossary();
        } catch (error) {
            message.error('Ошибка удаления');
        }
    };

    const filteredData = glossary.filter(item =>
        item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.url.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        {
            title: 'Ключевое выражение',
            dataIndex: 'term',
            key: 'term',
            render: (text) => <Text strong>{text}</Text>,
            sorter: (a, b) => a.term.localeCompare(b.term, 'ru-RU')
        },
        {
            title: 'Ссылка (URL)',
            dataIndex: 'url',
            key: 'url',
            render: (url) => <a href={url} target="_blank" rel="noopener noreferrer"
                                style={{color: 'var(--hse-blue-accent)'}}>{url}</a>,
        },
        {
            title: 'Действие',
            key: 'action',
            width: 100,
            render: (_, record) => (
                <Popconfirm
                    title="Удалить ключевое выражения из общего глоссария?"
                    onConfirm={() => handleDelete(record.id)}
                    okText="Да" cancelText="Нет"
                >
                    <Button type="text" danger icon={<DeleteOutlined/>}/>
                </Popconfirm>
            ),
        },
    ];

    return (
        <Modal
            title={<Typography.Title level={4} style={{fontFamily: 'HSE Sans', margin: 0}}>Глоссарий
                автолинкинга</Typography.Title>}
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={800}
        >
            <div style={{marginBottom: 20}}>
                <Text type="secondary">
                    Добавленные сюда сущности (Факультеты, ФИО преподавателей) будут автоматически оборачиваться в
                    ссылки при нажатии кнопки "Авто-ссылки" в редакторе.
                </Text>
            </div>

            {/* Форма добавления нового термина */}
            <Form
                form={form}
                layout="inline"
                onFinish={handleAdd}
                style={{
                    marginBottom: 20,
                    padding: 16,
                    background: '#fafafa',
                    borderRadius: 6,
                    border: '1px solid #f0f0f0'
                }}
            >
                <Form.Item
                    name="term"
                    rules={[{required: true, message: 'Обязательное поле'}]}
                    style={{flex: 1}}
                >
                    <Input placeholder="Ключевое слово (например: ФКН)"/>
                </Form.Item>
                <Form.Item
                    name="url"
                    rules={[
                        {required: true, message: 'Обязательное поле'},
                        {type: 'url', message: 'Введите корректный URL (с https://)'}
                    ]}
                    style={{flex: 2}}
                >
                    <Input placeholder="https://cs.hse.ru"/>
                </Form.Item>
                <Form.Item style={{marginRight: 0}}>
                    <Button type="primary" htmlType="submit" icon={<PlusOutlined/>}
                            style={{background: 'var(--hse-blue)'}}>
                        Добавить
                    </Button>
                </Form.Item>
            </Form>

            <Input
                placeholder="Поиск по ключевым выражениям или ссылкам..."
                prefix={<SearchOutlined/>}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{marginBottom: 16}}
            />

            <Table
                columns={columns}
                dataSource={filteredData}
                rowKey="id"
                loading={loading}
                pagination={{pageSize: 5}}
                size="small"
                locale={{
                    emptyText: 'Глоссарий пуст',
                    triggerDesc: 'Нажмите для сортировки по убыванию',
                    triggerAsc: 'Нажмите для сортировки по возрастанию',
                    cancelSort: 'Нажмите, чтобы отменить сортировку'
                }}
            />
        </Modal>
    );
};
