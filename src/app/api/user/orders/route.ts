import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request) {
    try {
        const user = await getUserFromToken();
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find({ user: user.id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments({ user: user.id }),
        ]);

        if (!orders || orders.length === 0) {
            console.log(`No orders found for user: ${user.id}`);
        }

        return NextResponse.json({
            success: true,
            orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error(' [ORDER_API_ERROR] Get User Orders Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error while fetching orders' },
            { status: 500 }
        );
    }
}
