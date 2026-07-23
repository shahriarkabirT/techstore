import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ name: string }> }
) {
    await dbConnect();
    const { name } = await params;

    try {
        // Aggregate statistics for the specified courier
        const stats = await Order.aggregate([
            {
                $match: {
                    'paymentDetails.courier': name
                }
            },
            {
                $group: {
                    _id: '$orderStatus',
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedStats = {
            total: stats.reduce((acc, curr) => acc + curr.count, 0),
            shipped: stats.find(s => s._id === 'Shipped')?.count || 0,
            delivered: stats.find(s => s._id === 'Delivered')?.count || 0,
            processing: stats.find(s => s._id === 'Processing')?.count || 0,
            pending: stats.find(s => s._id === 'Pending')?.count || 0,
            cancelled: stats.find(s => s._id === 'Cancelled')?.count || 0,
        };

        return NextResponse.json({ success: true, stats: formattedStats });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
