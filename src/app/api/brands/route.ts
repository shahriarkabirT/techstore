import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import Brand from '@/models/Brand';
import { slugify } from '@/lib/utils';
import { requirePermission } from '@/lib/auth';

// GET all brands (public)
export async function GET() {
    try {
        await dbConnect();
        const brands = await Brand.find().sort({ order: 1, name: 1 }).lean();
        return NextResponse.json({ success: true, brands });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to fetch brands' },
            { status: 500 }
        );
    }
}

// POST create brand (admin only)
export async function POST(request: Request) {
    try {
        const admin = await requirePermission('products');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await request.json();

        const { name, logo, description, order } = body;

        if (!name || !logo) {
            return NextResponse.json(
                { success: false, message: 'Brand name and logo are required' },
                { status: 400 }
            );
        }

        const slug = slugify(name);

        // Check for duplicate slug
        const existing = await Brand.findOne({ slug });
        if (existing) {
            return NextResponse.json(
                { success: false, message: 'A brand with this name already exists' },
                { status: 409 }
            );
        }

        const brand = await Brand.create({
            name,
            slug,
            logo,
            description: description || '',
            order: order || 0,
            isActive: true,
        });

        revalidatePath('/');

        return NextResponse.json({ success: true, brand }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to create brand' },
            { status: 500 }
        );
    }
}
