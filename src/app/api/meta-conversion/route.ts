import { NextResponse } from 'next/server';
import { sendCapiEvent, CapiEventParams } from '@/lib/meta-capi';
import { headers, cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Extract IP and User-Agent from headers if not provided in body
        const headersList = await headers();
        const ipAddress = body.ipAddress || headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '';
        const userAgent = body.userAgent || headersList.get('user-agent') || '';
        
        // Extract Meta cookies automatically
        const cookieStore = await cookies();
        const fbp = cookieStore.get('_fbp')?.value;
        const fbc = cookieStore.get('_fbc')?.value;

        const customerInfo = {
            ...body.customerInfo,
            ...(fbp ? { fbp } : {}),
            ...(fbc ? { fbc } : {})
        };
        
        const params: CapiEventParams = {
            ...body,
            customerInfo,
            ipAddress,
            userAgent
        };

        // Validate required fields
        if (!params.eventName || !params.eventID) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields: eventName and eventID' },
                { status: 400 }
            );
        }

        // Send event to Meta Conversions API
        // We do this asynchronously without awaiting to prevent blocking the client response
        sendCapiEvent(params).catch(err => {
            console.error('Failed to send CAPI event asynchronously:', err);
        });

        return NextResponse.json({ success: true, message: 'CAPI event queued for processing' });
    } catch (error: any) {
        console.error('Error in /api/meta-conversion:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
