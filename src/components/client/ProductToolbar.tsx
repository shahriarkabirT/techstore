'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useGetCategoriesQuery } from '@/redux/features/categories/categoryApi';
import MobileFilters from './MobileFilters';

interface ProductToolbarProps {
    total?: number;
}

const SORT_OPTIONS = [
    { value: 'createdAt', label: 'New Arrivals' },
    { value: 'relevance', label: 'Relevance' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'averageRating', label: 'Top Rated' },
];

export default function ProductToolbar({ total }: ProductToolbarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const sortRef = useRef<HTMLDivElement>(null);

    const currentView = searchParams.get('view') || 'grid';
    const sortBy = searchParams.get('sortBy') || 'createdAt';

    const currentSortLabel = SORT_OPTIONS.find(opt => opt.value === sortBy)?.label || 'New Arrivals';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
                setIsSortOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const updateParams = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.set('page', '1');
        router.push(`/products?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-6">
                {/* Mobile Filter Button */}
                <button
                    onClick={() => setIsMobileFiltersOpen(true)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-900 rounded-lg text-xs font-semibold text-white hover:bg-black transition-all shadow-sm active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                    </svg>
                    Filters
                </button>
            </div>

            <div className="flex items-center gap-6">
                {/* Sorting */}
                <div className="relative" ref={sortRef}>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider hidden md:block">Sort by</span>
                        <button
                            onClick={() => setIsSortOpen(!isSortOpen)}
                            className="flex items-center gap-2 text-[13px] font-medium text-gray-900 hover:text-primary transition-colors py-1"
                        >
                            <span>{currentSortLabel}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-3 h-3 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>
                    </div>

                    {isSortOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden z-[110] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                            <div className="p-1.5">
                                {SORT_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            updateParams('sortBy', option.value);
                                            setIsSortOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${sortBy === option.value
                                            ? 'bg-gray-900 text-white shadow-sm'
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
                    <button
                        onClick={() => updateParams('view', 'grid')}
                        className={`p-1.5 rounded-lg transition-all ${currentView === 'grid' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Grid View"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => updateParams('view', 'list')}
                        className={`p-1.5 rounded-lg transition-all ${currentView === 'list' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                        title="List View"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 5.25h16.5m-16.5-10.5h16.5" />
                        </svg>
                    </button>
                </div>
            </div>

            <MobileFilters
                isOpen={isMobileFiltersOpen}
                onClose={() => setIsMobileFiltersOpen(false)}
            />
        </div>
    );
}
