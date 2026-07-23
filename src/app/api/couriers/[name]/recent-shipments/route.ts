import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ name: string }> }
) {
    await dbConnect();
    const { name } = await params;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    try {
        const query = { 'paymentDetails.courier': name };

        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort({ 'paymentDetails.sentToCourierAt': -1 })
                .skip(skip)
                .limit(limit)
                .select('orderId customerInfo totalAmount orderStatus paymentDetails.trackingId paymentDetails.sentToCourierAt'),
            Order.countDocuments(query)
        ]);

        return NextResponse.json({
            success: true,
            orders,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
