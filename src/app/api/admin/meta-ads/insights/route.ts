import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import MetaAdsConfig from '@/models/MetaAdsConfig';
import { requirePermission } from '@/lib/auth';

const META_API_VERSION = 'v21.0';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

const INSIGHT_FIELDS = [
    'spend',
    'impressions',
    'clicks',
    'cpc',
    'cpm',
    'ctr',
    'reach',
    'frequency',
    'actions',
    'cost_per_action_type',
    'purchase_roas',
    'conversions',
    'conversion_values',
].join(',');

const CAMPAIGN_FIELDS = [
    'campaign_name',
    'campaign_id',
    'spend',
    'impressions',
    'clicks',
    'ctr',
    'cpc',
    'actions',
    'cost_per_action_type',
    'purchase_roas',
].join(',');

type DatePreset = 'today' | 'yesterday' | 'last_7d' | 'last_30d';

function getDateRange(preset: DatePreset) {
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);

    switch (preset) {
        case 'today':
            break;
        case 'yesterday':
            start.setDate(start.getDate() - 1);
            end.setDate(end.getDate() - 1);
            break;
        case 'last_7d':
            start.setDate(start.getDate() - 6);
            break;
        case 'last_30d':
            start.setDate(start.getDate() - 29);
            break;
    }

    return {
        since: start.toISOString().split('T')[0],
        until: end.toISOString().split('T')[0],
    };
}

function extractActionValue(actions: any[] | undefined, actionType: string): number {
    if (!actions) return 0;
    const action = actions.find((a: any) => a.action_type === actionType);
    return action ? parseFloat(action.value) : 0;
}

function extractCostPerAction(costPerActions: any[] | undefined, actionType: string): number {
    if (!costPerActions) return 0;
    const entry = costPerActions.find((a: any) => a.action_type === actionType);
    return entry ? parseFloat(entry.value) : 0;
}

export async function GET(request: NextRequest) {
    try {
        const admin = await requirePermission('reports');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const config = await MetaAdsConfig.findOne();

        if (!config || !config.isEnabled || !config.accessToken || !config.adAccountId) {
            return NextResponse.json({
                success: false,
                message: 'Meta Ads is not configured or not enabled.',
            });
        }

        const searchParams = request.nextUrl.searchParams;
        const preset = (searchParams.get('preset') || 'today') as DatePreset;
        const customStart = searchParams.get('startDate');
        const customEnd = searchParams.get('endDate');

        let since: string, until: string;

        if (customStart && customEnd) {
            since = customStart;
            until = customEnd;
        } else {
            const range = getDateRange(preset);
            since = range.since;
            until = range.until;
        }

        const cacheKey = `${since}_${until}`;

        // Check cache
        if (
            config.cacheKey === cacheKey &&
            config.cacheExpiry &&
            new Date(config.cacheExpiry) > new Date() &&
            config.cachedInsights
        ) {
            return NextResponse.json({
                success: true,
                insights: config.cachedInsights,
                campaigns: config.cachedCampaigns || [],
                cached: true,
                lastSyncedAt: config.lastSyncedAt,
                since,
                until,
            });
        }

        const accountId = config.adAccountId.startsWith('act_')
            ? config.adAccountId
            : `act_${config.adAccountId}`;

        // Fetch account-level insights
        const insightsUrl = `https://graph.facebook.com/${META_API_VERSION}/${accountId}/insights?fields=${INSIGHT_FIELDS}&time_range={"since":"${since}","until":"${until}"}&access_token=${config.accessToken}`;

        // Fetch campaign-level breakdown
        const campaignsUrl = `https://graph.facebook.com/${META_API_VERSION}/${accountId}/insights?fields=${CAMPAIGN_FIELDS}&time_range={"since":"${since}","until":"${until}"}&level=campaign&limit=50&access_token=${config.accessToken}`;

        const [insightsRes, campaignsRes] = await Promise.all([
            fetch(insightsUrl),
            fetch(campaignsUrl),
        ]);

        const insightsData = await insightsRes.json();
        const campaignsData = await campaignsRes.json();

        if (insightsData.error) {
            return NextResponse.json({
                success: false,
                message: insightsData.error.message || 'Failed to fetch insights from Meta',
                errorType: insightsData.error.type,
            });
        }

        // Parse account-level insights
        const raw = insightsData.data?.[0] || {};
        const insights = {
            spend: parseFloat(raw.spend || '0'),
            impressions: parseInt(raw.impressions || '0'),
            clicks: parseInt(raw.clicks || '0'),
            cpc: parseFloat(raw.cpc || '0'),
            cpm: parseFloat(raw.cpm || '0'),
            ctr: parseFloat(raw.ctr || '0'),
            reach: parseInt(raw.reach || '0'),
            frequency: parseFloat(raw.frequency || '0'),
            purchases: extractActionValue(raw.actions, 'purchase'),
            addToCart: extractActionValue(raw.actions, 'add_to_cart'),
            initiateCheckout: extractActionValue(raw.actions, 'initiate_checkout'),
            leads: extractActionValue(raw.actions, 'lead'),
            linkClicks: extractActionValue(raw.actions, 'link_click'),
            pageViews: extractActionValue(raw.actions, 'landing_page_view'),
            costPerPurchase: extractCostPerAction(raw.cost_per_action_type, 'purchase'),
            costPerLead: extractCostPerAction(raw.cost_per_action_type, 'lead'),
            costPerAddToCart: extractCostPerAction(raw.cost_per_action_type, 'add_to_cart'),
            roas: raw.purchase_roas?.[0]?.value ? parseFloat(raw.purchase_roas[0].value) : 0,
        };

        // Parse campaign-level data
        const campaigns = (campaignsData.data || []).map((c: any) => ({
            name: c.campaign_name,
            id: c.campaign_id,
            spend: parseFloat(c.spend || '0'),
            impressions: parseInt(c.impressions || '0'),
            clicks: parseInt(c.clicks || '0'),
            ctr: parseFloat(c.ctr || '0'),
            cpc: parseFloat(c.cpc || '0'),
            purchases: extractActionValue(c.actions, 'purchase'),
            costPerPurchase: extractCostPerAction(c.cost_per_action_type, 'purchase'),
            roas: c.purchase_roas?.[0]?.value ? parseFloat(c.purchase_roas[0].value) : 0,
        }));

        // Save to cache
        config.cachedInsights = insights;
        config.cachedCampaigns = campaigns;
        config.cacheKey = cacheKey;
        config.cacheExpiry = new Date(Date.now() + CACHE_TTL_MS);
        config.lastSyncedAt = new Date();
        await config.save();

        return NextResponse.json({
            success: true,
            insights,
            campaigns,
            cached: false,
            lastSyncedAt: config.lastSyncedAt,
            since,
            until,
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
