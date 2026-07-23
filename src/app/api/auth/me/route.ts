import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getAuthCookies, setAuthCookies, clearAuthCookies } from '@/lib/cookies';
import { verifyAccessToken, verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
    try {
        const { accessToken, refreshToken } = await getAuthCookies();
        let userId: string | null = null;

        // 0. If no refresh token, session is dead. Clear everything to avoid zombie state.
        if (!refreshToken) {
            await clearAuthCookies();
            return NextResponse.json(
                { success: false, message: 'Session expired' },
                { status: 401 }
            );
        }

        // 1. Try checking access token
        if (accessToken) {
            const decoded = verifyAccessToken(accessToken);
            if (decoded) {
                userId = decoded.id;
            }
        }

        // 2. If access token invalid/missing, try refreshing with refresh token
        if (!userId && refreshToken) {
            const decodedRefresh = verifyRefreshToken(refreshToken);

            if (decodedRefresh) {
                // Fetch fresh user data from DB for new tokens
                await dbConnect();
                const freshUser = await User.findById(decodedRefresh.id);

                if (!freshUser) {
                    await clearAuthCookies();
                    return NextResponse.json(
                        { success: false, message: 'User not found' },
                        { status: 404 }
                    );
                }

                // Generate new tokens with FRESH permissions from DB
                const payload = {
                    id: freshUser._id.toString(),
                    email: freshUser.email,
                    role: freshUser.role,
                    permissions: freshUser.permissions || [],
                };

                const newAccessToken = signAccessToken(payload);
                const newRefreshToken = signRefreshToken(payload); // Rotation

                // Set new cookies
                await setAuthCookies(newAccessToken, newRefreshToken);

                userId = decodedRefresh.id;
            }
        }

        if (!userId) {
            // Check failed, clear cookies
            await clearAuthCookies();
            return NextResponse.json(
                { success: false, message: 'Not authenticated' },
                { status: 401 }
            );
        }

        await dbConnect();
        const user = await User.findById(userId);

        if (!user) {
            await clearAuthCookies();
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // ALWAYS regenerate tokens with fresh permissions from DB
        const payload = {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            permissions: user.permissions || [],
        };

        const newAccessToken = signAccessToken(payload);
        const newRefreshToken = signRefreshToken(payload);

        await setAuthCookies(newAccessToken, newRefreshToken);

        return NextResponse.json({
            success: true,
            user: {
                ...user.toObject(),
                hasPassword: !!user.password,
                password: undefined,
            },
        });

    } catch (error) {
        console.error('Get Me Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
