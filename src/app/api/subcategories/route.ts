import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import SubCategory from '@/models/SubCategory';
import Category from '@/models/Category';
import { slugify } from '@/lib/utils';
import { requirePermission } from '@/lib/auth';
import { deleteImages } from '@/lib/imageUtils';

// GET all subcategories
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get('categoryId');
        const activeOnly = searchParams.get('active') === 'true';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
        const isActive = searchParams.get('isActive');

        const query: any = {};

        if (activeOnly) {
            query.isActive = true;
        } else if (isActive !== null && isActive !== undefined && isActive !== '') {
            query.isActive = isActive === 'true';
        }

        if (categoryId) query.categoryId = categoryId;

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const [subCategories, total] = await Promise.all([
            SubCategory.find(query)
                .populate('categoryId', 'name slug')
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(limit),
            SubCategory.countDocuments(query)
        ]);

        const pages = Math.ceil(total / limit);

        return NextResponse.json({
            success: true,
            subCategories,
            pagination: {
                total,
                page,
                pages,
                limit
            }
        });
    } catch (error) {
        console.error('Get SubCategories Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// POST create subcategory (admin only)
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
        const { name, categoryId, description, bannerImage, showToLandingPage, showOnMid, order } = body;

        if (!name || !categoryId) {
            return NextResponse.json(
                { success: false, message: 'Name and Parent Category are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const parent = await Category.findById(categoryId);
        if (!parent) {
            return NextResponse.json(
                { success: false, message: 'Parent Category not found' },
                { status: 404 }
            );
        }

        const slug = `${parent.slug}-${slugify(name)}`;

        const existing = await SubCategory.findOne({ slug });
        if (existing) {
            return NextResponse.json(
                { success: false, message: 'SubCategory with this name already exists under this parent' },
                { status: 400 }
            );
        }

        const subCategory = await SubCategory.create({
            name,
            slug,
            categoryId,
            description,
            bannerImage,
            order: Number(order) || 0,
            showToLandingPage: showToLandingPage || false,
            showOnMid: showOnMid || false,
        });

        revalidatePath('/');

        return NextResponse.json({
            success: true,
            message: 'SubCategory created successfully',
            subCategory,
        });
    } catch (error) {
        console.error('Create SubCategory Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
// DELETE bulk subcategories (admin only)
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
        const subCategories = await SubCategory.find({ _id: { $in: ids } }).select('bannerImage').lean();
        await deleteImages(subCategories.map((s: any) => s.bannerImage));

        const result = await SubCategory.deleteMany({ _id: { $in: ids } });

        revalidatePath('/');

        return NextResponse.json({
            success: true,
            message: `${result.deletedCount} subcategories deleted successfully`,
        });
    } catch (error) {
        console.error('Bulk Delete SubCategories Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
