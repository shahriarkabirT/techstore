import { apiSlice } from '../../api/apiSlice';
import { CartItem } from '@/types';

export const cartApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getCart: builder.query<{ success: boolean; cart: CartItem[] }, void>({
            query: () => '/user/cart',
            providesTags: ['Order'], // Using Order tag for now or we could add 'Cart'
        }),
        syncCart: builder.mutation<{ success: boolean }, { cart: CartItem[] }>({
            query: (body) => ({
                url: '/user/cart',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Order'],
        }),
    }),
});

export const { useGetCartQuery, useSyncCartMutation } = cartApi;
