import { unstable_cache } from 'next/cache';
import dbConnect from '@/lib/db';
import Banner from '@/models/Banner';
import HeroBannerClient from './HeroBannerClient';

const getActiveBanners = unstable_cache(
    async () => {
        await dbConnect();
        const banners = await Banner.find({
            isActive: true,
            position: { $in: ['primary', 'secondary', 'secondary-top', 'secondary-bottom'] },
        })
            .sort({ order: 1 })
            .lean();
        return JSON.parse(JSON.stringify(banners));
    },
    ['hero-banners'],
    { tags: ['banners'], revalidate: 3600 }
);

export default async function HeroBanner() {
    const banners = await getActiveBanners();

    return <HeroBannerClient banners={banners} />;
}

