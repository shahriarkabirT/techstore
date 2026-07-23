import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import { requirePermission } from '@/lib/auth';

export async function GET() {
    try {
        const admin = await requirePermission('settings');
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const settings = await Settings.findOne({}, 'googleClientId googleClientSecret') || await Settings.create({});
        return NextResponse.json({ success: true, settings });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const admin = await requirePermission('settings');
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { googleClientId, googleClientSecret } = body;

        await dbConnect();
        const settings = await Settings.findOneAndUpdate(
            {},
            {
                $set: {
                    googleClientId,
                    googleClientSecret,
                }
            },
            { new: true, upsert: true }
        );

        revalidatePath('/', 'layout');

        return NextResponse.json({ success: true, settings });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to update settings' }, { status: 500 });
    }
}
