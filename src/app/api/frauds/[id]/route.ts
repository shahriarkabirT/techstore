import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Fraud from '@/models/Fraud';
import { requirePermission } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('frauds');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        await dbConnect();

        const updatedFraud = await Fraud.findByIdAndUpdate(
            id,
            { status: body.status },
            { new: true }
        );

        if (!updatedFraud) {
            return NextResponse.json({ success: false, message: 'Fraud entry not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, fraud: updatedFraud });
    } catch (error) {
        console.error('Update Fraud Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('frauds');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await dbConnect();

        const deletedFraud = await Fraud.findByIdAndDelete(id);

        if (!deletedFraud) {
            return NextResponse.json({ success: false, message: 'Fraud entry not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Fraud entry permanently removed' });
    } catch (error) {
        console.error('Delete Fraud Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
