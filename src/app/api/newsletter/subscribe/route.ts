import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subscriber from '@/models/Subscriber';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
        }

        await dbConnect();

        // Try to create subscriber, handle duplicate email
        try {
            const subscriber = await Subscriber.create({ email });
            return NextResponse.json({ success: true, message: 'Subscribed successfully', data: { subscriber } });
        } catch (error: any) {
            if (error.code === 11000) {
                return NextResponse.json({ success: true, message: 'You are already subscribed!' });
            }
            throw error;
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message || 'Subscription failed' }, { status: 500 });
    }
}
