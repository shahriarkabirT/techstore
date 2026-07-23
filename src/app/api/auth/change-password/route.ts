import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { hashPassword, comparePassword, getUserFromToken } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const tokenUser = await getUserFromToken();
        if (!tokenUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        let body: any;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json(
                { success: false, message: 'Invalid or empty request body' },
                { status: 400 }
            );
        }

        const { currentPassword, newPassword, confirmPassword } = body;

        if (!newPassword || !confirmPassword) {
            return NextResponse.json(
                { success: false, message: 'New password and confirmation are required' },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { success: false, message: 'New password must be at least 6 characters' },
                { status: 400 }
            );
        }

        if (newPassword !== confirmPassword) {
            return NextResponse.json(
                { success: false, message: 'New passwords do not match' },
                { status: 400 }
            );
        }

        await dbConnect();

        const user = await User.findById(tokenUser.id);
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // If user already has a password, they must verify the current one
        if (user.password) {
            if (!currentPassword) {
                return NextResponse.json(
                    { success: false, message: 'Current password is required' },
                    { status: 400 }
                );
            }

            const isMatch = await comparePassword(currentPassword, user.password);
            if (!isMatch) {
                return NextResponse.json(
                    { success: false, message: 'Current password is incorrect' },
                    { status: 400 }
                );
            }
        }

        // Hash and save new password
        const hashedPassword = await hashPassword(newPassword);
        user.password = hashedPassword;
        await user.save();

        return NextResponse.json({
            success: true,
            message: user.password ? 'Password changed successfully' : 'Password set successfully',
        });

    } catch (error: any) {
        console.error('Change Password Error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Server error' },
            { status: 500 }
        );
    }
}
