import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import ChildCategory from '@/models/ChildCategory';
import SubCategory from '@/models/SubCategory';
import { slugify } from '@/lib/utils';
import { requirePermission } from '@/lib/auth';
import { deleteImages } from '@/lib/imageUtils';

// GET all child categories
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const subCategoryId = searchParams.get('subCategoryId');
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

        if (subCategoryId) query.subCategoryId = subCategoryId;

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const [childCategories, total] = await Promise.all([
            ChildCategory.find(query)
                .populate('subCategoryId', 'name slug')
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(limit),
            ChildCategory.countDocuments(query)
        ]);

        const pages = Math.ceil(total / limit);

        return NextResponse.json({
            success: true,
            childCategories,
            pagination: {
                total,
                page,
                pages,
                limit
            }
        });
    } catch (error) {
        console.error('Get ChildCategories Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// POST create child category (admin only)
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
        console.log('API POST (ChildCat) - Received Body:', body);
        const { name, subCategoryId, description, image, showToLandingPage, order } = body;

        if (!name || !subCategoryId) {
            return NextResponse.json(
                { success: false, message: 'Name and Parent SubCategory are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const parent = await SubCategory.findById(subCategoryId);
        if (!parent) {
            return NextResponse.json(
                { success: false, message: 'Parent SubCategory not found' },
                { status: 404 }
            );
        }

        const slug = `${parent.slug}-${slugify(name)}`;

        const existing = await ChildCategory.findOne({ slug });
        if (existing) {
            return NextResponse.json(
                { success: false, message: 'ChildCategory with this name already exists under this parent' },
                { status: 400 }
            );
        }

        const childCategory = await ChildCategory.create({
            name,
            slug,
            subCategoryId,
            description,
            image,
            order: Number(order) || 0,
            showToLandingPage: showToLandingPage || false,
        });
        console.log('API POST (ChildCat) - Saved ChildCategory:', childCategory);

        revalidatePath('/');

        return NextResponse.json({
            success: true,
            message: 'ChildCategory created successfully',
            childCategory,
        });
    } catch (error) {
        console.error('Create ChildCategory Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
// DELETE bulk child categories (admin only)
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

        // Fetch images before deleting so we can clean up the filesystem
        const childCategories = await ChildCategory.find({ _id: { $in: ids } }).select('image').lean();
        await deleteImages(childCategories.map((c: any) => c.image));

        const result = await ChildCategory.deleteMany({ _id: { $in: ids } });

        revalidatePath('/');

        return NextResponse.json({
            success: true,
            message: `${result.deletedCount} child categories deleted successfully`,
        });
    } catch (error) {
        console.error('Bulk Delete ChildCategories Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
