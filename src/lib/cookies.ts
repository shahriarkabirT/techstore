import { cookies } from 'next/headers';
import env from '@/lib/env';

const ACCESS_TOKEN_NAME = 'access_token';
const REFRESH_TOKEN_NAME = 'refresh_token';

// Access token expiry: 15 minutes
// Refresh token expiry: 7 days
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export async function setAuthCookies(accessToken: string, refreshToken: string) {
    const cookieStore = await cookies();

    cookieStore.set(ACCESS_TOKEN_NAME, accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        // No maxAge for access token cookie as it's short lived and we rely on JWT expiry
    });

    cookieStore.set(REFRESH_TOKEN_NAME, refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: REFRESH_TOKEN_MAX_AGE,
    });
}

export async function clearAuthCookies() {
    const cookieStore = await cookies();
    cookieStore.delete(ACCESS_TOKEN_NAME);
    cookieStore.delete(REFRESH_TOKEN_NAME);
}

export async function getAuthCookies() {
    const cookieStore = await cookies();
    return {
        accessToken: cookieStore.get(ACCESS_TOKEN_NAME)?.value,
        refreshToken: cookieStore.get(REFRESH_TOKEN_NAME)?.value,
    };
}
