import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';

export async function GET() {
    try {
        await dbConnect();
        const settings = await Settings.findOne({}, 'brandName shippingChargeInsideDhaka shippingChargeOutsideDhaka');

        if (!settings) {
            return NextResponse.json({
                success: true,
                settings: {
                    brandName: 'EcoStore',
                    shippingChargeInsideDhaka: 60,
                    shippingChargeOutsideDhaka: 120,
                }
            });
        }

        return NextResponse.json({ success: true, settings });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to fetch settings' }, { status: 500 });
    }
}
