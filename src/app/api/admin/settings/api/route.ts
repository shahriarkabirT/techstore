import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import { requirePermission } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
    try {
        const admin = await requirePermission('settings');
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const settings = await Settings.findOne({}, 'apiSecret') || await Settings.create({});
        return NextResponse.json({ success: true, apiSecret: settings.apiSecret });
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
        const { action } = body;
        
        let newSecret = '';
        if (action === 'generate') {
            newSecret = `ts_${uuidv4().replace(/-/g, '')}`;
        }

        await dbConnect();
        const settings = await Settings.findOneAndUpdate(
            {},
            {
                $set: {
                    apiSecret: newSecret
                }
            },
            { new: true, upsert: true }
        );

        return NextResponse.json({ success: true, apiSecret: settings.apiSecret });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to update settings' }, { status: 500 });
    }
}
