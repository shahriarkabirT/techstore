import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import env from '@/lib/env';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const mer_txnid = formData.get('mer_txnid');

        if (mer_txnid) {
            await dbConnect();

            const order = await Order.findOne({ orderId: mer_txnid });

            if (order && order.paymentStatus !== 'Paid') {
                order.paymentStatus = 'Failed';
                await order.save();
            }
        }

        return NextResponse.redirect(
            new URL(`/payment/fail${mer_txnid ? `?orderId=${mer_txnid}` : ''}`, env.NEXT_PUBLIC_APP_URL)
        );
    } catch (error) {
        console.error('Payment Fail Handler Error:', error);
        return NextResponse.redirect(new URL('/payment/fail', env.NEXT_PUBLIC_APP_URL));
    }
}
