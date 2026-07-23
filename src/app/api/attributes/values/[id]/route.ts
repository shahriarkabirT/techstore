import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import AttributeValue from '@/models/AttributeValue';
import Attribute from '@/models/Attribute';
import { requirePermission } from '@/lib/auth';

// PUT update a value
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
        const { label, colorCode, order } = body;

        if (!label || !label.trim()) {
            return NextResponse.json(
                { success: false, message: 'Label is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const value = await AttributeValue.findById(id);
        if (!value) {
            return NextResponse.json(
                { success: false, message: 'Value not found' },
                { status: 404 }
            );
        }

        // Check parent attribute type for colorCode
        const attribute = await Attribute.findById(value.attributeId).lean();

        value.label = label.trim();
        if (order !== undefined) {
            value.order = order;
        }
        if (attribute?.type === 'color' && colorCode) {
            value.colorCode = colorCode;
        }

        await value.save();

        return NextResponse.json({
            success: true,
            message: 'Value updated',
            value,
        });
    } catch (error: any) {
        console.error('Update Attribute Value Error:', error);

        if (error.code === 11000) {
            return NextResponse.json(
                { success: false, message: 'A value with this label already exists for this attribute' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// DELETE a value
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

        const value = await AttributeValue.findByIdAndDelete(id);
        if (!value) {
            return NextResponse.json(
                { success: false, message: 'Value not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Value deleted',
        });
    } catch (error) {
        console.error('Delete Attribute Value Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
