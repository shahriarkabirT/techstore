import { apiSlice } from '../../api/apiSlice';
import type { IAttribute, IAttributeValue } from '@/types';

interface AttributesResponse {
    success: boolean;
    attributes: (IAttribute & { values: IAttributeValue[] })[];
}

export const attributeApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getAttributes: builder.query<AttributesResponse, void>({
            query: () => '/attributes',
            providesTags: ['Attribute'],
        }),
        createAttribute: builder.mutation<
            { success: boolean; attribute: IAttribute },
            { name: string; type?: 'text' | 'color'; order?: number }
        >({
            query: (body) => ({
                url: '/attributes',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Attribute'],
        }),
        updateAttribute: builder.mutation<
            { success: boolean; attribute: IAttribute },
            { id: string; body: { name?: string; type?: 'text' | 'color'; order?: number } }
        >({
            query: ({ id, body }) => ({
                url: `/attributes/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Attribute'],
        }),
        deleteAttribute: builder.mutation<
            { success: boolean },
            string
        >({
            query: (id) => ({
                url: `/attributes/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Attribute'],
        }),
        createAttributeValue: builder.mutation<
            { success: boolean; value: IAttributeValue },
            { attributeId: string; label: string; colorCode?: string; order?: number }
        >({
            query: ({ attributeId, ...body }) => ({
                url: `/attributes/${attributeId}/values`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Attribute'],
        }),
        updateAttributeValue: builder.mutation<
            { success: boolean; value: IAttributeValue },
            { id: string; body: { label?: string; colorCode?: string; order?: number } }
        >({
            query: ({ id, body }) => ({
                url: `/attributes/values/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Attribute'],
        }),
        deleteAttributeValue: builder.mutation<
            { success: boolean },
            string
        >({
            query: (id) => ({
                url: `/attributes/values/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Attribute'],
        }),
    }),
});

export const {
    useGetAttributesQuery,
    useCreateAttributeMutation,
    useUpdateAttributeMutation,
    useDeleteAttributeMutation,
    useCreateAttributeValueMutation,
    useUpdateAttributeValueMutation,
    useDeleteAttributeValueMutation,
} = attributeApi;
