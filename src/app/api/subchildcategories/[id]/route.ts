import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import SubChildCategory from '@/models/SubChildCategory';
import ChildCategory from '@/models/ChildCategory';
import { slugify } from '@/lib/utils';
import { requirePermission } from '@/lib/auth';
import { deleteImage } from '@/lib/imageUtils';

// GET single sub-child category
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();

        const { id } = await params;
        const subChildCategory = await SubChildCategory.findById(id).populate('childCategoryId');

        if (!subChildCategory) {
            return NextResponse.json(
                { success: false, message: 'SubChildCategory not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            subChildCategory,
        });
    } catch (error) {
        console.error('Get SubChildCategory Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// PUT update sub-child category (admin only)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('categories');
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        console.log('API PUT (SubChildCat) - Received Body:', body);
        const { name, childCategoryId, description, image, isActive, showToLandingPage, order } = body;

        await dbConnect();

        const subChildCategory = await SubChildCategory.findById(id);
        if (!subChildCategory) {
            return NextResponse.json(
                { success: false, message: 'SubChildCategory not found' },
                { status: 404 }
            );
        }

        let needsSlugUpdate = false;
        if (name && name !== subChildCategory.name) needsSlugUpdate = true;
        if (childCategoryId && childCategoryId !== subChildCategory.childCategoryId.toString()) needsSlugUpdate = true;

        if (needsSlugUpdate) {
            const newName = name || subChildCategory.name;
            const newParentId = childCategoryId || subChildCategory.childCategoryId;

            const parent = await ChildCategory.findById(newParentId);
            if (!parent) {
                return NextResponse.json(
                    { success: false, message: 'Parent ChildCategory not found' },
                    { status: 404 }
                );
            }

            const slug = `${parent.slug}-${slugify(newName)}`;
            const existing = await SubChildCategory.findOne({ slug, _id: { $ne: id } });
            
            if (existing) {
                return NextResponse.json(
                    { success: false, message: 'SubChildCategory with this name already exists under this parent' },
                    { status: 400 }
                );
            }
            subChildCategory.slug = slug;
            if (name) subChildCategory.name = name;
        } else if (name) {
            subChildCategory.name = name;
        }

        if (childCategoryId) subChildCategory.childCategoryId = childCategoryId;
        if (description !== undefined) subChildCategory.description = description;

        // Handle image cleanup on update
        if (image !== undefined && image !== subChildCategory.image) {
            await deleteImage(subChildCategory.image);
            subChildCategory.image = image;
        }

        if (isActive !== undefined) subChildCategory.isActive = isActive;
        if (showToLandingPage !== undefined) subChildCategory.showToLandingPage = showToLandingPage;
        if (order !== undefined) subChildCategory.order = Number(order) || 0;

        await subChildCategory.save();
        console.log('API PUT (SubChildCat) - Updated SubChildCategory:', subChildCategory);

        revalidatePath('/');

        return NextResponse.json({
            success: true,
            message: 'SubChildCategory updated successfully',
            subChildCategory,
        });
    } catch (error) {
        console.error('Update SubChildCategory Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// DELETE sub-child category (admin only)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('categories');
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;

        await dbConnect();

        const subChildCategory = await SubChildCategory.findById(id);

        if (!subChildCategory) {
            return NextResponse.json(
                { success: false, message: 'SubChildCategory not found' },
                { status: 404 }
            );
        }

        // Delete image from disk
        await deleteImage(subChildCategory.image);

        await SubChildCategory.findByIdAndDelete(id);

        revalidatePath('/');

        return NextResponse.json({
            success: true,
            message: 'SubChildCategory deleted successfully',
        });
    } catch (error) {
        console.error('Delete SubChildCategory Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
