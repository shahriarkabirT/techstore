import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import StoreLocation from '@/models/StoreLocation';

export async function GET() {
    try {
        await dbConnect();
        const locations = await StoreLocation.find({ isActive: true }).sort({ order: 1 });
        return NextResponse.json({ success: true, locations });
    } catch (error: any) {
        console.error('Public Store Locations GET Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
