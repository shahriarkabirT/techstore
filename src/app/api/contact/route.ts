import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ContactMessage from '@/models/ContactMessage';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, subject, message } = body;

        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { success: false, message: 'Please provide name, email, subject and message' },
                { status: 400 }
            );
        }

        const WORD_LIMIT = 250;
        const SUBJECT_LIMIT = 100;
        const wordCount = message.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
        if (wordCount > WORD_LIMIT) {
            return NextResponse.json(
                { success: false, message: `Message exceeds the maximum limit of ${WORD_LIMIT} words.` },
                { status: 400 }
            );
        }

        if (subject.length > SUBJECT_LIMIT) {
            return NextResponse.json(
                { success: false, message: `Subject exceeds the maximum limit of ${SUBJECT_LIMIT} characters.` },
                { status: 400 }
            );
        }

        await dbConnect();
        const newMessage = await ContactMessage.create({
            name,
            email,
            phone,
            subject,
            message
        });

        return NextResponse.json({
            success: true,
            message: 'Your message has been sent successfully!',
            data: newMessage
        });
    } catch (error: any) {
        console.error('Contact API Error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
