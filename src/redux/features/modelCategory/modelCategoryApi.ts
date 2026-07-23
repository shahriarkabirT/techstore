import { apiSlice } from '../../api/apiSlice';
import type { IModelCategory } from '@/types';

export const modelCategoryApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getModelCategories: builder.query<{
            success: boolean;
            categories: IModelCategory[];
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        }, { page?: number; limit?: number; search?: string; isActive?: boolean }>({
            query: (params) => ({
                url: '/model-categories',
                method: 'GET',
                params,
            }),
            providesTags: ['ModelCategories'],
        }),
        createModelCategory: builder.mutation<{ success: boolean; category: IModelCategory }, { name: string }>({
            query: (body) => ({
                url: '/model-categories',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['ModelCategories'],
        }),
        updateModelCategory: builder.mutation<{ success: boolean; category: IModelCategory }, { id: string; body: Partial<IModelCategory> }>({
            query: ({ id, body }) => ({
                url: `/model-categories/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['ModelCategories'],
        }),
        deleteModelCategory: builder.mutation<{ success: boolean; message: string }, string>({
            query: (id) => ({
                url: `/model-categories/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['ModelCategories'],
        }),
    }),
});

export const {
    useGetModelCategoriesQuery,
    useCreateModelCategoryMutation,
    useUpdateModelCategoryMutation,
    useDeleteModelCategoryMutation,
} = modelCategoryApi;
