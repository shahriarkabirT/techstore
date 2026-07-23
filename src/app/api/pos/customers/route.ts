import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { requirePermission } from '@/lib/auth';

// GET — Search customers by phone for POS
export async function GET(request: NextRequest) {
    try {
        const admin = await requirePermission('pos');
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const phone = searchParams.get('phone');

        if (!phone || phone.trim().length < 3) {
            return NextResponse.json({
                success: true,
                customers: [],
            });
        }

        await dbConnect();

        const phoneRegex = new RegExp(phone.trim(), 'i');
        const customers = await User.find({
            $or: [
                { phone: phoneRegex },
                { name: phoneRegex },
            ],
        })
            .select('name email phone address addressBook')
            .limit(10)
            .lean();

        return NextResponse.json({
            success: true,
            customers,
        });
    } catch (error) {
        console.error('POS Customer Search Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
