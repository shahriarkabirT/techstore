import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import AffiliateTransaction from '@/models/AffiliateTransaction';
import { getUserFromToken } from '@/lib/auth';

export async function GET() {
    try {
        await dbConnect();
        const userToken = await getUserFromToken();

        if (!userToken) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const user = await User.findById(userToken.id);
        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        // Auto-generate affiliate code if not exists
        let affiliateCode = user.affiliateCode;
        if (!affiliateCode) {
            affiliateCode = `REF-${user._id.toString().substring(0, 8).toUpperCase()}`;
            user.affiliateCode = affiliateCode;
            await user.save();
        }

        // Fetch pending earnings
        const pendingTransactions = await AffiliateTransaction.find({ user: user._id, status: 'pending', type: 'earning' });
        const pendingEarnings = pendingTransactions.reduce((acc, curr) => acc + curr.amount, 0);

        // Fetch recent transactions
        const transactions = await AffiliateTransaction.find({ user: user._id }).sort({ createdAt: -1 }).limit(20).populate('orderId', 'orderId totalAmount');

        return NextResponse.json({
            success: true,
            data: {
                affiliateCode,
                affiliateBalance: user.affiliateBalance || 0,
                totalAffiliateEarnings: user.totalAffiliateEarnings || 0,
                pendingEarnings,
                transactions
            }
        });
    } catch (error) {
        console.error('Affiliate Dashboard Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const userToken = await getUserFromToken();

        if (!userToken) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { amount, paymentMethod, paymentDetails } = body;

        if (!amount || amount <= 0 || !paymentMethod || !paymentDetails) {
            return NextResponse.json({ success: false, message: 'Invalid withdrawal details' }, { status: 400 });
        }

        const user = await User.findById(userToken.id);
        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        if (user.affiliateBalance < amount) {
            return NextResponse.json({ success: false, message: 'Insufficient balance' }, { status: 400 });
        }

        // Deduct balance and create withdrawal transaction
        user.affiliateBalance -= amount;
        await user.save();

        const transaction = await AffiliateTransaction.create({
            user: user._id,
            amount,
            type: 'withdrawal',
            status: 'pending', // Pending admin approval
            paymentMethod,
            paymentDetails
        });

        return NextResponse.json({
            success: true,
            message: 'Withdrawal requested successfully',
            transaction
        });
    } catch (error) {
        console.error('Affiliate Withdrawal Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
