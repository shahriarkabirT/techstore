import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import { requirePermission } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const admin = await requirePermission('orders');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { phone_number } = body;

        if (!phone_number) {
            return NextResponse.json({ success: false, message: 'Phone number is required' }, { status: 400 });
        }

        await dbConnect();
        const settings = await Settings.findOne({}, 'fraudBdApiKey');
        const apiKey = settings?.fraudBdApiKey;

        if (!apiKey) {
            return NextResponse.json({ success: false, message: 'Fraud BD API key is not configured in settings.' }, { status: 400 });
        }

        const isSandbox = apiKey === '1302e523911213bc507c3c6dd35ebdb908044b42982345012452ac8f86406cc9';
        const apiUrl = isSandbox 
            ? 'https://fraudbd.com/api/sandbox/check-courier-info' 
            : 'https://fraudbd.com/api/check-courier-info';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            body: JSON.stringify({ phone_number })
        });

        const textResponse = await response.text();
        let data;
        
        try {
            data = JSON.parse(textResponse);
        } catch (e) {
            console.error('Fraud BD Non-JSON Response:', textResponse);
            return NextResponse.json({ success: false, message: 'Received an invalid response from Fraud BD.' }, { status: 502 });
        }
        
        return NextResponse.json(data);
    } catch (error) {
        console.error('Fraud BD Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to check fraud status.' }, { status: 500 });
    }
}
