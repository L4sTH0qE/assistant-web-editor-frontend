import React, {useState} from 'react';
import {Button, Card, Form, Input, message, Tabs, Typography} from 'antd';
import {LockOutlined, UserOutlined} from '@ant-design/icons';
import {useNavigate} from 'react-router-dom';
import {useDispatch} from 'react-redux';
import api from '../utils/api';
import {loginSuccess} from '../store/authSlice';

const {Title, Text} = Typography;

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('login');
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleAuthSuccess = async (token) => {
        localStorage.setItem('jwtToken', token);
        const meResponse = await api.get('/auth/me');
        dispatch(loginSuccess(meResponse.data));
        message.success(activeTab === 'login' ? 'Вход выполнен' : 'Регистрация успешна');
        navigate('/');
    };

    const onFinish = async (values) => {
        setLoading(true);
        try {
            let response;

            if (activeTab === 'login') {
                response = await api.post('/auth/login', {
                    username: values.username,
                    password: values.password
                });
            } else {
                response = await api.post('/auth/register', {
                    username: values.username,
                    password: values.password,
                });
            }

            if (response.data.message) {
                await handleAuthSuccess(response.data.message);
            } else {
                message.error('Неверный ответ сервера');
            }

        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.error || 'Произошла ошибка';
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const AuthForm = ({isRegister}) => (
        <Form
            name={isRegister ? "register" : "login"}
            onFinish={onFinish}
            layout="vertical"
            requiredMark={false}
        >
            <Form.Item
                name="username"
                label={<Text strong>Логин (Email)</Text>}
                rules={[
                    {required: true, message: 'Введите логин!'},
                    {type: 'email', message: 'Некорректный email'}
                ]}
            >
                <Input prefix={<UserOutlined/>} placeholder="ivanov@hse.ru" size="large"/>
            </Form.Item>

            <Form.Item
                name="password"
                label={<Text strong>Пароль</Text>}
                rules={[
                    {required: true, message: 'Введите пароль!'},
                    {min: 8, message: 'Минимум 8 символов'}
                ]}
            >
                <Input.Password prefix={<LockOutlined/>} placeholder="••••••" size="large"/>
            </Form.Item>
            {isRegister && (
                <Form.Item
                    name="confirm"
                    label={<Text strong>Повторите пароль</Text>}
                    dependencies={['password']}
                    rules={[
                        {required: true, message: 'Повторите пароль!'},
                        ({getFieldValue}) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('password') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('Пароли не совпадают!'));
                            },
                        }),
                    ]}
                >
                    <Input.Password prefix={<LockOutlined/>} placeholder="••••••" size="large"/>
                </Form.Item>
            )}

            <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block size="large" style={{marginTop: 10}}>
                    {isRegister ? 'Зарегистрироваться' : 'Войти'}
                </Button>
            </Form.Item>
        </Form>
    );

    const items = [
        {
            key: 'login',
            label: 'Вход',
            children: <AuthForm isRegister={false}/>,
        },
        {
            key: 'register',
            label: 'Регистрация',
            children: <AuthForm isRegister={true}/>,
        },
    ];

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'var(--hse-blue)', // Синий фон
            backgroundImage: 'linear-gradient(135deg, #0F2D69 0%, #234B9B 100%)' // Градиент для красоты
        }}>
            <Card
                style={{width: 420, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.15)'}}
                bordered={false}
            >
                <div style={{textAlign: 'center', marginBottom: 24}}>
                    <Title level={3} style={{color: 'var(--hse-blue)', margin: 0}}>
                        Помощник Редактора
                    </Title>
                    <Text type="secondary">Авторизация в системе</Text>
                </div>

                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={items}
                    centered
                    size="large"
                />
            </Card>
        </div>
    );
};

export default LoginPage;