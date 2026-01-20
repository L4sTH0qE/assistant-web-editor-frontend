import React, { useState } from 'react';
import { Modal, List, Button, Typography, Input, message } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { TextArea } = Input;

export const ExportModal = ({ isOpen, onClose, blocksData }) => {

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        message.success('Код блока скопирован!');
    };

    return (
        <Modal
            title="Экспорт HTML для вставки в CMS"
            open={isOpen}
            onCancel={onClose}
            footer={[
                <Button key="close" type="primary" onClick={onClose}>
                    Закрыть
                </Button>
            ]}
            width={700}
        >
            <div style={{ marginBottom: 16 }}>
                <Text type="secondary">
                    Скопируйте HTML-код каждого блока по отдельности и вставьте его в соответствующее поле (Источник) в редакторе ВШЭ.
                </Text>
            </div>

            <List
                itemLayout="horizontal"
                dataSource={blocksData}
                bordered
                style={{ maxHeight: '60vh', overflowY: 'auto' }}
                renderItem={(item, index) => (
                    <List.Item
                        actions={[
                            <Button
                                type="dashed"
                                icon={<CopyOutlined />}
                                onClick={() => handleCopy(item.htmlContent)}
                            >
                                Копировать
                            </Button>
                        ]}
                    >
                        <List.Item.Meta
                            avatar={
                                <div style={{
                                    width: 24, height: 24,
                                    background: 'var(--hse-blue)', color: 'white',
                                    borderRadius: '50%', textAlign: 'center', lineHeight: '24px'
                                }}>
                                    {index + 1}
                                </div>
                            }
                            title={item.blockName}
                            description={
                                <TextArea
                                    value={item.htmlContent}
                                    readOnly
                                    autoSize={{ minRows: 2, maxRows: 6 }}
                                    style={{ fontFamily: 'monospace', fontSize: 12, marginTop: 8 }}
                                />
                            }
                        />
                    </List.Item>
                )}
            />
        </Modal>
    );
};