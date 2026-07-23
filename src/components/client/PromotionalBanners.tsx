import { unstable_cache } from 'next/cache';
import dbConnect from '@/lib/db';
import Banner from '@/models/Banner';
import PromotionalBannersClient from './PromotionalBannersClient';

interface PromoBannerData {
    _id: string;
    title: string;
    image: string;
    link?: string;
    isActive: boolean;
    position: 'promotional-left' | 'promotional-right';
}

const getPromotionalBanners = unstable_cache(
    async (): Promise<{
        left: PromoBannerData | null;
        right: PromoBannerData | null;
    }> => {
        await dbConnect();

        const banners = await Banner.find({
            isActive: true,
            position: { $in: ['promotional-left', 'promotional-right'] },
        })
            .sort({ order: 1 })
            .lean();

        const serialized: PromoBannerData[] = JSON.parse(JSON.stringify(banners));

        const left = serialized.find(b => b.position === 'promotional-left') ?? null;
        const right = serialized.find(b => b.position === 'promotional-right') ?? null;

        return { left, right };
    },
    ['promotional-banners'],
    { tags: ['banners'], revalidate: 3600 }
);

export default async function PromotionalBanners() {
    const { left, right } = await getPromotionalBanners();

    // If neither banner is configured, render nothing — no layout shift
    if (!left && !right) return null;

    return <PromotionalBannersClient left={left} right={right} />;
}

