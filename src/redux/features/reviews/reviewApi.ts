import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { IReview } from '@/types';

export const reviewApi = createApi({
    reducerPath: 'reviewApi',
    baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
    tagTypes: ['Review'],
    endpoints: (builder) => ({
        getApprovedReviews: builder.query<{ success: boolean; reviews: IReview[] }, string>({
            query: (productId) => `/reviews?productId=${productId}`,
            providesTags: (result, error, productId) => [{ type: 'Review', id: productId }],
        }),
        submitReview: builder.mutation<{ success: boolean; review: IReview }, any>({
            query: (body) => ({
                url: '/reviews',
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, error, { productId }) => [{ type: 'Review', id: productId }],
        }),
        adminGetAllReviews: builder.query<{ success: boolean; reviews: any[]; pagination: any }, { page?: number; limit?: number }>({
            query: ({ page = 1, limit = 10 }) => `/admin/reviews?page=${page}&limit=${limit}`,
            providesTags: ['Review'],
        }),
        adminUpdateReview: builder.mutation<{ success: boolean; review: IReview }, { reviewId: string; isApproved?: boolean; rating?: number; comment?: string; images?: string[]; reviewerName?: string; reviewerAvatar?: string; }>({
            query: (body) => ({
                url: '/admin/reviews',
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['Review'],
        }),
        adminDeleteReview: builder.mutation<{ success: boolean; message: string }, string>({
            query: (id) => ({
                url: `/admin/reviews?id=${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Review'],
        }),
        adminCreateReview: builder.mutation<{ success: boolean; review: IReview }, any>({
            query: (body) => ({
                url: '/admin/reviews',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Review'],
        }),
    }),
});

export const {
    useGetApprovedReviewsQuery,
    useSubmitReviewMutation,
    useAdminGetAllReviewsQuery,
    useAdminUpdateReviewMutation,
    useAdminDeleteReviewMutation,
    useAdminCreateReviewMutation,
} = reviewApi;
