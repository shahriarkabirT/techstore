import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Coupon from '@/models/Coupon';
import { requirePermission } from '@/lib/auth';

export async function GET() {
    try {
        await dbConnect();
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: { coupons } });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to fetch coupons' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const admin = await requirePermission('marketing');
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        await dbConnect();

        const coupon = await Coupon.create(body);
        return NextResponse.json({ success: true, data: { coupon } });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ success: false, message: 'Coupon code already exists' }, { status: 400 });
        }
        return NextResponse.json({ success: false, message: error.message || 'Failed to create coupon' }, { status: 500 });
    }
}
