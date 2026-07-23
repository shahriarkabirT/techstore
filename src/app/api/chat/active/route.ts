import { NextResponse } from 'next/server';
import ChatSession from '@/models/ChatSession';
import mongoose from 'mongoose';

export async function GET(req: Request) {
    try {
        if (!process.env.MONGODB_URI) throw new Error('MONGO_URI not found');
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        // Fetch active AND closed sessions, sorted by most recent first
        const sessions = await ChatSession.find({})
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);

        return NextResponse.json(sessions);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }
}
