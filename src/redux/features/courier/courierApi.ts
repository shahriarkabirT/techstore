import { apiSlice } from '../../api/apiSlice';
import { ICourier, ApiResponse } from '@/types';

export const courierApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getCouriers: builder.query<{ success: boolean; couriers: ICourier[] }, void>({
            query: () => '/couriers',
            providesTags: ['Courier'],
        }),
        updateCourier: builder.mutation<ApiResponse<ICourier>, { name: string; isEnabled: boolean; config: Record<string, any> }>({
            query: (body) => ({
                url: '/couriers',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Courier'],
        }),
        getCourierAreas: builder.query<{ success: boolean; areas: any[] }, { courierName: string; post_code?: number; district_name?: string; city_id?: number; zone_id?: number, apiKey?: string, isSandbox?: boolean }>({
            query: ({ courierName, ...params }) => ({
                url: `/couriers/${courierName}/areas`,
                params,
            }),
        }),
        getCourierPickupStores: builder.query<{ success: boolean; pickup_stores: any[] }, { courierName: string }>({
            query: ({ courierName }) => `/couriers/${courierName}/pickup-stores`,
        }),
        getCourierBalance: builder.query<{ success: boolean; balance: number; message?: string }, { courierName: string }>({
            query: ({ courierName }) => `/couriers/${courierName}/balance`,
        }),
        getCourierStats: builder.query<{ success: boolean; stats: any }, { courierName: string }>({
            query: ({ courierName }) => `/couriers/${courierName}/stats`,
        }),
        getRecentShipments: builder.query<{ success: boolean; orders: any[]; pagination?: { total: number; page: number; limit: number; totalPages: number } }, { courierName: string; page?: number; limit?: number }>({
            query: ({ courierName, page = 1, limit = 10 }) => ({
                url: `/couriers/${courierName}/recent-shipments`,
                params: { page, limit }
            }),
        }),
        sendOrderToCourier: builder.mutation<{ success: boolean; message: string; trackingId?: string }, {
            orderId: string;
            courierName: string;
            pickupStoreId?: string;
            deliveryAreaId?: number;
            deliveryAreaName?: string;
            city_id?: number;
            zone_id?: number;
            isClosedBox?: boolean;
            instruction?: string;
            parcelDetails?: any[];
        }>({
            query: ({ orderId, ...body }) => ({
                url: `/orders/${orderId}/send-to-courier`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Order', 'Courier'],
        }),
        bulkSendOrderToCourier: builder.mutation<{ success: boolean; message: string; results: any }, {
            orderIds: string[];
            courierName: string;
            pickupStoreId?: string;
            isClosedBox?: boolean;
            instruction?: string;
        }>({
            query: (body) => ({
                url: `/orders/bulk-courier`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Order', 'Courier'],
        }),
        trackCourierParcel: builder.query<{ success: boolean; status: string; history: any[]; message?: string }, { courierName: string; trackingId: string }>({
            query: ({ courierName, trackingId }) => ({
                url: `/couriers/${courierName}/track`,
                params: { trackingId },
            }),
        }),
    }),
});

export const {
    useGetCouriersQuery,
    useUpdateCourierMutation,
    useGetCourierAreasQuery,
    useLazyGetCourierAreasQuery,
    useGetCourierPickupStoresQuery,
    useGetCourierBalanceQuery,
    useLazyGetCourierBalanceQuery,
    useGetCourierStatsQuery,
    useGetRecentShipmentsQuery,
    useSendOrderToCourierMutation,
    useBulkSendOrderToCourierMutation,
    useTrackCourierParcelQuery,
} = courierApi;
