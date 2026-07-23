import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ModelCategory from '@/models/ModelCategory';
import { slugify } from '@/lib/utils';
import { requirePermission } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('products');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const body = await request.json();
        const { name, isActive } = body;

        const updateData: any = {};
        
        if (name) {
            updateData.name = name;
            updateData.slug = slugify(name);
        }
        if (isActive !== undefined) {
            updateData.isActive = isActive;
        }

        const category = await ModelCategory.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!category) {
            return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, category });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to update category' },
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

        const category = await ModelCategory.findByIdAndDelete(id);

        if (!category) {
            return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
        }

        // Optional: Update associated CompatibleModels to remove this category reference
        // await CompatibleModel.updateMany({ category: id }, { $set: { category: null } });

        return NextResponse.json({ success: true, message: 'Category deleted successfully' });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to delete category' },
            { status: 500 }
        );
    }
}
