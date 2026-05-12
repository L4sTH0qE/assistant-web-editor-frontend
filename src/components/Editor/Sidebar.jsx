import React, {useState} from 'react';
import {Button, Form, Input, message, Modal, Space, Typography} from 'antd';
import {AlignLeftOutlined, UserOutlined} from '@ant-design/icons';
import {useDispatch} from 'react-redux';
import {addBlock} from '../../store/editorSlice';
import api from '../../utils/api';

const {Title} = Typography;

export const Sidebar = () => {
    const dispatch = useDispatch();
    const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleAddPerson = async (values) => {
        setLoading(true);
        try {
            const {data} = await api.post('/pages/parse-person', {url: values.url});
            dispatch(addBlock({type: 'person', props: {name: data.name, photoUrl: data.photoUrl}}));
            setIsPersonModalOpen(false);
            form.resetFields();
            message.success('Персона добавлена');
        } catch (error) {
            message.error('Ошибка! Проверьте ссылку на страницу сотрудника ВШЭ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{padding: '16px', background: '#fff', height: '100%', borderRight: '1px solid #eee'}}>
            <Title className="sidebar-title" level={4} style={{margin: 0, fontFamily: 'HSE Sans'}}>Добавить блоки</Title>

            <Space orientation="vertical" style={{width: '100%', marginTop: '16px'}}>
                <Button block icon={<AlignLeftOutlined/>} className="responsive-btn"
                        onClick={() => dispatch(addBlock({type: 'text', props: {content: ''}}))}>
                    <span className="btn-text">Текстовый блок</span>
                </Button>

                <Button block icon={<UserOutlined/>} className="responsive-btn"
                        onClick={() => setIsPersonModalOpen(true)}>
                    <span className="btn-text">Блок персоны</span>
                </Button>
            </Space>

            <Modal title="Добавить карточку сотрудника" open={isPersonModalOpen} onOk={() => form.submit()}
                   onCancel={() => setIsPersonModalOpen(false)} confirmLoading={loading} okText="Создать блок персоны"
                   cancelText="Отмена">
                <Form form={form} layout="vertical" onFinish={handleAddPerson}>
                    <Form.Item name="url" label="Ссылка на страницу сотрудника на hse.ru" rules={[{
                        required: true,
                        message: 'Введите ссылку на страницу сотрудника на hse.ru!',
                        type: 'url'
                    }]}>
                        <Input placeholder="https://www.hse.ru/org/persons/219484540/"/>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
