import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import SubChildCategory from '@/models/SubChildCategory';
import ChildCategory from '@/models/ChildCategory';
import { slugify } from '@/lib/utils';
import { requirePermission } from '@/lib/auth';
import { deleteImages } from '@/lib/imageUtils';

// GET all sub-child categories
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const childCategoryId = searchParams.get('childCategoryId');
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

        if (childCategoryId) query.childCategoryId = childCategoryId;

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const [subChildCategories, total] = await Promise.all([
            SubChildCategory.find(query)
                .populate('childCategoryId', 'name slug')
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(limit),
            SubChildCategory.countDocuments(query)
        ]);

        const pages = Math.ceil(total / limit);

        return NextResponse.json({
            success: true,
            subChildCategories,
            pagination: {
                total,
                page,
                pages,
                limit
            }
        });
    } catch (error) {
        console.error('Get SubChildCategories Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// POST create sub-child category (admin only)
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
        console.log('API POST (SubChildCat) - Received Body:', body);
        const { name, childCategoryId, description, image, showToLandingPage, order } = body;

        if (!name || !childCategoryId) {
            return NextResponse.json(
                { success: false, message: 'Name and Parent ChildCategory are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const parent = await ChildCategory.findById(childCategoryId);
        if (!parent) {
            return NextResponse.json(
                { success: false, message: 'Parent ChildCategory not found' },
                { status: 404 }
            );
        }

        const slug = `${parent.slug}-${slugify(name)}`;

        const existing = await SubChildCategory.findOne({ slug });
        if (existing) {
            return NextResponse.json(
                { success: false, message: 'SubChildCategory with this name already exists under this parent' },
                { status: 400 }
            );
        }

        const subChildCategory = await SubChildCategory.create({
            name,
            slug,
            childCategoryId,
            description,
            image,
            order: Number(order) || 0,
            showToLandingPage: showToLandingPage || false,
        });
        console.log('API POST (SubChildCat) - Saved SubChildCategory:', subChildCategory);

        revalidatePath('/');

        return NextResponse.json({
            success: true,
            message: 'SubChildCategory created successfully',
            subChildCategory,
        });
    } catch (error) {
        console.error('Create SubChildCategory Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
// DELETE bulk sub-child categories (admin only)
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
        const subChildCategories = await SubChildCategory.find({ _id: { $in: ids } }).select('image').lean();
        await deleteImages(subChildCategories.map((s: any) => s.image));

        const result = await SubChildCategory.deleteMany({ _id: { $in: ids } });

        revalidatePath('/');

        return NextResponse.json({
            success: true,
            message: `${result.deletedCount} sub-child categories deleted successfully`,
        });
    } catch (error) {
        console.error('Bulk Delete SubChildCategories Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
