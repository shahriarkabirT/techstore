import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Courier from '@/models/Courier';

/**
 * GET: Fetch all courier settings
 */
export async function GET() {
    await dbConnect();
    try {
        const couriers = await Courier.find({});
        return NextResponse.json({ success: true, couriers });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

/**
 * POST: Update or create courier settings
 */
export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const { name, isEnabled, config } = await req.json();

        if (!name) {
            return NextResponse.json({ success: false, message: 'Courier name is required' }, { status: 400 });
        }

        const courier = await Courier.findOneAndUpdate(
            { name },
            { isEnabled, config },
            { new: true, upsert: true }
        );

        return NextResponse.json({ success: true, courier });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
