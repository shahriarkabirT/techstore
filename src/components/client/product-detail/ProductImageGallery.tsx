'use client';

import Image from 'next/image';
import WatermarkedImage from '@/components/ui/WatermarkedImage';
import { useState, useCallback, useRef } from 'react';
import ProductImageZoom from '@/components/client/ProductImageZoom';

interface ProductImageGalleryProps {
    images: string[];
    title: string;
    discountValue?: number;
    discountType?: string;
    activeVariantImages?: string[];
    youtubeVideoLink?: string;
    onImageChange?: (img: string) => void;
}

export default function ProductImageGallery({
    images,
    title,
    discountValue = 0,
    discountType,
    activeVariantImages,
    youtubeVideoLink,
    onImageChange,
}: ProductImageGalleryProps) {
    const baseImages = (activeVariantImages && activeVariantImages.length > 0)
        ? activeVariantImages
        : images;

    const galleryItems = baseImages.map(img => ({ type: 'image', url: img }));
    if (youtubeVideoLink) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = youtubeVideoLink.match(regExp);
        const videoId = (match && match[2].length === 11) ? match[2] : null;
        if (videoId) {
            galleryItems.push({ type: 'video', url: `https://www.youtube.com/embed/${videoId}` });
        }
    }

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Drag / swipe state
    const dragStartX = useRef<number | null>(null);
    const isDragging = useRef(false);
    const dragDelta = useRef(0);

    const mainItem = galleryItems?.[currentIndex] || null;

    const handleSelect = useCallback((index: number) => {
        if (index === currentIndex) return;
        setCurrentIndex(index);
        const item = galleryItems[index];
        if (item?.type === 'image') {
            onImageChange?.(item.url);
        }
    }, [currentIndex, galleryItems, onImageChange]);

    const goNext = useCallback(() => {
        if (galleryItems.length <= 1) return;
        const next = (currentIndex + 1) % galleryItems.length;
        handleSelect(next);
    }, [currentIndex, galleryItems, handleSelect]);

    const goPrev = useCallback(() => {
        if (galleryItems.length <= 1) return;
        const prev = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
        handleSelect(prev);
    }, [currentIndex, galleryItems, handleSelect]);

    // ── Mouse drag (desktop) ──────────────────────────────────
    const handleMouseDown = (e: React.MouseEvent) => {
        dragStartX.current = e.clientX;
        isDragging.current = false;
        dragDelta.current = 0;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (dragStartX.current === null) return;
        dragDelta.current = e.clientX - dragStartX.current;
        if (Math.abs(dragDelta.current) > 5) isDragging.current = true;
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (dragStartX.current === null) return;
        const delta = e.clientX - dragStartX.current;
        dragStartX.current = null;
        if (Math.abs(delta) < 5) return; // treat as click, not drag
        if (delta < -40) goNext();
        else if (delta > 40) goPrev();
        // Suppress click-to-zoom after drag
        if (isDragging.current) {
            e.preventDefault();
            e.stopPropagation();
        }
        isDragging.current = false;
    };

    const handleMouseLeave = () => {
        dragStartX.current = null;
        isDragging.current = false;
    };

    // ── Touch swipe (mobile) ──────────────────────────────────
    const touchStartX = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(delta) < 30) return; // not a swipe
        if (delta < 0) goNext();
        else goPrev();
    };

    return (
        <>
            <div className="space-y-3">
                {/* Main Image */}
                <div
                    className="relative aspect-square bg-gray-50 border border-gray-100 rounded overflow-hidden cursor-grab active:cursor-grabbing group select-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onClick={() => {
                        // On desktop, clicking the image opens modal. On mobile, they must use the magnify button to avoid accidental taps while sliding.
                        if (!isDragging.current && window.innerWidth >= 1024) setIsModalOpen(true);
                    }}
                >
                    {/* Sliding image strip */}
                    <div
                        style={{
                            display: 'flex',
                            width: `${galleryItems.length * 100}%`,
                            transform: `translateX(-${currentIndex * (100 / galleryItems.length)}%)`,
                            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            height: '100%',
                        }}
                    >
                        {galleryItems.map((item, i) => (
                            <div
                                key={i}
                                style={{
                                    width: `${100 / galleryItems.length}%`,
                                    flexShrink: 0,
                                    position: 'relative',
                                    height: '100%',
                                }}
                            >
                                {item.type === 'video' ? (
                                    <iframe 
                                        src={item.url} 
                                        title={`${title} video ${i + 1}`} 
                                        className="w-full h-full border-0" 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowFullScreen 
                                    />
                                ) : Math.abs(i - currentIndex) <= 1 ? (
                                    <ProductImageZoom src={item.url} alt={`${title} ${i + 1}`} />
                                ) : (
                                    <WatermarkedImage src={item.url} alt={`${title} ${i + 1}`} className="absolute inset-0 w-full h-full" imageClassName="object-cover" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Fallback when no images */}
                    {!mainItem && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-200">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                        </div>
                    )}

                    {discountValue > 0 && (
                        <div className="absolute top-3 left-3 bg-primary text-white text-[10px] font-black px-2.5 py-1 rounded z-10">
                            {discountType === 'flat' ? `Save ৳${discountValue}` : `${Math.round(discountValue)}% OFF`}
                        </div>
                    )}

                    {/* Magnify Icon Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                        aria-label="Open fullscreen gallery"
                        className="absolute bottom-4 right-4 z-10 w-9 h-9 md:w-10 md:h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-700 shadow-sm border border-gray-100 hover:bg-white hover:text-gray-900 transition-colors cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
                        </svg>
                    </button>

                    {/* Left Arrow */}
                    {galleryItems.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); goPrev(); }}
                            aria-label="Previous image"
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-white/40 backdrop-blur-sm text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white/70 hover:text-gray-800"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                            </svg>
                        </button>
                    )}

                    {/* Right Arrow */}
                    {galleryItems.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); goNext(); }}
                            aria-label="Next image"
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-white/40 backdrop-blur-sm text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white/70 hover:text-gray-800"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>
                    )}

                    {/* Dot indicators */}
                    {galleryItems.length > 1 && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                            {galleryItems.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); handleSelect(i); }}
                                    aria-label={`Image ${i + 1}`}
                                    className={`rounded-full transition-all duration-300 ${
                                        i === currentIndex
                                            ? 'w-4 h-1.5 bg-white'
                                            : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Thumbnails */}
                {galleryItems && galleryItems.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {galleryItems.map((item, i) => (
                            <button
                                key={i}
                                onClick={() => handleSelect(i)}
                                className={`relative w-16 h-16 flex-shrink-0 border-2 rounded overflow-hidden transition-all ${currentIndex === i ? 'border-orange-500' : 'border-gray-200 opacity-60 hover:opacity-100'} ${item.type === 'video' ? 'bg-black' : ''}`}
                            >
                                {item.type === 'video' ? (
                                    <div className="absolute inset-0 flex items-center justify-center text-red-600 bg-gray-100">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                                          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                                        </svg>
                                    </div>
                                ) : (
                                    <WatermarkedImage src={item.url} alt={`${title} ${i + 1}`} className="absolute inset-0 w-full h-full" imageClassName="object-cover" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Fullscreen Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setIsModalOpen(false)}
                >
                    <button
                        className="absolute top-6 right-6 text-white/70 hover:text-white"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div
                        className="relative w-full max-w-2xl aspect-square rounded overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {mainItem?.type === 'video' ? (
                            <iframe 
                                src={mainItem.url} 
                                title={`${title} video modal`} 
                                className="w-full h-full border-0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen 
                            />
                        ) : mainItem ? (
                            <WatermarkedImage src={mainItem.url} alt={title} className="absolute inset-0 w-full h-full" imageClassName="object-contain" />
                        ) : null}
                    </div>
                    {galleryItems.length > 1 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                            {galleryItems.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={e => { e.stopPropagation(); handleSelect(i); }}
                                    className={`w-12 h-12 rounded border-2 overflow-hidden relative transition-all ${currentIndex === i ? 'border-white' : 'border-white/30 opacity-50 hover:opacity-100'}`}
                                >
                                    {item.type === 'video' ? (
                                        <div className="absolute inset-0 flex items-center justify-center text-red-600 bg-gray-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                                            </svg>
                                        </div>
                                    ) : (
                                        <WatermarkedImage src={item.url} alt="" className="absolute inset-0 w-full h-full" imageClassName="object-cover" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
