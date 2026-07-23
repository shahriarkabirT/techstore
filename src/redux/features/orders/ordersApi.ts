import { apiSlice } from '../../api/apiSlice';
import { IOrder, OrderResponse, UserOrdersResponse } from '@/types';

export const ordersApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getUserOrders: builder.query<UserOrdersResponse, { page?: number; limit?: number }>({
            query: ({ page = 1, limit = 10 }) => ({
                url: '/user/orders',
                params: { page, limit },
            }),
            providesTags: ['Order'],
        }),
    }),
});

export const { useGetUserOrdersQuery } = ordersApi;
