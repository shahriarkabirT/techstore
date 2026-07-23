import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { IOrderDocument } from '@/types';
import { Document, DefaultSchemaOptions, Types } from 'mongoose';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { notification_type, consignment_id, invoice, status } = body;

        // Steadfast webhook now sends 'notification_type', 'invoice', and 'status'
        if (!invoice && !consignment_id) {
            return NextResponse.json({ status: 'error', message: 'Missing invoice or consignment_id' }, { status: 400 });
        }

        if (!status) {
            return NextResponse.json({ status: 'error', message: 'Missing status field' }, { status: 400 });
        }

        await dbConnect();

        // invoice corresponds to our orderId since we pass data.order.orderId as invoice
        let order: Document<unknown, {}, IOrderDocument, {}, DefaultSchemaOptions> & IOrderDocument & Required<{ _id: Types.ObjectId; }> & { __v: number; } & { id: string; };
        if (invoice) {
            order = await Order.findOne({ orderId: invoice });
        }
        
        // Fallback to trackingId/consignment_id if invoice fails
        if (!order && consignment_id) {
            order = await Order.findOne({ 'paymentDetails.trackingId': consignment_id.toString() });
        }

        if (!order) {
            return NextResponse.json({ status: 'error', message: 'Order not found for this invoice/consignment' }, { status: 404 });
        }

        let updated = false;
        const statusStr = status.toString().toLowerCase();

        // Update status for 'delivery_status' notifications
        if (notification_type === 'delivery_status' || !notification_type) {
            if (statusStr.includes('delivered') && !statusStr.includes('approval_pending') && !statusStr.includes('partial')) {
                if (order.orderStatus !== 'Delivered') {
                    order.orderStatus = 'Delivered';
                    if (order.paymentMethod === 'COD') {
                        order.paymentStatus = 'Paid';
                    }
                    updated = true;
                }
            } else if (statusStr.includes('partial_delivered') && !statusStr.includes('approval_pending')) {
                if (order.orderStatus !== 'Partially Delivered') {
                    order.orderStatus = 'Partially Delivered';
                    if (order.paymentMethod === 'COD') {
                        order.paymentStatus = 'Delivery Charge Paid';
                    }
                    updated = true;
                }
            } else if (statusStr.includes('cancelled') && !statusStr.includes('approval_pending')) {
                if (order.orderStatus !== 'Cancelled') {
                    order.orderStatus = 'Cancelled';
                    order.paymentStatus = 'Failed';
                    updated = true;
                }
            }
        }

        if (updated) {
            await order.save();
        }

        // Steadfast expects 'status': 'success'
        return NextResponse.json({ status: 'success', message: 'Webhook received successfully.' });
    } catch (error) {
        console.error('Steadfast webhook error:', error);
        return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
    }
}
