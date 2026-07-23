import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';

export async function GET() {
    try {
        await dbConnect();
        // Fetch only logo-related settings
        const settings = await Settings.findOne({}, 'logoUrl logoWidth logoHeight faviconUrl address contactPhone contactEmail whatsapp facebook instagram youtube tiktok facebookPixelId googleTagManagerId tiktokPixelId');

        if (!settings) {
            return NextResponse.json({
                success: true,
                settings: {
                    logoUrl: '/logo.png', // Default fallback
                    logoWidth: 120,
                    logoHeight: 40
                }
            });
        }

        return NextResponse.json({ success: true, settings });
    } catch (error: any) {
        console.error('Public Settings API Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
