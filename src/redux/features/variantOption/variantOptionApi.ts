import { apiSlice } from '../../api/apiSlice';

export interface IVariantOption {
    _id: string;
    type: 'size' | 'color' | 'material' | 'ram' | 'storage';
    label: string;
    order: number;
    colorCode?: string;
    isActive: boolean;
}

interface VariantOptionsResponse {
    success: boolean;
    sizes: IVariantOption[];
    colors: IVariantOption[];
    materials: IVariantOption[];
    rams: IVariantOption[];
    storages: IVariantOption[];
}

export const variantOptionApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getVariantOptions: builder.query<VariantOptionsResponse, void>({
            query: () => '/variant-options',
            providesTags: ['VariantOption'],
        }),
        createVariantOption: builder.mutation<
            { success: boolean; option: IVariantOption },
            { type: string; label: string; order?: number; colorCode?: string }
        >({
            query: (body) => ({
                url: '/variant-options',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['VariantOption'],
        }),
        updateVariantOption: builder.mutation<
            { success: boolean; option: IVariantOption },
            { id: string; body: { label: string; order?: number; colorCode?: string } }
        >({
            query: ({ id, body }) => ({
                url: `/variant-options/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['VariantOption'],
        }),
        deleteVariantOption: builder.mutation<
            { success: boolean },
            string
        >({
            query: (id) => ({
                url: `/variant-options/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['VariantOption'],
        }),
    }),
});

export const {
    useGetVariantOptionsQuery,
    useCreateVariantOptionMutation,
    useUpdateVariantOptionMutation,
    useDeleteVariantOptionMutation,
} = variantOptionApi;
