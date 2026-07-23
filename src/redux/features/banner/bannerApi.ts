import { apiSlice } from '../../api/apiSlice';
import { IBanner } from '@/types';

export const bannerApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getBanners: builder.query<IBanner[], { active?: boolean; position?: string } | void>({
            query: (params) => {
                const queryParams = new URLSearchParams();
                if (params && typeof params === 'object') {
                    if (params.active) queryParams.append('active', 'true');
                    if (params.position) queryParams.append('position', params.position);
                }
                const queryString = queryParams.toString();
                return queryString ? `/banners?${queryString}` : '/banners';
            },
            transformResponse: (response: { success: boolean; banners: IBanner[] }) => response.banners,
            providesTags: ['Banner'],
        }),
        createBanner: builder.mutation<{ success: boolean; banner: IBanner }, Partial<IBanner>>({
            query: (body) => ({
                url: '/banners',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Banner'],
        }),
        updateBanner: builder.mutation<{ success: boolean; banner: IBanner }, { id: string; body: Partial<IBanner> }>({
            query: ({ id, body }) => ({
                url: `/banners/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Banner'],
        }),
        deleteBanner: builder.mutation<{ success: boolean }, string>({
            query: (id) => ({
                url: `/banners/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Banner'],
        }),
    }),
});

export const {
    useGetBannersQuery,
    useCreateBannerMutation,
    useUpdateBannerMutation,
    useDeleteBannerMutation
} = bannerApi;
