import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Refund from '@/models/Refund';
import Order from '@/models/Order';
import { getUserFromToken } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const user = await getUserFromToken();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { orderId, reason } = body;

        if (!orderId || !reason) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        await dbConnect();

        // Check if order exists and belongs to the user
        const order = await Order.findOne({ orderId, user: user.id });
        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found or not owned by user' }, { status: 404 });
        }

        // Must be Delivered to request a refund
        if (order.orderStatus !== 'Delivered') {
            return NextResponse.json({ success: false, message: 'Refunds can only be requested for Delivered orders' }, { status: 400 });
        }

        // Check if refund already requested
        const existingRefund = await Refund.findOne({ orderId: order._id });
        if (existingRefund) {
            return NextResponse.json({ success: false, message: 'Refund request already exists for this order' }, { status: 400 });
        }

        // Create the Refund Request
        const newRefund = await Refund.create({
            orderId: order._id,
            userId: user.id,
            reason: reason,
            status: 'pending'
        });

        return NextResponse.json({ success: true, refund: newRefund });

    } catch (error) {
        console.error('[USER_REFUND_POST_ERROR]', error);
        return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
    }
}
