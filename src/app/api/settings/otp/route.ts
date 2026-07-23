import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';

export async function GET() {
    try {
        await dbConnect();
        let settings = await Settings.findOne();

        if (!settings) {
            settings = await Settings.create({});
        }

        return NextResponse.json({
            success: true,
            emailOtpEnabled: settings.emailOtpEnabled,
            smsOtpEnabled: settings.smsOtpEnabled,
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
