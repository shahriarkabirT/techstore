import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import AbandonedCheckout from '@/models/AbandonedCheckout';
import { requirePermission } from '@/lib/auth';
import rateLimit from '@/lib/rate-limit';

const limiter = rateLimit({
    uniqueTokenPerInterval: 500,
    interval: 60000, // 60 seconds
});

// POST — public: capture abandoned checkout (called via sendBeacon)
export async function POST(request: any) {
    try {
        const ip =
            request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            '127.0.0.1';

        // Strict rate limit: 5 per IP per 60 seconds
        try {
            await limiter.check(5, `abandoned_${ip}`);
        } catch {
            return NextResponse.json(
                { success: false, message: 'Too many requests' },
                { status: 429 }
            );
        }

        await dbConnect();

        let body: any;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { success: false, message: 'Invalid request body' },
                { status: 400 }
            );
        }

        const { customerInfo, cartItems, cartTotal } = body;

        // Must have at least name or phone to be useful
        const name = customerInfo?.name?.trim()?.slice(0, 200) || '';
        const phone = customerInfo?.phone?.trim()?.slice(0, 20) || '';

        if (!name && !phone) {
            return NextResponse.json(
                { success: false, message: 'At least name or phone is required' },
                { status: 400 }
            );
        }

        // Sanitize customer info
        const sanitizedCustomerInfo = {
            name,
            phone,
            email: customerInfo?.email?.trim()?.slice(0, 100)?.toLowerCase() || '',
            address: customerInfo?.address?.trim()?.slice(0, 500) || '',
            city: customerInfo?.city?.trim()?.slice(0, 100) || '',
            notes: customerInfo?.notes?.trim()?.slice(0, 500) || '',
        };

        // Sanitize cart items (limit to 50 items max)
        const sanitizedCartItems = (Array.isArray(cartItems) ? cartItems : [])
            .slice(0, 50)
            .map((item: any) => ({
                productId: String(item.productId || '').slice(0, 50),
                title: String(item.title || '').slice(0, 300),
                price: Math.max(0, Number(item.price) || 0),
                quantity: Math.max(1, Math.min(100, Number(item.quantity) || 1)),
                image: String(item.image || '').slice(0, 500),
                variant: item.variant || {},
            }))
            .filter((item: any) => item.productId && item.title);

        const safeCartTotal = Math.max(0, Number(cartTotal) || 0);

        const userAgent = (request.headers.get('user-agent') || '').slice(0, 500);

        // Deduplication: upsert by phone within 1-hour window
        // If the same phone number has an abandoned checkout created in the last hour, update it
        if (phone) {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const existing = await AbandonedCheckout.findOneAndUpdate(
                {
                    'customerInfo.phone': phone,
                    status: 'abandoned',
                    createdAt: { $gte: oneHourAgo },
                },
                {
                    customerInfo: sanitizedCustomerInfo,
                    cartItems: sanitizedCartItems,
                    cartTotal: safeCartTotal,
                    ipAddress: ip,
                    userAgent,
                },
                { new: true }
            );

            if (existing) {
                return NextResponse.json({ success: true, deduplicated: true });
            }
        }

        // Create new entry
        await AbandonedCheckout.create({
            customerInfo: sanitizedCustomerInfo,
            cartItems: sanitizedCartItems,
            cartTotal: safeCartTotal,
            status: 'abandoned',
            ipAddress: ip,
            userAgent,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Abandoned checkout error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// GET — admin only: list abandoned checkouts
export async function GET(request: any) {
    try {
        const admin = await requirePermission('orders');
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1') || 1;
        const limit = parseInt(searchParams.get('limit') || '20') || 20;
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        const query: Record<string, unknown> = {};

        if (status && ['abandoned', 'recovered', 'expired'].includes(status)) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { 'customerInfo.name': { $regex: search, $options: 'i' } },
                { 'customerInfo.phone': { $regex: search, $options: 'i' } },
                { 'customerInfo.email': { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;

        const [checkouts, total] = await Promise.all([
            AbandonedCheckout.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            AbandonedCheckout.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            checkouts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get abandoned checkouts error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
