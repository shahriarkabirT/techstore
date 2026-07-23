import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { requirePermission } from '@/lib/auth';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ phone: string }> }
) {
    try {
        const admin = await requirePermission('marketing');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { phone } = await params;
        await dbConnect();

        const orders = await Order.find({ 'customerInfo.phone': phone })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            orders,
        });
    } catch (error) {
        console.error('Get Customer Orders Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
