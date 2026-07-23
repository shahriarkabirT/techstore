import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Settings from '@/models/Settings';
import { sendOTPEmail } from '@/lib/email';
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

        const { email, method: requestedMethod } = body;

        if (!email) {
            return NextResponse.json(
                { success: false, message: 'Email is required' },
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

        // Determine method: prioritizing requestedMethod, then lastOtpMethod, then email
        let method: 'email' | 'sms' = requestedMethod || user.lastOtpMethod || 'email';

        if (method === 'email' && user.isEmailVerified) {
            return NextResponse.json(
                { success: false, message: 'Email already verified' },
                { status: 400 }
            );
        }

        if (method === 'sms' && user.isPhoneVerified) {
            return NextResponse.json(
                { success: false, message: 'Phone number already verified' },
                { status: 400 }
            );
        }

        // Check settings and default method
        let settings = await Settings.findOne();
        if (!settings) settings = await Settings.create({});

        // Fallback if the last used method is now disabled
        if (method === 'sms' && !settings.smsOtpEnabled) {
            if (settings.emailOtpEnabled) {
                method = 'email';
            } else {
                return NextResponse.json(
                    { success: false, message: 'OTP services are currently unavailable.' },
                    { status: 503 }
                );
            }
        } else if (method === 'email' && !settings.emailOtpEnabled) {
            if (settings.smsOtpEnabled) {
                method = 'sms';
            } else {
                return NextResponse.json(
                    { success: false, message: 'OTP services are currently unavailable.' },
                    { status: 503 }
                );
            }
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

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        user.otp = otp;
        user.otpExpires = otpExpires;
        user.lastOtpMethod = method;
        await user.save();

        let otpResponse;
        if (method === 'sms') {
            otpResponse = await sendSMS(user.phone, `Your verification code is: ${otp}`);
        } else {
            otpResponse = await sendOTPEmail(user.email, otp);
        }

        if (!otpResponse.success) {
            return NextResponse.json(
                { success: false, message: `Failed to send verification ${method === 'sms' ? 'SMS' : 'email'}` },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `A new verification code has been sent to your ${method === 'sms' ? 'phone' : 'email'}.`,
            method,
        });

    } catch (error: any) {
        console.error('Resend OTP Error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Server error' },
            { status: 500 }
        );
    }
}
