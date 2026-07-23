import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import Testimonial from '@/models/Testimonial';
import { requirePermission } from '@/lib/auth';
import { deleteImage } from '@/lib/imageUtils';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('testimonials');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        await dbConnect();

        // Fetch first so we can detect profilePicture change and clean up
        const existing = await Testimonial.findById(id);
        if (!existing) {
            return NextResponse.json({ success: false, message: 'Testimonial not found' }, { status: 404 });
        }

        if (
            body.profilePicture !== undefined &&
            body.profilePicture !== existing.profilePicture &&
            existing.profilePicture
        ) {
            await deleteImage(existing.profilePicture);
        }

        const testimonial = await Testimonial.findByIdAndUpdate(id, body, { new: true, runValidators: true });

        revalidatePath('/');

        return NextResponse.json({ success: true, testimonial, message: 'Testimonial updated successfully' });
    } catch (error: any) {
        console.error('Update Testimonial Error:', error);
        return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('testimonials');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await dbConnect();
        const testimonial = await Testimonial.findById(id);

        if (!testimonial) {
            return NextResponse.json({ success: false, message: 'Testimonial not found' }, { status: 404 });
        }

        if (testimonial.profilePicture) {
            await deleteImage(testimonial.profilePicture);
        }

        await Testimonial.findByIdAndDelete(id);

        revalidatePath('/');

        return NextResponse.json({ success: true, message: 'Testimonial deleted successfully' });
    } catch (error: any) {
        console.error('Delete Testimonial Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
