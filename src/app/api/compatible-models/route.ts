import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CompatibleModel from '@/models/CompatibleModel';
import { slugify } from '@/lib/utils';
import { requirePermission } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        await dbConnect();
        
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const isActive = searchParams.get('isActive');
        const category = searchParams.get('category');

        const query: any = {};
        
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        
        if (isActive !== null && isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        if (category) {
            query.category = category;
        }

        const skip = (page - 1) * limit;

        const [models, total] = await Promise.all([
            CompatibleModel.find(query)
                .sort({ order: 1, name: 1 })
                .skip(skip)
                .limit(limit)
                .populate('category', 'name slug')
                .lean(),
            CompatibleModel.countDocuments(query)
        ]);

        return NextResponse.json({ 
            success: true, 
            models,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to fetch compatible models' },
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
        const { name, order, category } = body;

        if (!name) {
            return NextResponse.json(
                { success: false, message: 'Model name is required' },
                { status: 400 }
            );
        }

        const slug = slugify(name);

        const existing = await CompatibleModel.findOne({ slug });
        if (existing) {
            return NextResponse.json(
                { success: false, message: 'A model with this name already exists' },
                { status: 409 }
            );
        }

        const model = await CompatibleModel.create({
            name,
            slug,
            category: category || null,
            order: order || 0,
            isActive: true,
        });

        return NextResponse.json({ success: true, model }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to create compatible model' },
            { status: 500 }
        );
    }
}
