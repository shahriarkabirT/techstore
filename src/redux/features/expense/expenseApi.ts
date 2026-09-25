import { apiSlice } from '@/redux/api/apiSlice';

export const expenseApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getExpenses: builder.query({
            query: (params) => ({
                url: '/admin/expenses',
                params,
            }),
            providesTags: ['Expense'],
        }),
        addExpense: builder.mutation({
            query: (data) => ({
                url: '/admin/expenses',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Expense'],
        }),
        updateExpense: builder.mutation({
            query: ({ id, data }) => ({
                url: `/admin/expenses/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Expense'],
        }),
        deleteExpense: builder.mutation({
            query: (id) => ({
                url: `/admin/expenses/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Expense'],
        }),
    }),
});

export const {
    useGetExpensesQuery,
    useAddExpenseMutation,
    useUpdateExpenseMutation,
    useDeleteExpenseMutation,
} = expenseApi;
