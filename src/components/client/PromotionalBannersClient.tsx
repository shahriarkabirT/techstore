'use client';

import Image from 'next/image';
import Link from 'next/link';

interface PromoBannerData {
    _id: string;
    title: string;
    image: string;
    link?: string;
    isActive: boolean;
    position: 'promotional-left' | 'promotional-right';
}

interface PromotionalBannersClientProps {
    left: PromoBannerData | null;
    right: PromoBannerData | null;
}

function PromoBannerCard({ banner }: { banner: PromoBannerData }) {
    const inner = (
        <div className="relative w-full aspect-video overflow-hidden bg-gray-100 shadow-sm group">
            <Image
                src={banner.image}
                alt={banner.title || 'Promotional Banner'}
                fill
                loading="lazy"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 50vw, 45vw"
            />
            {/* subtle dark overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
        </div>
    );

    if (banner.link) {
        // External URLs open in new tab, internal slugs use Next.js Link
        const isExternal = banner.link.startsWith('http://') || banner.link.startsWith('https://');
        if (isExternal) {
            return (
                <a
                    href={banner.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                    aria-label={banner.title || 'Promotional Banner'}
                >
                    {inner}
                </a>
            );
        }
        return (
            <Link
                href={banner.link}
                className="block w-full"
                aria-label={banner.title || 'Promotional Banner'}
            >
                {inner}
            </Link>
        );
    }

    return <div className="block w-full">{inner}</div>;
}

// Placeholder card — keeps grid layout even if one slot is empty
function PromoBannerPlaceholder() {
    return (
        <div className="relative w-full aspect-video rounded-xl bg-gray-100 overflow-hidden">
            {/* Silent placeholder — invisible but maintains layout */}
        </div>
    );
}

export default function PromotionalBannersClient({ left, right }: PromotionalBannersClientProps) {
    return (
        <section className="container mx-auto px-4 xl:px-0 py-6 md:py-8">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                {left ? (
                    <PromoBannerCard banner={left} />
                ) : (
                    <PromoBannerPlaceholder />
                )}
                {right ? (
                    <PromoBannerCard banner={right} />
                ) : (
                    <PromoBannerPlaceholder />
                )}
            </div>
        </section>
    );
}
