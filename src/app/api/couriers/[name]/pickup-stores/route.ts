import { NextRequest, NextResponse } from 'next/server';
import { CourierFactory } from '@/lib/couriers/factory';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ name: string }> }
) {
    const { name } = await params;

    try {
        const courierService = await CourierFactory.getService(name);
        if (!courierService) {
            return NextResponse.json({ success: false, message: `Courier service '${name}' not found` }, { status: 404 });
        }

        const pickup_stores = await courierService.getPickupStores();
        return NextResponse.json({ success: true, pickup_stores });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
