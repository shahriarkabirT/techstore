import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';
import { slugify } from '@/lib/utils';
import { requirePermission } from '@/lib/auth';
import { deleteImage } from '@/lib/imageUtils';

// GET single category
export async function GET(request, { params }) {
    try {
        await dbConnect();

        const { id } = await params;
        const category = await Category.findById(id);

        if (!category) {
            return NextResponse.json(
                { success: false, message: 'Category not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            category,
        });
    } catch (error) {
        console.error('Get Category Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// PUT update category (admin only)
export async function PUT(request, { params }) {
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
        const { name, description, bannerImage, isActive, showToLandingPage, order } = body;

        await dbConnect();

        const category = await Category.findById(id);
        if (!category) {
            return NextResponse.json(
                { success: false, message: 'Category not found' },
                { status: 404 }
            );
        }

        // Update slug if name changed
        if (name && name !== category.name) {
            const slug = slugify(name);
            const existing = await Category.findOne({ slug, _id: { $ne: id } });
            if (existing) {
                return NextResponse.json(
                    { success: false, message: 'Category with this name already exists' },
                    { status: 400 }
                );
            }
            category.slug = slug;
            category.name = name;
        }

        if (description !== undefined) category.description = description;

        // Handle image cleanup on update
        if (bannerImage !== undefined && bannerImage !== category.bannerImage) {
            await deleteImage(category.bannerImage);
            category.bannerImage = bannerImage;
        }

        if (isActive !== undefined) category.isActive = isActive;
        if (showToLandingPage !== undefined) category.showToLandingPage = showToLandingPage;
        if (order !== undefined) category.order = order;

        await category.save();

        revalidatePath('/');

        return NextResponse.json({
            success: true,
            message: 'Category updated successfully',
            category,
        });
    } catch (error) {
        console.error('Update Category Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// DELETE category (admin only)
export async function DELETE(request, { params }) {
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

        const category = await Category.findById(id);

        if (!category) {
            return NextResponse.json(
                { success: false, message: 'Category not found' },
                { status: 404 }
            );
        }

        // Delete images from disk
        await deleteImage(category.bannerImage);

        await Category.findByIdAndDelete(id);

        revalidatePath('/');

        return NextResponse.json({
            success: true,
            message: 'Category deleted successfully',
        });
    } catch (error) {
        console.error('Delete Category Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
