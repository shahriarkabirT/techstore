import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import VariantOption from '@/models/VariantOption';
import { requirePermission } from '@/lib/auth';

// PUT update a variant option
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requirePermission('products');
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        const { label, order, colorCode } = body;

        if (!label || !label.trim()) {
            return NextResponse.json(
                { success: false, message: 'Label is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const option = await VariantOption.findById(id);
        if (!option) {
            return NextResponse.json(
                { success: false, message: 'Option not found' },
                { status: 404 }
            );
        }

        option.label = label.trim();
        if (order !== undefined) {
            option.order = order;
        }
        if (option.type === 'color' && colorCode) {
            option.colorCode = colorCode;
        }

        await option.save();

        return NextResponse.json({
            success: true,
            message: 'Option updated',
            option,
        });
    } catch (error: any) {
        console.error('Update Variant Option Error:', error);

        if (error.code === 11000) {
            return NextResponse.json(
                { success: false, message: 'An option with this label already exists' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// DELETE a variant option
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requirePermission('products');
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;
        await dbConnect();

        const option = await VariantOption.findByIdAndDelete(id);
        if (!option) {
            return NextResponse.json(
                { success: false, message: 'Option not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Option deleted',
        });
    } catch (error) {
        console.error('Delete Variant Option Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
