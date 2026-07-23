import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const user = await getUserFromToken();
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await context.params;

        await dbConnect();

        // Ensure the order belongs precisely to the authenticated user!
        const order = await Order.findOne({ orderId: id, user: user.id }).lean();

        if (!order) {
            return NextResponse.json(
                { success: false, message: 'Order not found or access denied' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, order });
    } catch (error) {
        console.error('[USER_ORDER_GET_ERROR]', error);
        return NextResponse.json(
            { success: false, message: 'Server Error' },
            { status: 500 }
        );
    }
}
