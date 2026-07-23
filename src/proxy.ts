import { NextRequest, NextResponse } from 'next/server';
import { verifyLegacyAdminToken, verifyAccessToken, verifyRefreshToken } from '@/lib/token-verify';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis only if URLs are provided (to avoid crashing in dev without keys)
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

// Create a new ratelimiter that allows 100 requests per 10 seconds
const ratelimit = redis
    ? new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(100, '10 s'),
        analytics: true,
    })
    : null;

export async function proxy(request: NextRequest): Promise<NextResponse> {
    const { pathname } = request.nextUrl;

    // Rate limiting for API routes
    if (pathname.startsWith('/api')) {
        if (!ratelimit) {
            return NextResponse.next();
        }

        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';
        try {
            const { success, pending, limit, reset, remaining } = await ratelimit.limit(ip);

            if (!success) {
                return NextResponse.json(
                    { success: false, message: 'Too many requests. Please try again later.' },
                    {
                        status: 429,
                        headers: {
                            'X-RateLimit-Limit': limit.toString(),
                            'X-RateLimit-Remaining': remaining.toString(),
                            'X-RateLimit-Reset': reset.toString(),
                        },
                    }
                );
            }

            const res = NextResponse.next();
            res.headers.set('X-RateLimit-Limit', limit.toString());
            res.headers.set('X-RateLimit-Remaining', remaining.toString());
            res.headers.set('X-RateLimit-Reset', reset.toString());
            return res;
        } catch (error) {
            console.error('Rate Limiting Error:', error);
            return NextResponse.next();
        }
    }

    const accessToken = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;
    const adminToken = request.cookies.get('admin_token')?.value;

    // Public routes that should not be accessible when logged in
    const authRoutes = ['/login', '/register'];

    // Protected routes that require authentication
    const protectedRoutes = ['/profile', '/orders'];

    const isAuthRoute = authRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
    const isProtectedRoute = protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

    // Verify refresh token JWT validity (not just cookie existence).
    // A cookie can persist in the browser even after the JWT inside it has expired,
    // so we must decode it to confirm it is still valid before treating the user as logged in.
    const isRefreshTokenValid = refreshToken ? !!verifyRefreshToken(refreshToken) : false;

    if (isRefreshTokenValid) {
        if (isAuthRoute) {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // If refresh token cookie exists but JWT is expired, clear stale cookies and redirect to login
    if (refreshToken && !isRefreshTokenValid) {
        const clearResponse = isProtectedRoute
            ? NextResponse.redirect(new URL('/login', request.url))
            : NextResponse.next();
        clearResponse.cookies.delete('access_token');
        clearResponse.cookies.delete('refresh_token');
        return clearResponse;
    }

    if (!accessToken && !refreshToken) {
        if (isProtectedRoute) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // Protect admin routes
    if (pathname.startsWith('/admin')) {
        let isAdmin = false;

        // Check legacy admin token
        if (adminToken) {
            const decodedAdmin = verifyLegacyAdminToken(adminToken);
            if (decodedAdmin) isAdmin = true;
        }

        // Check unified access token
        if (!isAdmin && accessToken) {
            const decodedUser = verifyAccessToken(accessToken);
            if (decodedUser && (decodedUser.role === 'admin' || decodedUser.role === 'moderator')) {
                isAdmin = true;

                // Strict check for moderators
                if (decodedUser.role === 'moderator') {
                    const permissions = decodedUser.permissions || [];
                    const hasPermission = permissions.some((perm: string) => {
                        const permPath = perm.startsWith('/') ? perm : `/admin/${perm}`;
                        return pathname === permPath || pathname.startsWith(permPath + '/');
                    });

                    console.log(`[Proxy Debug] Moderator access check:
  - Pathname: ${pathname}
  - Permissions: ${JSON.stringify(permissions)}
  - HasPermission: ${hasPermission}`);

                    const isModeratorDashboard = pathname === '/admin/moderator-dashboard';
                    // If moderator doesn't have permission and it's not the base /admin path or their dashboard, deny access
                    if (!hasPermission && pathname !== '/admin' && !isModeratorDashboard) {
                        isAdmin = false;
                    }
                }
            }
        }

        // --- Session Refresh Logic ---
        // Only attempt session refresh if refresh token is still valid
        if (!isAdmin && !accessToken && refreshToken && isRefreshTokenValid) {
            const refreshUrl = new URL('/api/auth/session-refresh', request.url);
            refreshUrl.searchParams.set('redirect_to', pathname);
            return NextResponse.redirect(refreshUrl);
        }
        // ----------------------------------

        if (!isAdmin) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // Redirect /admin to appropriate dashboard/first permitted route
    if (pathname === '/admin') {
        let redirectPath = '/admin/dashboard'; // Default for admins or if no specific moderator route

        if (accessToken) {
            const decodedUser = verifyAccessToken(accessToken);
            if (decodedUser && decodedUser.role === 'moderator') {
                redirectPath = '/admin/moderator-dashboard'; // Auto redirect to moderator dashboard
            }
        }
        return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/profile',
        '/profile/:path*',
        '/checkout',
        '/checkout/:path*',
        '/orders',
        '/orders/:path*',
        '/admin',
        '/admin/:path*',
        '/login',
        '/register',
        '/api/:path*'
    ],
};
