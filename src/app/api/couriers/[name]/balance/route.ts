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

        const balanceResult = await courierService.getBalance();
        return NextResponse.json(balanceResult);
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
