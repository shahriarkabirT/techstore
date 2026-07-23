import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as loginPost } from '@/app/api/auth/login/route';
import { POST as signupPost } from '@/app/api/auth/signup/route';
import User from '@/models/User';
import Settings from '@/models/Settings';
import * as authLib from '@/lib/auth';
import * as jwtLib from '@/lib/jwt';
import * as cookieLib from '@/lib/cookies';
import * as emailLib from '@/lib/email';
import * as smsLib from '@/lib/sms';

// Mock Dependencies
vi.mock('@/lib/db', () => ({ default: vi.fn() }));
vi.mock('@/models/User');
vi.mock('@/models/Settings');
vi.mock('@/lib/auth');
vi.mock('@/lib/jwt');
vi.mock('@/lib/cookies');
vi.mock('@/lib/email');
vi.mock('@/lib/sms');

describe('Auth API Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/auth/login', () => {
        const loginData = { email: 'test@example.com', password: 'password123' };

        it('should login successfully with valid credentials', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                role: 'user',
                password: 'hashedPassword',
                provider: 'local',
                toObject: vi.fn().mockReturnValue({ _id: 'user123', email: 'test@example.com', role: 'user' }),
            };

            (User.findOne as any).mockReturnValue({
                select: vi.fn().mockResolvedValue(mockUser),
            });
            (authLib.comparePassword as any).mockResolvedValue(true);
            (jwtLib.signAccessToken as any).mockReturnValue('access-token');
            (jwtLib.signRefreshToken as any).mockReturnValue('refresh-token');

            const request = new Request('http://localhost/api/auth/login', {
                method: 'POST',
                body: JSON.stringify(loginData),
            });

            const response = await loginPost(request as any);
            const result = await response.json();

            expect(result.success).toBe(true);
            expect(result.message).toBe('Login successful');
            expect(cookieLib.setAuthCookies).toHaveBeenCalledWith('access-token', 'refresh-token');
        });

        it('should return 401 for invalid password', async () => {
            const mockUser = {
                password: 'hashedPassword',
                provider: 'local',
            };

            (User.findOne as any).mockReturnValue({
                select: vi.fn().mockResolvedValue(mockUser),
            });
            (authLib.comparePassword as any).mockResolvedValue(false);

            const request = new Request('http://localhost/api/auth/login', {
                method: 'POST',
                body: JSON.stringify(loginData),
            });

            const response = await loginPost(request as any);
            const result = await response.json();

            expect(response.status).toBe(401);
            expect(result.success).toBe(false);
            expect(result.message).toBe('Invalid credentials');
        });
    });

    describe('POST /api/auth/signup', () => {
        const signupData = {
            name: 'New User',
            email: 'new@example.com',
            password: 'password123',
            phone: '01711111111',
            address: 'Dhaka',
        };

        it('should register a new user and send OTP', async () => {
            (Settings.findOne as any).mockResolvedValue({
                emailOtpEnabled: true,
                smsOtpEnabled: false,
            });
            (User.findOne as any).mockResolvedValue(null);
            (authLib.hashPassword as any).mockResolvedValue('hashedPassword');
            (User.create as any).mockResolvedValue({});
            (emailLib.sendOTPEmail as any).mockResolvedValue({ success: true });

            const request = new Request('http://localhost/api/auth/signup', {
                method: 'POST',
                body: JSON.stringify(signupData),
            });

            const response = await signupPost(request as any);
            const result = await response.json();

            expect(response.status).toBe(201);
            expect(result.success).toBe(true);
            expect(result.requiresVerification).toBe(true);
            expect(emailLib.sendOTPEmail).toHaveBeenCalled();
        });

        it('should return 400 for missing fields', async () => {
            const request = new Request('http://localhost/api/auth/signup', {
                method: 'POST',
                body: JSON.stringify({ name: 'Partial' }),
            });

            const response = await signupPost(request as any);
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.success).toBe(false);
        });
    });
});
