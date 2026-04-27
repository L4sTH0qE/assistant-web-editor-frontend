import React, { useEffect, useState } from 'react';
import { Drawer, Typography, Badge, Button, Spin, Space, Tooltip, Modal, message, Flex } from 'antd';
import { HistoryOutlined, CheckCircleFilled, RollbackOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import api from '../../utils/api';
import { updateBlocks } from '../../store/editorSlice';

const { Text } = Typography;

export const VersionHistoryDrawer = ({ isOpen, onClose, pageId }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewData, setPreviewData] = useState({ blocks: [], versionNumber: null });
    const dispatch = useDispatch();

    useEffect(() => {
        if (isOpen && pageId) {
            loadHistory();
        }
    }, [isOpen, pageId]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/pages/${pageId}/history`);
            setHistory(data);
        } catch (e) {
            message.error('Не удалось загрузить историю версий');
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = async (version) => {
        setPreviewLoading(true);
        setPreviewModalOpen(true);
        try {
            const { data } = await api.get(`/pages/versions/${version.id}`);
            setPreviewData({ blocks: data, versionNumber: version.versionNumber });
        } catch (e) {
            message.error('Ошибка загрузки версии');
            setPreviewModalOpen(false);
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleRestore = () => {
        Modal.confirm({
            title: `Восстановить Версию ${previewData.versionNumber}?`,
            content: 'Текущие несохраненные изменения будут потеряны. Вы уверены?',
            okText: 'Да, восстановить',
            cancelText: 'Отмена',
            onOk() {
                dispatch(updateBlocks(previewData.blocks));
                message.success('Старая версия успешно загружена в редактор! Нажмите "Сохранить", чтобы зафиксировать ее.');
                setPreviewModalOpen(false);
                onClose();
            }
        });
    };

    return (
        <>
            <Drawer
                title={<span><HistoryOutlined /> История версий</span>}
                placement="right"
                onClose={onClose}
                open={isOpen}
                styles={{ body: { padding: '16px' } }}
            >
                {loading ? <Spin style={{ display: 'block', textAlign: 'center', marginTop: 50 }} /> : (
                    <Flex vertical gap="small">
                        {history.map((item, index) => (
                            <div
                                key={item.id}
                                style={{
                                    background: item.published ? '#f6ffed' : index === 0 ? '#f0f5ff' : '#fff',
                                    border: '1px solid #f0f0f0',
                                    borderRadius: 6,
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    transition: '0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px'
                                }}
                                className="history-item-hover"
                                onClick={() => handlePreview(item)}
                            >
                                <Space align="center" wrap>
                                    <Text strong>Версия {item.versionNumber}</Text>
                                    {index === 0 && <Badge count="Текущая" style={{ backgroundColor: '#1677ff' }} />}
                                    {item.published && (
                                        <Tooltip title="Последняя выгруженная на сайт ВШЭ версия">
                                            <CheckCircleFilled style={{ color: '#52c41a', fontSize: '16px' }} />
                                        </Tooltip>
                                    )}
                                </Space>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    {new Date(item.createdAt).toLocaleString('ru-RU')}
                                </Text>
                            </div>
                        ))}
                    </Flex>
                )}
            </Drawer>

            <Modal
                title={`Предпросмотр Версии ${previewData.versionNumber}`}
                open={previewModalOpen}
                onCancel={() => setPreviewModalOpen(false)}
                footer={[
                    <Button key="cancel" onClick={() => setPreviewModalOpen(false)}>Отмена</Button>,
                    <Button key="restore" type="primary" icon={<RollbackOutlined />} onClick={handleRestore}>Восстановить эту версию</Button>
                ]}
                width={700}
            >
                {previewLoading ? <Spin style={{ display: 'block', textAlign: 'center', margin: '50px 0' }} /> : (
                    <div style={{ maxHeight: '60vh', overflowY: 'auto', background: '#fafafa', padding: 20, borderRadius: 6, border: '1px solid #eee' }}>
                        {previewData.blocks.length === 0 ? (
                            <Text type="secondary">В этой версии нет контента.</Text>
                        ) : (
                            previewData.blocks.map((block, i) => (
                                <div key={i} style={{ marginBottom: 16 }}>
                                    {block.type === 'text' ? (
                                        <div dangerouslySetInnerHTML={{ __html: block.props.content }} style={{ fontFamily: 'HSE Sans' }} />
                                    ) : (
                                        <Text type="secondary">[ Блок: {block.type} ]</Text>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </Modal>

            <style>{`
               .history-item-hover:hover {
                   border-color: #1677ff !important;
                   box-shadow: 0 2px 8px rgba(0,0,0,0.1);
               }
           `}</style>
        </>
    );
};
