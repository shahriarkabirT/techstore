import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Blog from '@/models/Blog';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
    try {
        await dbConnect();
        const { slug } = await params;
        
        const blog = await Blog.findOne({ slug, isActive: true });

        if (!blog) {
            return NextResponse.json({ success: false, message: 'Blog not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, blog });
    } catch (error) {
        console.error('Error fetching blog:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
