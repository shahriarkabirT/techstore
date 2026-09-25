'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import ProductCard from './ProductCard';
import { useGetProductsQuery } from '@/redux/features/product/productApi';
import { ProductCardSkeleton, ProductCardListSkeleton } from '../shared/Skeletons';

export default function ProductGrid({ initialData }: { initialData?: any }) {
    const searchParams = useSearchParams();
    const router = useRouter();

    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('q') || undefined;
    const sortByParam = searchParams.get('sortBy') || 'createdAt';
    const minPrice = searchParams.get('minPrice') || undefined;
    const maxPrice = searchParams.get('maxPrice') || undefined;
    const inStock = searchParams.get('inStock') === 'true';
    const brand = searchParams.get('brand') || undefined;

    const [sortBy, order] = sortByParam.split('_');
    const sortOrder = order === 'asc' ? 'asc' : 'desc';
    const viewMode = searchParams.get('view') || 'grid';

    // Infinite scrolling state
    const [page, setPage] = useState(1);
    const [accumulatedProducts, setAccumulatedProducts] = useState<any[]>([]);

    // Reset pagination and list when filters change
    const filterKey = `${category}-${search}-${sortByParam}-${minPrice}-${maxPrice}-${inStock}-${brand}`;
    const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
    
    if (filterKey !== prevFilterKey) {
        setPage(1);
        setAccumulatedProducts([]);
        setPrevFilterKey(filterKey);
    }

    const { data: response, isLoading, isFetching } = useGetProductsQuery({
        category,
        search,
        page,
        limit: 20,
        sortBy: sortBy || 'createdAt',
        sortOrder,
        minPrice: minPrice ? parseInt(minPrice) : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
        inStock,
        brand,
    });

    const [prevProducts, setPrevProducts] = useState<any[] | null>(null);

    // Accumulate products as new pages are loaded during render (avoids cascading renders)
    if (response?.products && response.products !== prevProducts) {
        setPrevProducts(response.products);
        setAccumulatedProducts((prev) => {
            if (page === 1) return response.products;
            // Avoid duplicates caused by React StrictMode or concurrent renders
            const newProducts = response.products.filter(
                (newProduct: any) => !prev.some((p) => p._id === newProduct._id)
            );
            return [...prev, ...newProducts];
        });
    }

    // Use initialData on first render before client fetch completes
    const products = (page === 1 && !response) ? (initialData?.products || []) : accumulatedProducts;
    const pagination = response?.pagination || initialData?.pagination || { total: 0, pages: 1, page: 1 };
    
    // Only show full-page skeleton if we don't have a response AND we don't have initial SSR data
    const shouldShowSkeleton = isLoading && page === 1 && !initialData;

    // Intersection Observer for the last element
    const observer = useRef<IntersectionObserver | null>(null);
    const lastProductRef = useCallback((node: HTMLDivElement | null) => {
        if (isFetching || isLoading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && page < pagination.pages) {
                setPage((prevPage) => prevPage + 1);
            }
        });

        if (node) observer.current.observe(node);
    }, [isFetching, isLoading, page, pagination.pages]);

    if (shouldShowSkeleton) {
        return (
            <div className="space-y-8 mt-4">
                <div className={`grid gap-3 sm:gap-4 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                    {[...Array(12)].map((_, i) => (
                        viewMode === 'grid' ? <ProductCardSkeleton key={i} /> : <ProductCardListSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (products.length === 0 && !isFetching) {
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
                        onClick={() => {
                            // Reset filters by navigating to base products URL
                            router.push('/products');
                        }}
                        className="inline-flex items-center justify-center px-8 py-3 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-black transition-all shadow-sm active:scale-95"
                    >
                        Clear all filters
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            <div className={`grid gap-3 sm:gap-4 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                {products.map((product: any, index: number) => {
                    const isLastProduct = index === products.length - 1;
                    return (
                        <div key={product._id} ref={isLastProduct ? lastProductRef : null}>
                            <ProductCard product={product} viewMode={viewMode as 'grid' | 'list'} />
                        </div>
                    );
                })}
            </div>

            {/* Loading Indicator at the bottom */}
            {isFetching && page > 1 && (
                <div className="flex justify-center py-6">
                    <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin"></div>
                </div>
            )}
            
            {/* End of list indicator */}
            {!isFetching && page >= pagination.pages && products.length > 0 && (
                <div className="flex justify-center py-8">
                    <p className="text-sm text-gray-400">You&apos;ve reached the end of the collection.</p>
                </div>
            )}
        </div>
    );
}
