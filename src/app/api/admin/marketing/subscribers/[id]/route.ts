import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subscriber from '@/models/Subscriber';
import { requirePermission } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('marketing');
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await dbConnect();
        const subscriber = await Subscriber.findByIdAndDelete(id);
        if (!subscriber) {
            return NextResponse.json({ success: false, message: 'Subscriber not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'Subscriber deleted successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to delete subscriber' }, { status: 500 });
    }
}
