import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { requirePermission } from '@/lib/auth';

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const admin = await requirePermission('users');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const user = await User.findById(params.id).select('-password');

        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, user });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const admin = await requirePermission('users');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { role, permissions } = body;

        await dbConnect();

        const user = await User.findById(params.id);

        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        if (role) {
            user.role = role;
        }

        if (permissions && Array.isArray(permissions)) {
            user.permissions = permissions;
        }

        // Add other updateable fields here if needed

        await user.save();

        return NextResponse.json({ success: true, message: 'User updated successfully', user });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const admin = await requirePermission('users');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const user = await User.findByIdAndDelete(params.id);

        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'User deleted successfully' });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
