import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import Brand from '@/models/Brand';
import { slugify } from '@/lib/utils';
import { requirePermission } from '@/lib/auth';
import { deleteImage } from '@/lib/imageUtils';

// GET single brand
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const brand = await Brand.findById(id).lean();

        if (!brand) {
            return NextResponse.json({ success: false, message: 'Brand not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, brand });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to fetch brand' },
            { status: 500 }
        );
    }
}

// PUT update brand (admin only)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('products');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const body = await request.json();

        // Fetch first so we can read the existing logo before updating
        const existingBrand = await Brand.findById(id);
        if (!existingBrand) {
            return NextResponse.json({ success: false, message: 'Brand not found' }, { status: 404 });
        }

        const updateData: any = {};
        if (body.name !== undefined) {
            updateData.name = body.name;
            updateData.slug = slugify(body.name);
        }
        if (body.logo !== undefined) {
            // Delete old logo from disk if a new one is being set
            if (existingBrand.logo !== body.logo) {
                await deleteImage(existingBrand.logo);
            }
            updateData.logo = body.logo;
        }
        if (body.description !== undefined) updateData.description = body.description;
        if (body.order !== undefined) updateData.order = body.order;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;

        const brand = await Brand.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        revalidatePath('/');

        return NextResponse.json({ success: true, brand });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to update brand' },
            { status: 500 }
        );
    }
}

// DELETE brand (admin only)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('products');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const brand = await Brand.findById(id);

        if (!brand) {
            return NextResponse.json({ success: false, message: 'Brand not found' }, { status: 404 });
        }

        // Delete the logo from the filesystem
        await deleteImage(brand.logo);

        await Brand.findByIdAndDelete(id);

        revalidatePath('/');

        return NextResponse.json({ success: true, message: 'Brand deleted successfully' });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to delete brand' },
            { status: 500 }
        );
    }
}
