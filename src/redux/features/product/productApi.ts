import { apiSlice } from '../../api/apiSlice';

import { IProduct, ProductsResponse } from '@/types';

export const productApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getProducts: builder.query<ProductsResponse, {
            ids?: string;
            category?: string;
            search?: string;
            q?: string;
            page?: number;
            limit?: number;
            active?: string;
            sortBy?: string;
            sortOrder?: string;
            minPrice?: number;
            maxPrice?: number;
            inStock?: boolean;
            brand?: string;
        }>({

            query: (params) => ({
                url: '/products',
                params,
            }),
            providesTags: ['Product'],
        }),
        getSearchSuggestions: builder.query<IProduct[], string>({
            query: (query) => `/products/suggestions?q=${encodeURIComponent(query)}`,
            transformResponse: (response: { success: boolean; products: IProduct[] }) => response.products,
        }),
        getProductBySlug: builder.query<IProduct, string>({
            query: (slug) => `/products/${slug}`,
            transformResponse: (response: { success: boolean; product: IProduct }) => response.product,
            providesTags: (result, error, slug) => [{ type: 'Product', id: slug }],
        }),
        deleteProduct: builder.mutation<{ success: boolean; message?: string }, string>({
            query: (id) => ({
                url: `/products/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Product'],
        }),
        updateProduct: builder.mutation<{ success: boolean; data: IProduct }, { id: string; body: Partial<IProduct> }>({
            query: ({ id, body }) => ({
                url: `/products/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (result, error, { id }) => ['Product', { type: 'Product', id }],
        }),
        createProduct: builder.mutation<{ success: boolean; data: IProduct }, Partial<IProduct>>({
            query: (body) => ({
                url: '/products',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Product'],
        }),
        bulkDeleteProducts: builder.mutation<{ success: boolean; message?: string }, string[]>({
            query: (ids) => ({
                url: '/products/bulk',
                method: 'DELETE',
                body: { ids },
            }),
            invalidatesTags: ['Product'],
        }),
        getRelatedProducts: builder.query<ProductsResponse, {
            productId: string;
            category: string;
            subCategory?: string;
            childCategory?: string;
            subChildCategory?: string;
            direction?: 'bottom-up' | 'top-down';
            page?: number;
            limit?: number;
        }>({
            query: (params) => ({
                url: '/products/related',
                params,
            }),
            providesTags: ['Product'],
        }),
    }),
});

export const {
    useGetProductsQuery,
    useGetProductBySlugQuery,
    useDeleteProductMutation,
    useUpdateProductMutation,
    useCreateProductMutation,
    useGetSearchSuggestionsQuery,
    useBulkDeleteProductsMutation,
    useGetRelatedProductsQuery,
} = productApi;
