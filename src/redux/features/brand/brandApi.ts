import { apiSlice } from '../../api/apiSlice';
import { IBrand } from '@/types';

export const brandApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getBrands: builder.query<IBrand[], void>({
            query: () => '/brands',
            transformResponse: (response: { success: boolean; brands: IBrand[] }) => response.brands,
            providesTags: ['Brand'],
        }),
        createBrand: builder.mutation<{ success: boolean; brand: IBrand }, { name: string; logo: string; description?: string; order?: number }>({
            query: (body) => ({
                url: '/brands',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Brand'],
        }),
        updateBrand: builder.mutation<{ success: boolean; brand: IBrand }, { id: string; body: Partial<IBrand> }>({
            query: ({ id, body }) => ({
                url: `/brands/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Brand'],
        }),
        deleteBrand: builder.mutation<{ success: boolean; message?: string }, string>({
            query: (id) => ({
                url: `/brands/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Brand'],
        }),
    }),
});

export const {
    useGetBrandsQuery,
    useCreateBrandMutation,
    useUpdateBrandMutation,
    useDeleteBrandMutation,
} = brandApi;
