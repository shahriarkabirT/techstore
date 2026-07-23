import { apiSlice } from '../../api/apiSlice';

export const policyApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getPolicies: builder.query({
            query: (params) => ({
                url: '/policies',
                params,
            }),
            providesTags: ['Policy'],
        }),
        getPolicy: builder.query({
            query: (id) => `/policies/${id}`,
            providesTags: (result, error, id) => [{ type: 'Policy', id }],
        }),
        addPolicy: builder.mutation({
            query: (body) => ({
                url: '/policies',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Policy'],
        }),
        updatePolicy: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/policies/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Policy'],
        }),
        deletePolicy: builder.mutation({
            query: (id) => ({
                url: `/policies/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Policy'],
        }),
    }),
});

export const {
    useGetPoliciesQuery,
    useGetPolicyQuery,
    useAddPolicyMutation,
    useUpdatePolicyMutation,
    useDeletePolicyMutation,
} = policyApi;
