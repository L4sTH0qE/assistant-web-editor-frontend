import React from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {closestCenter, DndContext, PointerSensor, useSensor, useSensors} from '@dnd-kit/core';
import {SortableContext, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {Empty, Typography} from 'antd';
import {reorderBlocks, selectBlock} from '../../store/editorSlice';
import {CanvasItem} from './CanvasItem';

const {Title} = Typography;

export const Canvas = (props) => {
    const blocks = useSelector((state) => state.editor.blocks);
    const dispatch = useDispatch();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const handleDragEnd = (event) => {
        const {active, over} = event;

        if (active.id !== over?.id) {
            const oldIndex = blocks.findIndex((b) => b.id === active.id);
            const newIndex = blocks.findIndex((b) => b.id === over.id);
            dispatch(reorderBlocks({oldIndex, newIndex}));
        }
    };

    const handleBackgroundClick = (e) => {
        if (e.target === e.currentTarget) {
            dispatch(selectBlock(null));
        }
    };

    return (
        <div
            style={{
                minHeight: '100%',
                padding: '0 40px 100px 40px',
                maxWidth: '1000px',
                margin: '0 auto',
                cursor: 'default'
            }}
            onClick={handleBackgroundClick}
        >
            <Title
                level={1}
                style={{
                    margin: 0,
                    color: '#000000',
                    paddingBottom: '8px',
                    fontFamily: 'HSE Sans',
                    border: '1px solid transparent',
                    marginBottom: '16px',
                    background: '#f8f5f2',
                    padding: '24px 16px',
                    position: 'relative',
                    borderRadius: '4px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    opacity: 1,
                    zIndex: 1,
                }}

            >
                {props.name}
            </Title>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={blocks} strategy={verticalListSortingStrategy}>
                    {blocks.map((block) => (
                        <CanvasItem key={block.id} block={block}/>
                    ))}
                </SortableContext>
            </DndContext>

            {blocks.length === 0 && (
                <Empty style={{padding: '60px 0', textAlign: 'center', fontFamily: 'HSE Sans'}}
                       description="Страница пуста. Добавьте блоки из левой панели"/>
            )}
        </div>
    );
};