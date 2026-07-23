import { apiSlice } from '../../api/apiSlice';

interface MetaAdsConfigResponse {
    success: boolean;
    config: {
        accessToken: string;
        adAccountId: string;
        isEnabled: boolean;
        lastSyncedAt?: string | null;
        hasToken: boolean;
    };
}

interface MetaAdsTestResponse {
    success: boolean;
    message?: string;
    account?: {
        name: string;
        status: string;
        currency: string;
        timezone: string;
    };
}

interface MetaAdsInsightsResponse {
    success: boolean;
    message?: string;
    insights?: {
        spend: number;
        impressions: number;
        clicks: number;
        cpc: number;
        cpm: number;
        ctr: number;
        reach: number;
        frequency: number;
        purchases: number;
        addToCart: number;
        initiateCheckout: number;
        leads: number;
        linkClicks: number;
        pageViews: number;
        costPerPurchase: number;
        costPerLead: number;
        costPerAddToCart: number;
        roas: number;
    };
    campaigns?: {
        name: string;
        id: string;
        spend: number;
        impressions: number;
        clicks: number;
        ctr: number;
        cpc: number;
        purchases: number;
        costPerPurchase: number;
        roas: number;
    }[];
    cached: boolean;
    lastSyncedAt?: string;
    since?: string;
    until?: string;
}

interface InsightsQueryParams {
    preset?: string;
    startDate?: string;
    endDate?: string;
}

export const metaAdsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getMetaAdsConfig: builder.query<MetaAdsConfigResponse, void>({
            query: () => '/admin/meta-ads/config',
            providesTags: ['MetaAds'],
        }),
        updateMetaAdsConfig: builder.mutation<MetaAdsConfigResponse, { accessToken?: string; adAccountId?: string; isEnabled?: boolean }>({
            query: (body) => ({
                url: '/admin/meta-ads/config',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['MetaAds'],
        }),
        testMetaAdsConnection: builder.mutation<MetaAdsTestResponse, void>({
            query: () => ({
                url: '/admin/meta-ads/test',
                method: 'POST',
            }),
        }),
        getMetaAdsInsights: builder.query<MetaAdsInsightsResponse, InsightsQueryParams>({
            query: ({ preset, startDate, endDate }) => {
                const params = new URLSearchParams();
                if (startDate && endDate) {
                    params.set('startDate', startDate);
                    params.set('endDate', endDate);
                } else if (preset) {
                    params.set('preset', preset);
                }
                return `/admin/meta-ads/insights?${params.toString()}`;
            },
        }),
    }),
});

export const {
    useGetMetaAdsConfigQuery,
    useUpdateMetaAdsConfigMutation,
    useTestMetaAdsConnectionMutation,
    useGetMetaAdsInsightsQuery,
} = metaAdsApi;
