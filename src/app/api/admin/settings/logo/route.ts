import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import { requirePermission } from '@/lib/auth';

export async function GET() {
    try {
        await dbConnect();
        const settings = await Settings.findOne({}, 'logoUrl logoWidth logoHeight faviconUrl');
        return NextResponse.json({ success: true, settings: settings || {} });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const admin = await requirePermission('settings');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { logoUrl, logoWidth, logoHeight, faviconUrl } = body;

        await dbConnect();
        let settings = await Settings.findOne();

        if (!settings) {
            settings = new Settings({});
        }

        if (logoUrl !== undefined) settings.logoUrl = logoUrl;
        if (logoWidth !== undefined) settings.logoWidth = logoWidth;
        if (logoHeight !== undefined) settings.logoHeight = logoHeight;
        if (faviconUrl !== undefined) settings.faviconUrl = faviconUrl;

        await settings.save();

        revalidatePath('/', 'layout');

        return NextResponse.json({ success: true, settings });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
