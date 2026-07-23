import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Attribute from '@/models/Attribute';
import AttributeValue from '@/models/AttributeValue';
import { requirePermission } from '@/lib/auth';
import { slugify } from '@/lib/utils';

// GET all attributes with their values
export async function GET() {
    try {
        await dbConnect();

        const attributes = await Attribute.find({ isActive: true })
            .sort({ order: 1, createdAt: 1 })
            .lean();

        const attributeIds = attributes.map((a) => a._id);
        const values = await AttributeValue.find({
            attributeId: { $in: attributeIds },
            isActive: true,
        })
            .sort({ order: 1, createdAt: 1 })
            .lean();

        // Group values under their parent attribute
        const result = attributes.map((attr) => ({
            ...attr,
            values: values.filter(
                (v) => v.attributeId.toString() === attr._id.toString()
            ),
        }));

        return NextResponse.json({ success: true, attributes: result });
    } catch (error) {
        console.error('Get Attributes Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// POST create a new attribute (admin only)
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
        const { name, type, order } = body;

        if (!name || !name.trim()) {
            return NextResponse.json(
                { success: false, message: 'Attribute name is required' },
                { status: 400 }
            );
        }

        if (type && !['text', 'color'].includes(type)) {
            return NextResponse.json(
                { success: false, message: 'Type must be "text" or "color"' },
                { status: 400 }
            );
        }

        await dbConnect();

        const slug = slugify(name.trim());

        const attribute = await Attribute.create({
            name: name.trim(),
            slug,
            type: type || 'text',
            order: order || 0,
        });

        return NextResponse.json({
            success: true,
            message: 'Attribute created',
            attribute,
        });
    } catch (error: any) {
        console.error('Create Attribute Error:', error);

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
