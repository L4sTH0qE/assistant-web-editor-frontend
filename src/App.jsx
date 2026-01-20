import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ConfigProvider } from 'antd'; // Провайдер темы
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EditorPage from './pages/EditorPage';
import MainLayout from './components/Layout/MainLayout';
import api from './utils/api';
import { loginSuccess, logout } from './store/authSlice';

function App() {
    const dispatch = useDispatch();
    const isAuthenticated = useSelector((state) => !!state.auth.isAuthenticated);

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
        checkAuth();
    }, [dispatch]);

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: 'var(--hse-blue)',
                    borderRadius: 2,
                },
            }}
        >
            <Routes>
                <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />

                <Route path="/" element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />} >
                    <Route index element={<DashboardPage />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Route>

                <Route path="/editor/:id" element={isAuthenticated ? <EditorPage /> : <Navigate to="/login" />} />
            </Routes>
        </ConfigProvider>
    );
}

export default App;