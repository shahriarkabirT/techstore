import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';
import { setAuthCookies } from '@/lib/cookies';

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

        const { email, otp, method: requestedMethod } = body;

        if (!email || !otp) {
            return NextResponse.json(
                { success: false, message: 'Email and OTP are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        if (user.otp !== otp) {
            return NextResponse.json(
                { success: false, message: 'Invalid verification code' },
                { status: 400 }
            );
        }

        if (!user.otpExpires || user.otpExpires < new Date()) {
            return NextResponse.json(
                { success: false, message: 'Verification code has expired' },
                { status: 400 }
            );
        }

        // Verify user based on method used (prioritize requested method, then last used, then default)
        const method = requestedMethod || user.lastOtpMethod || 'email';

        if (method === 'sms') {
            user.isPhoneVerified = true;
            user.phoneVerified = new Date();
            // Also ensure lastOtpMethod is updated if it wasn't
            user.lastOtpMethod = 'sms';
        } else {
            user.isEmailVerified = true;
            user.emailVerified = new Date();
            user.lastOtpMethod = 'email';
        }

        user.otp = undefined;
        user.otpExpires = undefined;

        await user.save();

        // Sign tokens
        const payload = {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            permissions: user.permissions || [],
        };

        const accessToken = signAccessToken(payload);
        const refreshToken = signRefreshToken(payload);

        await setAuthCookies(accessToken, refreshToken);

        return NextResponse.json({
            success: true,
            message: 'Email verified successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

    } catch (error: any) {
        console.error('OTP Verification Error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Server error' },
            { status: 500 }
        );
    }
}
