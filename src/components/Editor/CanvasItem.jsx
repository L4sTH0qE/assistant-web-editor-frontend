import React from 'react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {Button, Tooltip} from 'antd';
import {DeleteOutlined} from '@ant-design/icons';
import {useDispatch, useSelector} from 'react-redux';
import {removeBlock, selectBlock} from '../../store/editorSlice';
import {BlockRenderer} from '../Blocks/BlockRenderer';

export const CanvasItem = ({block}) => {
    const dispatch = useDispatch();
    const selectedId = useSelector((state) => state.editor.selectedBlockId);
    const isSelected = selectedId === block.id;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({id: block.id});

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        fontFamily: 'HSE Sans',
        border: isSelected ? '2px solid var(--hse-blue)' : '2px solid transparent',
        marginBottom: '16px',
        background: '#fff',
        padding: '24px 16px',
        position: 'relative',
        borderRadius: '4px',
        cursor: 'grab',
        boxShadow: isDragging
            ? '0 10px 20px rgba(0,0,0,0.15)'
            : isSelected
                ? '0 0 0 2px rgba(15, 45, 109, 0.1)'
                : '0 1px 3px rgba(0,0,0,0.1)',
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 1,
    };

    const handleSelect = () => {
        dispatch(selectBlock(block.id));
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        dispatch(removeBlock(block.id));
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={handleSelect}
        >
            <div style={{pointerEvents: 'none'}}>
                <BlockRenderer block={block}/>
            </div>

            {isSelected && (
                <div style={{position: 'absolute', top: 0, right: 0}}>
                    <Tooltip title="Удалить блок">
                        <Button
                            type="primary"
                            danger
                            shape="circle"
                            icon={<DeleteOutlined/>}
                            onClick={handleDelete}
                            onPointerDown={(e) => e.stopPropagation()}
                        />
                    </Tooltip>
                </div>
            )}
        </div>
    );
};