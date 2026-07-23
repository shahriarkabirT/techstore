import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import StoreLocation from '@/models/StoreLocation';
import { requirePermission } from '@/lib/auth';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requirePermission('store-locations');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        await dbConnect();
        const location = await StoreLocation.findByIdAndUpdate(id, body, { new: true });

        if (!location) {
            return NextResponse.json({ success: false, message: 'Location not found' }, { status: 404 });
        }

        revalidatePath('/store-locations');

        return NextResponse.json({ success: true, location, message: 'Store location updated successfully' });
    } catch (error: any) {
        console.error('Admin Store Locations PATCH Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requirePermission('store-locations');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await dbConnect();
        const location = await StoreLocation.findByIdAndDelete(id);

        if (!location) {
            return NextResponse.json({ success: false, message: 'Location not found' }, { status: 404 });
        }

        revalidatePath('/store-locations');

        return NextResponse.json({ success: true, message: 'Store location deleted successfully' });
    } catch (error: any) {
        console.error('Admin Store Locations DELETE Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
