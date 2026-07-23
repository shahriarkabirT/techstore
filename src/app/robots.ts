import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://bdgirls.xyz';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                // Allow all well-behaved crawlers full access to public content
                userAgent: '*',
                allow: [
                    '/',
                    '/products',
                    '/products/',
                    '/blogs',
                    '/blogs/',
                    '/about',
                    '/contact',
                ],
                disallow: [
                    '/admin',
                    '/admin/',
                    '/api/',
                    '/profile/',
                    '/checkout',
                    '/cart',
                    '/login',
                    '/register',
                    '/_next/',
                    '/uploads/',         // served via /api/files internally
                    '/*?*ref=',          // block referral tracking params
                    '/*?*utm_',          // block UTM query variants
                ],
            },
            {
                // Explicitly throttle GPTBot / AI scrapers — not blocking, just rate-limit
                userAgent: 'GPTBot',
                allow: ['/'],
                disallow: ['/admin/', '/api/', '/profile/', '/checkout'],
            },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
        host: BASE_URL,
    };
}
