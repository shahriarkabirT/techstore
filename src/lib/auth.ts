import jwt, { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { verifyAccessToken } from './jwt';
import env from '@/lib/env';

const JWT_SECRET = env.JWT_SECRET;
const TOKEN_EXPIRY = '7d';

export interface AdminTokenPayload extends JwtPayload {
    id: string;
    email: string;
    role: string;
    permissions?: string[];
}

export function generateToken(payload: object): string {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): AdminTokenPayload | null {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }
    try {
        return jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
    } catch {
        return null;
    }
}

export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    if (!password || !hashedPassword || typeof password !== 'string' || typeof hashedPassword !== 'string') {
        return false;
    }
    return bcrypt.compare(password, hashedPassword);
}

export async function getAdminFromToken(): Promise<AdminTokenPayload | null> {
    const cookieStore = await cookies();

    // Check legacy admin token first
    const token = cookieStore.get('admin_token')?.value;
    if (token) {
        const decoded = verifyToken(token);
        if (decoded) return decoded;
    }

    // Check unified access token
    const accessToken = cookieStore.get('access_token')?.value;
    if (accessToken) {
        const decoded = verifyAccessToken(accessToken);
        if (decoded && (decoded.role === 'admin' || decoded.role === 'moderator')) {
            return {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
                permissions: decoded.permissions || [],
            } as AdminTokenPayload;
        }
    }

    return null;
}

export async function getUserFromToken() {
    const cookieStore = await cookies();

    // 1. Check unified access token first
    const accessToken = cookieStore.get('access_token')?.value;
    if (accessToken) {
        const decoded = verifyAccessToken(accessToken);
        if (decoded) {
            return {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
            };
        }
    }

    // 2. Fallback to legacy admin token
    const adminToken = cookieStore.get('admin_token')?.value;
    if (adminToken) {
        const decoded = verifyToken(adminToken);
        if (decoded) {
            return {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role || 'admin',
            };
        }
    }

    return null;
}

export function isAuthenticated(request: NextRequest): boolean {
    const adminToken = request.cookies.get('admin_token')?.value;
    if (adminToken) {
        const decoded = verifyToken(adminToken);
        if (decoded) return true;
    }

    const accessToken = request.cookies.get('access_token')?.value;
    if (accessToken) {
        const decoded = verifyAccessToken(accessToken);
        if (decoded && (decoded.role === 'admin' || decoded.role === 'moderator')) return true;
    }

    return false;
}

/**
 * Check if the authenticated admin/moderator has the required permission.
 * - Admins: always allowed
 * - Moderators: must have the permission key in their permissions[]
 *
 * Supports both new format ('products') and legacy path format ('/admin/products').
 *
 * Returns the admin payload on success, or null on failure.
 */
export async function requirePermission(permissionKey: string): Promise<AdminTokenPayload | null> {
    const admin = await getAdminFromToken();
    if (!admin) return null;

    // Admins have full access
    if (admin.role === 'admin') return admin;

    // Moderators must have the specific permission
    if (admin.role === 'moderator') {
        const permissions = admin.permissions || [];

        // Check new format: 'products', 'orders', etc.
        if (permissions.includes(permissionKey)) {
            return admin;
        }

        // Check legacy path format: '/admin/products', '/admin/orders', etc.
        const legacyPath = `/admin/${permissionKey}`;
        if (permissions.includes(legacyPath)) {
            return admin;
        }

        return null;
    }

    return null;
}

/**
 * Strictly require admin role — blocks moderators entirely.
 * Use this for sensitive operations like user management, settings, etc.
 */
export async function requireAdmin(): Promise<AdminTokenPayload | null> {
    const admin = await getAdminFromToken();
    if (!admin) return null;
    if (admin.role !== 'admin') return null;
    return admin;
}
