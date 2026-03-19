import React, {useState} from 'react';
import {Alert, Button, Card, Form, Input, message, Space, Tabs, Typography} from 'antd';
import {ArrowLeftOutlined, LockOutlined, MailOutlined, UserOutlined} from '@ant-design/icons';
import {useNavigate} from 'react-router-dom';
import {useDispatch} from 'react-redux';
import api from '../utils/api';
import {loginSuccess} from '../store/authSlice';

const {Title, Text} = Typography;

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('login');

    const [isVerificationStep, setIsVerificationStep] = useState(false);
    const [regData, setRegData] = useState({username: '', password: ''});

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleAuthSuccess = async (token) => {
        localStorage.setItem('jwtToken', token);
        const meResponse = await api.get('/auth/me');
        dispatch(loginSuccess(meResponse.data));
        message.success('Вход выполнен');
        navigate('/');
    };

    const onLoginSubmit = async (values) => {
        setLoading(true);
        try {
            const response = await api.post('/auth/login', {
                username: values.username,
                password: values.password
            });
            if (response.data.token || response.data.message) {
                await handleAuthSuccess(response.data.token || response.data.message);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Неверный логин или пароль';
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const onRequestCode = async (values) => {
        setLoading(true);
        try {
            // Сохраняем введенные данные в стейт, чтобы отправить их позже вместе с кодом
            setRegData({username: values.username, password: values.password});

            // Отправляем запрос на генерацию и отправку email
            await api.post('/auth/register/send-code', {username: values.username});

            message.success('Код подтверждения отправлен на почту!');
            setIsVerificationStep(true); // Переключаем UI на ввод кода
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Пользователь уже существует или ошибка сервера';
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const onVerifyCode = async (values) => {
        setLoading(true);
        try {
            // Отправляем email, пароль и код для финального создания аккаунта
            const response = await api.post('/auth/register/confirm', {
                username: regData.username,
                password: regData.password,
                code: values.code
            });

            message.success('Регистрация успешно завершена!');
            if (response.data.token || response.data.message) {
                await handleAuthSuccess(response.data.token || response.data.message);
            }
        } catch (error) {
            message.error('Неверный код или срок его действия истек');
        } finally {
            setLoading(false);
        }
    };

    const LoginForm = () => (
        <Form name="login" onFinish={onLoginSubmit} layout="vertical" requiredMark={false}>
            <Form.Item name="username" label={<Text strong>Корпоративная почта</Text>}
                       rules={[{required: true, message: 'Введите почту!'}, {
                           type: 'email',
                           message: 'Некорректный email'
                       }]}>
                <Input prefix={<UserOutlined/>} placeholder="ivanov@hse.ru" size="large"/>
            </Form.Item>
            <Form.Item name="password" label={<Text strong>Пароль</Text>}
                       rules={[{required: true, message: 'Введите пароль!'}]}>
                <Input.Password prefix={<LockOutlined/>} placeholder="••••••" size="large"/>
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large"
                    style={{marginTop: 10}}>Войти</Button>
        </Form>
    );

    const RegisterForm = () => (
        <Form name="register" onFinish={onRequestCode} layout="vertical" requiredMark={false}>
            <Alert title="Доступ разрешен только сотрудникам и студентам с почтой в доменах @hse.ru или @edu.hse.ru"
                   type="info" showIcon style={{marginBottom: 16}}/>

            <Form.Item
                name="username"
                label={<Text strong>Корпоративная почта ВШЭ</Text>}
                rules={[
                    {required: true, message: 'Введите почту!'},
                    {type: 'email', message: 'Некорректный формат'},
                    // КАСТОМНЫЙ ВАЛИДАТОР ДОМЕНА
                    {
                        validator(_, value) {
                            if (!value) return Promise.resolve();
                            if (value.endsWith('@hse.ru') || value.endsWith('@edu.hse.ru')) {
                                return Promise.resolve();
                            }
                            return Promise.reject(new Error('Разрешены только домены @hse.ru и @edu.hse.ru!'));
                        }
                    }
                ]}
            >
                <Input prefix={<MailOutlined/>} placeholder="ivanov@hse.ru" size="large"/>
            </Form.Item>

            <Form.Item name="password" label={<Text strong>Придумайте пароль</Text>}
                       rules={[{required: true, message: 'Введите пароль!'}, {min: 8, message: 'Минимум 8 символов'}]}>
                <Input.Password prefix={<LockOutlined/>} placeholder="••••••" size="large"/>
            </Form.Item>

            <Form.Item name="confirm" label={<Text strong>Повторите пароль</Text>} dependencies={['password']} rules={[
                {required: true, message: 'Повторите пароль!'},
                ({getFieldValue}) => ({
                    validator(_, value) {
                        if (!value || getFieldValue('password') === value) return Promise.resolve();
                        return Promise.reject(new Error('Пароли не совпадают!'));
                    },
                }),
            ]}>
                <Input.Password prefix={<LockOutlined/>} placeholder="••••••" size="large"/>
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={loading} block size="large" style={{marginTop: 10}}>Получить
                код подтверждения</Button>
        </Form>
    );

    const VerifyCodeForm = () => (
        <Form name="verify" onFinish={onVerifyCode} layout="vertical" requiredMark={false}>
            <div style={{textAlign: 'center', marginBottom: 20}}>
                <MailOutlined style={{fontSize: 40, color: 'var(--hse-blue)', marginBottom: 10}}/>
                <Title level={5}>Проверьте вашу почту</Title>
                <Text type="secondary">Мы отправили 6-значный код на <br/><b>{regData.username}</b></Text>
            </div>

            <Form.Item name="code" rules={[{required: true, message: 'Введите код!'}, {
                len: 6,
                message: 'Код должен состоять из 6 цифр'
            }]}>
                <Input
                    size="large"
                    placeholder="123456"
                    maxLength={6}
                    style={{textAlign: 'center', fontSize: 24, letterSpacing: 10, padding: 10}}
                />
            </Form.Item>

            <Space orientation="vertical" style={{width: '100%'}} size="middle">
                <Button type="primary" htmlType="submit" loading={loading} block size="large">
                    Подтвердить и завершить
                </Button>
                <Button type="text" block onClick={() => setIsVerificationStep(false)} icon={<ArrowLeftOutlined/>}>
                    Изменить email
                </Button>
            </Space>
        </Form>
    );

    const items = [
        {key: 'login', label: 'Вход', children: <LoginForm/>},
        {key: 'register', label: 'Регистрация', children: <RegisterForm/>},
    ];

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'var(--hse-blue)',
            backgroundImage: 'linear-gradient(135deg, #0F2D69 0%, #234B9B 100%)'
        }}>
            <Card style={{width: 420, borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.2)'}}>
                <div style={{textAlign: 'center', marginBottom: 24}}>
                    <Title level={3} style={{color: 'var(--hse-blue)', margin: 0, fontFamily: 'HSE Sans'}}>Помощник
                        Редактора</Title>
                    <Text type="secondary">Корпоративный портал НИУ ВШЭ</Text>
                </div>

                {isVerificationStep && activeTab === 'register' ? (
                    <VerifyCodeForm/>
                ) : (
                    <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} centered size="large"/>
                )}
            </Card>
        </div>
    );
};

export default LoginPage;
