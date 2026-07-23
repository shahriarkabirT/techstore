import { NextRequest, NextResponse } from 'next/server';
import { CourierFactory } from '@/lib/couriers/factory';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ name: string }> }
) {
    const { name } = await params;
    const { searchParams } = new URL(req.url);
    const trackingId = searchParams.get('trackingId');

    if (!trackingId) {
        return NextResponse.json(
            { success: false, message: 'Tracking ID is required' },
            { status: 400 }
        );
    }

    try {
        // We use ignoreEnabled=true because an admin might want to track an old parcel
        // even if the courier is currently disabled in their settings.
        const courierService = await CourierFactory.getService(name, true);

        if (!courierService) {
            return NextResponse.json(
                { success: false, message: `Courier service '${name}' not found` },
                { status: 404 }
            );
        }

        const result = await courierService.trackOrder(trackingId);

        return NextResponse.json({
            success: result.success,
            status: result.status,
            history: result.history || [],
            message: result.message || 'Tracking fetched successfully',
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to fetch tracking details' },
            { status: 500 }
        );
    }
}
