import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { CourierFactory } from '@/lib/couriers/factory';
import { IOrder } from '@/types';
import { requirePermission } from '@/lib/auth';

function stringMatch(source: string, target: string) {
    if (!source || !target) return false;
    return source.toLowerCase().includes(target.toLowerCase()) || target.toLowerCase().includes(source.toLowerCase());
}

export async function POST(req: NextRequest) {
    try {
        const admin = await requirePermission('orders');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const {
            orderIds,
            courierName,
            pickupStoreId,
            isClosedBox,
            instruction
        } = await req.json();

        if (!courierName) {
            return NextResponse.json({ success: false, message: 'Courier name is required' }, { status: 400 });
        }

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json({ success: false, message: 'No orders selected' }, { status: 400 });
        }

        const courierService = await CourierFactory.getService(courierName);
        if (!courierService) {
            return NextResponse.json({
                success: false,
                message: `Courier service '${courierName}' is not available or enabled`
            }, { status: 400 });
        }

        const results = [];
        let successCount = 0;
        let failCount = 0;

        for (const id of orderIds) {
            try {
                const order = await Order.findById(id);
                if (!order) {
                    results.push({ id, success: false, message: 'Order not found' });
                    failCount++;
                    continue;
                }

                if (order.orderStatus === 'Shipped' || order.orderStatus === 'Delivered') {
                    results.push({ id, success: false, message: 'Already shipped or delivered' });
                    failCount++;
                    continue;
                }

                let deliveryAreaId: number | undefined = undefined;
                let deliveryAreaName: string | undefined = undefined;
                let city_id: number | undefined = undefined;
                let zone_id: number | undefined = undefined;

                // Auto-mapping for Pathao and RedX
                if (courierName === 'steadfast') {
                    // Steadfast doesn't strictly need mapped areas, it relies on text addresses mostly
                    deliveryAreaId = 0; 
                } else if (courierName === 'redx') {
                    const areas = await courierService.getAreas({ district_name: order.customerInfo.city });
                    const match = areas.find((a: any) => stringMatch(a.name, order.customerInfo.city) || stringMatch(a.name, order.customerInfo.address));
                    if (match) {
                        deliveryAreaId = match.id;
                        deliveryAreaName = match.name;
                    }
                } else if (courierName === 'pathao') {
                    // Pathao is complex, requires City -> Zone -> Area
                    const cities = await courierService.getAreas();
                    const cityMatch = cities.find((c: any) => stringMatch(c.name, order.customerInfo.city));
                    if (cityMatch) {
                        city_id = cityMatch.id;
                        const zones = await courierService.getAreas({ city_id });
                        const zoneMatch = zones.find((z: any) => stringMatch(z.name, order.customerInfo.city) || stringMatch(z.name, order.customerInfo.address));
                        if (zoneMatch) {
                            zone_id = zoneMatch.id;
                            const areas = await courierService.getAreas({ zone_id });
                            const areaMatch = areas.find((a: any) => stringMatch(a.name, order.customerInfo.address));
                            if (areaMatch) {
                                deliveryAreaId = areaMatch.id;
                                deliveryAreaName = areaMatch.name;
                            }
                        }
                    }
                }

                if (!deliveryAreaId && courierName !== 'steadfast') {
                    results.push({ id, success: false, message: 'Failed to auto-map delivery area from address. Dispatch manually.' });
                    failCount++;
                    continue;
                }

                // Inject temporarily into order object as required by CourierOrderRequest
                if (city_id || zone_id || deliveryAreaId) {
                    order.paymentDetails = {
                        ...order.paymentDetails,
                        city_id,
                        zone_id,
                        area_id: deliveryAreaId,
                        area_name: deliveryAreaName
                    };
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
                    order.orderStatus = 'Shipped';
                    order.paymentDetails = {
                        ...order.paymentDetails,
                        trackingId: result.trackingId,
                        parcelId: result.parcelId,
                        courier: courierName,
                        sentToCourierAt: new Date(),
                        city_id,
                        zone_id,
                        area_id: deliveryAreaId,
                        area_name: deliveryAreaName
                    };
                    await order.save();
                    
                    results.push({ id, success: true, trackingId: result.trackingId });
                    successCount++;
                } else {
                    results.push({ id, success: false, message: result.message });
                    failCount++;
                }
            } catch (err: any) {
                results.push({ id, success: false, message: err.message });
                failCount++;
            }
        }

        const msg = failCount === 0 
            ? `Successfully dispatched all ${successCount} orders.` 
            : `Dispatched ${successCount} orders. Failed ${failCount} orders.`;

        return NextResponse.json({
            success: true,
            message: msg,
            results
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
