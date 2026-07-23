import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Settings from '@/models/Settings';
import { sendPasswordResetEmail } from '@/lib/email';
import { sendSMS } from '@/lib/sms';

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

        const { identifier, otpPreference } = body;

        if (!identifier) {
            return NextResponse.json(
                { success: false, message: 'Email or Phone is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        let query = {};
        if (otpPreference === 'sms') {
            query = { phone: identifier };
        } else {
            query = { email: identifier.toLowerCase() };
        }

        const user = await User.findOne(query);

        if (!user) {
            // we return success message even if user not found to prevent user enumeration
            return NextResponse.json({
                success: true,
                message: otpPreference === 'sms'
                    ? 'If an account exists with this phone number, a reset code has been sent.'
                    : 'If an account exists with this email, a reset code has been sent.',
            });
        }

        // Check global settings for OTP
        let settings = await Settings.findOne();
        if (!settings) settings = await Settings.create({});

        if (!settings.emailOtpEnabled && !settings.smsOtpEnabled) {
            return NextResponse.json(
                { success: false, message: 'Password reset is temporarily unavailable.' },
                { status: 503 }
            );
        }

        // Determine which method to use
        let method: 'email' | 'sms' = 'email';
        if (otpPreference === 'sms' && settings.smsOtpEnabled) {
            method = 'sms';
        } else if (otpPreference === 'email' && settings.emailOtpEnabled) {
            method = 'email';
        } else {
            // Fallback or error if requested method is disabled
            if (settings.emailOtpEnabled) method = 'email';
            else if (settings.smsOtpEnabled) method = 'sms';
            else method = 'email'; // Should be caught by previous check
        }

        if (method === 'sms') {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            if (user.lastSmsOtpDate && user.lastSmsOtpDate > startOfDay) {
                if (user.dailyOtpSmsCount && user.dailyOtpSmsCount >= 10) {
                    return NextResponse.json(
                        { success: false, message: 'Daily SMS limit reached. Please try again tomorrow or use email.' },
                        { status: 429 }
                    );
                }
                user.dailyOtpSmsCount = (user.dailyOtpSmsCount || 0) + 1;
            } else {
                user.dailyOtpSmsCount = 1;
                user.lastSmsOtpDate = now;
            }
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        user.resetPasswordOTP = otp;
        user.resetPasswordExpires = otpExpires;
        user.lastOtpMethod = method;
        await user.save();

        let otpResponse;
        if (method === 'sms') {
            otpResponse = await sendSMS(user.phone, `Your password reset code is: ${otp}`);
        } else {
            otpResponse = await sendPasswordResetEmail(user.email, otp);
        }

        if (!otpResponse.success) {
            return NextResponse.json(
                { success: false, message: `Failed to send reset ${method === 'sms' ? 'SMS' : 'email'}. Please try again later.` },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: method === 'sms'
                ? 'A reset code has been sent to your phone.'
                : 'A reset code has been sent to your email.',
            method,
        });

    } catch (error: any) {
        console.error('Forgot Password Error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Server error' },
            { status: 500 }
        );
    }
}
