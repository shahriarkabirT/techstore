import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import AbandonedCheckout from '@/models/AbandonedCheckout';
import { requirePermission } from '@/lib/auth';

// PATCH — admin only: update status
export async function PATCH(request: any, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('orders');
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        if (!status || !['abandoned', 'recovered', 'expired'].includes(status)) {
            return NextResponse.json(
                { success: false, message: 'Invalid status' },
                { status: 400 }
            );
        }

        const checkout = await AbandonedCheckout.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!checkout) {
            return NextResponse.json(
                { success: false, message: 'Not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, checkout });
    } catch (error) {
        console.error('Update abandoned checkout error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// DELETE — admin only
export async function DELETE(request: any, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('orders');
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        const { id } = await params;
        const checkout = await AbandonedCheckout.findByIdAndDelete(id);

        if (!checkout) {
            return NextResponse.json(
                { success: false, message: 'Not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, message: 'Deleted' });
    } catch (error) {
        console.error('Delete abandoned checkout error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
