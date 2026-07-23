import { NextResponse } from 'next/server';
import ChatSession from '@/models/ChatSession';
import dbConnect from '@/lib/db';
import { getAdminFromToken } from '@/lib/auth';

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const admin = await getAdminFromToken();

        if (!admin || (admin.role !== 'admin' && admin.role !== 'moderator')) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        if (!id) {
            return NextResponse.json({ success: false, message: 'Session ID is required' }, { status: 400 });
        }

        const sessionToDelete = await ChatSession.findById(id);

        if (!sessionToDelete) {
            return NextResponse.json({ success: false, message: 'Session not found' }, { status: 404 });
        }

        if (sessionToDelete.status === 'active') {
            return NextResponse.json({ 
                success: false, 
                message: 'Active chats cannot be deleted. Please end the chat first.' 
            }, { status: 400 });
        }

        await ChatSession.findByIdAndDelete(id);

        return NextResponse.json({ success: true, message: 'Session deleted successfully' });
    } catch (error: any) {
        console.error('Delete Chat Session Error:', error);
        return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
