import { apiSlice } from '../../api/apiSlice';
import { UsersResponse } from '@/types';

export const userApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getAdminUsers: builder.query<UsersResponse, {
            page?: number;
            limit?: number;
            role?: string;
            search?: string;
        }>({
            query: (params) => ({
                url: '/admin/users',
                params: {
                    page: params.page?.toString(),
                    limit: params.limit?.toString(),
                    ...(params.role && { role: params.role }),
                    ...(params.search && { search: params.search }),
                },
            }),
            providesTags: ['User'],
        }),
        getCustomers: builder.query<{
            success: boolean;
            customers: any[];
            pagination: any;
        }, {
            page?: number;
            limit?: number;
            search?: string;
        }>({
            query: (params) => ({
                url: '/admin/customers',
                params: {
                    page: params.page?.toString(),
                    limit: params.limit?.toString(),
                    ...(params.search && { search: params.search }),
                },
            }),
            providesTags: ['User'],
        }),
        getCustomerOrders: builder.query<{
            success: boolean;
            orders: any[];
        }, string>({
            query: (phone) => `/admin/customers/${phone}/orders`,
            providesTags: ['Order'],
        }),
    }),
});

export const { useGetAdminUsersQuery, useGetCustomersQuery, useGetCustomerOrdersQuery } = userApi;
