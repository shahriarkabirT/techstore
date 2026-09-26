import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';

export async function GET() {
    let brandName = 'Admin Store';
    let iconUrl = '/favicon.ico';
    
    try {
        await dbConnect();
        const settings = await Settings.findOne({});
        if (settings) {
            brandName = settings.brandName ? `${settings.brandName} Admin` : brandName;
            // iconUrl = settings.faviconUrl || settings.logoUrl || iconUrl;
        }
    } catch (error) {
        console.error('Error fetching settings for admin manifest:', error);
    }

    return NextResponse.json({
        name: brandName,
        short_name: brandName,
        description: `${brandName} Management Dashboard`,
        start_url: '/admin/dashboard',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#FF4F87',
        icons: [
            {
                src: iconUrl,
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: iconUrl,
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    });
}
