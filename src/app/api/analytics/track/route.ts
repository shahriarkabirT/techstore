import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Visit from '@/models/Visit';
import geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    try {
        await dbConnect();

        const body = await req.json();
        const { path } = body;

        // Skip tracking for admin and api routes
        if (path?.startsWith('/admin') || path?.startsWith('/api')) {
            return NextResponse.json({ success: true, ignored: true });
        }

        // Get IP from headers (works for most proxies/CDNs like Vercel, Cloudflare, Nginx)
        const forwardedFor = req.headers.get('x-forwarded-for');
        const realIp = req.headers.get('x-real-ip');
        let ip = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || '127.0.0.1');
        
        // Handling IPv6 localhost
        if (ip === '::1') ip = '127.0.0.1';

        // Get User Agent
        const userAgent = req.headers.get('user-agent') || '';
        
        // Ignore bots
        const isBot = /bot|googlebot|crawler|spider|robot|crawling/i.test(userAgent);
        if (isBot) {
            return NextResponse.json({ success: true, ignored: true, reason: 'bot' });
        }

        const parser = new UAParser(userAgent);
        const device = parser.getDevice();
        const browser = parser.getBrowser();
        const os = parser.getOS();

        const deviceType = device.type || (userAgent.includes('Mobile') ? 'mobile' : 'desktop');

        // Geolocation
        const geo = geoip.lookup(ip);
        const country = geo?.country || 'Unknown';
        const city = geo?.city || 'Unknown';

        // Session ID via cookies to track unique visitors across pages
        const cookieStore = await cookies();
        let sessionId = cookieStore.get('analytics_session_id')?.value;
        
        // Note: setting cookies in a POST route might not persist if the route is cached or 
        // if we are using an edge runtime in a specific way, but standard Next.js handles it.
        // Actually, returning it in the response to let the client set it is safer, but we can try setting it.
        
        let needsNewCookie = false;
        if (!sessionId) {
            sessionId = uuidv4();
            needsNewCookie = true;
        }

        const newVisit = await Visit.create({
            ip,
            userAgent,
            path: path || '/',
            country,
            city,
            deviceType,
            browser: browser.name || 'Unknown',
            os: os.name || 'Unknown',
            sessionId
        });

        const response = NextResponse.json({ success: true, id: newVisit._id });
        
        if (needsNewCookie) {
            // Set cookie for 30 minutes (session)
            response.cookies.set('analytics_session_id', sessionId, {
                maxAge: 30 * 60, 
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            });
        }

        return response;

    } catch (error) {
        console.error('Analytics tracking error:', error);
        return NextResponse.json({ success: false, error: 'Failed to track visit' }, { status: 500 });
    }
}
