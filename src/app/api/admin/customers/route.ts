import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { requirePermission } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const admin = await requirePermission('marketing');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search')?.trim();
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const matchStage: any = {};
        if (search) {
            matchStage.$or = [
                { 'customerInfo.name': new RegExp(search, 'i') },
                { 'customerInfo.phone': new RegExp(search, 'i') },
                { 'customerInfo.email': new RegExp(search, 'i') },
            ];
        }

        const aggregation = [
            { $match: matchStage },
            { $sort: { createdAt: -1 } }, // Sort to get the most recent info first
            {
                $group: {
                    _id: '$customerInfo.phone',
                    name: { $first: '$customerInfo.name' },
                    phone: { $first: '$customerInfo.phone' },
                    email: { $first: '$customerInfo.email' },
                    address: { $first: '$customerInfo.address' },
                    city: { $first: '$customerInfo.city' },
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: '$totalAmount' },
                    lastOrderDate: { $first: '$createdAt' },
                }
            },
            { $sort: { lastOrderDate: -1 } },
            {
                $facet: {
                    metadata: [{ $count: 'total' }],
                    data: [{ $skip: skip }, { $limit: limit }]
                }
            }
        ];

        const [results] = await Order.aggregate(aggregation as any);
        const customers = results?.data || [];
        const total = results?.metadata?.[0]?.total || 0;

        return NextResponse.json({
            success: true,
            customers,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get Customers Aggregation Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
