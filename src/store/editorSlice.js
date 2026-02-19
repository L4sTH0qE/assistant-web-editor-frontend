import {createSlice} from '@reduxjs/toolkit';
import {v4 as uuidv4} from 'uuid';

const initialState = {
    pageId: null,
    title: 'Новая страница',
    blocks: [],
    selectedBlockId: null,
    isSaved: true,
};

const editorSlice = createSlice({
    name: 'editor',
    initialState,
    reducers: {
        setPageData: (state, action) => {
            state.pageId = action.payload.id;
            state.title = action.payload.title;
            state.blocks = action.payload.blocks || [];
            state.isSaved = true;
        },
        setIsSaved: (state, action) => {
            state.isSaved = true;
        },
        addBlock: (state, action) => {
            const newBlock = {
                id: uuidv4(),
                type: action.payload.type,
                props: action.payload.props || {},
            };
            state.blocks.push(newBlock);
            state.selectedBlockId = newBlock.id;
            state.isSaved = false;
        },
        updateBlockProps: (state, action) => {
            const {id, props} = action.payload;
            const block = state.blocks.find(b => b.id === id);
            if (block) {
                block.props = {...block.props, ...props};
                state.isSaved = false;
            }
        },
        removeBlock: (state, action) => {
            state.blocks = state.blocks.filter(b => b.id !== action.payload);
            if (state.selectedBlockId === action.payload) {
                state.selectedBlockId = null;
            }
            state.isSaved = false;
        },
        reorderBlocks: (state, action) => {
            const {oldIndex, newIndex} = action.payload;
            const result = Array.from(state.blocks);
            const [removed] = result.splice(oldIndex, 1);
            result.splice(newIndex, 0, removed);
            state.blocks = result;
            state.isSaved = false;
        },
        selectBlock: (state, action) => {
            state.selectedBlockId = action.payload;
        },
    },
});

export const {
    setPageData,
    setIsSaved,
    addBlock,
    updateBlockProps,
    removeBlock,
    reorderBlocks,
    selectBlock
} = editorSlice.actions;
export default editorSlice.reducer;