import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        let body: any;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json(
                { success: false, message: 'Invalid or empty request body' },
                { status: 400 }
            );
        }

        const { identifier, otp, newPassword } = body;

        if (!identifier || !otp || !newPassword) {
            return NextResponse.json(
                { success: false, message: 'Identifier, OTP, and new password are required' },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { success: false, message: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        await dbConnect();

        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
        const query = isEmail ? { email: identifier.toLowerCase() } : { phone: identifier };

        const user = await User.findOne(query);

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        if (user.resetPasswordOTP !== otp) {
            return NextResponse.json(
                { success: false, message: 'Invalid verification code' },
                { status: 400 }
            );
        }

        if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
            return NextResponse.json(
                { success: false, message: 'Verification code has expired' },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update user
        user.password = hashedPassword;
        user.resetPasswordOTP = undefined;
        user.resetPasswordExpires = undefined;
        // In case they were resetting while unverified, we still keep isEmailVerified as is 
        // unless you want to verify them now. Usually best to keep it separate.

        await user.save();

        return NextResponse.json({
            success: true,
            message: 'Password has been reset successfully. You can now log in with your new password.',
        });

    } catch (error: any) {
        console.error('Reset Password Error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Server error' },
            { status: 500 }
        );
    }
}
