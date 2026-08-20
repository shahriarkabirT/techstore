import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import AffiliateTransaction from '@/models/AffiliateTransaction';
import User from '@/models/User';
import { requirePermission } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const admin = await requirePermission('dashboard');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const status = searchParams.get('status');

        const query: any = {};
        if (type) query.type = type;
        if (status) query.status = status;

        const transactions = await AffiliateTransaction.find(query)
            .sort({ createdAt: -1 })
            .populate('user', 'name email phone affiliateCode')
            .populate('orderId', 'orderId totalAmount');

        const stats = await AffiliateTransaction.aggregate([
            {
                $group: {
                    _id: { type: '$type', status: '$status' },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        return NextResponse.json({
            success: true,
            transactions,
            stats
        });
    } catch (error) {
        console.error('Admin Affiliate Get Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const admin = await requirePermission('dashboard');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await request.json();
        const { id, status } = body;

        const transaction = await AffiliateTransaction.findById(id);
        if (!transaction) {
            return NextResponse.json({ success: false, message: 'Transaction not found' }, { status: 404 });
        }

        // Only allow changing withdrawal status to paid or cancelled
        if (transaction.type === 'withdrawal' && transaction.status === 'pending') {
            transaction.status = status;
            await transaction.save();

            // If cancelled, refund the balance to the user
            if (status === 'cancelled') {
                await User.findByIdAndUpdate(transaction.user, {
                    $inc: { affiliateBalance: transaction.amount }
                });
            }

            return NextResponse.json({ success: true, message: 'Transaction updated successfully' });
        }

        return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Admin Affiliate Put Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
