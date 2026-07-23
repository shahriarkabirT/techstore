import jwt, { JwtPayload } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import env from '@/lib/env';

const ACCESS_TOKEN_SECRET = env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = env.REFRESH_TOKEN_SECRET;

const ACCESS_TOKEN_EXPIRY = '4h';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface TokenPayload extends JwtPayload {
    id: string;
    email: string;
    role: string;
    permissions?: string[];
}

export function signAccessToken(payload: object): string {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function signRefreshToken(payload: object): string {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

export function verifyAccessToken(token: string): TokenPayload | null {
    try {
        return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
    } catch {
        return null;
    }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
    try {
        return jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;
    } catch {
        return null;
    }
}

export async function getUserFromRequest() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
        return null;
    }

    return verifyAccessToken(accessToken);
}
