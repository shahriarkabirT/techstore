'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useGetSearchSuggestionsQuery } from '@/redux/features/product/productApi';

interface SearchBarProps {
    className?: string;
    inputClassName?: string;
    autoFocus?: boolean;
    onSearchSubmit?: () => void;
    placeholder?: string;
}

export default function SearchBar({
    className = "",
    inputClassName = "",
    autoFocus = false,
    onSearchSubmit,
    placeholder = "Search luxury products..."
}: SearchBarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Debounce query for API
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const { data: suggestions = [] } = useGetSearchSuggestionsQuery(debouncedQuery, {
        skip: debouncedQuery.length < 2
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/products?q=${encodeURIComponent(query.trim())}`);
            if (onSearchSubmit) onSearchSubmit();
            setIsFocused(false);
        }
    };

    return (
        <div className={`relative ${className}`}>
            <form onSubmit={handleSubmit} className="relative">
                <input
                    autoFocus={autoFocus}
                    type="text"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Delay to allow click
                    className={`w-full bg-white border border-gray-400 shadow-xs rounded-md py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-primary/30 transition-all ${inputClassName}`}
                />
                <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                    aria-label="Search"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                </button>
            </form>

            {/* Suggestions Dropdown */}
            {isFocused && query.length >= 2 && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-[60vh] overflow-y-auto py-2">
                        <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Suggestions</div>
                        {suggestions.map((product) => (
                            <Link
                                key={product._id}
                                href={`/products/${product.slug}`}
                                onClick={() => {
                                    setIsFocused(false);
                                    if (onSearchSubmit) onSearchSubmit();
                                }}
                                className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors group"
                            >
                                <div className="relative w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                                    {product.images && product.images[0] ? (
                                        <Image
                                            src={product.images[0]}
                                            alt={product.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-primary transition-colors">{product.title}</h4>
                                    <div className="text-xs text-gray-500 font-bold">
                                        {new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).format(product.price)}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                    <div className="bg-gray-50 px-4 py-2 border-t border-gray-100 text-center">
                        <button
                            onClick={(e) => handleSubmit(e as any)}
                            className="text-xs font-bold text-primary hover:underline"
                        >
                            View all results for &quot;{query}&quot;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
