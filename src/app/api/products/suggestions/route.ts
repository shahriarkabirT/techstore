import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        if (!query || query.length < 2) {
            return NextResponse.json({ success: true, products: [] });
        }

        const regex = new RegExp(query, 'i');

        const products = await Product.find({
            $or: [
                { title: { $regex: regex } },
                { slug: { $regex: regex } }
            ],
            isActive: true
        })
            .select('title slug price images category')
            .limit(8)
            .lean();

        return NextResponse.json({
            success: true,
            products,
        });
    } catch (error) {
        console.error('Search Suggestions Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error', products: [] },
            { status: 500 }
        );
    }
}
