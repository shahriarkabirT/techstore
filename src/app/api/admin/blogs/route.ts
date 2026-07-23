import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Blog from '@/models/Blog';
import { requirePermission } from '@/lib/auth';
import slugify from 'slugify';

export async function GET(request: Request) {
    try {
        const admin = await requirePermission('blogs');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1') || 1;
        const limit = parseInt(searchParams.get('limit') || '10') || 10;
        const search = searchParams.get('search');

        const query: any = {};
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        const skip = (page - 1) * limit;

        const [blogs, total] = await Promise.all([
            Blog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
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

export async function POST(request: Request) {
    try {
        const admin = await requirePermission('blogs');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const data = await request.json();

        // Generate base slug
        let baseSlug = slugify(data.title, { lower: true, strict: true, trim: true });
        if (!baseSlug) {
            baseSlug = `blog-${Date.now()}`;
        }
        
        let slug = baseSlug;
        let counter = 1;

        // Ensure unique slug
        while (await Blog.exists({ slug })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        const newBlog = await Blog.create({
            ...data,
            slug,
        });

        return NextResponse.json({ success: true, blog: newBlog }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating blog:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Server error' },
            { status: 500 }
        );
    }
}
