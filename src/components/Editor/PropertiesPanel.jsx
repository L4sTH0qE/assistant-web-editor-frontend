import React from 'react';
import { Form, Input, Typography, Empty, Select, Divider } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { updateBlockProps } from '../../store/editorSlice';
import { RichTextEditor } from '../Common/RichTextEditor';

const { Title, Text } = Typography;
const { TextArea } = Input;

export const PropertiesPanel = () => {
    const dispatch = useDispatch();
    const blocks = useSelector((state) => state.editor.blocks);
    const selectedId = useSelector((state) => state.editor.selectedBlockId);

    const selectedBlock = blocks.find(b => b.id === selectedId);

    if (!selectedBlock) {
        return (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <Empty description="Выберите блок для настройки" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
        );
    }

    const handleChange = (changedValues) => {
        dispatch(updateBlockProps({
            id: selectedId,
            props: changedValues
        }));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '16px', background: '#fafafa', borderBottom: '1px solid #eee' }}>
                <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase' }}>Свойства блока</Text>
                <Title level={5} style={{ margin: 0 }}>
                    {getBlockTypeName(selectedBlock.type)}
                </Title>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                <Form
                    layout="vertical"
                    initialValues={selectedBlock.props}
                    onValuesChange={handleChange}
                    key={selectedId}
                >
                    {renderFields(selectedBlock.type)}
                </Form>
            </div>
        </div>
    );
};

const getBlockTypeName = (type) => {
    switch(type) {
        case 'header': return 'Заголовок';
        case 'text': return 'Текстовый блок';
        case 'hero': return 'Баннер';
        default: return 'Блок';
    }
};

const renderFields = (type) => {
    switch (type) {
        case 'header':
            return (
                <>
                    <Form.Item label="Текст заголовка" name="text">
                        <Input />
                    </Form.Item>
                    <Form.Item label="Уровень (H1-H3)" name="level">
                        <Select options={[
                            { value: 1, label: 'H1 (Заголовок страницы)' },
                            { value: 2, label: 'H2 (Раздел)' },
                            { value: 3, label: 'H3 (Подраздел)' },
                        ]} />
                    </Form.Item>
                </>
            );
        case 'text':
            return (
                <Form.Item
                    label="Содержимое"
                    name="content"
                    valuePropName="value"
                    getValueFromEvent={(val) => val}
                >
                    <RichTextEditor />
                </Form.Item>
            );
        case 'hero':
            return (
                <>
                    <Form.Item label="Заголовок баннера" name="title">
                        <Input />
                    </Form.Item>
                    <Form.Item label="Ссылка на картинку" name="imageUrl">
                        <Input placeholder="https://..." />
                    </Form.Item>
                </>
            );
        default:
            return <div style={{ color: '#999' }}>Нет настроек для этого блока</div>;
    }
};