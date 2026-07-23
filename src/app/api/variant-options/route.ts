import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import VariantOption from '@/models/VariantOption';
import Attribute from '@/models/Attribute';
import AttributeValue from '@/models/AttributeValue';
import { requirePermission } from '@/lib/auth';

// GET all variant options (grouped by type)
// Also returns new dynamic attributes for backward compatibility
export async function GET() {
    try {
        await dbConnect();

        // Fetch new dynamic attributes
        const attributes = await Attribute.find({ isActive: true })
            .sort({ order: 1, createdAt: 1 })
            .lean();

        const attributeIds = attributes.map((a) => a._id);
        const attrValues = await AttributeValue.find({
            attributeId: { $in: attributeIds },
            isActive: true,
        })
            .sort({ order: 1, createdAt: 1 })
            .lean();

        const dynamicAttributes = attributes.map((attr) => ({
            ...attr,
            values: attrValues.filter(
                (v) => v.attributeId.toString() === attr._id.toString()
            ),
        }));

        // Also fetch legacy variant options for backward compat
        const options = await VariantOption.find({ isActive: true })
            .sort({ order: 1, createdAt: 1 })
            .lean();

        const grouped = {
            sizes: options.filter((o) => o.type === 'size'),
            colors: options.filter((o) => o.type === 'color'),
            materials: options.filter((o) => o.type === 'material'),
            rams: options.filter((o) => o.type === 'ram'),
            storages: options.filter((o) => o.type === 'storage'),
        };

        return NextResponse.json({ success: true, ...grouped, attributes: dynamicAttributes });
    } catch (error) {
        console.error('Get Variant Options Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// POST create a variant option (admin only)
export async function POST(request: Request) {
    try {
        const admin = await requirePermission('products');
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { type, label, order, colorCode } = body;

        if (!type || !['size', 'color', 'material', 'ram', 'storage'].includes(type)) {
            return NextResponse.json(
                { success: false, message: 'Valid type (size, color, material, ram, storage) is required' },
                { status: 400 }
            );
        }

        if (!label || !label.trim()) {
            return NextResponse.json(
                { success: false, message: 'Label is required' },
                { status: 400 }
            );
        }

        if (type === 'color' && !colorCode) {
            return NextResponse.json(
                { success: false, message: 'Color code is required for color type' },
                { status: 400 }
            );
        }

        await dbConnect();

        const option = await VariantOption.create({
            type,
            label: label.trim(),
            order: order || 0,
            colorCode: type === 'color' ? colorCode : undefined,
        });

        return NextResponse.json({
            success: true,
            message: 'Variant option created',
            option,
        });
    } catch (error: any) {
        console.error('Create Variant Option Error:', error);

        if (error.code === 11000) {
            return NextResponse.json(
                { success: false, message: 'This option already exists' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
