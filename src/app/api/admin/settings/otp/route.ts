import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import { requirePermission } from '@/lib/auth';

export async function GET() {
    try {
        const admin = await requirePermission('settings');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        let settings = await Settings.findOne();

        if (!settings) {
            settings = await Settings.create({});
        }

        return NextResponse.json({ success: true, settings });
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

        let body: any;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ success: false, message: 'Invalid body' }, { status: 400 });
        }

        await dbConnect();

        const { emailOtpEnabled, smsOtpEnabled, smsApiKey, smsSenderId, smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom } = body;

        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings({});
        }

        if (emailOtpEnabled !== undefined) settings.emailOtpEnabled = emailOtpEnabled;
        if (smsOtpEnabled !== undefined) settings.smsOtpEnabled = smsOtpEnabled;
        if (smsApiKey !== undefined) settings.smsApiKey = smsApiKey;
        if (smsSenderId !== undefined) settings.smsSenderId = smsSenderId;
        if (smtpHost !== undefined) settings.smtpHost = smtpHost;
        if (smtpPort !== undefined) settings.smtpPort = Number(smtpPort);
        if (smtpUser !== undefined) settings.smtpUser = smtpUser;
        if (smtpPass !== undefined) settings.smtpPass = smtpPass;
        if (smtpFrom !== undefined) settings.smtpFrom = smtpFrom;

        await settings.save();

        return NextResponse.json({ success: true, settings });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
