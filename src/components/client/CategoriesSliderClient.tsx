'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ICategory } from '@/types';

interface CategoriesSliderClientProps {
    categories: ICategory[];
}

export default function CategoriesSliderClient({ categories }: CategoriesSliderClientProps) {
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

    // ── helpers ──────────────────────────────────────────────────────────────
    const getGap = () => (window.innerWidth >= 640 ? 24 : 16);

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
            setActiveDot(Math.round(container.scrollLeft / itemWidth) % categories.length);
        };
        container.addEventListener('scroll', updateDot, { passive: true });
        return () => container.removeEventListener('scroll', updateDot);
    }, [categories.length]);

    // ── auto-advance ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (categories.length <= 1 || isDragging || isPaused) return;
        const interval = setInterval(() => {
            const container = scrollContainerRef.current;
            if (!container) return;
            const { scrollLeft, scrollWidth, clientWidth } = container;
            if (Math.ceil(scrollLeft + clientWidth) >= scrollWidth - 10) {
                container.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                scroll('right');
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [categories.length, isDragging, isPaused, scroll]);

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
                scheduleUnpause();
                return;
            }
            container.scrollLeft += velocity;
            velocity *= deceleration;
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

    if (!categories || categories.length === 0) return null;

    const extendedCategories = [...categories, ...categories, ...categories];

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-end justify-between mb-8 md:mb-12">
                <div>
                    <Link href="/products" className="text-[10px] font-black text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest flex items-center gap-1.5 mb-2 group">
                        VIEW ALL PRODUCTS
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                    </Link>
                    <h2 className="text-lg sm:text-2xl md:text-3xl font-bold md:font-black text-gray-900 tracking-tight truncate">Shop by Categories</h2>
                </div>

                {/* Navigation Arrows */}
                <div className="flex items-center gap-2 mb-1 lg:mb-0">
                    <button
                        onClick={() => scroll('left')}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all focus:outline-none"
                        aria-label="Previous categories"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all focus:outline-none"
                        aria-label="Next categories"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5 15.75 12l-7.5 7.5" />
                        </svg>
                    </button>
                </div>
            </div>

            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className={`relative w-full group ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}>
                <div
                    ref={scrollContainerRef}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={finalizeDrag}
                    onMouseUp={finalizeDrag}
                    onMouseMove={handleMouseMove}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-4 -mb-4"
                    style={{ touchAction: 'pan-y pinch-zoom', willChange: 'scroll-position' }}
                >
                    {extendedCategories.map((category, index) => (
                        <div
                            key={`${category._id}-${index}`}
                            className="flex-none snap-start w-[calc((100%-32px)/3)] sm:w-[calc((100%-48px)/3)] lg:w-[calc((100%-72px)/4)] xl:w-[calc((100%-96px)/5)]"
                        >
                            <Link
                                draggable={false}
                                href={`/products?category=${category.slug}`}
                                onClickCapture={(e) => {
                                    if (dragDistance.current > 5) {
                                        e.stopPropagation();
                                        e.preventDefault();
                                    }
                                }}
                                className={`group/card relative block aspect-[4/3] bg-gray-50 rounded-lg overflow-hidden border border-gray-100 transition-all duration-500 shadow-gray-100 h-full ${!isDragging && 'hover:border-gray-200 hover:shadow-xl'}`}
                            >
                                <Image
                                    draggable={false}
                                    src={category.bannerImage}
                                    alt={category.name}
                                    fill
                                    className="object-cover group-hover/card:scale-105 transition-transform duration-500 pointer-events-none"
                                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 33vw, 25vw"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent opacity-60 group-hover/card:opacity-80 transition-opacity duration-500" />
                                <div className="absolute bottom-2 left-2 md:bottom-6 md:left-6 z-10 w-[95%] sm:w-[85%]">
                                    <h3 className="text-xs sm:text-sm md:text-lg 2xl:text-2xl font-black text-white group-hover/card:text-white transition-colors duration-500 leading-tight md:leading-normal line-clamp-2">{category.name}</h3>
                                    <p className="hidden sm:block text-[8px] md:text-[10px] 2xl:text-sm font-bold text-gray-200 group-hover/card:text-white uppercase tracking-widest transform translate-y-2 md:translate-y-4 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-500 mt-1">Explore</p>
                                </div>
                                <div className="absolute top-2 right-2 md:top-6 md:right-6 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center transform -translate-y-12 group-hover/card:translate-y-0 transition-transform duration-500 delay-100 shadow-lg border border-white/30 hidden sm:flex">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dot indicators */}
            {categories.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-6">
                    {categories.map((_, i) => (
                        <button
                            key={i}
                            aria-label={`Go to category ${i + 1}`}
                            onClick={() => {
                                const container = scrollContainerRef.current;
                                if (!container) return;
                                const firstChild = container.firstElementChild as HTMLElement | null;
                                if (!firstChild) return;
                                const itemWidth = firstChild.offsetWidth + getGap();
                                container.scrollTo({ left: i * itemWidth, behavior: 'smooth' });
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
