import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookies, setAuthCookies } from '@/lib/cookies';
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
    try {
        const { refreshToken } = await getAuthCookies();

        if (!refreshToken) {
            return NextResponse.json(
                { success: false, message: 'No refresh token provided' },
                { status: 401 }
            );
        }

        const decoded = verifyRefreshToken(refreshToken);

        if (!decoded) {
            return NextResponse.json(
                { success: false, message: 'Invalid or expired refresh token' },
                { status: 401 }
            );
        }

        const payload = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
        };

        const newAccessToken = signAccessToken(payload);
        const newRefreshToken = signRefreshToken(payload);

        await setAuthCookies(newAccessToken, newRefreshToken);

        return NextResponse.json({
            success: true,
            message: 'Token refreshed successfully',
        });
    } catch (error) {
        console.error('Refresh Token Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
