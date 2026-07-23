'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { IProduct } from '@/types';
import ProductCard from './ProductCard';

interface ProductsSliderClientProps {
    title: string;
    categorySlug?: string;
    viewAllLink?: string;
    products: IProduct[];
}

export default function ProductsSliderClient({ title, categorySlug, viewAllLink, products }: ProductsSliderClientProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const snapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const unpauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rafRef = useRef<number | null>(null);

    // ── touch momentum state (all in refs to avoid re-renders during touch) ──
    const touchStartX = useRef(0);
    const touchLastX = useRef(0);
    const touchLastTime = useRef(0);
    const touchVelocity = useRef(0);  // px / ms

    // ── desktop drag state ──
    const [isDragging, setIsDragging] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const dragStartX = useRef(0);
    const dragScrollStart = useRef(0);
    const dragDistance = useRef(0);
    const [activeDot, setActiveDot] = useState(0);
    const [visibleItems, setVisibleItems] = useState(5);

    // Calculate visible items based on screen width
    useEffect(() => {
        const updateVisible = () => {
            if (window.innerWidth >= 1536) setVisibleItems(6);
            else if (window.innerWidth >= 1024) setVisibleItems(5);
            else if (window.innerWidth >= 768) setVisibleItems(4);
            else if (window.innerWidth >= 640) setVisibleItems(3);
            else setVisibleItems(2);
        };
        updateVisible();
        window.addEventListener('resize', updateVisible);
        return () => window.removeEventListener('resize', updateVisible);
    }, []);

    // ── helpers ──────────────────────────────────────────────────────────────
    const getGap = () => (window.innerWidth >= 640 ? 16 : 12);
    const cancelMomentum = () => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    };

    const snapToNearest = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const firstChild = container.firstElementChild as HTMLElement | null;
        if (!firstChild) return;
        const itemWidth = firstChild.offsetWidth + getGap();
        const nearestIndex = Math.round(container.scrollLeft / itemWidth);
        container.scrollTo({ left: nearestIndex * itemWidth, behavior: 'smooth' });
    }, []);

    const scheduleUnpause = useCallback(() => {
        if (unpauseTimeoutRef.current) clearTimeout(unpauseTimeoutRef.current);
        unpauseTimeoutRef.current = setTimeout(() => setIsPaused(false), 5000);
    }, []);

    const scroll = useCallback((direction: 'left' | 'right') => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const firstChild = container.firstElementChild as HTMLElement | null;
        if (!firstChild) return;
        const scrollAmount = firstChild.offsetWidth + getGap();
        container.scrollBy({ left: direction === 'right' ? scrollAmount : -scrollAmount, behavior: 'smooth' });
    }, []);

    // ── dot tracker ───────────────────────────────────────────────────────────
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const updateDot = () => {
            const firstChild = container.firstElementChild as HTMLElement | null;
            if (!firstChild) return;
            const itemWidth = firstChild.offsetWidth + getGap();
            const scrollPos = container.scrollLeft;
            const currentIndex = Math.round(scrollPos / itemWidth);
            setActiveDot(Math.floor(currentIndex / visibleItems));
        };
        container.addEventListener('scroll', updateDot, { passive: true });
        return () => container.removeEventListener('scroll', updateDot);
    }, [visibleItems]);

    // ── auto-advance ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!products || products.length <= 1 || isDragging || isPaused) return;
        const interval = setInterval(() => {
            const container = scrollContainerRef.current;
            if (!container) return;
            const { scrollLeft, scrollWidth, clientWidth } = container;
            if (Math.ceil(scrollLeft + clientWidth) >= scrollWidth - 10) {
                container.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                scroll('right');
            }
        }, 3500);
        return () => clearInterval(interval);
    }, [products, isDragging, isPaused, scroll]);

    // ── TOUCH handlers (momentum / inertia) ──────────────────────────────────
    const handleTouchStart = (e: React.TouchEvent) => {
        cancelMomentum();
        setIsPaused(true);
        if (unpauseTimeoutRef.current) clearTimeout(unpauseTimeoutRef.current);

        // Disable snap so the finger tracks the content exactly
        if (scrollContainerRef.current) {
            scrollContainerRef.current.style.scrollSnapType = 'none';
        }

        const touch = e.touches[0];
        touchStartX.current = touch.clientX;
        touchLastX.current = touch.clientX;
        touchLastTime.current = performance.now();
        touchVelocity.current = 0;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const touch = e.touches[0];
        const now = performance.now();
        const dx = touchLastX.current - touch.clientX;           // positive = scrolling right
        const dt = now - touchLastTime.current;

        // Rolling velocity (px/ms) — smoothed with a weighted average
        if (dt > 0) {
            const instantV = dx / dt;
            touchVelocity.current = touchVelocity.current * 0.6 + instantV * 0.4;
        }

        container.scrollLeft += dx;

        touchLastX.current = touch.clientX;
        touchLastTime.current = now;
    };

    const handleTouchEnd = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        // Kick off momentum animation
        let velocity = touchVelocity.current * 16; // scale to per-frame (≈16ms)
        const deceleration = 0.92;                  // friction coefficient (0.85–0.95)
        const minVelocity = 0.5;                    // px — stop threshold

        const momentumStep = () => {
            if (!container || Math.abs(velocity) < minVelocity) {
                // Finished — snap to nearest item
                snapToNearest();
                if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
                snapTimeoutRef.current = setTimeout(() => {
                    if (container) container.style.scrollSnapType = 'x mandatory';
                }, 400);
                scheduleUnpause();
                return;
            }

            container.scrollLeft += velocity;
            velocity *= deceleration;

            // Bounce at edges
            const { scrollLeft, scrollWidth, clientWidth } = container;
            if (scrollLeft <= 0 || scrollLeft + clientWidth >= scrollWidth) {
                snapToNearest();
                scheduleUnpause();
                return;
            }

            rafRef.current = requestAnimationFrame(momentumStep);
        };

        rafRef.current = requestAnimationFrame(momentumStep);
    };

    // ── DESKTOP mouse-drag handlers ───────────────────────────────────────────
    const handleMouseDown = (e: React.MouseEvent) => {
        const container = scrollContainerRef.current;
        if (!container) return;
        cancelMomentum();
        setIsPaused(true);
        if (unpauseTimeoutRef.current) clearTimeout(unpauseTimeoutRef.current);
        if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);

        setIsDragging(true);
        dragDistance.current = 0;
        dragStartX.current = e.pageX - container.offsetLeft;
        dragScrollStart.current = container.scrollLeft;
        container.style.scrollSnapType = 'none';
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - dragStartX.current) * 1.5;
        dragDistance.current = Math.abs(walk);
        scrollContainerRef.current.scrollLeft = dragScrollStart.current - walk;
    };

    const finalizeDrag = () => {
        if (!isDragging) return;
        setIsDragging(false);
        snapToNearest();
        if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
        snapTimeoutRef.current = setTimeout(() => {
            if (scrollContainerRef.current) {
                scrollContainerRef.current.style.scrollSnapType = 'x mandatory';
            }
        }, 400);
        scheduleUnpause();
    };

    // ── cleanup ───────────────────────────────────────────────────────────────
    useEffect(() => () => {
        cancelMomentum();
        if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
        if (unpauseTimeoutRef.current) clearTimeout(unpauseTimeoutRef.current);
    }, []);

    if (!products || products.length === 0) return null;

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-end justify-between mb-6 md:mb-8">
                <div>
                    <h2 className="text-lg sm:text-2xl md:text-3xl font-bold md:font-black text-gray-900 tracking-tight truncate">{title}</h2>
                    <Link
                        href={viewAllLink || (categorySlug ? `/products?category=${categorySlug}` : '/products')}
                        className="text-[10px] md:text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest mt-1 md:mt-2 inline-flex items-center gap-1 group"
                    >
                        VIEW ALL
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                    </Link>
                </div>

                {/* Navigation Arrows */}
                <div className="flex items-center gap-2 mb-1">
                    <button
                        onClick={() => scroll('left')}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all focus:outline-none"
                        aria-label="Previous products"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all focus:outline-none"
                        aria-label="Next products"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5 15.75 12l-7.5 7.5" />
                        </svg>
                    </button>
                </div>
            </div>

            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            <div
                className={`relative w-full group ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} pb-4`}
                onClickCapture={(e) => {
                    if (dragDistance.current > 5) {
                        e.stopPropagation();
                        e.preventDefault();
                    }
                }}
                onDragStart={(e) => e.preventDefault()}
            >
                <div
                    ref={scrollContainerRef}
                    /* Desktop drag */
                    onMouseDown={handleMouseDown}
                    onMouseLeave={finalizeDrag}
                    onMouseUp={finalizeDrag}
                    onMouseMove={handleMouseMove}
                    /* Touch / mobile */
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar"
                    /* Let touch events drive our custom scroll — do NOT use touch-action:pan rules */
                    style={{ touchAction: 'pan-y pinch-zoom', willChange: 'scroll-position' }}
                >
                    {products.map((product) => (
                        <div
                            key={product._id}
                            className="flex-none snap-start w-[calc((100%-12px)/2)] sm:w-[calc((100%-32px)/3)] md:w-[calc((100%-48px)/4)] lg:w-[calc((100%-64px)/5)] 2xl:w-[calc((100%-80px)/6)]"
                        >
                            <div className="h-full">
                                <ProductCard product={product} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dot indicators */}
            {products.length > 0 && (
                <div className="flex items-center justify-center gap-1.5 mt-6">
                    {Array.from({ length: Math.max(2, Math.ceil(products.length / visibleItems)) }).map((_, i) => (
                        <button
                            key={i}
                            aria-label={`Go to page ${i + 1}`}
                            onClick={() => {
                                const container = scrollContainerRef.current;
                                if (!container) return;
                                const firstChild = container.firstElementChild as HTMLElement | null;
                                if (!firstChild) return;
                                const itemWidth = firstChild.offsetWidth + getGap();
                                const targetIndex = i * visibleItems;
                                container.scrollTo({ left: targetIndex * itemWidth, behavior: 'smooth' });
                            }}
                            className={`rounded-full transition-all duration-300 ${
                                activeDot === i
                                    ? 'w-5 h-2 bg-gray-900'
                                    : 'w-2 h-2 bg-gray-300 hover:bg-gray-500'
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
