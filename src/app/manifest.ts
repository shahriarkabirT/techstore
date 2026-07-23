import { MetadataRoute } from 'next';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
    let brandName = 'Store';
    let iconUrl = '/favicon.ico';
    
    try {
        await dbConnect();
        const settings = await Settings.findOne({});
        if (settings) {
            brandName = settings.brandName || brandName;
            iconUrl = settings.faviconUrl || settings.logoUrl || iconUrl;
        }
    } catch (error) {
        console.error('Error fetching settings for manifest:', error);
    }

    return {
        name: brandName,
        short_name: brandName,
        description: `${brandName}: Your trusted online shopping destination.`,
        start_url: '/',
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
    };
}
