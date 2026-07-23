import { apiSlice } from '../../api/apiSlice';

export const categoryApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Categories
        getCategories: builder.query({
            query: (params) => ({
                url: '/categories',
                params,
            }),
            providesTags: ['Category'],
        }),
        addCategory: builder.mutation({
            query: (body) => ({
                url: '/categories',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Category'],
        }),
        updateCategory: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/categories/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Category'],
        }),
        deleteCategory: builder.mutation({
            query: (id) => ({
                url: `/categories/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Category'],
        }),
        bulkDeleteCategories: builder.mutation({
            query: (ids) => ({
                url: '/categories',
                method: 'DELETE',
                body: { ids },
            }),
            invalidatesTags: ['Category'],
        }),

        // Sub Categories
        getSubCategories: builder.query({
            query: (params) => ({
                url: '/subcategories',
                params,
            }),
            providesTags: ['SubCategory'],
        }),
        addSubCategory: builder.mutation({
            query: (body) => ({
                url: '/subcategories',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['SubCategory'],
        }),
        updateSubCategory: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/subcategories/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['SubCategory'],
        }),
        deleteSubCategory: builder.mutation({
            query: (id) => ({
                url: `/subcategories/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['SubCategory'],
        }),
        bulkDeleteSubCategories: builder.mutation({
            query: (ids) => ({
                url: '/subcategories',
                method: 'DELETE',
                body: { ids },
            }),
            invalidatesTags: ['SubCategory'],
        }),

        // Child Categories
        getChildCategories: builder.query({
            query: (params) => ({
                url: '/childcategories',
                params,
            }),
            providesTags: ['ChildCategory'],
        }),
        addChildCategory: builder.mutation({
            query: (body) => ({
                url: '/childcategories',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['ChildCategory'],
        }),
        updateChildCategory: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/childcategories/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['ChildCategory'],
        }),
        deleteChildCategory: builder.mutation({
            query: (id) => ({
                url: `/childcategories/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['ChildCategory'],
        }),
        bulkDeleteChildCategories: builder.mutation({
            query: (ids) => ({
                url: '/childcategories',
                method: 'DELETE',
                body: { ids },
            }),
            invalidatesTags: ['ChildCategory'],
        }),

        // Sub Child Categories
        getSubChildCategories: builder.query({
            query: (params) => ({
                url: '/subchildcategories',
                params,
            }),
            providesTags: ['SubChildCategory'],
        }),
        addSubChildCategory: builder.mutation({
            query: (body) => ({
                url: '/subchildcategories',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['SubChildCategory'],
        }),
        updateSubChildCategory: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/subchildcategories/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['SubChildCategory'],
        }),
        deleteSubChildCategory: builder.mutation({
            query: (id) => ({
                url: `/subchildcategories/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['SubChildCategory'],
        }),
        bulkDeleteSubChildCategories: builder.mutation({
            query: (ids) => ({
                url: '/subchildcategories',
                method: 'DELETE',
                body: { ids },
            }),
            invalidatesTags: ['SubChildCategory'],
        }),

        getCategoryTree: builder.query<any[], void>({
            query: () => '/categories/tree',
            transformResponse: (response: { success: boolean; tree: any[] }) => response.tree,
            providesTags: ['Category', 'SubCategory', 'ChildCategory', 'SubChildCategory'],
        }),

        getFeaturedCategories: builder.query<any[], void>({
            query: () => '/categories/featured',
            transformResponse: (response: { success: boolean; categories: any[] }) => response.categories,
            providesTags: ['Category', 'SubCategory'],
        }),
    }),
});

export const {
    useGetCategoriesQuery,
    useAddCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
    useBulkDeleteCategoriesMutation,

    useGetSubCategoriesQuery,
    useAddSubCategoryMutation,
    useUpdateSubCategoryMutation,
    useDeleteSubCategoryMutation,
    useBulkDeleteSubCategoriesMutation,

    useGetChildCategoriesQuery,
    useAddChildCategoryMutation,
    useUpdateChildCategoryMutation,
    useDeleteChildCategoryMutation,
    useBulkDeleteChildCategoriesMutation,

    useGetSubChildCategoriesQuery,
    useAddSubChildCategoryMutation,
    useUpdateSubChildCategoryMutation,
    useDeleteSubChildCategoryMutation,
    useBulkDeleteSubChildCategoriesMutation,

    useGetCategoryTreeQuery,
    useGetFeaturedCategoriesQuery,
} = categoryApi;
