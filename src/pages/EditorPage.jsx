import React, { useEffect, useState } from 'react';
import { Layout, Button, Space, Typography, Spin, message, Divider, Modal } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { Sidebar } from '../components/Editor/Sidebar';
import { Canvas } from '../components/Editor/Canvas';
import { PropertiesPanel } from '../components/Editor/PropertiesPanel';
import { ExportModal } from '../components/Editor/ExportModal';

import api from '../utils/api';
import { setPageData, setIsSaved } from '../store/editorSlice';

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

const EditorPage = () => {
    const { id } = useParams(); // id страницы из URL
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { blocks, title, isSaved } = useSelector(state => state.editor);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [exportData, setExportData] = useState([]);
    const [isExportOpen, setIsExportOpen] = useState(false);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (!isSaved) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isSaved]);

    const handleBackClick = () => {
        if (!isSaved) {
            Modal.confirm({
                title: 'Несохраненные изменения',
                content: 'У вас есть несохраненные правки. Вы уверены, что хотите выйти? Прогресс будет утерян.',
                okText: 'Выйти без сохранения',
                okType: 'danger',
                cancelText: 'Отмена',
                onOk() {
                    navigate('/');
                }
            });
        } else {
            navigate('/');
        }
    };

    useEffect(() => {
        const fetchPageData = async () => {
            try {
                const { data } = await api.get(`/pages/${id}`);

                dispatch(setPageData({
                    id: data.id,
                    title: data.title,
                    blocks: data.blocks || []
                }));
            } catch (error) {
                console.error(error);
                message.error('Ошибка загрузки страницы');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchPageData();
    }, [id, dispatch, navigate]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post(`/pages/${id}/save`, {
                blocks: blocks
            });
            message.success('Версия сохранена!');
            dispatch(setIsSaved());
        } catch (error) {
            message.error('Не удалось сохранить');
        } finally {
            setSaving(false);
        }
    };

    const handleExport = async () => {
        try {
            await handleSave();

            const { data } = await api.get(`/pages/${id}/export`);
            setExportData(data);
            setIsExportOpen(true);
        } catch (error) {
            message.error('Ошибка экспорта');
        }
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}><Spin size="large" /></div>;
    }

    return (
        <Layout style={{ height: '100vh' }}>
            {/* Верхняя панель редактора */}
            <Header style={{
                background: '#fff',
                padding: '0 24px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                height: 64
            }}>
                <Space>
                    <Button icon={<ArrowLeftOutlined />} onClick={handleBackClick}>Назад</Button>
                    <Divider orientation="vertical" />
                    <Text strong style={{ fontSize: 18, color: 'white' }}>{title}</Text>
                    {!isSaved && <Text type="secondary" style={{ fontSize: 18, color: 'white' }}>(есть изменения)</Text>}
                </Space>
                <Space>
                    {/* Кнопка Экспорт */}
                    <Button icon={<CloudUploadOutlined />} onClick={handleExport}>
                        Экспорт HTML
                    </Button>

                    {/* Кнопка Сохранить */}
                    <Button
                        icon={<SaveOutlined />}
                        loading={saving}
                        onClick={handleSave}
                    >
                        Сохранить
                    </Button>
                </Space>
            </Header>

            <Layout>
                <Sider width={240} theme="light" style={{ borderRight: '1px solid #eee' }}>
                    <Sidebar />
                </Sider>

                <Content style={{ overflowY: 'auto', padding: '24px', background: '#f5f5f5' }}>
                    <Canvas />
                </Content>

                <Sider width={480} theme="light" style={{ borderLeft: '1px solid #eee' }}>
                    <PropertiesPanel />
                </Sider>
            </Layout>
            <ExportModal
                isOpen={isExportOpen}
                onClose={() => setIsExportOpen(false)}
                blocksData={exportData}
            />
        </Layout>
    );
};

export default EditorPage;