import React, {useEffect, useState} from 'react';
import {Button, Divider, Layout, message, Modal, Space, Spin, Typography} from 'antd';
import {ArrowLeftOutlined, CloudUploadOutlined, SaveOutlined} from '@ant-design/icons';
import {useNavigate, useParams} from 'react-router-dom';
import {useDispatch, useSelector} from 'react-redux';

import {Sidebar} from '../components/Editor/Sidebar';
import {Canvas} from '../components/Editor/Canvas';
import {PropertiesPanel} from '../components/Editor/PropertiesPanel';
import {ExportModal} from '../components/Editor/ExportModal';

import api from '../utils/api';
import {setIsSaved, setPageData} from '../store/editorSlice';

const {Sider, Content, Header} = Layout;
const {Text} = Typography;

const EditorPage = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const {blocks, title, isSaved} = useSelector(state => state.editor);

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
                const {data} = await api.get(`/pages/${id}`);

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

            const {data} = await api.get(`/pages/${id}/export`);
            setExportData(data);
            setIsExportOpen(true);
        } catch (error) {
            message.error('Ошибка экспорта');
        }
    };

    if (loading) {
        return <div style={{display: 'flex', justifyContent: 'center', marginTop: 100}}><Spin size="large"/></div>;
    }

    return (
        <Layout style={{height: '100vh'}}>
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
                    <Button
                        style={{width: '5vw', fontFamily: 'HSE Sans'}}
                        icon={<ArrowLeftOutlined/>}
                        onClick={handleBackClick}
                    >
                        Назад
                    </Button>
                    <Divider orientation="vertical"/>
                    <Text strong style={{fontSize: 20, color: 'white', fontFamily: 'HSE Sans'}}>Редактирование
                        страницы</Text>
                    {!isSaved && <Text strong style={{fontSize: 20, color: 'white', fontFamily: 'HSE Sans'}}>(есть
                        изменения)</Text>}
                </Space>
                <Space>
                    {/* Кнопка Экспорт */}
                    <Button
                        style={{width: '8vw', fontFamily: 'HSE Sans'}}
                        icon={<CloudUploadOutlined/>}
                        onClick={handleExport}
                    >
                        Экспорт HTML
                    </Button>

                    {/* Кнопка Сохранить */}
                    <Button
                        style={{width: '8vw', fontFamily: 'HSE Sans'}}
                        icon={<SaveOutlined/>}
                        loading={saving}
                        onClick={handleSave}
                    >
                        Сохранить
                    </Button>
                </Space>
            </Header>

            <Layout>
                {/* Список блоков */}
                <Sider width='10vw' theme="light" style={{borderRight: '1px solid #eee'}}>
                    <Sidebar/>
                </Sider>

                {/* Отображение страницы */}
                <Content style={{overflowY: 'auto', padding: '24px', background: '#f5f5f5'}}>
                    <Canvas name={title}/>
                </Content>

                {/* Редактор текущего блока */}
                <Sider width='30vw' theme="light" style={{borderLeft: '1px solid #eee'}}>
                    <PropertiesPanel/>
                </Sider>
            </Layout>
            <ExportModal
                isOpen={isExportOpen}
                onClose={() => setIsExportOpen(false)}
                blocksData={exportData}
                name={title}
            />
        </Layout>
    );
};

export default EditorPage;