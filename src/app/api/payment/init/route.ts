import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { initAamarPayPayment } from '@/lib/aamarpay';

export async function POST(request) {
    try {
        const { orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json(
                { success: false, message: 'Order ID is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const order = await Order.findOne({ orderId });

        if (!order) {
            return NextResponse.json(
                { success: false, message: 'Order not found' },
                { status: 404 }
            );
        }

        if (order.paymentMethod !== 'AamarPay') {
            return NextResponse.json(
                { success: false, message: 'This order is not for online payment' },
                { status: 400 }
            );
        }

        if (order.paymentStatus === 'Paid') {
            return NextResponse.json(
                { success: false, message: 'Order is already paid' },
                { status: 400 }
            );
        }

        const paymentResult = await initAamarPayPayment({
            orderId: order.orderId,
            amount: order.totalAmount,
            customerName: order.customerInfo.name,
            customerEmail: order.customerInfo.email,
            customerPhone: order.customerInfo.phone,
            customerAddress: order.customerInfo.address,
            customerCity: order.customerInfo.city,
        });

        if (!paymentResult.success) {
            return NextResponse.json(
                { success: false, message: paymentResult.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            paymentUrl: paymentResult.paymentUrl,
        });
    } catch (error) {
        console.error('Payment Init Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
