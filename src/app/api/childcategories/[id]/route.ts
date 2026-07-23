import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import ChildCategory from '@/models/ChildCategory';
import SubCategory from '@/models/SubCategory';
import { slugify } from '@/lib/utils';
import { requirePermission } from '@/lib/auth';
import { deleteImage } from '@/lib/imageUtils';

// GET single child category
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();

        const { id } = await params;
        const childCategory = await ChildCategory.findById(id).populate('subCategoryId');

        if (!childCategory) {
            return NextResponse.json(
                { success: false, message: 'ChildCategory not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            childCategory,
        });
    } catch (error) {
        console.error('Get ChildCategory Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// PUT update child category (admin only)
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
        console.log('API PUT (ChildCat) - Received Body:', body);
        const { name, subCategoryId, description, image, isActive, showToLandingPage, order } = body;

        await dbConnect();

        const childCategory = await ChildCategory.findById(id);
        if (!childCategory) {
            return NextResponse.json(
                { success: false, message: 'ChildCategory not found' },
                { status: 404 }
            );
        }

        let needsSlugUpdate = false;
        if (name && name !== childCategory.name) needsSlugUpdate = true;
        if (subCategoryId && subCategoryId !== childCategory.subCategoryId.toString()) needsSlugUpdate = true;

        if (needsSlugUpdate) {
            const newName = name || childCategory.name;
            const newParentId = subCategoryId || childCategory.subCategoryId;

            const parent = await SubCategory.findById(newParentId);
            if (!parent) {
                return NextResponse.json(
                    { success: false, message: 'Parent SubCategory not found' },
                    { status: 404 }
                );
            }

            const slug = `${parent.slug}-${slugify(newName)}`;
            const existing = await ChildCategory.findOne({ slug, _id: { $ne: id } });
            
            if (existing) {
                return NextResponse.json(
                    { success: false, message: 'ChildCategory with this name already exists under this parent' },
                    { status: 400 }
                );
            }
            childCategory.slug = slug;
            if (name) childCategory.name = name;
        } else if (name) {
            childCategory.name = name;
        }

        if (subCategoryId) childCategory.subCategoryId = subCategoryId;
        if (description !== undefined) childCategory.description = description;

        // Handle image cleanup on update
        if (image !== undefined && image !== childCategory.image) {
            await deleteImage(childCategory.image);
            childCategory.image = image;
        }

        if (isActive !== undefined) childCategory.isActive = isActive;
        if (showToLandingPage !== undefined) childCategory.showToLandingPage = showToLandingPage;
        if (order !== undefined) childCategory.order = Number(order) || 0;

        await childCategory.save();
        console.log('API PUT (ChildCat) - Updated ChildCategory:', childCategory);

        revalidatePath('/');

        return NextResponse.json({
            success: true,
            message: 'ChildCategory updated successfully',
            childCategory,
        });
    } catch (error) {
        console.error('Update ChildCategory Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// DELETE child category (admin only)
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

        const childCategory = await ChildCategory.findById(id);

        if (!childCategory) {
            return NextResponse.json(
                { success: false, message: 'ChildCategory not found' },
                { status: 404 }
            );
        }

        // Delete image from disk
        await deleteImage(childCategory.image);

        await ChildCategory.findByIdAndDelete(id);

        revalidatePath('/');

        return NextResponse.json({
            success: true,
            message: 'ChildCategory deleted successfully',
        });
    } catch (error) {
        console.error('Delete ChildCategory Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
