'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const lastTrackedPath = useRef<string>('');

    useEffect(() => {
        if (!pathname) return;

        // Construct full URL path
        let url = pathname;
        if (searchParams && searchParams.toString()) {
            url = `${pathname}?${searchParams.toString()}`;
        }

        // Avoid duplicate tracking of the same path in strict mode
        if (lastTrackedPath.current === url) return;
        lastTrackedPath.current = url;

        // Skip admin paths
        if (url.startsWith('/admin')) return;

        const trackVisit = async () => {
            try {
                await fetch('/api/analytics/track', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ path: url }),
                });
            } catch (error) {
                console.error('Analytics tracking failed', error);
            }
        };

        trackVisit();
    }, [pathname, searchParams]);

    return null; // Component does not render anything
}
