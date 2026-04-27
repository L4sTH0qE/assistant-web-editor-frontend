import React, { useState } from 'react';
import { Button, Card, Form, Input, message, Tabs, Typography, Space, Alert } from 'antd';
import { LockOutlined, UserOutlined, MailOutlined, ArrowLeftOutlined, KeyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../utils/api';
import { loginSuccess } from '../store/authSlice';

const { Title, Text } = Typography;

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('login');

    // Стейты маршрутизации (Регистрация / Восстановление)
    const [step, setStep] = useState('AUTH'); // AUTH, REG_VERIFY, RESET_EMAIL, RESET_VERIFY
    const [tempData, setTempData] = useState({ email: '', password: '' });

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleAuthSuccess = async (token) => {
        localStorage.setItem('jwtToken', token);
        const meResponse = await api.get('/auth/me');
        dispatch(loginSuccess(meResponse.data));
        navigate('/');
    };

    // --- ЛОГИКА ВХОДА ---
    const onLoginSubmit = async (values) => {
        setLoading(true);
        try {
            const response = await api.post('/auth/login', { username: values.username, password: values.password });
            if (response.data.token || response.data.message) {
                message.success('Вход выполнен');
                await handleAuthSuccess(response.data.token || response.data.message);
            }
        } catch (error) {
            message.error(error.response?.data?.error || 'Неверный логин или пароль');
        } finally {
            setLoading(false);
        }
    };

    // --- ЛОГИКА РЕГИСТРАЦИИ ---
    const onRegRequestCode = async (values) => {
        setLoading(true);
        try {
            setTempData({ email: values.username, password: values.password });
            await api.post('/auth/register/send-code', { username: values.username });
            message.success('Код отправлен на почту!');
            setStep('REG_VERIFY');
        } catch (error) {
            message.error(error.response?.data?.error || 'Ошибка сервера');
        } finally {
            setLoading(false);
        }
    };

    const onRegVerifyCode = async (values) => {
        setLoading(true);
        try {
            const response = await api.post('/auth/register/confirm', {
                username: tempData.email, password: tempData.password, code: values.code
            });
            message.success('Регистрация завершена!');
            await handleAuthSuccess(response.data.token || response.data.message);
        } catch (error) {
            message.error(error.response?.data?.error || 'Неверный код');
        } finally {
            setLoading(false);
        }
    };

    // --- ЛОГИКА ВОССТАНОВЛЕНИЯ ПАРОЛЯ ---
    const onResetRequestCode = async (values) => {
        setLoading(true);
        try {
            setTempData({ ...tempData, email: values.email });
            await api.post('/auth/password-reset/send-code', { email: values.email });
            message.success('Код сброса отправлен!');
            setStep('RESET_VERIFY');
        } catch (error) {
            message.error(error.response?.data?.error || 'Пользователь не найден');
        } finally {
            setLoading(false);
        }
    };

    const onResetVerifyAndSave = async (values) => {
        setLoading(true);
        try {
            const response = await api.post('/auth/password-reset/confirm', {
                email: tempData.email, code: values.code, newPassword: values.newPassword
            });
            message.success('Пароль успешно изменен!');
            await handleAuthSuccess(response.data.token || response.data.message);
        } catch (error) {
            message.error(error.response?.data?.error || 'Ошибка сброса пароля');
        } finally {
            setLoading(false);
        }
    };

    const LoginForm = () => (
        <Form name="login" onFinish={onLoginSubmit} layout="vertical" requiredMark={false}>
            <Form.Item name="username" label={<Text strong>Корпоративная почта</Text>} rules={[{ required: true, message: 'Введите почту!' }]}>
                <Input prefix={<UserOutlined />} placeholder="ivanov@hse.ru" size="large" />
            </Form.Item>
            <Form.Item name="password" label={<Text strong>Пароль</Text>} rules={[{ required: true, message: 'Введите пароль!' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="••••••" size="large" />
            </Form.Item>

            <div style={{ textAlign: 'right', marginBottom: 16, marginTop: -10 }}>
                <a onClick={() => setStep('RESET_EMAIL')} style={{ color: 'var(--hse-blue)' }}>Забыли пароль?</a>
            </div>

            <Button type="primary" htmlType="submit" loading={loading} block size="large">Войти</Button>
        </Form>
    );

    const RegisterForm = () => (
        <Form name="register" onFinish={onRegRequestCode} layout="vertical" requiredMark={false}>
            <Alert message="Доступ разрешен только для почты в домене @hse.ru" type="info" showIcon style={{marginBottom: 16}}/>
            <Form.Item name="username" label={<Text strong>Корпоративная почта ВШЭ</Text>} rules={[
                { required: true, message: 'Введите почту!' },
                { validator(_, value) {
                        if (!value) return Promise.resolve();
                        if (value.endsWith('@hse.ru')) return Promise.resolve();
                        return Promise.reject(new Error('Разрешен только домен @hse.ru!'));
                    }}
            ]}>
                <Input prefix={<MailOutlined />} placeholder="ivanov@hse.ru" size="large" />
            </Form.Item>
            <Form.Item name="password" label={<Text strong>Придумайте пароль</Text>} rules={[{ required: true, message: 'Введите пароль!' }, { min: 8, message: 'Минимум 8 символов' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="••••••" size="large" />
            </Form.Item>
            <Form.Item name="confirm" label={<Text strong>Повторите пароль</Text>} dependencies={['password']} rules={[
                { required: true, message: 'Повторите пароль!' },
                ({ getFieldValue }) => ({ validator(_, value) {
                        if (!value || getFieldValue('password') === value) return Promise.resolve();
                        return Promise.reject(new Error('Пароли не совпадают!'));
                    }}),
            ]}>
                <Input.Password prefix={<LockOutlined />} placeholder="••••••" size="large" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">Получить код подтверждения</Button>
        </Form>
    );

    // Универсальная форма запроса Email (для сброса пароля)
    const ResetEmailForm = () => (
        <Form name="resetEmail" onFinish={onResetRequestCode} layout="vertical" requiredMark={false}>
            <div style={{textAlign: 'center', marginBottom: 20}}>
                <KeyOutlined style={{fontSize: 40, color: 'var(--hse-blue)', marginBottom: 10}} />
                <Title level={5}>Сброс пароля</Title>
                <Text type="secondary">Укажите почту, к которой привязан аккаунт</Text>
            </div>
            <Form.Item name="email" rules={[{ required: true, message: 'Введите почту!' }, { type: 'email', message: 'Некорректный email' }]}>
                <Input prefix={<UserOutlined />} placeholder="ivanov@hse.ru" size="large" />
            </Form.Item>
            <Space direction="vertical" style={{ width: '100%' }}>
                <Button type="primary" htmlType="submit" loading={loading} block size="large">Отправить код сброса</Button>
                <Button type="text" block onClick={() => setStep('AUTH')} icon={<ArrowLeftOutlined />}>Вернуться ко входу</Button>
            </Space>
        </Form>
    );

    // Универсальная форма проверки кода (для регистрации и сброса пароля)
    const VerifyCodeForm = ({ isResetMode }) => (
        <Form name="verify" onFinish={isResetMode ? onResetVerifyAndSave : onRegVerifyCode} layout="vertical" requiredMark={false}>
            <div style={{textAlign: 'center', marginBottom: 20}}>
                <MailOutlined style={{fontSize: 40, color: 'var(--hse-blue)', marginBottom: 10}} />
                <Title level={5}>Проверьте вашу почту</Title>
                <Text type="secondary">Мы отправили 6-значный код на <br/><b>{tempData.email}</b></Text>
            </div>

            <Form.Item name="code" rules={[{ required: true, message: 'Введите код!' }, { len: 6, message: 'Код: 6 цифр' }]}>
                <Input size="large" placeholder="123456" maxLength={6} style={{ textAlign: 'center', fontSize: 24, letterSpacing: 10, padding: 10 }} />
            </Form.Item>

            {isResetMode && (
                <>
                    <Form.Item name="newPassword" label={<Text strong>Новый пароль</Text>} rules={[{ required: true, message: 'Введите пароль!' }]}>
                        <Input.Password prefix={<LockOutlined />} size="large" />
                    </Form.Item>
                    <Form.Item name="confirmNew" label={<Text strong>Повторите новый пароль</Text>} dependencies={['newPassword']} rules={[
                        { required: true, message: 'Повторите пароль!' },
                        ({ getFieldValue }) => ({ validator(_, value) {
                                if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                                return Promise.reject(new Error('Пароли не совпадают!'));
                            }}),
                    ]}>
                        <Input.Password prefix={<LockOutlined />} size="large" />
                    </Form.Item>
                </>
            )}

            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Button type="primary" htmlType="submit" loading={loading} block size="large">
                    {isResetMode ? 'Сохранить и войти' : 'Подтвердить и завершить'}
                </Button>
                <Button type="text" block onClick={() => setStep(isResetMode ? 'RESET_EMAIL' : 'AUTH')} icon={<ArrowLeftOutlined />}>
                    Назад
                </Button>
            </Space>
        </Form>
    );

    // --- РЕНДЕРИНГ ОСНОВНОГО ЭКРАНА ---
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--hse-blue)', backgroundImage: 'linear-gradient(135deg, #0F2D69 0%, #234B9B 100%)' }}>
            <Card style={{ width: 420, borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Title level={3} style={{ color: 'var(--hse-blue)', margin: 0, fontFamily: 'HSE Sans' }}>Помощник Редактора</Title>
                    <Text type="secondary">Корпоративный портал НИУ ВШЭ</Text>
                </div>

                {step === 'AUTH' && (
                    <Tabs activeKey={activeTab} onChange={setActiveTab} centered size="large" items={[
                        { key: 'login', label: 'Вход', children: <LoginForm /> },
                        { key: 'register', label: 'Регистрация', children: <RegisterForm /> },
                    ]} />
                )}

                {step === 'REG_VERIFY' && <VerifyCodeForm isResetMode={false} />}
                {step === 'RESET_EMAIL' && <ResetEmailForm />}
                {step === 'RESET_VERIFY' && <VerifyCodeForm isResetMode={true} />}
            </Card>
        </div>
    );
};

export default LoginPage;
