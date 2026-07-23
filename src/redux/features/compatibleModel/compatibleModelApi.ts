import { apiSlice } from '../../api/apiSlice';
import { ICompatibleModel } from '@/types';

export interface GetModelsResponse {
    success: boolean;
    models: ICompatibleModel[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface GetModelsArgs {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    category?: string;
}

export const compatibleModelApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getCompatibleModels: builder.query<GetModelsResponse, GetModelsArgs | void>({
            query: (args) => {
                let url = '/compatible-models';
                if (args) {
                    const params = new URLSearchParams();
                    if (args.page) params.append('page', args.page.toString());
                    if (args.limit) params.append('limit', args.limit.toString());
                    if (args.search) params.append('search', args.search);
                    if (args.isActive !== undefined) params.append('isActive', args.isActive.toString());
                    if (args.category) params.append('category', args.category);
                    if (params.toString()) url += `?${params.toString()}`;
                }
                return url;
            },
            providesTags: ['CompatibleModel'],
        }),
        getCompatibleModel: builder.query<ICompatibleModel, string>({
            query: (id) => `/compatible-models/${id}`,
            transformResponse: (response: { success: boolean; model: ICompatibleModel }) => response.model,
            providesTags: (result, error, id) => [{ type: 'CompatibleModel', id }],
        }),
        createCompatibleModel: builder.mutation<
            { success: boolean; model: ICompatibleModel },
            { name: string; category?: string; order?: number }
        >({
            query: (body) => ({
                url: '/compatible-models',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['CompatibleModel'],
        }),
        updateCompatibleModel: builder.mutation<
            { success: boolean; model: ICompatibleModel },
            { id: string; body: { name?: string; category?: string; isActive?: boolean; order?: number } }
        >({
            query: ({ id, body }) => ({
                url: `/compatible-models/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (result, error, { id }) => ['CompatibleModel', { type: 'CompatibleModel', id }],
        }),
        deleteCompatibleModel: builder.mutation<{ success: boolean }, string>({
            query: (id) => ({
                url: `/compatible-models/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['CompatibleModel'],
        }),
    }),
});

export const {
    useGetCompatibleModelsQuery,
    useGetCompatibleModelQuery,
    useCreateCompatibleModelMutation,
    useUpdateCompatibleModelMutation,
    useDeleteCompatibleModelMutation,
} = compatibleModelApi;
