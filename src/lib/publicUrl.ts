import type { NextRequest } from 'next/server';

const isLocalHost = (host: string) => /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?$/i.test(host);

/**
 * Resolve the public origin (e.g. https://example.com) of the incoming request.
 *
 * Behind Nginx, `request.url` reflects the internal upstream (http://localhost:3012),
 * so building redirects from it sends users to localhost. Prefer the proxy headers,
 * then NEXT_PUBLIC_BASE_URL, and only fall back to request.url as a last resort.
 */
export function getPublicOrigin(request: NextRequest | Request): string {
    const headers = request.headers;
    const forwardedHost = headers.get('x-forwarded-host')?.split(',')[0]?.trim();
    const host = forwardedHost || headers.get('host') || '';
    const forwardedProto = headers.get('x-forwarded-proto')?.split(',')[0]?.trim();

    if (host && !isLocalHost(host)) {
        const proto = forwardedProto || 'https';
        return `${proto}://${host}`;
    }

    const envBase = process.env.NEXT_PUBLIC_BASE_URL;
    if (envBase && !isLocalHost(new URL(envBase).host)) {
        return envBase.replace(/\/$/, '');
    }

    return new URL(request.url).origin;
}

/** Build an absolute URL on the public origin for a path such as '/login'. */
export function publicUrl(path: string, request: NextRequest | Request): URL {
    return new URL(path, getPublicOrigin(request));
}
