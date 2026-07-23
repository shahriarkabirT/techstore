import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { verifyAamarPayPayment } from '@/lib/aamarpay';
import env from '@/lib/env';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const mer_txnid = formData.get('mer_txnid');
        const pay_status = formData.get('pay_status');

        if (!mer_txnid) {
            return NextResponse.redirect(new URL('/payment/fail', env.NEXT_PUBLIC_APP_URL));
        }

        await dbConnect();

        const order = await Order.findOne({ orderId: mer_txnid });

        if (!order) {
            return NextResponse.redirect(new URL('/payment/fail', process.env.NEXT_PUBLIC_BASE_URL));
        }

        // Verify payment with AamarPay
        const verification = await verifyAamarPayPayment(mer_txnid);

        if (verification.success && verification.status === 'Paid') {
            order.paymentStatus = 'Paid';
            order.orderStatus = 'Confirmed';
            order.transactionId = verification.transactionId || mer_txnid;
            order.paymentDetails = verification.paymentDetails || {};
            await order.save();

            return NextResponse.redirect(
                new URL(`/order-confirmation/${order.orderId}?status=success`, env.NEXT_PUBLIC_APP_URL)
            );
        }

        order.paymentStatus = 'Failed';
        await order.save();

        return NextResponse.redirect(
            new URL(`/payment/fail?orderId=${order.orderId}`, env.NEXT_PUBLIC_APP_URL)
        );
    } catch (error) {
        console.error('Payment Success Handler Error:', error);
        return NextResponse.redirect(new URL('/payment/fail', process.env.NEXT_PUBLIC_BASE_URL));
    }
}
