import { apiSlice } from '../../api/apiSlice';
import { ISubscriber, ApiResponse, PaginationInfo } from '@/types';

export const newsletterApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getSubscribers: builder.query<ApiResponse<{ subscribers: ISubscriber[]; pagination: PaginationInfo }>, { page?: number; limit?: number }>({
            query: ({ page = 1, limit = 10 } = {}) => `/admin/marketing/subscribers?page=${page}&limit=${limit}`,
            providesTags: ['Subscriber'],
        }),
        subscribe: builder.mutation<ApiResponse<ISubscriber>, { email: string }>({
            query: (body) => ({
                url: '/newsletter/subscribe',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Subscriber'],
        }),
        deleteSubscriber: builder.mutation<ApiResponse<void>, string>({
            query: (id) => ({
                url: `/admin/marketing/subscribers/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Subscriber'],
        }),
        sendBulkMarketingEmail: builder.mutation<ApiResponse<any>, { target: string[] | 'all', subject: string, message: string, productLink?: string }>({
            query: (body) => ({
                url: '/admin/subscribers/email',
                method: 'POST',
                body,
            }),
        }),
    }),
});

export const {
    useGetSubscribersQuery,
    useSubscribeMutation,
    useDeleteSubscriberMutation,
    useSendBulkMarketingEmailMutation,
} = newsletterApi;
