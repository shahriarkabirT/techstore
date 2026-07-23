'use client';

import { useEffect } from 'react';
import { useGetPublicSettingsQuery } from '@/redux/features/settings/settingsApi';

export default function DynamicFavicon() {
    const { data } = useGetPublicSettingsQuery();
    const logoUrl = data?.settings?.logoUrl;
    const faviconUrl = data?.settings?.faviconUrl;

    const activeIcon = faviconUrl || logoUrl;

    useEffect(() => {
        if (!activeIcon) return;

        const updateLink = (rel: string, href: string) => {
            // Find ALL existing links with this rel and update them, or create one if none exist
            const existingLinks = document.querySelectorAll(`link[rel="${rel}"]`);

            if (existingLinks.length > 0) {
                existingLinks.forEach(link => {
                    (link as HTMLLinkElement).href = href;
                });
            } else {
                const link = document.createElement('link');
                link.rel = rel;
                link.href = href;
                document.head.appendChild(link);
            }
        };

        // Update all common icon variations
        updateLink('icon', activeIcon);
        updateLink('shortcut icon', activeIcon);
        updateLink('apple-touch-icon', activeIcon);

    }, [activeIcon]);

    return null; // This component doesn't render anything
}
