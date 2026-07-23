import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WishlistState {
    items: string[];
}

const getInitialState = (): WishlistState => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('wishlist');
        if (saved) {
            try {
                return { items: JSON.parse(saved) };
            } catch (e) {
                console.error('Failed to parse wishlist from localStorage', e);
            }
        }
    }
    return { items: [] };
};

const wishlistSlice = createSlice({
    name: 'wishlist',
    initialState: getInitialState(),
    reducers: {
        setWishlist: (state, action: PayloadAction<string[]>) => {
            state.items = action.payload;
            localStorage.setItem('wishlist', JSON.stringify(state.items));
        },
        addToWishlist: (state, action: PayloadAction<string>) => {
            if (!state.items.includes(action.payload)) {
                state.items.push(action.payload);
                localStorage.setItem('wishlist', JSON.stringify(state.items));
            }
        },
        removeFromWishlist: (state, action: PayloadAction<string>) => {
            state.items = state.items.filter(id => id !== action.payload);
            localStorage.setItem('wishlist', JSON.stringify(state.items));
        },
    },
});

export const { setWishlist, addToWishlist, removeFromWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
