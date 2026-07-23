import { apiSlice } from '../../api/apiSlice';

export const wishlistApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getWishlist: builder.query<{ success: boolean; wishlist: string[] }, void>({
            query: () => '/user/wishlist',
            providesTags: ['Wishlist' as any], // Cast to any if tag doesn't exist yet, but I'll add it to apiSlice
        }),
        toggleWishlist: builder.mutation<{ success: boolean; wishlist: string[] }, string>({
            query: (productId) => ({
                url: '/user/wishlist',
                method: 'POST',
                body: { productId },
            }),
            invalidatesTags: ['Wishlist' as any],
        }),
    }),
});

export const { useGetWishlistQuery, useToggleWishlistMutation } = wishlistApi;
