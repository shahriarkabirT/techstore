'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BannerData {
    _id: string;
    title: string;
    subtitle?: string;
    image: string;
    link?: string;
    isActive: boolean;
    order: number;
    position: 'primary' | 'secondary' | 'secondary-top' | 'secondary-bottom';
}

interface HeroBannerClientProps {
    banners: BannerData[];
}

export default function HeroBannerClient({ banners }: HeroBannerClientProps) {
    const router = useRouter();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [secondaryTopSlide, setSecondaryTopSlide] = useState(0);
    const [secondaryBottomSlide, setSecondaryBottomSlide] = useState(0);

    // Draggable states
    const [dragStart, setDragStart] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const didDragRef = useRef(false);
    const unpauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const viewportWidthRef = useRef(0);

    const primaryBanners = banners.filter(b => b.position === 'primary');
    const legacySecondaryBanners = banners.filter(b => b.position === 'secondary');
    
    const activeTopBanners = banners.filter(b => b.position === 'secondary-top');
    const activeBottomBanners = banners.filter(b => b.position === 'secondary-bottom');

    const secondaryTopBanners = activeTopBanners.length > 0 
        ? activeTopBanners 
        : legacySecondaryBanners.slice(0, 1);

    const secondaryBottomBanners = activeBottomBanners.length > 0 
        ? activeBottomBanners 
        : legacySecondaryBanners.slice(1);

    // Auto-advance Primary slides (Right-to-Left Sliding)
    useEffect(() => {
        if (primaryBanners.length <= 1 || isDragging || isHovered || isPaused) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % primaryBanners.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [primaryBanners.length, isDragging, isHovered, isPaused]);

    // Drag Handlers
    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        didDragRef.current = false;
        viewportWidthRef.current = window.innerWidth;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        setDragStart(clientX);
    };

    const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const offset = clientX - dragStart;
        setDragOffset(offset);
        if (Math.abs(offset) > 5) {
            didDragRef.current = true;
        }
    };

    const handleDragEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        const threshold = viewportWidthRef.current * 0.15;

        if (dragOffset > threshold) {
            setCurrentSlide(prev => (prev === 0 ? primaryBanners.length - 1 : prev - 1));
        } else if (dragOffset < -threshold) {
            setCurrentSlide(prev => (prev + 1) % primaryBanners.length);
        }
        setDragOffset(0);

        // Pause auto-sliding for 5 seconds after manual drag interaction
        setIsPaused(true);
        if (unpauseTimeoutRef.current) {
            clearTimeout(unpauseTimeoutRef.current);
        }
        unpauseTimeoutRef.current = setTimeout(() => {
            setIsPaused(false);
        }, 5000);
    };

    const handleLinkClick = (e: React.MouseEvent, url?: string) => {
        // Prevent click if we actually dragged
        if (didDragRef.current) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        if (url) {
            router.push(url);
        }
    };

    // Auto-advance Secondary Top slides (Opacity Fading)
    useEffect(() => {
        if (secondaryTopBanners.length <= 1) return;

        const interval = setInterval(() => {
            setSecondaryTopSlide((prev) => (prev + 1) % secondaryTopBanners.length);
        }, 5500); // offset slightly from primary

        return () => clearInterval(interval);
    }, [secondaryTopBanners.length]);

    // Auto-advance Secondary Bottom slides (Opacity Fading)
    useEffect(() => {
        if (secondaryBottomBanners.length <= 1) return;

        const interval = setInterval(() => {
            setSecondaryBottomSlide((prev) => (prev + 1) % secondaryBottomBanners.length);
        }, 6500); // offset slightly from primary

        return () => clearInterval(interval);
    }, [secondaryBottomBanners.length]);

    // Fallback if no banners active
    if (!banners || banners.length === 0) {
        return (
            <div className="container mx-auto px-4 mt-4 lg:mt-6 mb-8 xl:px-0">
                <Link href="/products" className="relative block aspect-video md:aspect-[13/7] w-full bg-gray-900 flex items-center justify-center overflow-hidden rounded-xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent z-10"></div>
                    <div className="relative z-20 px-4 text-white text-center">
                        <h1 className="text-2xl md:text-4xl font-black mb-2 tracking-tight">Luxury Defined</h1>
                        <p className="text-sm md:text-base text-gray-200 mb-6 max-w-lg mx-auto">Discover our curated collection of premium products designed for elegance.</p>
                        <span className="inline-block bg-white text-black px-6 py-2 rounded-md font-bold hover:bg-gray-200 transition-colors text-sm">
                            Shop Now
                        </span>
                    </div>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 mt-4 lg:mt-6 mb-8 xl:px-0">
            <div className="flex flex-col lg:flex-row gap-4 w-full">
                {/* Primary Banners Carousel */}
                <div 
                    className="relative w-full lg:w-[65%] xl:w-[70%] aspect-video md:aspect-[13/7]  overflow-hidden rounded-xl bg-gray-900 shadow-md group select-none"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => { setIsHovered(false); handleDragEnd(); }}
                >
                    {/* Slides Track - Flex row for RTL sliding */}
                    {primaryBanners.length > 0 ? (
                        <div 
                            className={`flex h-full ${!isDragging ? 'transition-transform duration-1000 ease-in-out' : ''}`}
                            style={{ 
                                transform: `translateX(calc(-${currentSlide * 100}% + ${dragOffset}px))`,
                                cursor: isDragging ? 'grabbing' : 'grab'
                            }}
                            onMouseDown={handleDragStart}
                            onMouseMove={handleDragMove}
                            onMouseUp={handleDragEnd}
                            onTouchStart={handleDragStart}
                            onTouchMove={handleDragMove}
                            onTouchEnd={handleDragEnd}
                            onMouseLeave={handleDragEnd}
                        >
                            {primaryBanners.map((banner, index) => {
                                const hasText = banner.title && !banner.title.includes('Primary Banner');
                                const InnerContent = (
                                    <>
                                        {/* Background Image */}
                                        <Image
                                            src={banner.image}
                                            alt={banner.title}
                                            fill
                                            priority={index === 0}
                                            fetchPriority={index === 0 ? 'high' : undefined}
                                            className="object-cover brightness-[0.85] pointer-events-none"
                                            sizes="100vw"
                                            draggable={false}
                                        />
                                        
                                        {/* Content - Only render overlay and text if actual Title is explicitly provided */}
                                        {hasText && (
                                            <div className="absolute inset-0 z-10 flex flex-col justify-center px-6 sm:px-10 md:px-12 lg:px-16 max-w-2xl bg-gradient-to-r from-black/60 to-transparent pointer-events-none">
                                                <div>
                                                    <h2 className="text-xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-white mb-2 sm:mb-4 tracking-tight drop-shadow-md">
                                                        {banner.title}
                                                    </h2>
                                                    {banner.subtitle && (
                                                        <p className="text-xs sm:text-base lg:text-lg text-white/90 mb-6 drop-shadow">
                                                            {banner.subtitle}
                                                        </p>
                                                    )}
                                                    {banner.link && (
                                                        <span className="inline-block bg-white text-black px-4 md:px-6 py-2 md:py-2.5 rounded-md font-bold hover:bg-gray-200 transition-colors text-sm pointer-events-auto shadow-sm">
                                                            Explore
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                );

                                return (
                                    banner.link ? (
                                        <div
                                            key={banner._id}
                                            className="relative w-full h-full shrink-0 block cursor-pointer"
                                            onClick={(e) => handleLinkClick(e, banner.link)}
                                        >
                                            {InnerContent}
                                        </div>
                                    ) : (
                                        <div
                                            key={banner._id}
                                            className="relative w-full h-full shrink-0 block"
                                        >
                                            {InnerContent}
                                        </div>
                                    )
                                );
                            })}
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/10">
                            <p className="text-gray-400">No primary banners</p>
                        </div>
                    )}

                    {/* Bottom Gradient Overlay to ensure indicator visibility */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-900/90 to-transparent pointer-events-none z-10"></div>

                    {/* Indicators */}
                    {primaryBanners.length > 1 && (
                        <div className="absolute bottom-6 right-6 lg:right-10 z-20 flex gap-2">
                            {primaryBanners.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    className={`h-2 rounded-full transition-all duration-500 ${index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Secondary Banners Stack */}
                {(secondaryTopBanners.length > 0 || secondaryBottomBanners.length > 0) && (
                    <div className="relative flex flex-row lg:flex-col lg:w-[35%] xl:w-[30%] gap-3 sm:gap-4 h-[140px] sm:h-[200px] md:h-[260px] lg:h-auto">
                        
                        {/* Top Block: Rotates through all uploaded secondary-top banners */}
                        {secondaryTopBanners.length > 0 ? (
                            <div className="relative flex-1 rounded-xl overflow-hidden shadow-md bg-gray-100 group shrink-0">
                                {secondaryTopBanners.map((banner, index) => (
                                    <Link 
                                        key={banner._id} 
                                        href={banner.link || '#'} 
                                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${secondaryTopSlide === index ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
                                    >
                                        <Image
                                            src={banner.image}
                                            alt={banner.title}
                                            fill
                                            priority={index === 0} 
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent group-hover:from-black/70 transition-all duration-300"></div>
                                        
                                        {banner.title && !banner.title.includes('Banner') && (
                                            <div className="absolute inset-0 p-3 sm:p-5 flex flex-col justify-end">
                                                <h3 className="text-sm sm:text-lg lg:text-xl font-black text-white uppercase tracking-tight leading-tight">
                                                    {banner.title}
                                                </h3>
                                                <div className="mt-1">
                                                    <span className="text-[10px] sm:text-xs font-bold text-white/90 border-b border-white/40 group-hover:border-white transition-all">
                                                        SHOP NOW
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="hidden lg:block flex-1 shrink-0 bg-gray-100 rounded-xl"></div>
                        )}

                        {/* Bottom Block: Rotates through all uploaded secondary-bottom banners */}
                        {secondaryBottomBanners.length > 0 ? (
                            <div className="relative flex-1 rounded-xl overflow-hidden shadow-md bg-gray-100 group shrink-0">
                                {secondaryBottomBanners.map((banner, index) => (
                                    <Link 
                                        key={banner._id} 
                                        href={banner.link || '#'} 
                                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${secondaryBottomSlide === index ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
                                    >
                                        <Image
                                            src={banner.image}
                                            alt={banner.title}
                                            fill
                                            priority={index === 0} 
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent group-hover:from-black/70 transition-all duration-300"></div>
                                        
                                        {banner.title && !banner.title.includes('Banner') && (
                                            <div className="absolute inset-0 p-3 sm:p-5 flex flex-col justify-end">
                                                <h3 className="text-sm sm:text-lg lg:text-xl font-black text-white uppercase tracking-tight leading-tight">
                                                    {banner.title}
                                                </h3>
                                                <div className="mt-1">
                                                    <span className="text-[10px] sm:text-xs font-bold text-white/90 border-b border-white/40 group-hover:border-white transition-all">
                                                        SHOP NOW
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="hidden lg:block flex-1 shrink-0 bg-gray-100 rounded-xl"></div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
