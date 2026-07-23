import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';

export async function GET(req: NextRequest) {
    const orderId = req.nextUrl.searchParams.get('orderId');

    if (!orderId || !orderId.trim()) {
        return NextResponse.json(
            { success: false, message: 'Order ID is required' },
            { status: 400 }
        );
    }

    try {
        await dbConnect();

        const order = await Order.findOne({ orderId: orderId.trim() })
            .select('orderId orderStatus paymentStatus paymentMethod products subtotal shippingCost taxAmount discountAmount totalAmount customerInfo.name customerInfo.city customerInfo.deliveryLocation createdAt updatedAt')
            .lean();

        if (!order) {
            return NextResponse.json(
                { success: false, message: 'Order not found' },
                { status: 404 }
            );
        }

        // Return only safe public fields
        return NextResponse.json({
            success: true,
            order: {
                orderId: order.orderId,
                orderStatus: order.orderStatus,
                paymentStatus: order.paymentStatus,
                paymentMethod: order.paymentMethod,
                customerName: order.customerInfo?.name || 'Customer',
                city: order.customerInfo?.city || '',
                deliveryLocation: order.customerInfo?.deliveryLocation || 'inside',
                products: order.products.map((p: any) => ({
                    title: p.title,
                    price: p.price,
                    quantity: p.quantity,
                    image: p.image || '',
                })),
                subtotal: order.subtotal,
                shippingCost: order.shippingCost,
                taxAmount: order.taxAmount,
                discountAmount: order.discountAmount,
                totalAmount: order.totalAmount,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
            },
        });
    } catch (error: any) {
        console.error('Track order error:', error);
        return NextResponse.json(
            { success: false, message: 'Something went wrong' },
            { status: 500 }
        );
    }
}
