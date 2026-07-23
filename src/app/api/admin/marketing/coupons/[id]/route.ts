import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Coupon from '@/models/Coupon';
import { requirePermission } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await dbConnect();
        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: { coupon } });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to fetch coupon' }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('marketing');
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        // Clean body to prevent Mongoose errors and ensure valid update
        const { _id, id: bodyId, ...updateData } = body;

        await dbConnect();

        const coupon = await Coupon.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        if (!coupon) {
            console.error(`Coupon not found for update: ${id}`);
            return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: { coupon } });
    } catch (error: any) {
        console.error('Coupon Update Error:', error);
        return NextResponse.json({ success: false, message: error.message || 'Failed to update coupon' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('marketing');
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await dbConnect();
        const coupon = await Coupon.findByIdAndDelete(id);
        if (!coupon) {
            return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to delete coupon' }, { status: 500 });
    }
}
