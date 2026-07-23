import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subscriber from '@/models/Subscriber';
import { requirePermission } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const admin = await requirePermission('marketing');
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        await dbConnect();
        const subscribers = await Subscriber.find()
            .sort({ subscribedAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Subscriber.countDocuments();

        return NextResponse.json({
            success: true,
            data: {
                subscribers,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to fetch subscribers' }, { status: 500 });
    }
}
