import { apiSlice } from '../../api/apiSlice';
import { IContactMessage, PaginationInfo } from '@/types';

export const contactApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        submitContactMessage: builder.mutation<{ success: boolean; message: string }, Partial<IContactMessage>>({
            query: (body) => ({
                url: '/contact',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Message'],
        }),
        getMessages: builder.query<{ success: boolean; messages: IContactMessage[]; pagination: PaginationInfo }, { page?: number; limit?: number }>({
            query: (params) => ({
                url: '/admin/messages',
                params,
            }),
            providesTags: ['Message'],
        }),
        updateMessageStatus: builder.mutation<{ success: boolean; message: IContactMessage }, { id: string; status: string }>({
            query: (body) => ({
                url: '/admin/messages',
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['Message'],
        }),
        deleteMessage: builder.mutation<{ success: boolean; message: string }, string>({
            query: (id) => ({
                url: `/admin/messages?id=${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Message'],
        }),
    }),
});

export const {
    useSubmitContactMessageMutation,
    useGetMessagesQuery,
    useUpdateMessageStatusMutation,
    useDeleteMessageMutation,
} = contactApi;
