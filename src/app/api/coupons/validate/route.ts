import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Coupon from '@/models/Coupon';

export async function POST(req: Request) {
    try {
        const { code, cartTotal } = await req.json();

        if (!code) {
            return NextResponse.json({ success: false, message: 'Coupon code is required' }, { status: 400 });
        }

        await dbConnect();

        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

        if (!coupon) {
            return NextResponse.json({ success: false, message: 'Invalid or expired coupon code' }, { status: 404 });
        }

        // Check start date (if coupon is not yet active)
        if (coupon.startDate && new Date(coupon.startDate) > new Date()) {
            return NextResponse.json({ success: false, message: 'Coupon is not yet active' }, { status: 400 });
        }

        // Check expiry date
        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
            return NextResponse.json({ success: false, message: 'Coupon has expired' }, { status: 400 });
        }

        // Check usage limit
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return NextResponse.json({ success: false, message: 'Coupon usage limit reached' }, { status: 400 });
        }

        // Check min order amount
        if (cartTotal < coupon.minOrderAmount) {
            return NextResponse.json({
                success: false,
                message: `Minimum order amount for this coupon is ${coupon.minOrderAmount}`
            }, { status: 400 });
        }

        // Calculate discount
        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = (cartTotal * coupon.discountValue) / 100;
            if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
                discount = coupon.maxDiscountAmount;
            }
        } else {
            discount = coupon.discountValue;
        }

        return NextResponse.json({
            success: true,
            message: 'Coupon applied successfully',
            data: {
                coupon,
                discount
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: 'Failed to validate coupon' }, { status: 500 });
    }
}
