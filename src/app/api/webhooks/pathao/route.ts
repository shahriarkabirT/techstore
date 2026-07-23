import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { consignment_id, order_status } = body;

        if (!consignment_id || !order_status) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        await dbConnect();

        // Find the order by trackingId
        const order = await Order.findOne({ 'paymentDetails.trackingId': consignment_id });

        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found for this consignment ID' }, { status: 404 });
        }

        let updated = false;

        // Pathao statuses are usually "Delivered", "Return", "Cancelled"
        const statusStr = order_status.toString().toLowerCase();

        if (statusStr.includes('delivered')) {
            if (order.orderStatus !== 'Delivered') {
                order.orderStatus = 'Delivered';
                if (order.paymentMethod === 'COD') {
                    order.paymentStatus = 'Paid';
                }
                updated = true;
            }
        } else if (statusStr.includes('return') || statusStr.includes('cancelled')) {
            if (order.orderStatus !== 'Returned' && order.orderStatus !== 'Cancelled') {
                order.orderStatus = statusStr.includes('return') ? 'Returned' : 'Cancelled';
                order.paymentStatus = 'Failed';
                updated = true;
            }
        }

        if (updated) {
            await order.save();
        }

        return NextResponse.json({ success: true, message: 'Webhook processed successfully' });
    } catch (error) {
        console.error('Pathao webhook error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
