import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Fraud from '@/models/Fraud';
import { requirePermission } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const admin = await requirePermission('frauds');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        
        const frauds = await Fraud.find().sort({ createdAt: -1 });

        return NextResponse.json({ success: true, frauds });
    } catch (error) {
        console.error('Fetch Frauds Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const admin = await requirePermission('frauds');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { phone, ip, name, reason } = body;

        if (!phone && !ip) {
            return NextResponse.json({ success: false, message: 'Phone or IP must be provided' }, { status: 400 });
        }

        await dbConnect();

        const newFraud = await Fraud.create({
            phone,
            ip: ip || '',
            name: name || '',
            status: 'blocked',
            reason: reason || 'Manually flagged by Admin'
        });

        return NextResponse.json({ success: true, fraud: newFraud });
    } catch (error) {
        console.error('Create Fraud Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
