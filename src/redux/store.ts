import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './api/apiSlice';
import { reviewApi } from './features/reviews/reviewApi';
import cartReducer from './features/cart/cartSlice';

import authReducer from './features/auth/authSlice';

import wishlistReducer from './features/wishlist/wishlistSlice';

import comparisonReducer from './features/comparison/comparisonSlice';
import chatReducer from './features/chat/chatSlice';

export const store = configureStore({
    reducer: {
        [apiSlice.reducerPath]: apiSlice.reducer,
        [reviewApi.reducerPath]: reviewApi.reducer,
        cart: cartReducer,
        auth: authReducer,
        wishlist: wishlistReducer,
        comparison: comparisonReducer,
        chat: chatReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(apiSlice.middleware, reviewApi.middleware),
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
