import React, { useEffect, useState, useRef } from 'react';
import {
    Button,
    Dropdown,
    Divider,
    Layout,
    message,
    Modal,
    Space,
    Spin,
    Typography,
    Drawer,
    Badge,
    Tooltip,
    Input,
    Tag,
    Alert
} from 'antd';
import {
    ArrowLeftOutlined,
    CloudUploadOutlined,
    SaveOutlined,
    SettingOutlined,
    LinkOutlined,
    SyncOutlined,
    EditOutlined,
    LoadingOutlined,
    WarningOutlined,
    HistoryOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { Sidebar } from '../components/Editor/Sidebar';
import { Canvas } from '../components/Editor/Canvas';
import { PropertiesPanel } from '../components/Editor/PropertiesPanel';
import { MetadataTab } from '../components/Editor/MetadataTab';
import { TransferModal } from '../components/Editor/TransferModal';
import { VersionHistoryDrawer } from '../components/Editor/VersionHistoryDrawer';

import api from '../utils/api';
import { setIsSaved, setPageData, setTitle, setSyncStatus } from '../store/editorSlice';

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

const EditorPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { blocks, title, type, metadata, syncStatus, isSaved, slug } = useSelector((state) => state.editor);

    const [initialLoading, setInitialLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [isMetadataOpen, setIsMetadataOpen] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);

    const [isSyncReportOpen, setIsSyncReportOpen] = useState(false);
    const [syncReportData, setSyncReportData] = useState(null);

    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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

    const handleAutoLink = async () => {
        if (!isSaved) {
            await handleSave();
        }
        setLoading(true);
        try {
            const { data } = await api.post(`/pages/${id}/autolink`);
            dispatch(setPageData(data));
            message.success('Ссылки расставлены автоматически');
        } catch (e) {
            message.error('Ошибка автоматической расстановки');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckSync = async () => {
        if (!metadata?.externalUrl) {
            message.warning('Сначала укажите URL в настройках метаданных!');
            setIsMetadataOpen(true);
            return;
        }

        if (!isSaved) {
            await handleSave();
        }

        setLoading(true);
        try {
            const { data } = await api.post(`/pages/${id}/check-sync`);
            dispatch(setSyncStatus(data.status));
            setSyncReportData(data);
            setIsSyncReportOpen(true);
        } catch (e) {
            message.error('Ошибка проверки синхронизации. Проверьте доступность ссылки.');
            dispatch(setSyncStatus('DESYNCED'));
        } finally {
            setLoading(false);
        }
    };

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
                    type: data.type,
                    blocks: data.blocks || [],
                    metadata: data.metadata || {},
                    syncStatus: data.syncStatus,
                    slug: data.slug
                }));
            } catch (error) {
                console.error(error);
                message.error('Ошибка загрузки страницы');
                navigate('/');
            } finally {
                setInitialLoading(false);
            }
        };
        if (id) fetchPageData();
    }, [id, dispatch, navigate]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post(`/pages/${id}/save`, {
                title: title,
                blocks: blocks,
                metadata: metadata,
                slug: slug
            });
            message.success('Версия сохранена!');

            dispatch(setSyncStatus('DESYNCED'));
            dispatch(setIsSaved());
        } catch (error) {
            message.error(error.response?.data?.error || 'Не удалось сохранить');
        } finally {
            setSaving(false);
        }
    };

    const handleExportClick = async () => {
        if (!isSaved) {
            await handleSave();
        }
        setIsTransferOpen(true);
    };

    if (initialLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--hse-gray-accent)' }}>
                <Spin size="large" />
            </div>
        );
    }

    const CustomTitle = ({ title, dispatch, setTitle, width = 300 }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [localVal, setLocalVal] = useState(title || '');
        const inputRef = useRef(null);

        useEffect(() => {
            setLocalVal(title || '');
        }, [title]);

        useEffect(() => {
            if (isEditing) {
                inputRef.current?.focus();
            }
        }, [isEditing]);

        const handleSave = () => {
            setIsEditing(false);
            if (localVal !== title) {
                dispatch(setTitle(localVal));
            }
        };

        return (
            <div className="google-docs-title-wrapper" style={{width, height: 32}}>
                {isEditing ? (
                    <Input
                        ref={inputRef}
                        value={localVal}
                        onChange={(e) => setLocalVal(e.target.value)}
                        onBlur={handleSave}
                        onPressEnter={handleSave}
                        maxLength={300}
                        className="google-docs-input"
                        style={{ width: '100%' }}
                    />
                ) : (
                    <div
                        className="google-docs-text-container"
                        onClick={() => setIsEditing(true)}
                        title="Изменить заголовок"
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '100%',
                            cursor: 'pointer',
                            height: '100%'
                        }}
                    >
                        <Text
                            ellipsis
                            className="google-docs-text"
                            style={{
                                flex: 1,
                                marginRight: '8px'
                            }}
                        >
                            {title || 'Без названия'}
                        </Text>
                        <EditOutlined className="google-docs-edit-icon" style={{ color: 'var(--hse-gray)' }} />
                    </div>
                )}
            </div>
        );
    };

    const toolsMenuItems = [
        {
            key: 'metadata',
            icon: <SettingOutlined />,
            label: (
                <Tooltip title="Настроить рубрики, темы, URL страницы" placement="right">
                    <span>Метаданные</span>
                </Tooltip>
            ),
            onClick: () => setIsMetadataOpen(true),
        },
        {
            type: 'divider',
        },
        {
            key: 'autolink',
            icon: <LinkOutlined />,
            label: 'Авто-ссылки',
            onClick: handleAutoLink,
        },
        {
            type: 'divider',
        },
        {
            key: 'sync',
            icon: <SyncOutlined />,
            label: 'Синхронизация',
            onClick: handleCheckSync,
        },
    ];

    const fileMenuItems = [
        {
            key: 'history',
            icon: <HistoryOutlined />,
            label: 'История версий',
            onClick: () => setIsHistoryOpen(true),
        },
        {
            type: 'divider'
        },
        {
            key: 'export',
            icon: <CloudUploadOutlined style={{ color: 'var(--hse-green-accent)' }} />,
            label: 'Экспортировать',
            onClick: handleExportClick,
        },
        {
            type: 'divider',
        },
        {
            key: 'save',
            icon: saving ? <LoadingOutlined /> : <SaveOutlined />,
            label: saving ? 'Сохранение...' : 'Сохранить',
            onClick: handleSave,
            disabled: saving,
        },
    ];

    return (
        <Layout style={{ height: '100vh', position: 'relative' }}>

            {/* OVERLAY ДЛЯ ЗАГРУЗОК (Автолинкинг, Синхронизация) */}
            {loading && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(2px)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <Spin size="large" />
                    <Text strong style={{ marginTop: 16, color: 'var(--hse-blue)', fontSize: '16px' }}>
                        Выполнение операции... Пожалуйста, подождите.
                    </Text>
                </div>
            )}

            {/* ВЕРХНЯЯ ПАНЕЛЬ МЕНЮ */}
            <Header style={{
                background: 'var(--hse-gray-accent)',
                padding: '0 24px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                height: 64
            }}>
                <Space align="center" style={{ display: 'flex' }}>
                    <Button style={{ minWidth: '120px' }} icon={<ArrowLeftOutlined />} onClick={handleBackClick}>Назад</Button>

                    <Tag
                        color={syncStatus === 'SYNCED' ? 'success' : syncStatus === 'DESYNCED' ? 'error' : 'default'}
                        icon={syncStatus === 'SYNCED' ? <SyncOutlined spin={loading} /> : <WarningOutlined />}
                        style={{ marginLeft: 10, fontFamily: 'HSE Sans' }}
                    >
                        {syncStatus === 'SYNCED' ? 'Синхронизировано' : syncStatus === 'DESYNCED' ? 'Не синхронизировано' : 'Черновик'}
                    </Tag>

                    <Divider orientation="vertical" />

                    <Badge dot={!isSaved} offset={[5, 0]} style={{ display: 'flex', alignItems: 'center' }}>
                        <CustomTitle title={title} setTitle={setTitle} dispatch={dispatch} width={300} />
                    </Badge>
                </Space>

                {/* ИНСТРУМЕНТЫ СМАРТ-РЕДАКТОРА */}
                <Space>
                    <Dropdown menu={{ items: fileMenuItems }} trigger={['click']} placement="bottomLeft">
                        <Button style={{ minWidth: '120px' }}>Файл</Button>
                    </Dropdown>
                    <Dropdown menu={{ items: toolsMenuItems }} trigger={['click']} placement="bottomLeft">
                        <Button style={{ minWidth: '120px' }}>Инструменты</Button>
                    </Dropdown>
                </Space>
            </Header>

            <Layout>
                <Sider width='10vw' theme="light" style={{ borderRight: '1px solid #eee' }}><Sidebar /></Sider>
                <Content style={{ overflowY: 'auto', padding: '24px', background: 'var(--hse-gray-accent)' }}><Canvas name={title} /></Content>
                <Sider width='33vw' theme="light" style={{ borderLeft: '1px solid #eee' }}><PropertiesPanel /></Sider>
            </Layout>

            {/* ПАНЕЛЬ МЕТАДАННЫХ */}
            <Drawer
                title={`Метаданные: ${type === 'NEWS' ? 'Новость' : type === 'ANNOUNCEMENT' ? 'Анонс' : 'Простая страница'}`}
                placement="right" onClose={() => setIsMetadataOpen(false)} open={isMetadataOpen} size={450}>
                <MetadataTab />
            </Drawer>

            {/* МАСТЕР ЭКСПОРТА СТРАНИЦЫ */}
            <TransferModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} />

            {/* МОДАЛЬНОЕ ОКНО ОТЧЕТА О СИНХРОНИЗАЦИИ */}
            <Modal
                title={<Typography.Title level={4} style={{ fontFamily: 'HSE Sans', margin: 0 }}>Отчет о синхронизации контента</Typography.Title>}
                open={isSyncReportOpen}
                onCancel={() => setIsSyncReportOpen(false)}
                footer={[<Button key="close" type="primary" onClick={() => setIsSyncReportOpen(false)}>Закрыть</Button>]}
                width={700}
            >
                {syncReportData && (
                    <div style={{ marginTop: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 10 }}>
                            <Text strong style={{ fontSize: 16 }}>Статус:</Text>
                            <Badge
                                status={syncReportData.status === 'SYNCED' ? 'success' : 'error'}
                                text={syncReportData.status === 'SYNCED' ? 'Синхронизировано' : 'Обнаружены расхождения'}
                                style={{ fontSize: 16 }}
                            />
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <Text strong>Процент совпадения текста: </Text>
                            <Text style={{ color: syncReportData.similarityPercent >= 80 ? '#52c41a' : '#cf1322', fontWeight: 'bold' }}>
                                {syncReportData.similarityPercent}%
                            </Text>
                        </div>

                        {!syncReportData.titleMatch && (
                            <Alert title="Внимание: Заголовок страницы на сайте отличается от черновика!" type="warning" showIcon style={{ marginBottom: 16 }} />
                        )}

                        {syncReportData.missingOnWebsite?.length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                                <Text strong style={{ color: '#d4380d' }}>Текст ЕСТЬ в черновике, но ОТСУТСТВУЕТ на сайте (Не выгружен):</Text>
                                <ul style={{ background: '#fff1f0', padding: '10px 10px 10px 25px', borderRadius: 4, marginTop: 8 }}>
                                    {syncReportData.missingOnWebsite.map((text, i) => <li key={i} style={{ marginBottom: 4, fontSize: 13 }}>{text}</li>)}
                                </ul>
                            </div>
                        )}

                        {syncReportData.extraOnWebsite?.length > 0 && (
                            <div>
                                <Text strong style={{ color: '#0958d9' }}>Текст ЕСТЬ на сайте, но ОТСУТСТВУЕТ в черновике (Системные приписки или правки на сайте):</Text>
                                <ul style={{ background: '#e6f4ff', padding: '10px 10px 10px 25px', borderRadius: 4, marginTop: 8 }}>
                                    {syncReportData.extraOnWebsite.map((text, i) => <li key={i} style={{ marginBottom: 4, fontSize: 13 }}>{text}</li>)}
                                </ul>
                            </div>
                        )}

                        {syncReportData.status === 'SYNCED' && syncReportData.extraOnWebsite?.length === 0 && syncReportData.missingOnWebsite?.length === 0 && (
                            <Alert title="Тексты идентичны. Расхождений не найдено." type="success" showIcon />
                        )}
                    </div>
                )}
            </Modal>

            {/* ИСТОРИЯ ВЕРСИЙ */}
            <VersionHistoryDrawer
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                pageId={id}
            />
        </Layout>
    );
};

export default EditorPage;
