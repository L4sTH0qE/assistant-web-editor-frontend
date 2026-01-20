import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { Empty } from 'antd';
import { reorderBlocks, selectBlock } from '../../store/editorSlice';
import { CanvasItem } from './CanvasItem';

export const Canvas = () => {
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
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = blocks.findIndex((b) => b.id === active.id);
            const newIndex = blocks.findIndex((b) => b.id === over.id);
            dispatch(reorderBlocks({ oldIndex, newIndex }));
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
                maxWidth: '900px',
                margin: '0 auto',
                cursor: 'default'
            }}
            onClick={handleBackgroundClick}
        >
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={blocks} strategy={verticalListSortingStrategy}>
                    {blocks.map((block) => (
                        <CanvasItem key={block.id} block={block} />
                    ))}
                </SortableContext>
            </DndContext>

            {blocks.length === 0 && (
                <div style={{ padding: '60px 0' }}>
                    <Empty description="Страница пуста. Добавьте блоки из левой панели." />
                </div>
            )}
        </div>
    );
};