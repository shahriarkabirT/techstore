import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import SubCategory from '@/models/SubCategory';
import Category from '@/models/Category';
import { slugify } from '@/lib/utils';
import { requirePermission } from '@/lib/auth';
import { deleteImage } from '@/lib/imageUtils';

// GET single subcategory
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();

        const { id } = await params;
        const subCategory = await SubCategory.findById(id).populate('categoryId');

        if (!subCategory) {
            return NextResponse.json(
                { success: false, message: 'SubCategory not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            subCategory,
        });
    } catch (error) {
        console.error('Get SubCategory Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// PUT update subcategory (admin only)
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
        const { name, categoryId, description, bannerImage, isActive, showToLandingPage, showOnMid, order } = body;

        await dbConnect();

        const subCategory = await SubCategory.findById(id);
        if (!subCategory) {
            return NextResponse.json(
                { success: false, message: 'SubCategory not found' },
                { status: 404 }
            );
        }

        let needsSlugUpdate = false;
        if (name && name !== subCategory.name) needsSlugUpdate = true;
        if (categoryId && categoryId !== subCategory.categoryId.toString()) needsSlugUpdate = true;

        if (needsSlugUpdate) {
            const newName = name || subCategory.name;
            const newCategoryId = categoryId || subCategory.categoryId;

            const parent = await Category.findById(newCategoryId);
            if (!parent) {
                return NextResponse.json(
                    { success: false, message: 'Parent Category not found' },
                    { status: 404 }
                );
            }

            const slug = `${parent.slug}-${slugify(newName)}`;
            const existing = await SubCategory.findOne({ slug, _id: { $ne: id } });
            
            if (existing) {
                return NextResponse.json(
                    { success: false, message: 'SubCategory with this name already exists under this parent' },
                    { status: 400 }
                );
            }
            subCategory.slug = slug;
            if (name) subCategory.name = name;
        } else if (name) {
            subCategory.name = name;
        }

        if (categoryId) subCategory.categoryId = categoryId;
        if (description !== undefined) subCategory.description = description;

        // Handle image cleanup on update
        if (bannerImage !== undefined && bannerImage !== subCategory.bannerImage) {
            await deleteImage(subCategory.bannerImage);
            subCategory.bannerImage = bannerImage;
        }

        if (isActive !== undefined) subCategory.isActive = isActive;
        if (showToLandingPage !== undefined) subCategory.showToLandingPage = showToLandingPage;
        if (showOnMid !== undefined) subCategory.showOnMid = showOnMid;
        if (order !== undefined) subCategory.order = Number(order) || 0;

        await subCategory.save();

        revalidatePath('/');

        return NextResponse.json({
            success: true,
            message: 'SubCategory updated successfully',
            subCategory,
        });
    } catch (error) {
        console.error('Update SubCategory Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// DELETE subcategory (admin only)
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

        const subCategory = await SubCategory.findById(id);

        if (!subCategory) {
            return NextResponse.json(
                { success: false, message: 'SubCategory not found' },
                { status: 404 }
            );
        }

        // Delete images from disk
        await deleteImage(subCategory.bannerImage);

        await SubCategory.findByIdAndDelete(id);

        revalidatePath('/');

        return NextResponse.json({
            success: true,
            message: 'SubCategory deleted successfully',
        });
    } catch (error) {
        console.error('Delete SubCategory Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
