import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import StoreLocation from '@/models/StoreLocation';
import { requirePermission } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const admin = await requirePermission('store-locations');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const locations = await StoreLocation.find({}).sort({ order: 1 });
        return NextResponse.json({ success: true, locations });
    } catch (error: any) {
        console.error('Admin Store Locations GET Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const admin = await requirePermission('store-locations');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, address, businessHours, contact, mapLink, image, isActive, order } = body;

        if (!title || !address || !businessHours || !contact || !image) {
            return NextResponse.json({ success: false, message: 'All required fields must be provided' }, { status: 400 });
        }

        await dbConnect();
        const location = await StoreLocation.create({
            title,
            address,
            businessHours,
            contact,
            mapLink,
            image,
            isActive: isActive !== undefined ? isActive : true,
            order: order || 0
        });

        revalidatePath('/store-locations');

        return NextResponse.json({ success: true, location, message: 'Store location created successfully' });
    } catch (error: any) {
        console.error('Admin Store Locations POST Error:', error);
        return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
