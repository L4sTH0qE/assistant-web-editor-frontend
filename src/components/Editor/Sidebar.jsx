import React, { useState, useRef } from 'react';
import { Button, Form, Input, message, Modal, Space, Typography, Radio, Upload, Spin } from 'antd';
import { AlignLeftOutlined, UserOutlined, UploadOutlined, LinkOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { addBlock } from '../../store/editorSlice';
import api from '../../utils/api';

const { Title } = Typography;

export const Sidebar = () => {
    const dispatch = useDispatch();
    const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [mode, setMode] = useState('url');
    const fileInputRef = useRef(null);

    const handleAddPersonByUrl = async (values) => {
        setLoading(true);
        try {
            const { data } = await api.post('/pages/parse-person', { url: values.url });
            dispatch(addBlock({
                type: 'person',
                props: { name: data.name, photoUrl: data.photoUrl }
            }));
            setIsPersonModalOpen(false);
            form.resetFields();
            message.success('Персона добавлена');
        } catch (error) {
            message.error('Ошибка! Проверьте, что указанная ссылка ведет на страницу сотрудника ВШЭ');
        } finally {
            setLoading(false);
        }
    };

    const handleAddPersonManual = async (values) => {
        let photoUrl = '';
        if (values.photoFile) {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', values.photoFile);
            try {
                const { data } = await api.post('/files/upload', formData);
                photoUrl = data.url;
            } catch (error) {
                message.error('Ошибка загрузки фото');
                setUploading(false);
                return;
            } finally {
                setUploading(false);
            }
        } else {
            message.error('Загрузите фото человека');
            return;
        }
        dispatch(addBlock({
            type: 'person',
            props: { name: values.name, photoUrl }
        }));
        setIsPersonModalOpen(false);
        form.resetFields();
        message.success('Персона добавлена');
    };

    const handleSubmit = (values) => {
        if (mode === 'url') {
            handleAddPersonByUrl(values);
        } else {
            handleAddPersonManual(values);
        }
    };

    const PhotoUploader = ({ value, onChange }) => {
        const handleUpload = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 10 * 1024 * 1024) {
                message.error('Размер файла превышает 10 МБ');
                return;
            }
            onChange(file);
        };

        const handleRemove = () => {
            onChange(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        };

        return (
            <div>
                {value && (
                    <div style={{ marginBottom: 12 }}>
                        <img
                            src={URL.createObjectURL(value)}
                            alt="preview"
                            style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain', borderRadius: '4px' }}
                        />
                        <Button type="link" danger onClick={handleRemove} style={{ marginLeft: 8 }}>Удалить</Button>
                    </div>
                )}
                <Button onClick={() => fileInputRef.current.click()} icon={<UploadOutlined />}>
                    {value ? 'Заменить фото' : 'Загрузить фото'}
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleUpload}
                />
            </div>
        );
    };

    return (
        <div style={{ padding: '16px', background: '#fff', height: '100%', borderRight: '1px solid #eee' }}>
            <Title className="sidebar-title" level={4} style={{ margin: 0, fontFamily: 'HSE Sans' }}>Добавить блоки</Title>

            <Space orientation="vertical" style={{ width: '100%', marginTop: '16px' }}>
                <Button block icon={<AlignLeftOutlined />} className="responsive-btn"
                        onClick={() => dispatch(addBlock({ type: 'text', props: { content: '' } }))}>
                    <span className="btn-text">Текстовый блок</span>
                </Button>

                <Button block icon={<UserOutlined />} className="responsive-btn"
                        onClick={() => setIsPersonModalOpen(true)}>
                    <span className="btn-text">Блок персоны</span>
                </Button>
            </Space>

            <Modal
                title="Добавить карточку сотрудника"
                open={isPersonModalOpen}
                onCancel={() => {
                    setIsPersonModalOpen(false);
                    form.resetFields();
                    setMode('url');
                }}
                footer={null}
                width={520}
            >
                <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)} style={{ marginBottom: 16 }}>
                    <Radio.Button value="url"><LinkOutlined /> По ссылке (авто)</Radio.Button>
                    <Radio.Button value="manual"><UserOutlined /> Вручную</Radio.Button>
                </Radio.Group>

                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    {mode === 'url' && (
                        <Form.Item
                            name="url"
                            label="Ссылка на страницу сотрудника на hse.ru"
                            rules={[{ required: true, message: 'Введите ссылку!', type: 'url' }]}
                        >
                            <Input placeholder="https://www.hse.ru/org/persons/219484540/" />
                        </Form.Item>
                    )}

                    {mode === 'manual' && (
                        <>
                            <Form.Item
                                name="name"
                                label="Имя персоны"
                                rules={[{ required: true, message: 'Введите имя человека' }]}
                            >
                                <Input placeholder="Иванов Иван Иванович" />
                            </Form.Item>
                            <Form.Item
                                name="photoFile"
                                label="Фото персоны"
                                valuePropName="value"
                                getValueFromEvent={(file) => file}
                                rules={[{ required: true, message: 'Загрузите фото человека' }]}
                            >
                                <PhotoUploader />
                            </Form.Item>
                        </>
                    )}

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Button onClick={() => setIsPersonModalOpen(false)} style={{ marginRight: 8 }}>
                            Отмена
                        </Button>
                        <Button type="primary" htmlType="submit" loading={loading || uploading}>
                            {mode === 'url' ? 'Создать блок' : 'Добавить персону'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
