import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';

export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
    try {
        await dbConnect();

        // Fetch top 12 newest active products
        const products = await Product.find({ isActive: true })
            .sort({ createdAt: -1 })
            .limit(12)
            .lean();

        return NextResponse.json({
            success: true,
            products
        });
    } catch (error) {
        console.error('Error fetching new arrivals:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch new arrivals' },
            { status: 500 }
        );
    }
}
