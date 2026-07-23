import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ModelCategory from '@/models/ModelCategory';
import { slugify } from '@/lib/utils';
import { requirePermission } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        await dbConnect();
        
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search') || '';
        const isActive = searchParams.get('isActive');

        const query: any = {};
        
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        
        if (isActive !== null && isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const skip = (page - 1) * limit;

        const [categories, total] = await Promise.all([
            ModelCategory.find(query)
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ModelCategory.countDocuments(query)
        ]);

        return NextResponse.json({ 
            success: true, 
            categories,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to fetch categories' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const admin = await requirePermission('products');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json(
                { success: false, message: 'Category name is required' },
                { status: 400 }
            );
        }

        const slug = slugify(name);

        const existing = await ModelCategory.findOne({ slug });
        if (existing) {
            return NextResponse.json(
                { success: false, message: 'A category with this name already exists' },
                { status: 409 }
            );
        }

        const category = await ModelCategory.create({
            name,
            slug,
            isActive: true,
        });

        return NextResponse.json({ success: true, category }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to create category' },
            { status: 500 }
        );
    }
}
