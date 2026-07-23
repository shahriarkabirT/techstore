import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { CourierFactory } from '@/lib/couriers/factory';
import { requirePermission, getUserFromToken } from '@/lib/auth';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const { id } = await params;

    try {
        const order = await Order.findById(id);
        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        // Authorization check
        const admin = await requirePermission('orders');
        const user = await getUserFromToken();

        const isOwner = user && order.user && order.user.toString() === user.id;
        const isAdmin = !!admin;

        if (!isOwner && !isAdmin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized access to tracking information' },
                { status: 403 }
            );
        }

        const trackingId = order.paymentDetails?.trackingId as string;
        const courierName = order.paymentDetails?.courier as string;

        if (!trackingId || !courierName) {
            return NextResponse.json({ success: false, message: 'No tracking information found for this order' }, { status: 400 });
        }

        const courierService = await CourierFactory.getService(courierName);
        if (!courierService) {
            return NextResponse.json({
                success: false,
                message: `Courier service '${courierName}' is not available or enabled`
            }, { status: 400 });
        }

        const result = await courierService.trackOrder(trackingId);

        return NextResponse.json({
            success: true,
            status: result.status,
            history: result.history || [],
            rawResponse: result.rawResponse
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
