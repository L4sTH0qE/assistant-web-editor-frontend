import React from 'react';
import {Empty, Form, Input, Typography} from 'antd';
import {useDispatch, useSelector} from 'react-redux';
import {updateBlockProps} from '../../store/editorSlice';
import {RichTextEditor} from '../Common/RichTextEditor';

const {Title, Text} = Typography;
const {TextArea} = Input;

export const PropertiesPanel = () => {
    const dispatch = useDispatch();
    const blocks = useSelector((state) => state.editor.blocks);
    const selectedId = useSelector((state) => state.editor.selectedBlockId);

    const selectedBlock = blocks.find(b => b.id === selectedId);
    const selectedIndex = blocks.findIndex(b => b.id === selectedId);

    if (!selectedBlock) {
        return (
            <Empty style={{padding: '40px 20px', textAlign: 'center', fontFamily: 'HSE Sans'}}
                   description="Выберите блок для редактирования" image={Empty.PRESENTED_IMAGE_SIMPLE}/>
        );
    }

    const handleChange = (changedValues) => {
        dispatch(updateBlockProps({
            id: selectedId,
            props: changedValues
        }));
    };

    return (
        <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
            <div style={{padding: '16px', background: '#fafafa', borderBottom: '1px solid #eee'}}>
                <Text type="secondary" style={{fontSize: '14px', fontFamily: 'HSE Sans', textTransform: 'uppercase'}}>Свойства
                    блока</Text>
                <Title level={5} style={{margin: 0, fontFamily: 'HSE Sans'}}>
                    {getBlockTypeName(selectedBlock.type, selectedIndex)}
                </Title>
            </div>

            <div style={{flex: 1, overflowY: 'auto', padding: '16px'}}>
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

const getBlockTypeName = (type, id) => {
    switch (type) {
        case 'text':
            return `Текстовый блок ${id + 1}`;
        default:
            return 'Блок';
    }
};

const renderFields = (type) => {
    switch (type) {
        case 'text':
            return (
                <Form.Item
                    className="custom-label-font"
                    label="Содержимое"
                    name="content"
                    valuePropName="value"
                    getValueFromEvent={(val) => val}
                >
                    <RichTextEditor/>
                </Form.Item>
            );
        default:
            return <div style={{color: '#999', fontFamily: 'HSE Sans'}}>Нет настроек для этого блока</div>;
    }
};