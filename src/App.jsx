import React, {useEffect, useState} from 'react';
import {Navigate, Route, Routes} from 'react-router-dom';
import {useDispatch, useSelector} from 'react-redux';
import {ConfigProvider, Result} from 'antd';
import AnalyticsPage from './pages/AnalyticsPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EditorPage from './pages/EditorPage';
import MainLayout from './components/Layout/MainLayout';
import api from './utils/api';
import {loginSuccess, logout} from './store/authSlice';
import {MobileOutlined} from '@ant-design/icons';

function App() {
    const dispatch = useDispatch();
    const isAuthenticated = useSelector((state) => !!state.auth.isAuthenticated);

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkIfMobile = () => {
            const isSmallScreen = window.innerWidth < 1024;
            
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            const isMobileAgent = /android|ipad|playbook|silk|iphone|ipod/i.test(userAgent.toLowerCase());
            setIsMobile(isSmallScreen || isMobileAgent);
        };
        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            if (localStorage.getItem('jwtToken')) {
                try {
                    const response = await api.get('/auth/me');
                    dispatch(loginSuccess(response.data));
                } catch (e) {
                    dispatch(logout());
                }
            }
        };
        if (!isMobile) {
            checkAuth();
        }
    }, [dispatch, isMobile]);

    if (isMobile) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
                <Result
                    icon={<MobileOutlined style={{ color: 'var(--hse-blue)' }} />}
                    title="Упс... Мобильная версия не поддерживается"
                    subTitle={<span style={{ fontFamily: 'HSE Sans', fontSize: '16px' }}>Помощник редакторов сайтов ВШЭ является сложным профессиональным инструментом. Пожалуйста, откройте приложение с компьютера или ноутбука.</span>}
                />
            </div>
        );
    }

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: 'var(--hse-blue)',
                    borderRadius: 4,
                },
            }}
        >
            <Routes>
                <Route path="/login" element={!isAuthenticated ? <LoginPage/> : <Navigate to="/"/>}/>

                <Route path="/analytics" element={isAuthenticated ? <MainLayout/> : <Navigate to="/login"/>}>
                    <Route index element={<AnalyticsPage/>}/>
                </Route>

                <Route path="/" element={isAuthenticated ? <MainLayout/> : <Navigate to="/login"/>}>
                    <Route index element={<DashboardPage/>}/>
                    <Route path="*" element={<Navigate to="/"/>}/>
                </Route>

                <Route path="/editor/:id" element={isAuthenticated ? <EditorPage/> : <Navigate to="/login"/>}/>
            </Routes>
        </ConfigProvider>
    );
}

export default App;
