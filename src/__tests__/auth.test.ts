import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as jwtHelpers from '@/lib/jwt';
import * as authHelpers from '@/lib/auth';

// Mock next/headers
vi.mock('next/headers', () => ({
    cookies: vi.fn(),
}));

import { cookies } from 'next/headers';

describe('JWT Helpers (src/lib/jwt.ts)', () => {
    const payload = { id: 'user123', email: 'user@test.com', role: 'user' };

    it('signs and verifies an access token', () => {
        const token = jwtHelpers.signAccessToken(payload);
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');

        const decoded = jwtHelpers.verifyAccessToken(token);
        expect(decoded).toMatchObject(payload);
    });

    it('signs and verifies a refresh token', () => {
        const token = jwtHelpers.signRefreshToken(payload);
        expect(token).toBeDefined();

        const decoded = jwtHelpers.verifyRefreshToken(token);
        expect(decoded).toMatchObject(payload);
    });

    it('returns null for an invalid access token', () => {
        const result = jwtHelpers.verifyAccessToken('invalid-token');
        expect(result).toBeNull();
    });

    it('extracts user from request via cookies', async () => {
        const token = jwtHelpers.signAccessToken(payload);
        const mockCookieStore = {
            get: vi.fn().mockReturnValue({ value: token }),
        };
        (cookies as any).mockResolvedValue(mockCookieStore);

        const user = await jwtHelpers.getUserFromRequest();
        expect(user).toMatchObject(payload);
        expect(mockCookieStore.get).toHaveBeenCalledWith('access_token');
    });

    it('returns null if no access token in cookies', async () => {
        const mockCookieStore = {
            get: vi.fn().mockReturnValue(null),
        };
        (cookies as any).mockResolvedValue(mockCookieStore);

        const user = await jwtHelpers.getUserFromRequest();
        expect(user).toBeNull();
    });
});

describe('Auth Helpers (src/lib/auth.ts)', () => {
    it('hashes and compares a password correctly', async () => {
        const password = 'SecretPassword123';
        const hash = await authHelpers.hashPassword(password);

        expect(hash).not.toBe(password);
        expect(hash.length).toBeGreaterThan(20);

        const isMatch = await authHelpers.comparePassword(password, hash);
        expect(isMatch).toBe(true);

        const isWrong = await authHelpers.comparePassword('WrongPassword', hash);
        expect(isWrong).toBe(false);
    });

    it('generates and verifies an admin token', () => {
        const payload = { id: 'admin1', email: 'admin@test.com', role: 'admin' };
        const token = authHelpers.generateToken(payload);
        expect(token).toBeDefined();

        const verified = authHelpers.verifyToken(token);
        expect(verified).toMatchObject(payload);
    });

    it('getAdminFromToken works with admin_token cookie', async () => {
        const payload = { id: 'admin1', email: 'admin@test.com', role: 'admin' };
        const token = authHelpers.generateToken(payload);
        const mockCookieStore = {
            get: vi.fn().mockImplementation((name) => {
                if (name === 'admin_token') return { value: token };
                return null;
            }),
        };
        (cookies as any).mockResolvedValue(mockCookieStore);

        const admin = await authHelpers.getAdminFromToken();
        expect(admin).toMatchObject(payload);
    });

    it('getAdminFromToken falls back to unified access_token if role is admin', async () => {
        const payload = { id: 'admin2', email: 'admin2@test.com', role: 'admin' };
        const token = jwtHelpers.signAccessToken(payload);
        const mockCookieStore = {
            get: vi.fn().mockImplementation((name) => {
                if (name === 'access_token') return { value: token };
                return null;
            }),
        };
        (cookies as any).mockResolvedValue(mockCookieStore);

        const admin = await authHelpers.getAdminFromToken();
        expect(admin).toMatchObject(payload);
    });

    it('isAuthenticated returns true for valid admin token', () => {
        const payload = { id: 'admin1', role: 'admin' };
        const token = authHelpers.generateToken(payload);
        const mockRequest = {
            cookies: {
                get: vi.fn().mockImplementation((name) => {
                    if (name === 'admin_token') return { value: token };
                    return null;
                }),
            },
        } as any;

        expect(authHelpers.isAuthenticated(mockRequest)).toBe(true);
    });
});
