'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { MouseEvent, useState } from 'react';
import { useHasMounted } from '@/hooks/useHasMounted';
import VariantModal from './VariantModal';
import { useRouter } from 'next/navigation';
import { calculateDiscountedPrice, formatCurrency } from '@/lib/utils';

interface ProductCardProps {
    product: any;
    viewMode?: 'grid' | 'list';
}

export default function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
    const { addToCart, isInCart, items, updateQuantity } = useCart();
    const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const mounted = useHasMounted();
    const router = useRouter();

    const discountedPrice = calculateDiscountedPrice(product.mrp || product.price, product.discountValue || product.discount, product.discountType || 'percentage');
    const hasVariants = product.variants && product.variants.length > 0;
    const inCart = isInCart(product._id);
    const inWishlist = mounted && isInWishlist(product._id);

    const handleAction = (e: MouseEvent, action: 'add' | 'buy') => {
        e.preventDefault();
        e.stopPropagation();

        if (hasVariants) {
            setIsModalOpen(true);
            return;
        }

        const isPreorder = product.preorder && product.stock <= 0;

        const cartItemData = {
            ...product,
            productId: product._id || product.id || product.productId,
            discountedPrice,
            tax: product.tax || 0,
            isPreorder
        };

        if (action === 'buy') {
            addToCart(cartItemData);
            router.push('/checkout');
        } else {
            addToCart(cartItemData);
        }
    };

    const handleWishlist = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (inWishlist) {
            removeFromWishlist(product._id);
        } else {
            addToWishlist(product._id);
        }
    };

    if (viewMode === 'list') {
        return (
            <>
                <div className="group relative bg-white rounded-sm overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-gray-200/50 border border-gray-100 flex h-52 sm:h-64">
                    {/* Image Section (Left) */}
                    <Link href={`/products/${product.slug}`} className="block relative w-48 sm:w-64 flex-shrink-0 bg-gray-50 overflow-hidden">
                        {product.images?.[0] ? (
                            <>
                                <Image
                                    src={product.images[0]}
                                    alt={product.title}
                                    fill
                                    className={`object-cover transition-all duration-700 group-hover:scale-110 ${product.images[1] ? 'group-hover:opacity-0' : ''}`}
                                    sizes="300px"
                                />
                                {product.images[1] && (
                                    <Image
                                        src={product.images[1]}
                                        alt={product.title}
                                        fill
                                        className="object-cover transition-all duration-700 scale-110 opacity-0 group-hover:opacity-100 group-hover:scale-100"
                                        sizes="300px"
                                    />
                                )}
                            </>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-gray-200">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                </svg>
                            </div>
                        )}

                        {(product.discountValue > 0 || product.discount > 0) && (
                            <div className="absolute top-4 left-4 bg-rose-500 text-white text-xs font-black px-3 py-1.5 rounded shadow-xl z-20 tracking-tight">
                                {product.discountType === 'flat' ? `Save ${formatCurrency(product.discountValue, true)}` : `${product.discountValue || product.discount}% off`}
                            </div>
                        )}
                    </Link>

                    {/* Content Section (Right) */}
                    <div className="flex-grow p-6 sm:p-8 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                {product.category?.name && (
                                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                        {product.category.name}
                                    </span>
                                )}
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-3 h-3 ${i < Math.floor(product.averageRating || 5) ? 'text-amber-400' : 'text-gray-200'}`}>
                                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                        </svg>
                                    ))}
                                </div>
                            </div>
                            <Link href={`/products/${product.slug}`} className="block group/title">
                                <h3 className="font-bold text-gray-900 text-lg sm:text-xl line-clamp-2 leading-tight group-hover/title:text-primary transition-colors">
                                    {product.title}
                                </h3>
                                <p className="mt-2 text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                    {product.shortDescription || 'Experience premium quality and exceptional design with our latest collection.'}
                                </p>
                            </Link>

                            <div className="mt-4 flex flex-wrap items-baseline gap-2">
                                <span className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                                    {formatCurrency(discountedPrice)}
                                </span>
                                {(product.discountValue > 0 || product.discount > 0) && (
                                    <span className="text-[10px] sm:text-[11px] text-gray-400 line-through font-medium mt-0.5">
                                        {formatCurrency(product.mrp || product.price)}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 flex items-center gap-4">
                            <button
                                onClick={(e) => handleAction(e, 'buy')}
                                disabled={product.stock === 0 && !product.preorder}
                                className="flex-grow py-3 bg-gray-900 text-white rounded-md font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-md hover:shadow-lg active:scale-[0.98] disabled:bg-gray-100 disabled:text-gray-300 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
                            >
                                {product.stock === 0 ? (
                                    product.preorder ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                            </span>
                                            Pre-order Now
                                        </span>
                                    ) : 'Out of Stock'
                                ) : 'Add to Bag'}
                            </button>
                            <button
                                onClick={handleWishlist}
                                aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                                className={`w-11 h-11 flex items-center justify-center rounded-lg border transition-all active:scale-[0.95] cursor-pointer group/wish ${inWishlist ? 'bg-white text-rose-500 border-rose-100 shadow-sm' : 'bg-white border-gray-200 text-gray-300 hover:text-rose-500 hover:border-rose-100 hover:shadow-sm'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill={inWishlist ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={inWishlist ? 0 : 1.5} stroke="currentColor" className={`w-[18px] h-[18px] transition-transform duration-300 ${inWishlist ? '' : 'group-hover/wish:scale-110'}`}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <VariantModal
                    key={product._id + isModalOpen}
                    product={product}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            </>
        );
    }

    // Default Grid View
    return (
        <div className="group/card relative bg-white rounded-md border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col h-full w-full">
            {/* Badges */}
            <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-20 pointer-events-none gap-1">
                {/* Left Badge */}
                {(product.discountValue > 0 || product.discount > 0) && (
                    <span className="bg-primary text-white text-[9px] sm:text-[10px] font-semibold px-1.5 py-[2px] rounded-[3px] whitespace-nowrap shadow-sm min-w-0 truncate">
                        Offered items
                    </span>
                )}

                {/* Right Badge */}
                {(product.discountValue > 0 || product.discount > 0) && (
                    <span className="bg-emerald-500 text-white text-[9px] sm:text-[10px] font-semibold px-1.5 py-[2px] rounded-[3px] whitespace-nowrap shadow-sm min-w-0 truncate">
                        Save {product.discountType === 'flat' ? formatCurrency(product.discountValue, true) : `${product.discountValue || product.discount}%`}
                    </span>
                )}
            </div>

            {/* Wishlist Button */}
            <button
                onClick={handleWishlist}
                aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                className={`absolute top-[40%] right-3 w-9 h-9 flex items-center justify-center rounded-full shadow-md transition-all duration-300 z-30 cursor-pointer group/wish
                ${inWishlist
                        ? 'opacity-100 bg-white text-rose-500 border border-rose-100'
                        : 'opacity-0 translate-x-2 group-hover/card:opacity-100 group-hover/card:translate-x-0 bg-white/90 backdrop-blur-sm text-gray-400 border border-gray-100 hover:text-rose-500'
                    }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill={inWishlist ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={inWishlist ? 0 : 1.5} stroke="currentColor" className={`w-[18px] h-[18px] transition-transform duration-300 ${inWishlist ? '' : 'group-hover/wish:scale-110'}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
            </button>

            {/* Image Section */}
            <div className="relative aspect-square w-full shrink-0 bg-gray-50/50">
                <Link href={`/products/${product.slug}`} className="block h-full w-full relative">
                    {product.images?.[0] ? (
                        <>
                            <Image
                                src={product.images[0]}
                                alt={product.title}
                                fill
                                className={`object-cover transition-transform duration-700 ease-out group-hover/card:scale-105 ${product.images[1] ? 'group-hover/card:opacity-0' : ''}`}
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                            />
                            {product.images[1] && (
                                <Image
                                    src={product.images[1]}
                                    alt={product.title}
                                    fill
                                    className="object-cover transition-all duration-700 ease-out scale-105 opacity-0 group-hover/card:opacity-100 group-hover/card:scale-100"
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                                />
                            )}
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-300 bg-gray-50 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                        </div>
                    )}
                </Link>
            </div>

            {/* Info Section */}
            <div className="px-4 pb-4 pt-1 flex flex-col flex-grow bg-white">
                <Link href={`/products/${product.slug}`} className="block group/title mb-2.5">
                    <h3 className="text-[14px] sm:text-[15px] font-normal text-gray-800 line-clamp-2 leading-snug group-hover/title:text-primary transition-colors">
                        {product.title}
                    </h3>
                </Link>

                <div className="flex items-center gap-2 mb-4">
                    <span className="font-bold text-primary text-base sm:text-lg">
                        {formatCurrency(discountedPrice)}
                    </span>
                    {(product.discountValue > 0 || product.discount > 0) && (
                        <span className="text-[10px] sm:text-[11px] text-gray-400 line-through">
                            {formatCurrency(product.mrp || product.price, true)}
                        </span>
                    )}
                </div>

                <div className="mt-auto">
                    {(() => {
                        const cartItem = !hasVariants ? items.find(i => i.productId === product._id && !i.variant) : null;
                        const cartQty = cartItem?.quantity || 0;
                        if (!hasVariants && cartQty > 0) {
                            return (
                                <div className="w-full flex items-center border border-primary rounded-[4px] overflow-hidden">
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product._id, cartQty - 1); }}
                                        className="flex-1 py-2 text-primary hover:bg-primary/5 transition-colors text-base font-bold cursor-pointer"
                                    >−</button>
                                    <span className="flex-1 text-center text-[13px] font-black text-primary">{cartQty}</span>
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (cartQty < product.stock) updateQuantity(product._id, cartQty + 1); }}
                                        disabled={cartQty >= product.stock}
                                        className="flex-1 py-2 text-primary hover:bg-primary/5 transition-colors text-base font-bold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                                    >+</button>
                                </div>
                            );
                        }
                        return (
                            <button
                                onClick={(e) => handleAction(e, 'add')}
                                disabled={product.stock === 0 && !product.preorder}
                                className="w-full py-2 bg-white border border-primary text-primary rounded-[4px] font-medium text-[13px] hover:bg-primary hover:text-white transition-all disabled:opacity-50 disabled:border-gray-200 disabled:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed cursor-pointer flex justify-center items-center gap-1.5 group/btn"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[18px] h-[18px]">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                                </svg>
                                {product.stock === 0 ? (
                                    product.preorder ? (
                                        <span className="flex items-center gap-2">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                            </span>
                                            Pre-order Now
                                        </span>
                                    ) : 'Out of Stock'
                                ) : 'Add To Cart'}
                            </button>
                        );
                    })()}
                </div>
            </div>

            {isModalOpen && (
                <VariantModal
                    key={product._id + isModalOpen}
                    product={product}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
}
