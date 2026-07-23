import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import MetaAdsConfig from '@/models/MetaAdsConfig';
import { requirePermission } from '@/lib/auth';

export async function POST() {
    try {
        const admin = await requirePermission('reports');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const config = await MetaAdsConfig.findOne();

        if (!config || !config.accessToken || !config.adAccountId) {
            return NextResponse.json({
                success: false,
                message: 'Missing credentials. Please save your access token and ad account ID first.',
            });
        }

        const accountId = config.adAccountId.startsWith('act_')
            ? config.adAccountId
            : `act_${config.adAccountId}`;

        // Lightweight call to verify token + account
        const url = `https://graph.facebook.com/v21.0/${accountId}?fields=name,account_status,currency,timezone_name&access_token=${config.accessToken}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.error) {
            return NextResponse.json({
                success: false,
                message: data.error.message || 'Invalid credentials',
                errorType: data.error.type,
            });
        }

        return NextResponse.json({
            success: true,
            account: {
                name: data.name,
                status: data.account_status === 1 ? 'Active' : 'Inactive',
                currency: data.currency,
                timezone: data.timezone_name,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
