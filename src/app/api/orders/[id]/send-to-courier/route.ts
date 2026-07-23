import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { CourierFactory } from '@/lib/couriers/factory';
import { IOrder } from '@/types';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const { id } = await params;

    try {
        const {
            courierName,
            pickupStoreId,
            deliveryAreaId,
            deliveryAreaName,
            city_id,
            zone_id,
            isClosedBox,
            instruction
        } = await req.json();

        if (!courierName) {
            return NextResponse.json({ success: false, message: 'Courier name is required' }, { status: 400 });
        }

        const order = await Order.findById(id);
        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        // Temporarily update order object with selection for the service to use if needed
        if (city_id || zone_id || deliveryAreaId) {
            order.paymentDetails = {
                ...order.paymentDetails,
                city_id,
                zone_id,
                area_id: deliveryAreaId
            };
        }

        const courierService = await CourierFactory.getService(courierName);
        if (!courierService) {
            return NextResponse.json({
                success: false,
                message: `Courier service '${courierName}' is not available or enabled`
            }, { status: 400 });
        }

        const result = await courierService.sendOrder({
            order: order as unknown as IOrder,
            pickupStoreId,
            deliveryAreaId,
            deliveryAreaName,
            isClosedBox,
            instruction
        });

        if (result.success) {
            // Update order with tracking info and status
            order.orderStatus = 'Shipped';
            order.paymentDetails = {
                ...order.paymentDetails,
                trackingId: result.trackingId,
                parcelId: result.parcelId,
                courier: courierName,
                sentToCourierAt: new Date(),
                // Ensure IDs and Names are persisted
                city_id,
                zone_id,
                area_id: deliveryAreaId,
                area_name: deliveryAreaName
            };

            await order.save();

            return NextResponse.json({
                success: true,
                message: result.message || 'Order successfully sent to courier',
                trackingId: result.trackingId
            });
        } else {
            return NextResponse.json({ success: false, message: result.message }, { status: 400 });
        }

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
