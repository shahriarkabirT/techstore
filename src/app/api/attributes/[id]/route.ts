import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Attribute from '@/models/Attribute';
import AttributeValue from '@/models/AttributeValue';
import { requirePermission } from '@/lib/auth';
import { slugify } from '@/lib/utils';

// GET a single attribute with its values
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

        return NextResponse.json({
            success: true,
            attribute: { ...attribute, values },
        });
    } catch (error) {
        console.error('Get Attribute Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// PUT update an attribute
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
        const { name, type, order } = body;

        await dbConnect();

        const attribute = await Attribute.findById(id);
        if (!attribute) {
            return NextResponse.json(
                { success: false, message: 'Attribute not found' },
                { status: 404 }
            );
        }

        if (name && name.trim()) {
            attribute.name = name.trim();
            attribute.slug = slugify(name.trim());
        }
        if (type && ['text', 'color'].includes(type)) {
            attribute.type = type;
        }
        if (order !== undefined) {
            attribute.order = order;
        }

        await attribute.save();

        return NextResponse.json({
            success: true,
            message: 'Attribute updated',
            attribute,
        });
    } catch (error: any) {
        console.error('Update Attribute Error:', error);

        if (error.code === 11000) {
            return NextResponse.json(
                { success: false, message: 'An attribute with this name already exists' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// DELETE an attribute (soft delete)
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

        const attribute = await Attribute.findById(id);
        if (!attribute) {
            return NextResponse.json(
                { success: false, message: 'Attribute not found' },
                { status: 404 }
            );
        }

        // Soft delete — mark as inactive
        attribute.isActive = false;
        await attribute.save();

        // Also deactivate all values under this attribute
        await AttributeValue.updateMany(
            { attributeId: id },
            { isActive: false }
        );

        return NextResponse.json({
            success: true,
            message: 'Attribute deleted',
        });
    } catch (error) {
        console.error('Delete Attribute Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
