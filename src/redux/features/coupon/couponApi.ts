import { apiSlice } from '../../api/apiSlice';
import { ICoupon, ApiResponse } from '@/types';

export const couponApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getCoupons: builder.query<ApiResponse<{ coupons: ICoupon[] }>, void>({
            query: () => '/admin/marketing/coupons',
            providesTags: ['Coupon'],
        }),
        getCouponById: builder.query<ApiResponse<ICoupon>, string>({
            query: (id) => `/admin/marketing/coupons/${id}`,
            providesTags: (result, error, id) => [{ type: 'Coupon', id }],
        }),
        createCoupon: builder.mutation<ApiResponse<ICoupon>, Partial<ICoupon>>({
            query: (body) => ({
                url: '/admin/marketing/coupons',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Coupon'],
        }),
        updateCoupon: builder.mutation<ApiResponse<ICoupon>, { id: string; body: Partial<ICoupon> }>({
            query: ({ id, body }) => ({
                url: `/admin/marketing/coupons/${id}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (result, error, { id }) => ['Coupon', { type: 'Coupon', id }],
        }),
        deleteCoupon: builder.mutation<ApiResponse<void>, string>({
            query: (id) => ({
                url: `/admin/marketing/coupons/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Coupon'],
        }),
        validateCoupon: builder.mutation<ApiResponse<{ coupon: ICoupon; discount: number }>, { code: string; cartTotal: number }>({
            query: (body) => ({
                url: '/coupons/validate',
                method: 'POST',
                body,
            }),
        }),
    }),
});

export const {
    useGetCouponsQuery,
    useGetCouponByIdQuery,
    useCreateCouponMutation,
    useUpdateCouponMutation,
    useDeleteCouponMutation,
    useValidateCouponMutation,
} = couponApi;
