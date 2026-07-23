import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import dbConnect from '@/lib/db';
import Banner from '@/models/Banner';
import { requirePermission } from '@/lib/auth';

// GET all banners
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('active') === 'true';
        const position = searchParams.get('position');

        const query: any = {};
        if (activeOnly) {
            query.isActive = true;
        }
        if (position) {
            query.position = position;
        }

        const banners = await Banner.find(query).sort({ order: 1, createdAt: -1 });

        return NextResponse.json({
            success: true,
            banners,
        });
    } catch (error) {
        console.error('Get Banners Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// POST create banner (admin only)
export async function POST(request: NextRequest) {
    try {
        const admin = await requirePermission('banners');
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { title, subtitle, image, link, position, isActive, order } = body;

        if (!title || !image) {
            return NextResponse.json(
                { success: false, message: 'Title and Image are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Enforce max-1 rule for promotional slots
        if (position === 'promotional-left' || position === 'promotional-right') {
            const existing = await Banner.findOne({ position });
            if (existing) {
                return NextResponse.json(
                    {
                        success: false,
                        message: `A ${position === 'promotional-left' ? 'Promotional Left' : 'Promotional Right'} banner already exists. Please edit or delete the existing one.`,
                    },
                    { status: 409 }
                );
            }
        }

        // Enforce max-4 rule for secondary-top and secondary-bottom
        if (position === 'secondary-top' || position === 'secondary-bottom') {
            const count = await Banner.countDocuments({ position });
            if (count >= 4) {
                return NextResponse.json(
                    {
                        success: false,
                        message: `A maximum of 4 banners can be uploaded for ${position === 'secondary-top' ? 'Secondary Top' : 'Secondary Bottom'}. Please delete or edit an existing banner.`,
                    },
                    { status: 400 }
                );
            }
        }

        const banner = await Banner.create({
            title,
            subtitle,
            image,
            link,
            position: position || 'primary',
            isActive: isActive !== undefined ? isActive : true,
            order: order || 0,
        });

        revalidateTag('banners', { expire: 0 });
        revalidatePath('/', 'page');

        return NextResponse.json({
            success: true,
            message: 'Banner created successfully',
            banner,
        });
    } catch (error) {
        console.error('Create Banner Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
