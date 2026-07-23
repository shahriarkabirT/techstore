import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Refund from '@/models/Refund';
import Order from '@/models/Order';
import { requirePermission } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const admin = await requirePermission('refunds');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const query: any = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const refunds = await Refund.find(query)
            .sort({ createdAt: -1 })
            .populate({
                path: 'orderId',
                select: 'orderId totalAmount orderStatus customerInfo createdAt',
            })
            .populate({
                path: 'userId',
                select: 'name email phone',
            })
            .lean();

        return NextResponse.json({ success: true, refunds });

    } catch (error) {
        console.error('[ADMIN_REFUND_GET_ERROR]', error);
        return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const admin = await requirePermission('refunds');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { orderId, reason } = body;

        if (!orderId || !reason) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        await dbConnect();

        // Check if order exists to pull the original userId
        const order = await Order.findById(orderId);
        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        // Check if refund already requested
        const existingRefund = await Refund.findOne({ orderId });
        if (existingRefund) {
            return NextResponse.json({ success: false, message: 'A Return & Refund request already exists for this order' }, { status: 400 });
        }

        // Create the Refund Request
        const newRefund = await Refund.create({
            orderId: orderId,
            userId: order.user, // Add the original buyer's ID
            reason: reason,
            status: 'pending' // As requested by user, inserts with pending status
        });

        return NextResponse.json({ success: true, refund: newRefund });

    } catch (error) {
        console.error('[ADMIN_REFUND_POST_ERROR]', error);
        return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
    }
}
