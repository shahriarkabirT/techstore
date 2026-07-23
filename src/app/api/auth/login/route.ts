import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { comparePassword } from '@/lib/auth';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';
import { setAuthCookies } from '@/lib/cookies';
import rateLimit from '@/lib/rate-limit';

const limiter = rateLimit({
    uniqueTokenPerInterval: 500,
    interval: 60000, // 1 minute
});

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';
        try {
            await limiter.check(10, ip); // Limit: 10 requests per minute per IP for login
        } catch {
            return NextResponse.json({ success: false, message: 'Too many login attempts. Please try again later.' }, { status: 429 });
        }

        await dbConnect();

        let body;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json(
                { success: false, message: 'Invalid or empty request body' },
                { status: 400 }
            );
        }

        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: 'Please provide email and password' },
                { status: 400 }
            );
        }

        if (typeof email !== 'string' || typeof password !== 'string') {
            return NextResponse.json(
                { success: false, message: 'Invalid email or password format' },
                { status: 400 }
            );
        }

        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        if (!user.password) {
            return NextResponse.json(
                { success: false, message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const isMatch = await comparePassword(password, user.password);

        if (!isMatch) {
            return NextResponse.json(
                { success: false, message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const payload = {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            permissions: user.permissions || [],
        };

        const accessToken = signAccessToken(payload);
        const refreshToken = signRefreshToken(payload);

        await setAuthCookies(accessToken, refreshToken);

        // Remove password from response
        const userObj = user.toObject();
        delete userObj.password;

        return NextResponse.json({
            success: true,
            message: 'Login successful',
            user: userObj,
        });
    } catch (error: any) {
        console.error('Login Error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Server error' },
            { status: 500 }
        );
    }
}
