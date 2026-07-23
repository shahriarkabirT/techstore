'use client';

import { useState } from 'react';
import Link from 'next/link';
import { IProduct } from '@/types';
import ProductCard from './ProductCard';
import { getShowcaseProducts } from '@/actions/showcase';

interface MidProductShowcaseClientProps {
    title: string;
    categorySlug: string;
    sectionId: string;
    initialProducts: IProduct[];
    initialHasMore: boolean;
}

export default function MidProductShowcaseClient({
    title,
    categorySlug,
    sectionId,
    initialProducts,
    initialHasMore
}: MidProductShowcaseClientProps) {
    const [products, setProducts] = useState<IProduct[]>(initialProducts);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [loading, setLoading] = useState(false);

    const loadMore = async () => {
        if (loading || !hasMore) return;
        setLoading(true);
        const nextPage = page + 1;
        const res = await getShowcaseProducts(sectionId, nextPage, 12);
        if (res.success) {
            setProducts(prev => {
                // Ensure no duplicates are added just in case
                const newProducts = res.products.filter(
                    (rp: IProduct) => !prev.some(p => p._id === rp._id)
                );
                return [...prev, ...newProducts];
            });
            setHasMore(res.hasMore);
            setPage(nextPage);
        }
        setLoading(false);
    };

    if (!products || products.length === 0) return null;

    return (
        <div className="w-full">
            <div className="flex items-end justify-between mb-6 md:mb-8">
                <div>
                    <h2 className="text-lg sm:text-2xl md:text-3xl font-bold md:font-black text-gray-900 tracking-tight truncate">{title}</h2>
                    <Link href={`/products?category=${categorySlug}`} className="text-[10px] md:text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest mt-1 md:mt-2 inline-flex items-center gap-1 group">
                        VIEW ALL
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                    </Link>
                </div>
            </div>

            <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6 responsive-grid-rows-2 ${page > 1 ? 'show-all' : ''}`}>
                {products.map((product) => (
                    <div key={product._id} className="h-full">
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>

            {hasMore && (
                <div className="mt-8 md:mt-10 flex justify-center">
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        className={`px-8 py-3 rounded-full text-sm font-semibold border-2 transition-all duration-300 ${
                            loading 
                                ? 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed' 
                                : 'bg-white text-gray-900 border-gray-900 hover:bg-gray-900 hover:text-white'
                        }`}
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Loading...
                            </div>
                        ) : 'Show More'}
                    </button>
                </div>
            )}
        </div>
    );
}
