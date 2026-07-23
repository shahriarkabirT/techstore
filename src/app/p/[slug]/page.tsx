import dbConnect from '@/lib/db';
import LandingPage from '@/models/LandingPage';
import Product from '@/models/Product';
import VariantOption, { IVariantOptionDocument } from '@/models/VariantOption';
import Settings from '@/models/Settings';
import '@/models/Category';
import LandingPageClient from './LandingPageClient';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    await dbConnect();

    const landing = await LandingPage.findOne({ slug, isActive: true })
        .populate('product', 'title shortDescription images')
        .lean();

    if (!landing) {
        return { title: 'Page Not Found' };
    }

    const product = landing.product as any;
    
    // Prioritize landing page banner, then product image, and ensure absolute URL for OpenGraph
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bdgirls.xyz';
    const imageUrl = landing.bannerImage || product?.images?.[0];
    const absoluteImageUrl = imageUrl 
        ? (imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`)
        : undefined;
        
    const title = landing.customTitle || product.title;
    const rawDescription = landing.customDescription || product.shortDescription || product.title || '';
    const description = typeof rawDescription === 'string' ? rawDescription.replace(/<[^>]*>?/gm, '').trim() : rawDescription;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: absoluteImageUrl ? [{ url: absoluteImageUrl, width: 1200, height: 630 }] : [],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: absoluteImageUrl ? [absoluteImageUrl] : [],
        }
    };
}

async function getLandingData(slug: string) {
    await dbConnect();

    const landing = await LandingPage.findOneAndUpdate(
        { slug, isActive: true },
        { $inc: { views: 1 } },
        { new: true }
    )
        .populate({
            path: 'product',
            select: 'title shortDescription images fullDescription mrp price discountValue discountType productType variants stock freeShipping isActive',
            populate: { path: 'category', select: 'name slug' },
        })
        .populate('comboProducts', 'title images price mrp productType shortDescription variants freeShipping')
        .lean();

    if (!landing || !(landing.product as any)?.isActive) return null;

    // Fetch variant options
    const allOptions: IVariantOptionDocument[] = await VariantOption.find({ isActive: true }).lean();
    const globalOptions = {
        sizes: allOptions.filter(o => o.type === 'size').sort((a, b) => a.order - b.order),
        colors: allOptions.filter(o => o.type === 'color').sort((a, b) => a.order - b.order),
        materials: allOptions.filter(o => o.type === 'material').sort((a, b) => a.order - b.order),
    };

    // Fetch WhatsApp number and shipping from settings
    const settings = await Settings.findOne().lean();

    return {
        landing: JSON.parse(JSON.stringify(landing)),
        product: JSON.parse(JSON.stringify(landing.product)),
        globalOptions: JSON.parse(JSON.stringify(globalOptions)),
        settings: JSON.parse(JSON.stringify(settings)),
    };
}

export default async function LandingPageRoute({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const data = await getLandingData(slug);

    if (!data) {
        notFound();
    }

    return (
        <LandingPageClient
            landing={data.landing}
            settings={data.settings}
            product={data.product}
        />
    );
}
