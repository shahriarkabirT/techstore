import { apiSlice } from '../../api/apiSlice';
import { IStoreLocation } from '@/types';

export const storeLocationApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Admin Endpoints
        getAdminStoreLocations: builder.query<IStoreLocation[], void>({
            query: () => '/admin/store-locations',
            providesTags: ['StoreLocation'],
            transformResponse: (response: { success: boolean; locations: IStoreLocation[] }) => response.locations || [],
        }),
        createStoreLocation: builder.mutation<{ success: boolean; location: IStoreLocation }, Partial<IStoreLocation>>({
            query: (body) => ({
                url: '/admin/store-locations',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['StoreLocation'],
        }),
        updateStoreLocation: builder.mutation<{ success: boolean; location: IStoreLocation }, { id: string; body: Partial<IStoreLocation> }>({
            query: ({ id, body }) => ({
                url: `/admin/store-locations/${id}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['StoreLocation'],
        }),
        deleteStoreLocation: builder.mutation<{ success: boolean; message: string }, string>({
            query: (id) => ({
                url: `/admin/store-locations/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['StoreLocation'],
        }),

        // Public Endpoints
        getPublicStoreLocations: builder.query<IStoreLocation[], void>({
            query: () => '/store-locations',
            providesTags: ['StoreLocation'],
            transformResponse: (response: { success: boolean; locations: IStoreLocation[] }) => response.locations || [],
        }),
    }),
});

export const {
    useGetAdminStoreLocationsQuery,
    useCreateStoreLocationMutation,
    useUpdateStoreLocationMutation,
    useDeleteStoreLocationMutation,
    useGetPublicStoreLocationsQuery,
} = storeLocationApi;
