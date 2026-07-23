import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CompatibleModel from '@/models/CompatibleModel';
import { slugify } from '@/lib/utils';
import { requirePermission } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const model = await CompatibleModel.findById(id).populate('category', 'name slug').lean();

        if (!model) {
            return NextResponse.json({ success: false, message: 'Model not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, model });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to fetch model' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('products');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const body = await request.json();
        const { name, isActive, order, category } = body;

        const updateData: any = {};
        
        if (name) {
            updateData.name = name;
            updateData.slug = slugify(name);
        }
        if (isActive !== undefined) {
            updateData.isActive = isActive;
        }
        if (order !== undefined) {
            updateData.order = order;
        }
        if (category !== undefined) {
            updateData.category = category;
        }

        const model = await CompatibleModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!model) {
            return NextResponse.json({ success: false, message: 'Model not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, model });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json(
                { success: false, message: 'A model with this name already exists' },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to update model' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('products');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;

        const model = await CompatibleModel.findByIdAndDelete(id);

        if (!model) {
            return NextResponse.json({ success: false, message: 'Model not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Model deleted successfully' });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to delete model' },
            { status: 500 }
        );
    }
}
