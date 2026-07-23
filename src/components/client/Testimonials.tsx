'use client';

import Image from 'next/image';
import { User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useGetPublicTestimonialsQuery } from '@/redux/features/testimonial/testimonialApi';
import { ITestimonial } from '@/types';

function TestimonialAvatar({ t }: { t: ITestimonial }) {
    const src = t.profilePicture?.trim();
    if (src) {
        return (
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-50">
                <Image src={src} alt={t.name} fill className="object-cover" sizes="44px" />
            </div>
        );
    }
    return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-400">
            <User className="h-5 w-5" strokeWidth={1.5} />
        </div>
    );
}

export default function Testimonials() {
    const { data: testimonials = [], isLoading } = useGetPublicTestimonialsQuery();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeftPos, setScrollLeftPos] = useState(0);
    const [dragDistance, setDragDistance] = useState(0);
    const [activeDot, setActiveDot] = useState(0);

    const getSlideWidth = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return 0;
        const firstChild = container.firstElementChild as HTMLElement | null;
        if (!firstChild) return 0;
        const gap = window.innerWidth >= 768 ? 20 : 16;
        return firstChild.offsetWidth + gap;
    }, []);

    // Arrow navigation
    const scroll = (direction: 'left' | 'right') => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const slideWidth = getSlideWidth();
        container.scrollBy({ left: direction === 'right' ? slideWidth : -slideWidth, behavior: 'smooth' });
    };

    // Dot tracker — uses requestAnimationFrame to avoid excessive re-renders while scrolling
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        let rafId: number;
        const updateDot = () => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                const slideWidth = getSlideWidth();
                if (!slideWidth) return;
                const index = Math.round(container.scrollLeft / slideWidth) % testimonials.length;
                setActiveDot(index);
            });
        };
        container.addEventListener('scroll', updateDot, { passive: true });
        return () => {
            container.removeEventListener('scroll', updateDot);
            cancelAnimationFrame(rafId);
        };
    }, [testimonials.length, getSlideWidth]);

    // ── Desktop mouse drag only — never interfere with native touch ────────────
    const handleMouseDown = (e: React.MouseEvent) => {
        const container = scrollContainerRef.current;
        if (!container) return;
        setIsDragging(true);
        setDragDistance(0);
        setStartX(e.pageX - container.offsetLeft);
        setScrollLeftPos(container.scrollLeft);
        // Temporarily disable CSS snap so dragging doesn't jump
        container.style.scrollSnapType = 'none';
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollContainerRef.current) return;
        e.preventDefault();
        const container = scrollContainerRef.current;
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 1.5;
        setDragDistance(Math.abs(walk));
        container.scrollLeft = scrollLeftPos - walk;
    };

    const finalizeDrag = () => {
        if (!isDragging) return;
        setIsDragging(false);
        const container = scrollContainerRef.current;
        if (!container) return;
        // Snap to nearest slide
        const slideWidth = getSlideWidth();
        if (slideWidth) {
            const nearestIndex = Math.round(container.scrollLeft / slideWidth);
            container.scrollTo({ left: nearestIndex * slideWidth, behavior: 'smooth' });
        }
        // Re-enable CSS snap after smooth scroll settles
        setTimeout(() => {
            if (container) container.style.scrollSnapType = 'x mandatory';
        }, 450);
    };

    if (isLoading) {
        return (
            <section className="border-t border-gray-100 bg-white py-10">
                <div className="container mx-auto px-4">
                    <div className="h-48 animate-pulse rounded-lg bg-gray-50" />
                </div>
            </section>
        );
    }

    if (!testimonials.length) return null;

    return (
        <section className="border-t border-gray-100 bg-white py-4 md:py-6">
            <div className="container mx-auto px-4">
                <div className="flex items-end justify-between mb-6 md:mb-8">
                    <h2 className="text-lg sm:text-2xl md:text-3xl font-bold md:font-black text-gray-900 tracking-tight truncate">
                        What Our Customers Say
                    </h2>

                    <div className="flex items-center gap-2 mb-1">
                        <button
                            onClick={() => scroll('left')}
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all focus:outline-none"
                            aria-label="Previous testimonial"
                        >
                            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all focus:outline-none"
                            aria-label="Next testimonial"
                        >
                            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>
                </div>

                <style>{`
                    .testimonial-scroll::-webkit-scrollbar { display: none; }
                    .testimonial-scroll {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                        /* GPU-accelerated smooth momentum on iOS */
                        -webkit-overflow-scrolling: touch;
                    }
                `}</style>

                <div
                    className={`relative w-full pb-4 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onClickCapture={(e) => {
                        // Block click events that were actually drags
                        if (dragDistance > 5) {
                            e.stopPropagation();
                            e.preventDefault();
                        }
                    }}
                    onDragStart={(e) => e.preventDefault()}
                >
                    <div
                        ref={scrollContainerRef}
                        onMouseDown={handleMouseDown}
                        onMouseLeave={finalizeDrag}
                        onMouseUp={finalizeDrag}
                        onMouseMove={handleMouseMove}
                        // ⚠️ No onTouchStart / onTouchEnd — let the browser handle
                        // native touch scrolling. Adding JS here causes the flicker.
                        className="testimonial-scroll flex gap-4 md:gap-5 overflow-x-auto snap-x snap-mandatory"
                        style={{ willChange: 'scroll-position' }}
                    >
                        {testimonials.map((t) => (
                            <div
                                key={t._id}
                                className="flex-none snap-start w-full sm:w-[calc((100%-16px)/2)] md:w-[calc((100%-40px)/3)] h-auto"
                            >
                                <article className="flex flex-col h-full rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                                    <p className="flex-1 text-left text-sm leading-relaxed text-gray-700">{t.quote}</p>
                                    <div className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-4">
                                        <TestimonialAvatar t={t} />
                                        <div className="min-w-0 text-left">
                                            <p className="truncate text-sm font-bold text-gray-900">{t.name}</p>
                                            {t.designation ? (
                                                <p className="truncate text-xs text-gray-500">{t.designation}</p>
                                            ) : null}
                                        </div>
                                    </div>
                                </article>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dot indicators */}
                {testimonials.length > 1 && (
                    <div className="flex items-center justify-center gap-1.5 mt-6">
                        {testimonials.map((_, i) => (
                            <button
                                key={i}
                                aria-label={`Go to testimonial ${i + 1}`}
                                onClick={() => {
                                    const container = scrollContainerRef.current;
                                    if (!container) return;
                                    const slideWidth = getSlideWidth();
                                    container.scrollTo({ left: i * slideWidth, behavior: 'smooth' });
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
        </section>
    );
}
