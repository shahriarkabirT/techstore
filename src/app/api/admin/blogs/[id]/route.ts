import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Blog from '@/models/Blog';
import { requirePermission } from '@/lib/auth';
import slugify from 'slugify';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('blogs');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const blog = await Blog.findById(id);

        if (!blog) {
            return NextResponse.json({ success: false, message: 'Blog not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, blog });
    } catch (error) {
        console.error('Error fetching blog:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('blogs');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const data = await request.json();

        // If title changed, we don't necessarily want to change slug unless requested, 
        // to prevent broken links. Here we'll just update fields without changing slug,
        // or update slug if explicitly passed (not typical).
        if (data.title && !data.slug) {
             let baseSlug = slugify(data.title, { lower: true, strict: true, trim: true });
             if (baseSlug) {
                 let slug = baseSlug;
                 let counter = 1;
                 while (await Blog.exists({ slug, _id: { $ne: id } })) {
                     slug = `${baseSlug}-${counter}`;
                     counter++;
                 }
                 data.slug = slug;
             }
        }

        const blog = await Blog.findByIdAndUpdate(id, data, { new: true, runValidators: true });

        if (!blog) {
            return NextResponse.json({ success: false, message: 'Blog not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, blog });
    } catch (error: any) {
        console.error('Error updating blog:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('blogs');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        
        const blog = await Blog.findByIdAndDelete(id);

        if (!blog) {
            return NextResponse.json({ success: false, message: 'Blog not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Blog deleted' });
    } catch (error) {
        console.error('Error deleting blog:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
