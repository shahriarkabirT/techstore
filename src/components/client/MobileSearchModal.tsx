'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useGetSearchSuggestionsQuery } from '@/redux/features/product/productApi';
import Link from 'next/link';
import { X, Search } from 'lucide-react';

interface MobileSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MobileSearchModal({ isOpen, onClose }: MobileSearchModalProps) {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

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
            onClose();
        }
    };

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        // Use setTimeout to avoid synchronous setState warning and cascading renders
        const timer = setTimeout(() => {
            setMounted(true);
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    if (!mounted) return null;

    return createPortal(
        <div
            className={`fixed inset-0 z-[60] md:hidden ${
                isOpen ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
        >
            {/* Backdrop */}
            <div 
                className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ease-out ${
                    isOpen ? 'opacity-100' : 'opacity-0'
                }`} 
                onClick={onClose} 
            />

            {/* Search Modal Content */}
            <div className={`relative bg-white shadow-2xl flex flex-col max-h-[85vh] transition-transform duration-300 ease-out rounded-b-2xl overflow-hidden ${
                isOpen ? 'translate-y-0' : '-translate-y-full'
            }`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">Search Products</h2>
                <button 
                    onClick={onClose} 
                    className="w-8 h-8 flex items-center justify-center text-rose-500 bg-rose-50 rounded-md transition-colors hover:bg-rose-100" 
                    aria-label="Close Modal"
                >
                    <X className="w-5 h-5" strokeWidth={2.5} />
                </button>
            </div>

            {/* Search Input Bar */}
            <div className="p-4 bg-gray-50/50">
                <form onSubmit={handleSubmit} className="relative flex shadow-sm rounded-md overflow-hidden border border-primary">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search In..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-white py-3 pl-4 pr-12 text-base focus:outline-none"
                    />
                    <button
                        type="submit"
                        className="absolute right-0 top-0 bottom-0 bg-primary px-4 flex items-center justify-center text-white"
                        aria-label="Search"
                    >
                        <Search className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                </form>
            </div>

            {/* Results / Content */}
            <div className="flex-1 overflow-y-auto">
                {query.length >= 2 ? (
                    <div className="py-2">
                        {suggestions.length > 0 ? (
                            suggestions.map((product) => (
                                <Link
                                    key={product._id}
                                    href={`/products/${product.slug}`}
                                    onClick={onClose}
                                    className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                                >
                                    <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                                        {product.images && product.images[0] ? (
                                            <Image src={product.images[0]} alt={product.title} fill sizes="48px" className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-gray-900 line-clamp-1">{product.title}</h4>
                                        <div className="text-xs font-bold text-primary mt-1">
                                            {new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).format(product.price)}
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                <p>No products found for &quot;{query}&quot;</p>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
            </div>
        </div>,
        document.body
    );
}
