
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Settings from '@/models/Settings';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import env from '@/lib/env';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    const baseUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!code) {
        return NextResponse.redirect(new URL('/login?error=Google_Auth_Failed', baseUrl));
    }

    try {
        await dbConnect();
        const settings = await Settings.findOne({}, 'googleClientId googleClientSecret');
        const clientId = settings?.googleClientId || env.GOOGLE_CLIENT_ID;
        const clientSecret = settings?.googleClientSecret || env.GOOGLE_CLIENT_SECRET;
        const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

        // 1. Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId!,
                client_secret: clientSecret!,
                redirect_uri: redirectUri!,
                grant_type: 'authorization_code',
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
            console.error('Failed to get access token from Google', tokenData);
            return NextResponse.redirect(new URL('/login?error=Google_Token_Error', baseUrl));
        }

        // 2. Get user info from Google
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        const googleUser = await userResponse.json();

        if (!googleUser.email) {
            return NextResponse.redirect(new URL('/login?error=Google_Email_Missing', baseUrl));
        }

        await dbConnect();

        // 3. Find or Create User
        let user = await User.findOne({ email: googleUser.email });

        if (!user) {
            // Create new user
            user = await User.create({
                name: googleUser.name || 'Google User',
                email: googleUser.email,
                image: googleUser.picture,
                provider: 'google',
                role: 'user',
                isEmailVerified: true, // Google emails are verified
                emailVerified: new Date(),
            });
        } else {
            // Update existing user if needed (e.g. if they didn't have a provider set)
            if (user.provider !== 'google') {
                user.provider = 'google';
                if (!user.image) user.image = googleUser.picture;
                if (!user.isEmailVerified) {
                    user.isEmailVerified = true;
                    user.emailVerified = new Date();
                }
                await user.save();
            }
        }

        // 4. Issue Custom JWTs
        const payload = {
            id: user._id,
            email: user.email,
            role: user.role,
        };

        const accessToken = signAccessToken(payload);
        const refreshToken = signRefreshToken(payload);

        // 5. Set Cookies
        const cookieStore = await cookies();

        cookieStore.set('access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 4 * 60 * 60, // 4 hours
            path: '/',
        });

        cookieStore.set('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/',
        });

        return NextResponse.redirect(new URL('/profile', baseUrl));

    } catch (error) {
        console.error('Google Auth Error:', error);
        return NextResponse.redirect(new URL('/login?error=Server_Error', baseUrl));
    }
}
