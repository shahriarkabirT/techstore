'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface CategoryBarProps {
    initialCategories?: any[];
}

export default function CategoryBar({ initialCategories = [] }: CategoryBarProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const [hoveredCat, setHoveredCat] = useState<string | null>(null);
    const [hoverPos, setHoverPos] = useState<{ left: number; top: number; width: number } | null>(null);
    const [isSticky, setIsSticky] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    // Sticky: when sentinel scrolls out of view, bar pins to top
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(
            ([entry]) => setIsSticky(!entry.isIntersecting),
            { threshold: 0 }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, []);

    // Scroll arrow visibility
    const updateScrollButtons = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 2);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
    }, []);

    const closeDropdown = useCallback(() => {
        setHoveredCat(null);
        setHoverPos(null);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        // Small delay to allow layout paint
        requestAnimationFrame(updateScrollButtons);
        el.addEventListener('scroll', updateScrollButtons, { passive: true });
        window.addEventListener('resize', updateScrollButtons);
        window.addEventListener('scroll', closeDropdown, { passive: true });
        return () => {
            el.removeEventListener('scroll', updateScrollButtons);
            window.removeEventListener('resize', updateScrollButtons);
            window.removeEventListener('scroll', closeDropdown);
        };
    }, [initialCategories, updateScrollButtons, closeDropdown]);

    const scroll = (dir: 'left' | 'right') => {
        scrollRef.current?.scrollBy({ left: dir === 'right' ? 200 : -200, behavior: 'smooth' });
        closeDropdown();
    };

    const handleMouseEnter = (e: React.MouseEvent, cat: any) => {
        const hasSubs = cat.subCategories?.length > 0;
        if (hasSubs) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setHoverPos({
                left: rect.left,
                top: rect.bottom,
                width: rect.width,
            });
        } else {
            setHoverPos(null);
        }
        setHoveredCat(cat._id);
    };

    if (initialCategories.length === 0) {
        return <div ref={sentinelRef} className="h-0" />;
    }

    const activeHoveredCategory = initialCategories.find(c => c._id === hoveredCat);

    return (
        <>
            {/* Sentinel: when this scrolls out of view, the bar becomes sticky */}
            <div ref={sentinelRef} className="h-0" />
            {isSticky && <div className="h-[50px] 2xl:h-[66px] hidden md:block" />}

            <div
                className={`hidden md:block w-full z-40 transition-all duration-300 ${isSticky
                    ? `fixed top-0 left-0 right-0 shadow-md ${hoveredCat
                        ? 'bg-[#FF5087]'
                        : 'bg-[#FF5087]/95 backdrop-blur-md hover:bg-[#FF5087] hover:backdrop-blur-none'
                    }`
                    : 'relative bg-[#FF5087] shadow-sm'
                    }`}
                onMouseLeave={closeDropdown}
            >
                <div className="container mx-auto relative">
                    <div className="flex items-center h-[50px] 2xl:h-[62px]">

                        {/* Left Arrow */}
                        {canScrollLeft && (
                            <button
                                onClick={() => scroll('left')}
                                className="absolute left-0 z-10 h-[50px] 2xl:h-[62px] w-12 flex items-center justify-start pl-1 cursor-pointer bg-gradient-to-r from-[#FF5087] via-[#FF5087]/95 to-transparent"
                                aria-label="Scroll left"
                            >
                                <div className="w-8 h-8 rounded-full bg-white/10 shadow-md border border-white/20 flex items-center justify-center hover:bg-white/20 hover:scale-105 transition-all duration-200">
                                    <ChevronLeft className="w-4 h-4 text-white" />
                                </div>
                            </button>
                        )}

                        {/* Category Links */}
                        <div
                            ref={scrollRef}
                            className="flex items-center overflow-x-auto h-full w-full gap-1.5 px-2"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            onScroll={closeDropdown}
                        >
                            {initialCategories.map((cat: any) => {
                                const hasSubs = cat.subCategories?.length > 0;
                                const isHovered = hoveredCat === cat._id;

                                return (
                                    <div
                                        key={cat._id}
                                        className="relative flex-shrink-0 h-full flex items-center"
                                        onMouseEnter={(e) => handleMouseEnter(e, cat)}
                                    >
                                        <Link
                                            href={`/products?category=${cat.slug}`}
                                            className={`flex items-center gap-1.5 px-3.5 py-1.5 2xl:px-4 2xl:py-2 text-[13px] 2xl:text-base font-medium whitespace-nowrap transition-all duration-200 rounded-lg ${isHovered
                                                ? 'text-white bg-white/20 shadow-sm'
                                                : 'text-white hover:text-white hover:bg-white/20'
                                                }`}
                                            onClick={closeDropdown}
                                        >
                                            {cat.name}
                                            {hasSubs && (
                                                <ChevronDown className={`w-3.5 h-3.5 2xl:w-4 2xl:h-4 text-white transition-all duration-200 ${isHovered ? 'rotate-180 text-white' : ''}`} />
                                            )}
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Mega Menu Dropdown */}
                        {activeHoveredCategory && activeHoveredCategory.subCategories?.length > 0 && hoverPos && (
                            <div
                                className="fixed left-0 right-0 z-50 pt-0"
                                style={{
                                    top: hoverPos.top
                                }}
                                onMouseLeave={closeDropdown}
                            >
                                {/* Backdrop - Only covers area below the bar to allow hovering other categories */}
                                <div
                                    className="fixed inset-x-0 bottom-0 bg-black/5 z-[-1]"
                                    style={{ top: hoverPos.top }}
                                    onMouseEnter={closeDropdown}
                                    onClick={closeDropdown}
                                />

                                <div className="bg-white shadow-2xl border-t border-gray-100 overflow-y-auto max-h-[calc(100vh-200px)]">
                                    <div className="container mx-auto px-6 py-10">
                                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-12">
                                            {activeHoveredCategory.subCategories.map((sub: any) => (
                                                <div key={sub._id} className="flex flex-col space-y-4">
                                                    <Link
                                                        href={`/products?category=${sub.slug}`}
                                                        className="block text-[14px] 2xl:text-[15px] font-bold text-gray-900 uppercase tracking-wider hover:text-primary hover:bg-gray-50/80 px-3 py-2 -mx-3 rounded-lg transition-all duration-200 border-b border-gray-100 hover:border-primary/10 pb-2"
                                                        onClick={closeDropdown}
                                                    >
                                                        {sub.name}
                                                    </Link>

                                                    {sub.childCategories?.length > 0 ? (
                                                        <div className="flex flex-col space-y-4">
                                                            {sub.childCategories.map((child: any) => (
                                                                <div key={child._id} className="space-y-1.5">
                                                                    <Link
                                                                        href={`/products?category=${child.slug}`}
                                                                        className="group flex items-center justify-between text-[13px] 2xl:text-[14px] font-semibold text-gray-800 hover:text-primary hover:bg-gray-50/80 px-3 py-1.5 -mx-3 rounded-lg transition-all duration-200"
                                                                        onClick={closeDropdown}
                                                                    >
                                                                        <span>{child.name}</span>
                                                                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200" />
                                                                    </Link>

                                                                    {child.subChildCategories?.length > 0 && (
                                                                        <div className="flex flex-col space-y-1 pl-1.5 border-l border-gray-100/80 ml-0.5">
                                                                            {child.subChildCategories.map((sc: any) => (
                                                                                <Link
                                                                                    key={sc._id}
                                                                                    href={`/products?category=${sc.slug}`}
                                                                                    className="block text-[12px] 2xl:text-[13px] text-gray-500 hover:text-primary hover:bg-gray-50/50 px-2.5 py-1 -mx-2 rounded-md transition-all duration-150 font-medium"
                                                                                    onClick={closeDropdown}
                                                                                >
                                                                                    {sc.name}
                                                                                </Link>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-[12px] text-gray-400 italic font-medium px-1">No sub-items</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Bottom Bar */}
                                    <div className="bg-gray-50/80 px-6 py-3 border-t border-gray-100">
                                        <div className="container mx-auto">
                                            <Link
                                                href={`/products?category=${activeHoveredCategory.slug}`}
                                                className="text-[11px] font-black text-primary uppercase tracking-widest hover:underline"
                                                onClick={closeDropdown}
                                            >
                                                View All {activeHoveredCategory.name} →
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Right Arrow */}
                        {canScrollRight && (
                            <button
                                onClick={() => scroll('right')}
                                className="absolute right-0 z-10 h-[50px] 2xl:h-[62px] w-12 flex items-center justify-end pr-1 cursor-pointer bg-gradient-to-l from-[#FF5087] via-[#FF5087]/95 to-transparent"
                                aria-label="Scroll right"
                            >
                                <div className="w-8 h-8 rounded-full bg-white/10 shadow-md border border-white/20 flex items-center justify-center hover:bg-white/20 hover:scale-105 transition-all duration-200">
                                    <ChevronRight className="w-4 h-4 text-white" />
                                </div>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Hide scrollbar */}
            <style jsx global>{`
                div[class*="overflow-x-auto"]::-webkit-scrollbar { display: none; }
            `}</style>
        </>
    );
}
