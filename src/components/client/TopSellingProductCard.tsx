'use client';

import Image from 'next/image';
import { IProduct, IVariant } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useState } from 'react';
import VariantModal from './VariantModal';

interface Props {
    product: IProduct;
}

export default function TopSellingProductCard({ product }: Props) {
    const { addToCart, items, updateQuantity } = useCart();
    const router = useRouter();
    const [isAdding, setIsAdding] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Use variant 0 if variant product
    const isVariantProduct = product.productType === 'variant' || (product.variants && product.variants.length > 0);
    const basePrice = (isVariantProduct && product.variants?.length > 0) ? product.variants[0].mrp : product.mrp;
    
    let discountedPrice = basePrice;
    let savedAmount = 0;
    const discountObj = (isVariantProduct && product.variants?.length > 0) ? product.variants[0] : product;

    if (discountObj.discountValue && discountObj.discountValue > 0) {
        if (discountObj.discountType === 'percentage') {
            const cut = (basePrice * discountObj.discountValue) / 100;
            discountedPrice = basePrice - cut;
            savedAmount = cut;
        } else {
            discountedPrice = Math.max(0, basePrice - discountObj.discountValue);
            savedAmount = discountObj.discountValue;
        }
    }

    const hasDiscount = savedAmount > 0;

    const handleAction = async (e: React.MouseEvent, type: 'cart' | 'buy') => {
        e.preventDefault();
        e.stopPropagation();

        if (isVariantProduct) {
            setIsModalOpen(true);
            return;
        }

        if (product.stock <= 0) {
            toast.error('Out of stock');
            return;
        }

        if (type === 'buy') {
            sessionStorage.setItem('directBuyItem', JSON.stringify([{
                productId: product._id,
                title: product.title,
                price: discountedPrice,
                originalPrice: basePrice,
                discount: discountObj.discountValue || 0,
                discountType: discountObj.discountType || 'flat',
                tax: product.tax || 0,
                image: product.images?.[0] || '',
                quantity: 1,
                stock: product.stock || 0,
                variant: {},
            }]));
            router.push('/checkout?directBuy=true');
            return;
        }

        setIsAdding(true);
        try {
            addToCart({ 
                ...product, 
                discountedPrice, 
                tax: product.tax || 0 
            });
            toast.success('Added to cart');
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <>
        <div 
            onClick={() => router.push(`/products/${product.slug}`)}
            className="group relative flex flex-col xl:flex-row items-center bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-3 sm:p-4 cursor-pointer min-h-[200px]"
        >
            {/* Best Selling badge — inside card, top-right corner, flush with border */}
            <div className="absolute top-0 right-0 z-0 bg-rose-500 text-white text-[9px] font-medium pl-2.5 pr-2 py-0.5 rounded-tr-xl rounded-bl-md inline-flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 flex-shrink-0">
                    <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.176 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.546 3.75 3.75 0 0 1 3.255 3.718Z" clipRule="evenodd" />
                </svg>
                Best Selling
            </div>

            {/* Left: Image (40% width on large screens) */}
            <div className="w-full xl:w-[40%] flex-shrink-0 relative aspect-[5/4] xl:aspect-square flex items-center justify-center p-1.5 mix-blend-multiply group-hover:scale-105 transition-transform duration-500">
                {product.images && product.images.length > 0 ? (
                    <Image
                        src={product.images[0]}
                        alt={product.title}
                        fill
                        className="object-contain drop-shadow-sm"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 250px, 280px"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Right: Content (60% width) */}
            <div className="relative z-10 w-full xl:w-[60%] mt-3 xl:mt-0 xl:pl-5 2xl:pl-6 flex flex-col justify-center text-center xl:text-left">
                <h3 className="text-[15px] sm:text-[17px] xl:text-[16px] 2xl:text-[17px] font-medium text-gray-800 group-hover:text-primary transition-colors line-clamp-2 mb-2 leading-snug">
                    {product.title}
                </h3>
                
                <div className="flex flex-wrap items-baseline justify-center xl:justify-start gap-2 mb-2">
                    <span className="text-[18px] sm:text-[20px] xl:text-[18px] 2xl:text-[20px] font-semibold text-primary">
                        {formatCurrency(discountedPrice)}
                    </span>
                    {hasDiscount && (
                        <span className="text-[10px] sm:text-[11px] text-gray-400 line-through font-medium">
                            {formatCurrency(basePrice)}
                        </span>
                    )}
                </div>
                
                {hasDiscount && (
                    <div className="mb-4 sm:mb-5">
                        <span className="bg-[#b5e02e] text-[#4d630b] text-[11px] sm:text-[12px] font-semibold px-2.5 py-0.5 rounded-full inline-flex tracking-tight">
                            Save {formatCurrency(savedAmount, true)}
                        </span>
                    </div>
                )}
                
                {/* Actions */}
                <div onClick={(e) => e.stopPropagation()} className={`w-full max-w-sm mx-auto xl:mx-0 ${!hasDiscount ? 'mt-3 sm:mt-6' : ''}`}>
                    {(() => {
                        const cartItem = !isVariantProduct ? items.find(i => i.productId === product._id && !i.variant) : null;
                        const cartQty = cartItem?.quantity || 0;
                        return (
                            <div className="flex gap-2 sm:gap-2.5 xl:gap-1.5 2xl:gap-2.5 w-full">
                                {!isVariantProduct && cartQty > 0 ? (
                                    <div className="flex-1 flex items-center border border-primary rounded overflow-hidden min-h-[38px] sm:min-h-[40px]">
                                        <button
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product._id, cartQty - 1); }}
                                            className="flex-1 py-1.5 text-primary hover:bg-primary/5 transition-colors text-lg font-medium cursor-pointer"
                                        >−</button>
                                        <span className="flex-1 text-center text-[13px] sm:text-[14px] font-semibold text-primary">{cartQty}</span>
                                        <button
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (cartQty < product.stock) updateQuantity(product._id, cartQty + 1); }}
                                            disabled={cartQty >= product.stock}
                                            className="flex-1 py-1.5 text-primary hover:bg-primary/5 transition-colors text-lg font-medium disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                                        >+</button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={(e) => handleAction(e, 'cart')}
                                        disabled={isAdding || (!isVariantProduct && product.stock <= 0)}
                                        className="flex-1 py-2 xl:px-1 2xl:px-0 border border-primary text-primary hover:bg-primary/5 rounded font-medium text-[12px] sm:text-[13px] xl:text-[11px] 2xl:text-[13px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 xl:gap-0.5 2xl:gap-1.5 min-h-[38px] sm:min-h-[40px]"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4 xl:w-3 xl:h-3 2xl:w-4 2xl:h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                                        </svg>
                                        Add To Cart
                                    </button>
                                )}
                                <button 
                                    onClick={(e) => handleAction(e, 'buy')}
                                    disabled={isAdding || (!isVariantProduct && product.stock <= 0)}
                                    className="flex-1 py-2 xl:px-1 2xl:px-0 bg-primary text-white hover:bg-primary/90 rounded font-medium text-[12px] sm:text-[13px] xl:text-[11px] 2xl:text-[13px] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_10px_-2px_rgba(249,115,22,0.4)] hidden sm:flex items-center justify-center gap-1 xl:gap-0.5 2xl:gap-1.5 sm:min-h-[40px]"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4 xl:w-3 xl:h-3 2xl:w-4 2xl:h-4">
                                        <path d="M2.25 2.25a.75.75 0 0 0 0 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 0 0-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 0 0 0-1.5H5.378A2.25 2.25 0 0 1 7.5 15h11.218a.75.75 0 0 0 .674-.421 60.358 60.358 0 0 0 2.96-7.228.75.75 0 0 0-.525-.965A60.864 60.864 0 0 0 5.68 4.509l-.232-.867A1.875 1.875 0 0 0 3.636 2.25H2.25ZM3.75 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM16.5 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
                                    </svg>
                                    Buy now
                                </button>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>

            {isVariantProduct && (
                <VariantModal
                    key={product._id + isModalOpen}
                    product={product}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    );
}
