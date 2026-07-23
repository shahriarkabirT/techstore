'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Brand {
    _id: string;
    name: string;
    slug: string;
    logo: string;
}

interface BrandsGridClientProps {
    brands: Brand[];
}

export default function BrandsGridClient({ brands }: BrandsGridClientProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const snapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const unpauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rafRef = useRef<number | null>(null);

    // ── touch momentum state ──
    const touchLastX = useRef(0);
    const touchLastTime = useRef(0);
    const touchVelocity = useRef(0);

    // ── desktop drag state ──
    const [isDragging, setIsDragging] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const dragStartX = useRef(0);
    const dragScrollStart = useRef(0);
    const dragDistance = useRef(0);
    const [activeDot, setActiveDot] = useState(0);
    const [visibleItems, setVisibleItems] = useState(6);

    // Calculate visible items based on screen width
    useEffect(() => {
        const updateVisible = () => {
            if (window.innerWidth >= 1024) setVisibleItems(6);
            else if (window.innerWidth >= 768) setVisibleItems(5);
            else if (window.innerWidth >= 640) setVisibleItems(4);
            else setVisibleItems(3);
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
        unpauseTimeoutRef.current = setTimeout(() => setIsPaused(false), 3000);
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
            // Map current index to page index
            setActiveDot(Math.floor(currentIndex / visibleItems));
        };
        container.addEventListener('scroll', updateDot, { passive: true });
        return () => container.removeEventListener('scroll', updateDot);
    }, [visibleItems]);

    // ── auto-advance ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!brands || brands.length <= 1 || isDragging || isPaused) return;
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
    }, [brands, isDragging, isPaused, scroll]);

    // ── TOUCH handlers (momentum / inertia) ──────────────────────────────────
    const handleTouchStart = (e: React.TouchEvent) => {
        cancelMomentum();
        setIsPaused(true);
        if (unpauseTimeoutRef.current) clearTimeout(unpauseTimeoutRef.current);

        if (scrollContainerRef.current) {
            scrollContainerRef.current.style.scrollSnapType = 'none';
        }
        const touch = e.touches[0];
        touchLastX.current = touch.clientX;
        touchLastTime.current = performance.now();
        touchVelocity.current = 0;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const touch = e.touches[0];
        const now = performance.now();
        const dx = touchLastX.current - touch.clientX;
        const dt = now - touchLastTime.current;
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
        let velocity = touchVelocity.current * 16;
        const deceleration = 0.92;
        const minVelocity = 0.5;

        const momentumStep = () => {
            if (!container || Math.abs(velocity) < minVelocity) {
                snapToNearest();
                if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
                snapTimeoutRef.current = setTimeout(() => {
                    if (container) container.style.scrollSnapType = 'x mandatory';
                }, 400);
                return;
            }
            container.scrollLeft += velocity;
            velocity *= deceleration;
            const { scrollLeft, scrollWidth, clientWidth } = container;
            if (scrollLeft <= 0 || scrollLeft + clientWidth >= scrollWidth) {
                snapToNearest();
                return;
            }
            rafRef.current = requestAnimationFrame(momentumStep);
        };
        rafRef.current = requestAnimationFrame(momentumStep);
        scheduleUnpause();
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

    if (!brands || brands.length === 0) return null;

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-end justify-between mb-6 md:mb-8">
                <div>
                    <Link href="/products" className="text-[10px] font-black text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest flex items-center gap-1.5 mb-2 group">
                        BROWSE BY BRAND
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                    </Link>
                    <h2 className="text-lg sm:text-2xl md:text-3xl font-bold md:font-black text-gray-900 tracking-tight truncate">Shop by Brands</h2>
                </div>

                <div className="flex items-center gap-2 mb-1 lg:mb-0">
                    <button
                        onClick={() => scroll('left')}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all focus:outline-none cursor-pointer"
                        aria-label="Previous brands"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all focus:outline-none cursor-pointer"
                        aria-label="Next brands"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5 15.75 12l-7.5 7.5" />
                        </svg>
                    </button>
                </div>
            </div>

            <style>{`
                .hide-scrollbar-brands::-webkit-scrollbar { display: none; }
                .hide-scrollbar-brands { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className={`relative w-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}>
                <div
                    ref={scrollContainerRef}
                    onMouseDown={handleMouseDown}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => {
                        finalizeDrag();
                        scheduleUnpause();
                    }}
                    onMouseUp={finalizeDrag}
                    onMouseMove={handleMouseMove}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar-brands pb-2 -mb-2"
                    style={{ touchAction: 'pan-y pinch-zoom', willChange: 'scroll-position' }}
                >
                    {brands.map((brand, index) => (
                        <div
                            key={`${brand._id}-${index}`}
                            className="flex-none snap-start w-[calc((100%-36px)/3)] sm:w-[calc((100%-48px)/4)] md:w-[calc((100%-60px)/5)] lg:w-[calc((100%-80px)/6)]"
                        >
                            <Link
                                draggable={false}
                                href={`/products?brand=${brand._id}`}
                                onClickCapture={(e) => {
                                    if (dragDistance.current > 5) {
                                        e.stopPropagation();
                                        e.preventDefault();
                                    }
                                }}
                                className={`group/card relative block aspect-[2/1] bg-white rounded-lg border border-gray-100 overflow-visible transition-all duration-300 ${!isDragging && 'hover:border-gray-300 hover:shadow-md'}`}
                            >
                                <div className="flex items-center justify-center h-full p-4 sm:p-5 md:p-6 overflow-hidden rounded-lg">
                                    <div className="relative w-full h-full">
                                        <Image
                                            draggable={false}
                                            src={brand.logo}
                                            alt={brand.name}
                                            fill
                                            className="object-contain pointer-events-none group-hover/card:scale-110 transition-transform duration-300"
                                            sizes="160px"
                                        />
                                    </div>
                                </div>
                                {/* Badge */}
                                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-gray-900/80 backdrop-blur-sm text-white text-[10px] font-semibold rounded-full whitespace-nowrap opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                    {brand.name}
                                </span>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dot indicators */}
            {brands.length > 0 && (
                <div className="flex items-center justify-center gap-1.5 mt-6">
                    {Array.from({ length: Math.max(2, Math.ceil(brands.length / visibleItems)) }).map((_, i) => (
                        <button
                            key={i}
                            aria-label={`Go to page ${i + 1}`}
                            onClick={() => {
                                const container = scrollContainerRef.current;
                                if (!container) return;
                                const firstChild = container.firstElementChild as HTMLElement | null;
                                if (!firstChild) return;
                                const itemWidth = firstChild.offsetWidth + getGap();
                                // Scroll to the start of the page
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
