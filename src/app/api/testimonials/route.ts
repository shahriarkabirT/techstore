import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Testimonial from '@/models/Testimonial';

export async function GET() {
    try {
        await dbConnect();
        const testimonials = await Testimonial.find({ isActive: true }).sort({ order: 1 });
        return NextResponse.json({ success: true, testimonials });
    } catch (error: any) {
        console.error('Public Testimonials API Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
