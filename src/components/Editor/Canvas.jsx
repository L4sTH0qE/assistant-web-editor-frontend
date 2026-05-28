import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Empty, Typography } from 'antd';
import { reorderBlocks, selectBlock } from '../../store/editorSlice';
import { CanvasItem } from './CanvasItem';

const { Title, Paragraph } = Typography;

export const Canvas = (props) => {
    const { blocks, metadata, type } = useSelector((state) => state.editor);
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
                width: '100%',
                minHeight: '100%',
                padding: '0 0 100px 0',
                marginLeft: '4px',
                cursor: 'default'
            }}
            onClick={handleBackgroundClick}
        >
            <div style={{
                padding: '24px 16px',
                borderRadius: '4px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                background: '#fff',
                cursor: 'not-allowed',
                marginBottom: '16px'
            }}>
                <Title
                    level={1}
                    style={{ margin: 0, fontFamily: 'HSE Sans' }}
                >
                    {props.name || 'Без названия'}
                </Title>

                {metadata?.coverImage && (
                    <div style={{ marginTop: '16px' }}>
                        <img 
                            src={metadata.coverImage} 
                            alt="cover" 
                            style={{ width: '100%', height: 'auto', borderRadius: '4px' }} 
                        />
                        {metadata.coverImageCaption && (
                            <div className="cover-image-caption">
                                {metadata.coverImageCaption}
                            </div>
                        )}
                    </div>
                )}

                {(type === 'NEWS' || type === 'ANNOUNCEMENT') && metadata?.annotation && (
                    <div className="lead-in" style={{ marginTop: '16px' }}>
                        {metadata.annotation}
                    </div>
                )}
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={blocks} strategy={verticalListSortingStrategy}>
                    {blocks.map((block) => (
                        <CanvasItem key={block.id} block={block} />
                    ))}
                </SortableContext>
            </DndContext>

            {blocks.length === 0 && (
                <Empty style={{ padding: '60px 0', textAlign: 'center', fontFamily: 'HSE Sans' }}
                       description="Страница пуста. Добавьте блоки из левой панели" />
            )}
        </div>
    );
};
