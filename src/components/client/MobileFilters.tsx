'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ProductFilters from './ProductFilters';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileFiltersProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MobileFilters({ isOpen, onClose }: MobileFiltersProps) {
    const pathname = usePathname();
    const drawerRef = useRef<HTMLDivElement>(null);

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            return () => document.removeEventListener('keydown', handleEsc);
        }
    }, [isOpen, onClose]);

    if (typeof window === 'undefined') return null;

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
                    isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Drawer */}
            <div
                ref={drawerRef}
                className={`fixed left-0 top-0 bottom-0 z-[9999] w-[76%] max-w-[280px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out lg:hidden ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto">
                    <div className="p-6">
                        <ProductFilters onClose={onClose} />
                    </div>

                    {pathname !== '/products' && (
                        <div className="px-6 py-6 border-t border-gray-100">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Links</h3>
                            <ul className="space-y-3">
                                {[
                                    { label: 'Home', href: '/' },
                                    { label: 'Shop', href: '/products' },
                                    { label: 'Stores', href: '/store-locations' },
                                    { label: 'Track Order', href: '/track/order' },
                                    { label: 'Wishlist', href: '/wishlist' },
                                    { label: 'Contact', href: '/contact' },
                                ].map((link) => (
                                    <li key={link.label}>
                                        <Link href={link.href} onClick={onClose} className="text-sm text-gray-700 font-medium hover:text-primary transition-colors flex items-center justify-between py-1">
                                            <span>{link.label}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-gray-300">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                            </svg>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary-dark transition-all shadow-sm cursor-pointer"
                    >
                        Show Results
                    </button>
                </div>
            </div>
        </>,
        document.body
    );
}
