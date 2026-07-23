import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';
import { slugify } from '@/lib/utils';
import { requirePermission } from '@/lib/auth';
import { deleteImages } from '@/lib/imageUtils';

// GET all categories
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('active') === 'true';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
        const isActive = searchParams.get('isActive');

        const query: any = {};

        // Status Filter
        if (activeOnly) {
            query.isActive = true;
        } else if (isActive !== null && isActive !== undefined && isActive !== '') {
            query.isActive = isActive === 'true';
        }

        // Search Filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const [categories, total] = await Promise.all([
            Category.find(query)
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(limit),
            Category.countDocuments(query)
        ]);

        const pages = Math.ceil(total / limit);

        return NextResponse.json({
            success: true,
            categories,
            pagination: {
                total,
                page,
                pages,
                limit
            }
        });
    } catch (error) {
        console.error('Get Categories Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// POST create category (admin only)
export async function POST(request: NextRequest) {
    try {
        const admin = await requirePermission('categories');
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, description, bannerImage, showToLandingPage, order } = body;

        if (!name) {
            return NextResponse.json(
                { success: false, message: 'Category name is required' },
                { status: 400 }
            );
        }

        if (!bannerImage) {
            return NextResponse.json(
                { success: false, message: 'Banner image is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const slug = slugify(name);

        // Check if slug exists
        const existing = await Category.findOne({ slug });
        if (existing) {
            return NextResponse.json(
                { success: false, message: 'Category with this name already exists' },
                { status: 400 }
            );
        }

        const category = await Category.create({
            name,
            slug,
            description,
            bannerImage,
            showToLandingPage: showToLandingPage || false,
            order: order ?? 0,
        });

        revalidatePath('/');

        return NextResponse.json({
            success: true,
            message: 'Category created successfully',
            category,
        });
    } catch (error) {
        console.error('Create Category Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
// DELETE bulk categories (admin only)
export async function DELETE(request: NextRequest) {
    try {
        const admin = await requirePermission('categories');
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Invalid or empty IDs list' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Fetch bannerImages before deleting so we can clean up the filesystem
        const categories = await Category.find({ _id: { $in: ids } }).select('bannerImage').lean();
        await deleteImages(categories.map((c: any) => c.bannerImage));

        const result = await Category.deleteMany({ _id: { $in: ids } });

        revalidatePath('/');

        return NextResponse.json({
            success: true,
            message: `${result.deletedCount} categories deleted successfully`,
        });
    } catch (error) {
        console.error('Bulk Delete Categories Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
