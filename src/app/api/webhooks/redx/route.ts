import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // RedX typically sends payload inside a structure or directly
        // We'll extract tracking_id and status from the body
        const tracking_id = body.tracking_id || body.parcel_tracking_id || body.tracking_code;
        const status = body.status || body.parcel_status;

        if (!tracking_id || !status) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        await dbConnect();

        const order = await Order.findOne({ 'paymentDetails.trackingId': tracking_id.toString() });

        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found for this tracking ID' }, { status: 404 });
        }

        let updated = false;
        const statusStr = status.toString().toLowerCase();

        // RedX statuses: delivered, returned, cancelled
        if (statusStr.includes('delivered')) {
            if (order.orderStatus !== 'Delivered') {
                order.orderStatus = 'Delivered';
                if (order.paymentMethod === 'COD') {
                    order.paymentStatus = 'Paid';
                }
                updated = true;
            }
        } else if (statusStr.includes('returned') || statusStr.includes('cancelled')) {
            if (order.orderStatus !== 'Returned' && order.orderStatus !== 'Cancelled') {
                order.orderStatus = statusStr.includes('returned') ? 'Returned' : 'Cancelled';
                order.paymentStatus = 'Failed';
                updated = true;
            }
        }

        if (updated) {
            await order.save();
        }

        return NextResponse.json({ success: true, message: 'Webhook processed successfully' });
    } catch (error) {
        console.error('RedX webhook error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
