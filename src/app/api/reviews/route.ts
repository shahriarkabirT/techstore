import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';
import Product from '@/models/Product';
import { getUserFromRequest } from '@/lib/jwt';

export async function GET(request: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        if (!productId) {
            return NextResponse.json({ success: false, message: 'Product ID is required' }, { status: 400 });
        }

        const reviews = await Review.find({ productId, isApproved: true })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ success: true, reviews });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userPayload = await getUserFromRequest();

        if (!userPayload) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await request.json();
        const { productId, rating, comment, images } = body;

        if (!productId || !rating || !comment) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        const review = await Review.create({
            productId,
            userId: userPayload.id,
            rating,
            comment,
            images: images || [],
            isApproved: false, // Default to unapproved
        });

        // Product's averageRating and reviewCount will be updated upon admin approval

        return NextResponse.json({ success: true, review });
    } catch (error) {
        console.error('Review Post Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
