import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookies, setAuthCookies, clearAuthCookies } from '@/lib/cookies';
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/jwt';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET(request: NextRequest) {
    const redirectUrl = request.nextUrl.searchParams.get('redirect_to') || '/';

    try {
        const { refreshToken } = await getAuthCookies();

        if (!refreshToken) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const decoded = verifyRefreshToken(refreshToken);

        if (!decoded) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Fetch fresh user data from DB
        await dbConnect();
        const freshUser = await User.findById(decoded.id);

        if (!freshUser) {
            await clearAuthCookies();
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Generate new tokens with FRESH permissions from DB
        const payload = {
            id: freshUser._id.toString(),
            email: freshUser.email,
            role: freshUser.role,
            permissions: freshUser.permissions || [],
        };

        const newAccessToken = signAccessToken(payload);
        const newRefreshToken = signRefreshToken(payload);

        // Set cookies
        await setAuthCookies(newAccessToken, newRefreshToken);

        return NextResponse.redirect(new URL(redirectUrl, request.url));

    } catch (error) {
        console.error('Session Refresh Error:', error);
        return NextResponse.redirect(new URL('/login', request.url));
    }
}
