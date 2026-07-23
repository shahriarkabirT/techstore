import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import LandingPage from '@/models/LandingPage';
import { requirePermission } from '@/lib/auth';
import slugify from 'slugify';

// GET — Fetch a single landing page
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('landing-pages');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await dbConnect();

        const landingPage = await LandingPage.findById(id)
            .populate('product')
            .populate('comboProducts', 'title images price mrp stock');
        if (!landingPage) {
            return NextResponse.json({ success: false, message: 'Landing page not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, landingPage });
    } catch (error) {
        console.error('Get Landing Page Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

// PUT — Update a landing page
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('landing-pages');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        if (body.reviewImages && (!Array.isArray(body.reviewImages) || body.reviewImages.length > 10)) {
            return NextResponse.json({ success: false, message: 'Maximum 10 review images allowed' }, { status: 400 });
        }

        await dbConnect();

        const landingPage = await LandingPage.findById(id);
        if (!landingPage) {
            return NextResponse.json({ success: false, message: 'Landing page not found' }, { status: 404 });
        }

        // If slug is being changed, verify uniqueness
        if (body.slug && body.slug !== landingPage.slug) {
            const newSlug = slugify(body.slug, { lower: true, strict: true });
            const slugExists = await LandingPage.findOne({ slug: newSlug, _id: { $ne: id } });
            if (slugExists) {
                return NextResponse.json({ success: false, message: `Slug "${newSlug}" is already in use` }, { status: 400 });
            }
            body.slug = newSlug;
        }

        const updated = await LandingPage.findByIdAndUpdate(id, body, { new: true })
            .populate('product', 'title slug images price mrp discountedPrice stock isActive');

        revalidatePath('/');

        return NextResponse.json({ success: true, landingPage: updated });
    } catch (error) {
        console.error('Update Landing Page Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

// DELETE — Remove a landing page
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('landing-pages');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await dbConnect();

        const deleted = await LandingPage.findByIdAndDelete(id);
        if (!deleted) {
            return NextResponse.json({ success: false, message: 'Landing page not found' }, { status: 404 });
        }

        revalidatePath('/');

        return NextResponse.json({ success: true, message: 'Landing page deleted' });
    } catch (error) {
        console.error('Delete Landing Page Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
