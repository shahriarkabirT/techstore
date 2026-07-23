'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from './ProductCard';
import { useGetProductsQuery } from '@/redux/features/product/productApi';
import { ProductCardSkeleton, ProductCardListSkeleton } from '../shared/Skeletons';

export default function ProductGrid({ initialData }: { initialData?: any }) {
    const searchParams = useSearchParams();
    const router = useRouter();

    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('q') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const sortByParam = searchParams.get('sortBy') || 'createdAt';
    const minPrice = searchParams.get('minPrice') || undefined;
    const maxPrice = searchParams.get('maxPrice') || undefined;
    const inStock = searchParams.get('inStock') === 'true';
    const brand = searchParams.get('brand') || undefined;

    const [sortBy, order] = sortByParam.split('_');
    const sortOrder = order === 'asc' ? 'asc' : 'desc';
    const viewMode = searchParams.get('view') || 'grid';

    const { data: response, isLoading, isFetching } = useGetProductsQuery({
        category,
        search,
        page,
        limit: 60,
        sortBy: sortBy || 'createdAt',
        sortOrder,
        minPrice: minPrice ? parseInt(minPrice) : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
        inStock,
        brand,
    });

    const products = response?.products || initialData?.products || [];
    const pagination = response?.pagination || initialData?.pagination || { total: 0, pages: 1, page: 1 };
    
    // Only show loading skeleton if we don't have a response AND we don't have initial SSR data
    const shouldShowSkeleton = isLoading && !initialData;

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', newPage.toString());
        router.push(`/products?${params.toString()}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (shouldShowSkeleton) {
        return (
            <div className="space-y-8 mt-4  ">
                <div className={`grid gap-3 sm:gap-4 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                    {[...Array(16)].map((_, i) => (
                        viewMode === 'grid' ? <ProductCardSkeleton key={i} /> : <ProductCardListSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="space-y-8">
                <div className="bg-white rounded-xl p-16 text-center border border-gray-100 shadow-sm">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 text-gray-300">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">No results found</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mb-8 text-sm font-normal leading-relaxed">
                        Try adjusting your filters or search terms to discover more of our collection.
                    </p>
                    <button
                        onClick={() => router.push('/products')}
                        className="inline-flex items-center justify-center px-8 py-3 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-black transition-all shadow-sm active:scale-95"
                    >
                        Clear all filters
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-8 ${isFetching ? 'opacity-50 transition-opacity' : ''}`}>
            <div className={`grid gap-3 sm:gap-4 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                {products.map((product) => (
                    <ProductCard key={product._id} product={product} viewMode={viewMode as 'grid' | 'list'} />
                ))}
            </div>

            {/* Compact Pagination */}
            {pagination.pages > 1 && (() => {
                const current = pagination.page;
                const total = pagination.pages;

                // Build smart page range: [1, ..., current-2..current+2, ..., last]
                const pages: (number | 'dots')[] = [];
                const addPage = (n: number) => { if (!pages.includes(n)) pages.push(n); };

                addPage(1);
                if (current > 4) pages.push('dots');
                for (let i = Math.max(2, current - 2); i <= Math.min(total - 1, current + 2); i++) addPage(i);
                if (current < total - 3) pages.push('dots');
                if (total > 1) addPage(total);

                return (
                    <div className="mt-10 border-t border-gray-100 pt-6 flex flex-col items-center gap-3">
                        {/* Info */}
                        <span className="text-[11px] text-gray-400">
                            {(current - 1) * 60 + 1}–{Math.min(current * 60, pagination.total)} of {pagination.total} products
                        </span>

                        {/* Prev + Numbers + Next */}
                        <div className="flex items-center gap-1.5">
                            {/* Prev */}
                            <button
                                disabled={current === 1}
                                onClick={() => handlePageChange(current - 1)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-white transition-all active:scale-95"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                                </svg>
                                <span className="hidden sm:inline">Prev</span>
                            </button>

                            {/* Page Numbers */}
                            {pages.map((item, idx) =>
                                item === 'dots' ? (
                                    <span key={`dots-${idx}`} className="w-7 text-center text-gray-300 text-xs select-none">…</span>
                                ) : (
                                    <button
                                        key={item}
                                        onClick={() => handlePageChange(item)}
                                        className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-xs font-bold transition-all active:scale-90 ${
                                            current === item
                                                ? 'bg-gray-900 text-white shadow-md'
                                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                    >
                                        {item}
                                    </button>
                                )
                            )}

                            {/* Next */}
                            <button
                                disabled={current === total}
                                onClick={() => handlePageChange(current + 1)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-white transition-all active:scale-95"
                            >
                                <span className="hidden sm:inline">Next</span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>

                            {/* Go to page */}
                            <div className="hidden sm:flex items-center gap-1 ml-2 text-[11px] text-gray-400">
                                <span>Go</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={total}
                                    placeholder={String(current)}
                                    className="w-10 h-7 text-center text-xs font-bold border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = Math.min(total, Math.max(1, parseInt((e.target as HTMLInputElement).value) || 1));
                                            handlePageChange(val);
                                            (e.target as HTMLInputElement).value = '';
                                            (e.target as HTMLInputElement).blur();
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
