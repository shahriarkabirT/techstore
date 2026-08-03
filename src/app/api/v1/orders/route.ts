import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import Order from '@/models/Order';

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        const apiSecretHeader = req.headers.get('x-api-secret');

        let providedSecret = apiSecretHeader;

        if (!providedSecret && authHeader && authHeader.startsWith('Bearer ')) {
            providedSecret = authHeader.substring(7);
        }

        if (!providedSecret) {
            return NextResponse.json({ success: false, message: 'Unauthorized: Missing API Secret' }, { status: 401 });
        }

        await dbConnect();
        
        const settings = await Settings.findOne({}, 'apiSecret');
        
        if (!settings || !settings.apiSecret) {
            return NextResponse.json({ success: false, message: 'Unauthorized: API Secret not configured on the server' }, { status: 401 });
        }

        if (providedSecret !== settings.apiSecret) {
            return NextResponse.json({ success: false, message: 'Unauthorized: Invalid API Secret' }, { status: 401 });
        }

        // Fetch all orders
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ success: true, count: orders.length, orders });
    } catch (error) {
        console.error('Error fetching orders API:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
