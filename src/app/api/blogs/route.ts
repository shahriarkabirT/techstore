import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Blog from '@/models/Blog';

export async function GET(request: Request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1') || 1;
        const limit = parseInt(searchParams.get('limit') || '10') || 10;
        const search = searchParams.get('search');

        const query: any = { isActive: true }; // Only fetch published blogs
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        const skip = (page - 1) * limit;

        const [blogs, total] = await Promise.all([
            Blog.find(query).select('-content').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Blog.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            blogs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching blogs:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
