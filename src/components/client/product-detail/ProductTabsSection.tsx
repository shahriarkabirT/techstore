'use client';

import { useState, useRef, useEffect } from 'react';
import ProductReviewsClient from './ProductReviewsClient';

interface ProductTabsSectionProps {
    product: any;
}

export default function ProductTabsSection({ product }: ProductTabsSectionProps) {
    const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
    const descriptionRef = useRef<HTMLDivElement | null>(null);
    const reviewsRef = useRef<HTMLDivElement | null>(null);

    const tabs = [
        { key: 'description', label: 'Description' },
        { key: 'reviews', label: `Customer Reviews` },
    ] as const;

    const scrollToSection = (tab: 'description' | 'reviews') => {
        setActiveTab(tab);
        const target = tab === 'description' ? descriptionRef.current : reviewsRef.current;
        if (!target) return;

        const navOffset = 120;
        const top = target.getBoundingClientRect().top + window.scrollY - navOffset;
        window.scrollTo({ top, behavior: 'smooth' });
    };

    useEffect(() => {
        const onScroll = () => {
            if (!descriptionRef.current || !reviewsRef.current) return;

            const threshold = 160;
            const reviewsTop = reviewsRef.current.getBoundingClientRect().top;
            setActiveTab(reviewsTop <= threshold ? 'reviews' : 'description');
        };

        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div className="mt-8 border-t border-gray-100">
            {/* Tab Bar */}
            <div className="flex border-b border-gray-200">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => scrollToSection(tab.key)}
                        className={`px-5 py-3.5 text-xs font-black uppercase tracking-widest transition-colors border-b-2 -mb-px cursor-pointer ${
                            activeTab === tab.key
                                ? 'border-orange-500 text-orange-600'
                                : 'border-transparent text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Description Section */}
            <div ref={descriptionRef} className="py-8 max-w-4xl">
                <div
                    className="prose prose-slate max-w-none rich-text-content text-sm"
                    dangerouslySetInnerHTML={{ __html: product.fullDescription || product.shortDescription || '' }}
                />
                {product.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-100">
                        {product.tags.map((tag: string) => (
                            <span key={tag} className="px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold rounded border border-gray-100">#{tag}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* Reviews Section */}
            <div ref={reviewsRef} className="py-8">
                <ProductReviewsClient productId={product._id} />
            </div>
        </div>
    );
}
