import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import dbConnect from '@/lib/db';
import Banner from '@/models/Banner';
import { requirePermission } from '@/lib/auth';
import { deleteImage } from '@/lib/imageUtils';

// PUT update banner (admin only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('banners');
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        const { title, subtitle, image, link, isActive, order } = body;

        await dbConnect();

        const banner = await Banner.findById(id);
        if (!banner) {
            return NextResponse.json(
                { success: false, message: 'Banner not found' },
                { status: 404 }
            );
        }

        if (title !== undefined) banner.title = title;
        if (subtitle !== undefined) banner.subtitle = subtitle;
        if (image !== undefined) {
            // Delete old image from disk if a new one is being set
            if (banner.image !== image) {
                await deleteImage(banner.image);
            }
            banner.image = image;
        }
        if (link !== undefined) banner.link = link;
        if (isActive !== undefined) banner.isActive = isActive;
        if (order !== undefined) banner.order = order;

        await banner.save();

        revalidateTag('banners', { expire: 0 });
        revalidatePath('/', 'page');

        return NextResponse.json({
            success: true,
            message: 'Banner updated successfully',
            banner,
        });
    } catch (error) {
        console.error('Update Banner Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// DELETE banner (admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('banners');
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;

        await dbConnect();

        const banner = await Banner.findById(id);

        if (!banner) {
            return NextResponse.json(
                { success: false, message: 'Banner not found' },
                { status: 404 }
            );
        }

        // Delete the banner image from the filesystem
        await deleteImage(banner.image);

        await Banner.findByIdAndDelete(id);

        revalidateTag('banners', { expire: 0 });
        revalidatePath('/', 'page');

        return NextResponse.json({
            success: true,
            message: 'Banner deleted successfully',
        });
    } catch (error) {
        console.error('Delete Banner Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
