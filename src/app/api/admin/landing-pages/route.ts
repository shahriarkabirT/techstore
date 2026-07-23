import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import LandingPage from '@/models/LandingPage';
import Product from '@/models/Product';
import { requirePermission } from '@/lib/auth';
import slugify from 'slugify';

// GET — List all landing pages
export async function GET() {
    try {
        const admin = await requirePermission('landing-pages');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const landingPages = await LandingPage.find()
            .populate('product', 'title slug images price mrp discountedPrice stock isActive')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ success: true, landingPages });
    } catch (error) {
        console.error('Get Landing Pages Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

// POST — Create a new landing page
export async function POST(request: NextRequest) {
    try {
        const admin = await requirePermission('landing-pages');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { productId, slug: customSlug, headerTitle, customTitle, customDescription, bannerImage, templateType, offerEndTime, comboProducts, freeShipping, reviewImages, offer } = body;

        if (!productId) {
            return NextResponse.json({ success: false, message: 'Product ID is required' }, { status: 400 });
        }

        if (reviewImages && (!Array.isArray(reviewImages) || reviewImages.length > 10)) {
            return NextResponse.json({ success: false, message: 'Maximum 10 review images allowed' }, { status: 400 });
        }

        await dbConnect();

        // Verify product exists
        const product = await Product.findById(productId);
        if (!product) {
            return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
        }

        // Check if landing page already exists for this product
        const existing = await LandingPage.findOne({ product: productId });
        if (existing) {
            return NextResponse.json({ success: false, message: 'A landing page already exists for this product' }, { status: 400 });
        }

        // Generate slug
        const finalSlug = customSlug
            ? slugify(customSlug, { lower: true, strict: true })
            : slugify(product.title, { lower: true, strict: true });

        // Check slug uniqueness
        const slugExists = await LandingPage.findOne({ slug: finalSlug });
        if (slugExists) {
            return NextResponse.json({ success: false, message: `Slug "${finalSlug}" is already in use` }, { status: 400 });
        }

        const landingPage = await LandingPage.create({
            product: productId,
            slug: finalSlug,
            customTitle: customTitle || '',
            headerTitle: headerTitle || '',
            customDescription: customDescription || '',
            bannerImage: bannerImage || undefined,
            templateType: templateType || 'standard',
            offerEndTime: offerEndTime || null,
            comboProducts: comboProducts || [],
            freeShipping: !!freeShipping,
            reviewImages: reviewImages || [],
            offer: offer || '',
        });

        revalidatePath('/');

        return NextResponse.json({
            success: true,
            message: 'Landing page created successfully',
            landingPage,
        });
    } catch (error: any) {
        console.error('Create Landing Page Error:', error);
        if (error.code === 11000) {
            return NextResponse.json({ success: false, message: 'Slug already exists' }, { status: 400 });
        }
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
