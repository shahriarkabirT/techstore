import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IProduct } from '@/types';

interface ComparisonState {
    items: IProduct[];
}

const initialState: ComparisonState = {
    items: [],
};

const comparisonSlice = createSlice({
    name: 'comparison',
    initialState,
    reducers: {
        addToComparison: (state, action: PayloadAction<IProduct>) => {
            if (state.items.length >= 4) {
                return; // Logic handled in context/component for alert
            }
            if (!state.items.find(p => p._id === action.payload._id)) {
                state.items.push(action.payload);
            }
        },
        removeFromComparison: (state, action: PayloadAction<string>) => {
            state.items = state.items.filter(p => p._id !== action.payload);
        },
        clearComparison: (state) => {
            state.items = [];
        },
    },
});

export const { addToComparison, removeFromComparison, clearComparison } = comparisonSlice.actions;
export default comparisonSlice.reducer;
