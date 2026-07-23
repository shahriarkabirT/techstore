import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import MetaAdsConfig from '@/models/MetaAdsConfig';
import { requirePermission } from '@/lib/auth';

export async function GET() {
    try {
        const admin = await requirePermission('reports');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const config = await MetaAdsConfig.findOne().lean();

        if (!config) {
            return NextResponse.json({
                success: true,
                config: { accessToken: '', adAccountId: '', isEnabled: false },
            });
        }

        // Mask the access token — only show last 8 characters
        const maskedToken = config.accessToken
            ? '•'.repeat(Math.max(0, config.accessToken.length - 8)) + config.accessToken.slice(-8)
            : '';

        return NextResponse.json({
            success: true,
            config: {
                adAccountId: config.adAccountId || '',
                accessToken: maskedToken,
                isEnabled: config.isEnabled || false,
                lastSyncedAt: config.lastSyncedAt || null,
                hasToken: !!config.accessToken,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const admin = await requirePermission('reports');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { accessToken, adAccountId, isEnabled } = body;

        await dbConnect();
        let config = await MetaAdsConfig.findOne();

        if (!config) {
            config = new MetaAdsConfig({});
        }

        // Only update token if a new one is provided (not a masked value)
        if (accessToken && !accessToken.includes('•')) {
            config.accessToken = accessToken;
        }
        if (adAccountId !== undefined) config.adAccountId = adAccountId;
        if (isEnabled !== undefined) config.isEnabled = isEnabled;

        // Clear cache when config changes
        config.cachedInsights = null;
        config.cachedCampaigns = null;
        config.cacheKey = '';
        config.cacheExpiry = null;

        await config.save();

        const maskedToken = config.accessToken
            ? '•'.repeat(Math.max(0, config.accessToken.length - 8)) + config.accessToken.slice(-8)
            : '';

        return NextResponse.json({
            success: true,
            config: {
                adAccountId: config.adAccountId,
                accessToken: maskedToken,
                isEnabled: config.isEnabled,
                hasToken: !!config.accessToken,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
