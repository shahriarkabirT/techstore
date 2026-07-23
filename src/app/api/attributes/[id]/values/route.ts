import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Attribute from '@/models/Attribute';
import AttributeValue from '@/models/AttributeValue';
import { requirePermission } from '@/lib/auth';

// GET values for an attribute
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await dbConnect();

        const attribute = await Attribute.findById(id).lean();
        if (!attribute) {
            return NextResponse.json(
                { success: false, message: 'Attribute not found' },
                { status: 404 }
            );
        }

        const values = await AttributeValue.find({
            attributeId: id,
            isActive: true,
        })
            .sort({ order: 1, createdAt: 1 })
            .lean();

        return NextResponse.json({ success: true, values });
    } catch (error) {
        console.error('Get Attribute Values Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// POST create a new value under an attribute
export async function POST(
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

        // Check the parent attribute exists and get its type
        const attribute = await Attribute.findById(id).lean();
        if (!attribute) {
            return NextResponse.json(
                { success: false, message: 'Attribute not found' },
                { status: 404 }
            );
        }

        if (attribute.type === 'color' && !colorCode) {
            return NextResponse.json(
                { success: false, message: 'Color code is required for color-type attributes' },
                { status: 400 }
            );
        }

        const value = await AttributeValue.create({
            attributeId: id,
            label: label.trim(),
            colorCode: attribute.type === 'color' ? colorCode : undefined,
            order: order || 0,
        });

        return NextResponse.json({
            success: true,
            message: 'Value created',
            value,
        });
    } catch (error: any) {
        console.error('Create Attribute Value Error:', error);

        if (error.code === 11000) {
            return NextResponse.json(
                { success: false, message: 'This value already exists for this attribute' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
