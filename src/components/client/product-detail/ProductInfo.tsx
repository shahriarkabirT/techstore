'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import SocialShare from '../SocialShare';

interface ProductInfoProps {
    product: any;
    discountedPrice: number;
    currentMrp: number;
    currentDiscountValue: number;
    currentDiscountType: string;
    currentStock: number;
    availableToBuy: number;
    quantity: number;
    onQuantityChange: (q: number) => void;
    onAddToCart: () => void;
    onBuyNow: () => void;
    showAddedToCart: boolean;
    selectionError: { type: string; source: 'cart' | 'buy' } | null;
    inWishlist: boolean;
    onWishlistToggle: () => void;
    whatsappNumber?: string;
    contactPhone?: string;
    // Variant slots rendered by parent
    variantSlot?: React.ReactNode;
}

export default function ProductInfo({
    product,
    discountedPrice,
    currentMrp,
    currentDiscountValue,
    currentDiscountType,
    currentStock,
    availableToBuy,
    quantity,
    onQuantityChange,
    onAddToCart,
    onBuyNow,
    showAddedToCart,
    selectionError,
    inWishlist,
    onWishlistToggle,
    whatsappNumber,
    contactPhone,
    variantSlot,
}: ProductInfoProps) {
    const savedAmount = currentMrp - discountedPrice;
    const savedPercent = currentDiscountValue;

    const handleWhatsApp = () => {
        const num = (whatsappNumber || '').replace(/\D/g, '');
        const msg = encodeURIComponent(`Hi, I want to order: ${product.title} — ${formatCurrency(discountedPrice)}\n${window.location.href}`);
        window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
    };

    const handleCall = () => {
        const num = (contactPhone || '').replace(/\s/g, '');
        window.location.href = `tel:${num}`;
    };

    return (
        <div className="space-y-2 lg:space-y-3 xl:space-y-4">
            {/* Bell animation keyframe — injected inline to bypass Tailwind v4 purging */}
            <style>{`
                @keyframes bellRing {
                    0%, 100% { transform: rotate(0deg) scale(1); }
                    15% { transform: rotate(2deg) scale(1.01); }
                    30% { transform: rotate(-2deg) scale(1.01); }
                    45% { transform: rotate(1.5deg) scale(1.01); }
                    60% { transform: rotate(-1.5deg) scale(1.01); }
                    75% { transform: rotate(0.5deg) scale(1); }
                }
            `}</style>
            {/* Title */}
            <h1 className="text-base lg:text-xl xl:text-2xl font-bold text-gray-900 leading-tight">
                {product.title}
            </h1>

            {/* Price */}
            <div className="flex items-center gap-2 lg:gap-3 flex-wrap">
                <span className="text-lg lg:text-xl xl:text-2xl font-black text-primary">{formatCurrency(discountedPrice)}</span>
                {currentDiscountValue > 0 && (
                    <>
                        <span className="text-sm lg:text-base text-gray-400 line-through">{formatCurrency(currentMrp)}</span>
                        <span className="text-[10px] lg:text-xs font-black bg-green-100 text-green-700 px-1.5 lg:px-2 py-0.5 rounded">
                            Save {currentDiscountType === 'flat' ? formatCurrency(savedAmount) : `${savedPercent}%`}
                        </span>
                    </>
                )}
            </div>

            {/* Stock badge */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${currentStock > 0 ? 'bg-green-50 text-green-600' : (product.preorder ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500')}`}>
                    {currentStock > 0 ? `In Stock (${currentStock})` : (product.preorder ? 'Pre-order Available' : 'Out of Stock')}
                </span>
                {product.weight != null && product.weight > 0 && (
                    <span className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                        Weight: <span className="text-gray-700 font-semibold">{product.weight}g</span>
                    </span>
                )}
            </div>

            {/* Variant Selector (injected by parent) */}
            {variantSlot}

            {/* Quantity */}
            <div>
                <label className="block text-[10px] lg:text-xs font-bold text-gray-700 mb-1 lg:mb-2 uppercase tracking-wide">Quantity</label>
                <div className="flex items-center gap-0 border border-gray-200 rounded w-fit">
                    <button
                        onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1 || availableToBuy === 0}
                        className="w-7 h-7 lg:w-9 lg:h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors border-r border-gray-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 lg:w-4 lg:h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>
                    </button>
                    <span className="w-10 lg:w-12 text-center text-xs lg:text-sm font-bold tabular-nums">{availableToBuy === 0 ? 0 : quantity}</span>
                    <button
                        onClick={() => onQuantityChange(Math.min(availableToBuy, quantity + 1))}
                        disabled={quantity >= availableToBuy || availableToBuy === 0}
                        className="w-7 h-7 lg:w-9 lg:h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors border-l border-gray-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 lg:w-4 lg:h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    </button>
                </div>
            </div>

            {/* Action Buttons */}
            <div className={`grid ${product.preorder && currentStock <= 0 ? 'grid-cols-1' : 'grid-cols-2'} gap-1.5 lg:gap-2`}>
                {/* ADD TO CART / PRE-ORDER */}
                <div className="relative">
                    {selectionError?.source === 'cart' && (
                        <div className="absolute -top-8 left-0 text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-1 rounded whitespace-nowrap">
                            Please select {selectionError.type}
                        </div>
                    )}
                    {showAddedToCart && (
                        <div className="absolute -top-8 left-0 text-[10px] font-bold text-green-600 bg-green-50 border border-green-100 px-2 py-1 rounded whitespace-nowrap">
                            ✓ Added to Cart!
                        </div>
                    )}
                    <button
                        onClick={onAddToCart}
                        disabled={availableToBuy === 0 && !product.preorder}
                        className="w-full py-2 lg:py-3 px-2 lg:px-4 bg-gray-900 hover:bg-black text-white font-black text-[11px] lg:text-sm rounded transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 lg:gap-2 cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
                        </svg>
                        {availableToBuy === 0 
                            ? 'Out of Stock' 
                            : (product.preorder && currentStock <= 0 ? (
                                <span className="flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                    </span>
                                    Pre-order Now
                                </span>
                            ) : 'Add to Cart')}
                    </button>
                </div>

                {/* BUY NOW - ONLY IF NOT PRE-ORDER */}
                {!(product.preorder && currentStock <= 0) && (
                    <div className="relative">
                        {selectionError?.source === 'buy' && (
                            <div className="absolute -top-8 left-0 text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-1 rounded whitespace-nowrap">
                                Please select {selectionError.type}
                            </div>
                        )}
                        <button
                            onClick={onBuyNow}
                            disabled={availableToBuy === 0 && !product.preorder}
                            style={{
                                animation: (availableToBuy > 0 || product.preorder) ? 'bellRing 1.6s ease-in-out infinite' : 'none',
                                transformOrigin: 'center bottom',
                            }}
                            className="w-full py-2 lg:py-3 px-2 lg:px-4 bg-primary hover:bg-primary/90 text-white font-black text-[11px] lg:text-sm rounded transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 lg:gap-2 cursor-pointer shadow-md hover:shadow-lg"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                            Buy Now
                        </button>
                    </div>
                )}

                {/* ORDER ON WHATSAPP - ONLY IF NOT PRE-ORDER */}
                {whatsappNumber && !(product.preorder && currentStock <= 0) && (
                    <button
                        onClick={handleWhatsApp}
                        className="col-span-1 py-2 lg:py-3 px-1 sm:px-2 lg:px-4 bg-green-500 hover:bg-green-600 text-white font-black text-[9px] min-[360px]:text-[10px] sm:text-[11px] lg:text-sm whitespace-nowrap rounded transition-colors flex items-center justify-center gap-1 sm:gap-1.5 lg:gap-2 cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 min-[360px]:w-3.5 min-[360px]:h-3.5 sm:w-4 sm:h-4 shrink-0">
                            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm4.55 14.21c-.21.55-1.22 1.05-1.68 1.1-.46.05-.89.22-3-1.1-2.55-1.57-4.07-4.2-4.19-4.39-.12-.19-1-1.32-1-2.52s.63-1.79.85-2.04c.22-.25.48-.31.64-.31h.46c.15 0 .35-.06.54.41.2.48.69 1.67.75 1.79.06.12.1.26.02.41-.08.15-.12.24-.24.37s-.25.29-.35.39c-.12.12-.24.25-.1.49.14.24.61 1.01 1.31 1.63.9.8 1.66 1.05 1.9 1.17.24.12.38.1.52-.06.14-.16.59-.69.75-.93.16-.24.32-.2.54-.12s1.42.67 1.66.79c.24.12.4.18.46.28.06.1.06.57-.15 1.12z"/>
                        </svg>
                        <span>Order On WhatsApp</span>
                    </button>
                )}

                {/* CALL FOR ORDER - ONLY IF NOT PRE-ORDER */}
                {contactPhone && !(product.preorder && currentStock <= 0) && (
                    <button
                        onClick={handleCall}
                        className="col-span-1 py-2 lg:py-3 px-1 sm:px-2 lg:px-4 bg-teal-500 hover:bg-teal-600 text-white font-black text-[9px] min-[360px]:text-[10px] sm:text-[11px] lg:text-sm whitespace-nowrap rounded transition-colors flex items-center justify-center gap-1 sm:gap-1.5 lg:gap-2 cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 min-[360px]:w-3.5 min-[360px]:h-3.5 sm:w-4 sm:h-4 shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 6.75Z" />
                        </svg>
                        <span>Call For Order</span>
                    </button>
                )}
            </div>

            {/* Brand logo only */}
            {product.brand?.logo && (
                <div className="pt-2 border-t border-gray-100">
                    <div className="relative h-8 w-20" title={product.brand.name || 'Brand'}>
                        <Image src={product.brand.logo} alt={product.brand.name || 'Brand'} fill className="object-contain object-left" sizes="80px" />
                    </div>
                </div>
            )}

            {/* Wishlist toggle + Share (Unified) */}
            <div className="pt-2 space-y-4">
                <button
                    onClick={onWishlistToggle}
                    className={`flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer ${inWishlist ? 'text-rose-500' : 'text-gray-400 hover:text-rose-500'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill={inWishlist ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                    {inWishlist ? 'Saved to Wishlist' : 'Add to Wishlist'}
                </button>

                <div className="border-t border-gray-100 pt-4">
                    <SocialShare title={product.title} />
                </div>
            </div>
        </div>
    );
}
