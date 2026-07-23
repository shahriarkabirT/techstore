import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import Testimonial from '@/models/Testimonial';
import { requirePermission } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const admin = await requirePermission('testimonials');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const testimonials = await Testimonial.find({}).sort({ order: 1 });
        return NextResponse.json({ success: true, testimonials });
    } catch (error: any) {
        console.error('Admin Testimonials API Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const admin = await requirePermission('testimonials');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, quote, profilePicture, designation, isActive, order } = body;

        if (!name || !quote) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        await dbConnect();
        const testimonial = await Testimonial.create({
            name,
            quote,
            profilePicture: profilePicture || '',
            designation,
            isActive: isActive !== undefined ? isActive : true,
            order: order || 0
        });

        revalidatePath('/');

        return NextResponse.json({ success: true, testimonial, message: 'Testimonial created successfully' });
    } catch (error: any) {
        console.error('Create Testimonial Error:', error);
        return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
