import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ContactMessage from '@/models/ContactMessage';
import { requirePermission } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const admin = await requirePermission('messages');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        await dbConnect();
        const messages = await ContactMessage.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await ContactMessage.countDocuments();

        return NextResponse.json({
            success: true,
            messages,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const admin = await requirePermission('messages');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, status } = body;

        await dbConnect();
        const message = await ContactMessage.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!message) {
            return NextResponse.json({ success: false, message: 'Message not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const admin = await requirePermission('messages');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        await dbConnect();
        const message = await ContactMessage.findByIdAndDelete(id);

        if (!message) {
            return NextResponse.json({ success: false, message: 'Message not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Message deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
