import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import { requirePermission } from '@/lib/auth';

export async function GET() {
    try {
        await dbConnect();
        const settings = await Settings.findOne({}, 'address contactPhone contactEmail whatsapp facebook instagram youtube tiktok');
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
        const { address, contactPhone, contactEmail, whatsapp, facebook, instagram, youtube, tiktok } = body;

        await dbConnect();
        let settings = await Settings.findOne();

        if (!settings) {
            settings = new Settings({});
        }

        if (address !== undefined) settings.address = address;
        if (contactPhone !== undefined) settings.contactPhone = contactPhone;
        if (contactEmail !== undefined) settings.contactEmail = contactEmail;
        if (whatsapp !== undefined) settings.whatsapp = whatsapp;
        if (facebook !== undefined) settings.facebook = facebook;
        if (instagram !== undefined) settings.instagram = instagram;
        if (youtube !== undefined) settings.youtube = youtube;
        if (tiktok !== undefined) settings.tiktok = tiktok;

        await settings.save();

        revalidatePath('/', 'layout');

        return NextResponse.json({ success: true, settings });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
