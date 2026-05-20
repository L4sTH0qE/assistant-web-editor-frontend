import editorReducer, { reorderBlocks } from './editorSlice';

describe('Функциональное тестирование: Drag-and-Drop', () => {
    test('Корректно изменяется порядок блоков', () => {
        const initialState = {
            blocks: [
                { id: 'block-1', type: 'text' },
                { id: 'block-2', type: 'person' },
                { id: 'block-3', type: 'text' }
            ]
        };

        const action = reorderBlocks({ oldIndex: 0, newIndex: 2 });
        const newState = editorReducer(initialState, action);

        expect(newState.blocks[0].id).toBe('block-2');
        expect(newState.blocks[1].id).toBe('block-3');
        expect(newState.blocks[2].id).toBe('block-1');

        const serializedPayload = JSON.stringify(newState.blocks);
        expect(serializedPayload).toContain('"id":"block-1"');
        expect(serializedPayload).toContain('"type":"person"');
        expect(() => JSON.parse(serializedPayload)).not.toThrow();
    });
});
