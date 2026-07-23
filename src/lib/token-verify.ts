import jwt, { JwtPayload } from 'jsonwebtoken';
import env from '@/lib/env';

const JWT_SECRET = env.JWT_SECRET;
const ACCESS_TOKEN_SECRET = env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = env.REFRESH_TOKEN_SECRET;

// Types duplicated to avoid importing from files with side-effects
export interface TokenPayload extends JwtPayload {
    id: string;
    email: string;
    role: string;
    permissions?: string[];
}

export interface AdminTokenPayload extends JwtPayload {
    id: string;
    email: string;
    role: string;
    permissions?: string[];
}

export function verifyLegacyAdminToken(token: string): AdminTokenPayload | null {
    if (!JWT_SECRET) {
        // In Edge, process.env might need specific handling or be available. 
        // If JWT_SECRET is missing, we can't verify.
        return null;
    }
    try {
        return jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
    } catch {
        return null;
    }
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

