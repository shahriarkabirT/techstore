import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, CartState } from '@/types';
import { isSameVariant } from '@/lib/utils';

const initialState: CartState = {
    items: [],
    isLoading: true,
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        setCart: (state, action: PayloadAction<CartItem[]>) => {
            state.items = action.payload;
            state.isLoading = false;
        },
        addItem: (state, action: PayloadAction<CartItem>) => {
            const existingIndex = state.items.findIndex(
                (item) =>
                    item.productId === action.payload.productId &&
                    isSameVariant(item.variant, action.payload.variant)
            );

            if (existingIndex >= 0) {
                state.items[existingIndex].quantity += action.payload.quantity;
            } else {
                state.items.push(action.payload);
            }

            if (typeof window !== 'undefined') {
                localStorage.setItem('cart', JSON.stringify(state.items));
            }
        },
        removeItem: (state, action: PayloadAction<{ productId: string; variant?: Record<string, string> }>) => {
            state.items = state.items.filter(
                (item) =>
                    !(item.productId === action.payload.productId &&
                        isSameVariant(item.variant, action.payload.variant))
            );

            if (typeof window !== 'undefined') {
                localStorage.setItem('cart', JSON.stringify(state.items));
            }
        },
        updateQuantity: (state, action: PayloadAction<{ productId: string; variant?: Record<string, string>; quantity: number }>) => {
            const item = state.items.find(
                (item) =>
                    item.productId === action.payload.productId &&
                    isSameVariant(item.variant, action.payload.variant)
            );
            if (item) {
                item.quantity = action.payload.quantity;
            }

            // Persist guest cart to localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem('cart', JSON.stringify(state.items));
            }
        },
        clearCart: (state) => {
            state.items = [];

            // Persist guest cart to localStorage
            if (typeof window !== 'undefined') {
                localStorage.removeItem('cart');
            }
        },
        initGuestCart: (state) => {
            if (typeof window !== 'undefined') {
                const savedCart = localStorage.getItem('cart');
                if (savedCart) {
                    try {
                        state.items = JSON.parse(savedCart);
                    } catch {
                        state.items = [];
                    }
                }
            }
            state.isLoading = false;
        },
    },
});

export const {
    setCart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    initGuestCart
} = cartSlice.actions;

export default cartSlice.reducer;
