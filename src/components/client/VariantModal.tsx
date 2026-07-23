'use client';

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { IProduct } from '@/types';
import { useCart } from '@/context/CartContext';
import { useGetAttributesQuery } from '@/redux/features/attribute/attributeApi';
import { useRouter } from 'next/navigation';
import { formatCurrency, calculateDiscountedPrice, isSameVariant } from '@/lib/utils';
import CompatibleModelsSelector from '@/components/client/product-detail/CompatibleModelsSelector';

interface VariantModalProps {
    product: any;
    isOpen: boolean;
    onClose: () => void;
    globalOptions?: any; // Leaving this for backwards compat if passed
}

export default function VariantModal({ product, isOpen, onClose }: VariantModalProps) {
    const { addToCart, isInCart, items } = useCart();
    const router = useRouter();

    const { data: attributesData } = useGetAttributesQuery(undefined, { skip: !isOpen });
    const globalAttributes = attributesData?.attributes || [];

    const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
    const [mainImage, setMainImage] = useState(product.images?.[0] || '');
    const [selectionError, setSelectionError] = useState<{ type: string, source: 'cart' | 'buy' } | null>(null);
    const [showAddedToCart, setShowAddedToCart] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);

    // Base product properties
    const productMrp = product.mrp || product.price;
    const productDiscountValue = product.discountValue || 0;
    const productDiscountType = product.discountType || 'percentage';

    const activeVariant = useMemo(() => {
        return product.variants?.find((v: any) => {
            if (v.attributes && Object.keys(v.attributes).length > 0) {
                return Object.entries(selectedVariants).every(([slug, val]) => v.attributes[slug] === val);
            }
            return false;
        });
    }, [product.variants, selectedVariants]);

    const requiredOptions = useMemo(() => {
        if (!product.variants?.length) return [];
        return [
            ...new Set(product.variants.flatMap((v: any) => {
                if (v.attributes && Object.keys(v.attributes).length > 0) {
                    return Object.keys(v.attributes);
                }
                return [];
            }))
        ];
    }, [product.variants]);

    const hasModels = (product.compatibleModels?.length ?? 0) > 0;
    const missingSelection = (requiredOptions as string[]).find(slug => !selectedVariants[slug]);
    const actualMissingSelection = missingSelection || (hasModels && !selectedModel ? 'model' : null);
    const isSelectionComplete = !actualMissingSelection;

    const currentMrp = useMemo(() => activeVariant?.mrp || productMrp, [activeVariant, productMrp]);
    const currentDiscountValue = useMemo(() => (activeVariant && activeVariant.discountValue !== undefined) ? activeVariant.discountValue : productDiscountValue, [activeVariant, productDiscountValue]);
    const currentDiscountType = useMemo(() => activeVariant?.discountType || productDiscountType, [activeVariant, productDiscountType]);

    const discountedPrice = useMemo(() => {
        return activeVariant?.price || calculateDiscountedPrice(
            currentMrp,
            currentDiscountValue,
            currentDiscountType
        );
    }, [activeVariant, currentMrp, currentDiscountValue, currentDiscountType]);

    // Dynamic stock based on active variant
    const currentStock = activeVariant ? (activeVariant.stock || 0) : product.stock;

    // Calculate how many are already in cart
    const checkVariantToSync: any = { ...selectedVariants };
    if (selectedModel) checkVariantToSync.model = selectedModel;
    if (activeVariant?.colorCode) checkVariantToSync.colorCode = activeVariant.colorCode;

    const currentCartItem = items.find(item => item.productId === product._id && isSameVariant(item.variant, { attributes: checkVariantToSync }));
    const cartItemQuantity = currentCartItem ? currentCartItem.quantity : 0;
    const availableToBuy = (product.preorder && currentStock <= 0) ? 99 : Math.max(0, currentStock - cartItemQuantity);

    if (!isOpen) return null;

    const handleVariantChange = (slug: string, value: string) => {
        if (selectionError) setSelectionError(null);
        setQuantity(1); // Reset quantity on variant change
        
        // 1. Try to maintain other current selections with the new value
        const nextSelections = { ...selectedVariants, [slug]: value };

        // 2. Check if this specific combination exists
        const exactMatch = product.variants?.find((v: any) => {
            if (v.attributes && Object.keys(v.attributes).length > 0) {
                return Object.entries(nextSelections).every(([k, val]) => v.attributes[k] === val);
            }
            // Fallback for legacy
            const fieldMap: Record<string, string> = { 'size': 'size', 'color': 'colorName', 'material': 'material', 'ram': 'ram', 'storage': 'storage' };
            return Object.entries(nextSelections).every(([k, val]) => {
                const vf = fieldMap[k] || k;
                return v[vf] === val;
            });
        });

        if (exactMatch) {
            setSelectedVariants(nextSelections);
            if (exactMatch.images && exactMatch.images.length > 0) {
                setMainImage(exactMatch.images[0]);
            } else {
                setMainImage(product.images?.[0] || '');
            }
        } else {
            // 3. Smart Switch: Combination doesn't exist, so switch to a valid variant 
            // that HAS the option the user just clicked.
            const bestFit = product.variants?.find((v: any) => {
                if (v.attributes && v.attributes[slug] === value) return true;
                const fieldMap: Record<string, string> = { 'size': 'size', 'color': 'colorName', 'material': 'material', 'ram': 'ram', 'storage': 'storage' };
                const vf = fieldMap[slug] || slug;
                return v[vf] === value;
            });

            if (bestFit) {
                const smartSelections: Record<string, string> = { ...selectedVariants };
                (requiredOptions as string[]).forEach((k) => {
                    if (bestFit.attributes && bestFit.attributes[k]) smartSelections[k] = bestFit.attributes[k];
                    else {
                        const fieldMap: Record<string, string> = { 'size': 'size', 'color': 'colorName', 'material': 'material', 'ram': 'ram', 'storage': 'storage' };
                        const kf = fieldMap[k] || k;
                        if (bestFit[kf]) smartSelections[k] = bestFit[kf];
                    }
                });
                smartSelections[slug] = value;
                setSelectedVariants(smartSelections);
                if (bestFit.images && bestFit.images.length > 0) {
                    setMainImage(bestFit.images[0]);
                } else {
                    setMainImage(product.images?.[0] || '');
                }
            } else {
                setSelectedVariants(nextSelections);
            }
        }
    };

    const handleAddToCart = () => {
        if (!isSelectionComplete) {
            setSelectionError({ type: actualMissingSelection as string, source: 'cart' });
            return;
        }

        const variantToSync: any = { ...selectedVariants };
        if (selectedModel) variantToSync.model = selectedModel;
        if (activeVariant?.colorCode) variantToSync.colorCode = activeVariant.colorCode;
        if (activeVariant?.tax !== undefined) variantToSync.tax = activeVariant.tax;

        addToCart({
            ...product,
            mrp: currentMrp,
            price: currentMrp,
            discountedPrice,
            discountValue: currentDiscountValue,
            discountType: currentDiscountType,
            tax: (activeVariant && activeVariant.tax !== undefined) ? activeVariant.tax : (product.tax || 0),
            title: `${product.title} ${Object.values(selectedVariants).length ? `(${Object.values(selectedVariants).join(', ')})` : ''}`,
            isPreorder: product.preorder && currentStock <= 0,
        }, quantity, variantToSync);

        setShowAddedToCart(true);
        setTimeout(() => {
            setShowAddedToCart(false);
        }, 1500);
    };

    const handleBuyNow = () => {
        if (!isSelectionComplete) {
            setSelectionError({ type: actualMissingSelection as string, source: 'buy' });
            return;
        }

        const variantToSync: any = { ...selectedVariants };
        if (selectedModel) variantToSync.model = selectedModel;
        if (activeVariant?.colorCode) variantToSync.colorCode = activeVariant.colorCode;
        if (activeVariant?.tax !== undefined) variantToSync.tax = activeVariant.tax;

        const directBuyItem = {
            productId: (product as any)._id || (product as any).productId || '',
            title: `${product.title} ${Object.values(selectedVariants).length ? `(${Object.values(selectedVariants).join(', ')})` : ''}`,
            price: discountedPrice || currentMrp,
            originalPrice: currentMrp,
            discount: currentDiscountValue,
            discountType: currentDiscountType,
            tax: (activeVariant && activeVariant.tax !== undefined) ? activeVariant.tax : (product.tax || 0),
            image: mainImage || product.images?.[0] || '',
            quantity,
            stock: product.stock || 0,
            variant: variantToSync,
            isPreorder: product.preorder && currentStock <= 0,
        };

        if (typeof window !== 'undefined') {
            sessionStorage.setItem('directBuyItem', JSON.stringify([directBuyItem]));
        }
        onClose();
        router.push('/checkout?directBuy=true');
    };

    const modalContent = (
        <div className="fixed inset-0 z-[999999] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/40 backdrop-blur-sm transition-all duration-300" onClick={onClose}>
            {/* Modal Container */}
            <div 
                className="relative bg-white w-full md:w-full md:max-w-[480px] max-h-[90vh] md:max-h-[85vh] rounded-t-2xl md:rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200 ease-out"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors z-20"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex flex-col h-full overflow-hidden">
                    {/* Header (Image + Title + Price) */}
                    <div className="p-5 flex items-start gap-4 border-b border-gray-100 shrink-0 pr-14">
                        <div className="relative w-24 h-24 shrink-0 rounded-md overflow-hidden border border-gray-200 bg-gray-50">
                            <Image
                                src={mainImage || product.images[0]}
                                alt={product.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                            <h2 className="text-[15px] font-semibold text-gray-900 leading-snug line-clamp-2 mb-1.5">
                                {product.title}
                            </h2>
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold text-gray-900">
                                    {formatCurrency(discountedPrice)}
                                </span>
                                {currentDiscountValue > 0 && (
                                    <span className="text-xs font-medium text-gray-400 line-through">
                                        {formatCurrency(currentMrp)}
                                    </span>
                                )}
                            </div>
                            {currentDiscountValue > 0 && (
                                <span className="inline-flex w-max mt-1.5 bg-gray-100 text-gray-600 text-[11px] font-medium px-2 py-0.5 rounded">
                                    {currentDiscountType === 'flat' ? `${formatCurrency(currentDiscountValue)} OFF` : `${currentDiscountValue}% OFF`}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Main Content Area (Variants) */}
                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white">
                        <div className="space-y-6">
                            {(requiredOptions as string[]).map((slug) => {
                                const rawOptions = Array.from(new Set(product.variants?.map((v: any) => {
                                    if (v.attributes && v.attributes[slug]) return v.attributes[slug];
                                    const fieldMap: Record<string, string> = { 'size': 'size', 'color': 'colorName', 'material': 'material', 'ram': 'ram', 'storage': 'storage' };
                                    const vf = fieldMap[slug] || slug;
                                    return v[vf];
                                }).filter(Boolean))) as string[];

                                const globalAttr = globalAttributes.find((a: any) => a.slug === slug);
                                const attrName = globalAttr?.name || slug.charAt(0).toUpperCase() + slug.slice(1);
                                const isColor = globalAttr?.type === 'color' || slug === 'color';

                                const options = [...rawOptions].sort((a: any, b: any) => {
                                    const orderA = globalAttr?.values?.find((v: any) => v.label === a)?.order ?? 999;
                                    const orderB = globalAttr?.values?.find((v: any) => v.label === b)?.order ?? 999;
                                    return orderA - orderB;
                                });

                                if (options.length === 0) return null;

                                return (
                                    <div key={slug}>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-[13px] font-semibold text-gray-900">{attrName}</h3>
                                            {selectedVariants[slug] && (
                                                <span className="text-[12px] font-medium text-gray-500">{selectedVariants[slug]}</span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2.5">
                                            {options.map((opt: string) => {
                                                let colorHex: string | undefined = undefined;
                                                if (isColor) {
                                                    const globalVal = globalAttr?.values?.find((v: any) => v.label === opt);
                                                    if (globalVal?.colorCode) {
                                                        colorHex = globalVal.colorCode;
                                                    } else {
                                                        const matchingVariant = product.variants?.find((v: any) => 
                                                            v.attributes && v.attributes[slug] === opt
                                                        );
                                                        colorHex = matchingVariant?.colorCode || opt;
                                                    }
                                                }

                                                const isAvailable = product.variants?.some((v: any) => {
                                                    if (!v.attributes || v.attributes[slug] !== opt) return false;

                                                    return Object.entries(selectedVariants).every(([key, value]) => {
                                                        if (key === slug) return true;
                                                        return v.attributes && v.attributes[key] === value;
                                                    });
                                                });

                                                return (
                                                    <button
                                                        key={opt}
                                                        onClick={() => handleVariantChange(slug, opt)}
                                                        className={`relative transition-all duration-200 focus:outline-none ${isColor
                                                            ? 'w-9 h-9 rounded-full ring-offset-2'
                                                            : 'px-4 py-2 rounded-md text-[13px] font-medium border'
                                                            } ${selectedVariants[slug] === opt
                                                                ? isColor ? 'ring-2 ring-gray-900' : 'bg-gray-900 border-gray-900 text-white'
                                                                : !isAvailable
                                                                    ? isColor ? 'opacity-30 grayscale cursor-not-allowed' : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                                                    : isColor ? 'ring-1 ring-gray-200 hover:ring-gray-400' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-900'
                                                            }`}
                                                        style={isColor ? { backgroundColor: colorHex || opt } : {}}
                                                        title={`${opt}${!isAvailable ? ' (Unavailable with current selection)' : ''}`}
                                                    >
                                                        {!isColor && opt}
                                                        {isColor && selectedVariants[slug] === opt && (
                                                            <div className={`absolute inset-0 flex items-center justify-center ${opt.toLowerCase() === 'white' ? 'text-black' : 'text-white'}`}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 shadow-sm">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                        {isColor && !isAvailable && selectedVariants[slug] !== opt && (
                                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                <div className="w-full h-[1.5px] bg-gray-400/60 -rotate-45" />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}

                            {hasModels && (
                                <div>
                                    <CompatibleModelsSelector
                                        models={product.compatibleModels}
                                        selectedModel={selectedModel}
                                        onSelect={(val) => {
                                            setSelectedModel(val);
                                            if (selectionError?.type === 'model') setSelectionError(null);
                                        }}
                                        hasError={selectionError?.type === 'model'}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sticky Action Footer */}
                    <div className="p-5 bg-white shrink-0 border-t border-gray-100">
                        <div className="flex flex-col gap-4">
                            {/* Quantity & Availability row */}
                            {isSelectionComplete && availableToBuy > 0 && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[13px] font-medium text-gray-700">Quantity</span>
                                        <div className="flex items-center border border-gray-200 rounded-md overflow-hidden h-9 bg-white">
                                            <button
                                                type="button"
                                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                                disabled={quantity <= 1}
                                                className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>
                                            </button>
                                            <span className="w-10 text-center text-[14px] font-medium text-gray-900 bg-white h-full flex items-center justify-center border-x border-gray-200">{quantity}</span>
                                            <button
                                                type="button"
                                                onClick={() => setQuantity(q => Math.min(availableToBuy, q + 1))}
                                                disabled={quantity >= availableToBuy}
                                                className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                    <span className={`text-[12px] font-medium px-2 py-1 rounded ${availableToBuy <= 10 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                        {availableToBuy <= 10 ? `Only ${availableToBuy} left` : `${availableToBuy} in stock`}
                                    </span>
                                </div>
                            )}

                            {/* Validation / Max stock warning */}
                            {isSelectionComplete && currentStock > 0 && availableToBuy === 0 && (
                                <p className="text-xs font-medium text-center text-rose-600 bg-rose-50 border border-rose-100 py-1.5 rounded-md">
                                    Maximum available stock in cart
                                </p>
                            )}

                            {/* Buttons Row */}
                            <div className="flex gap-3">
                                <div className={`${product.preorder && currentStock <= 0 ? 'flex-1' : 'flex-[1]'} relative`}>
                                    {selectionError?.source === 'cart' && (
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-max animate-in fade-in slide-in-from-bottom-1 duration-200 z-10">
                                            <div className="bg-gray-900 text-white px-3 py-1.5 rounded text-[11px] font-medium shadow-lg">
                                                Select {selectionError.type}
                                            </div>
                                        </div>
                                    )}
                                    {showAddedToCart && (
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-max animate-in fade-in slide-in-from-bottom-1 duration-200 z-10">
                                            <div className="bg-emerald-600 text-white px-3 py-1.5 rounded text-[11px] font-medium shadow-lg">
                                                Added to Cart!
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={availableToBuy === 0 && !product.preorder}
                                        className={`w-full h-11 flex items-center justify-center gap-2 rounded-md font-medium text-[14px] transition-all border ${availableToBuy === 0
                                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                            : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                                            }`}
                                    >
                                        {availableToBuy === 0 ? (cartItemQuantity > 0 ? 'Max Reached' : 'Out of Stock') : (product.preorder && currentStock <= 0 ? (
                                            <span className="flex items-center gap-2">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                                </span>
                                                Pre-order item
                                            </span>
                                        ) : 'Add to cart')}
                                    </button>
                                </div>
                                
                                {!(product.preorder && currentStock <= 0) && (
                                    <div className="flex-[1.5] relative">
                                        {selectionError?.source === 'buy' && (
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-max animate-in fade-in slide-in-from-bottom-1 duration-200 z-10">
                                                <div className="bg-gray-900 text-white px-3 py-1.5 rounded text-[11px] font-medium shadow-lg">
                                                    Select {selectionError.type}
                                                </div>
                                            </div>
                                        )}
                                        <button
                                            onClick={handleBuyNow}
                                            disabled={availableToBuy === 0}
                                            className="w-full h-11 flex items-center justify-center gap-2 rounded-md font-medium text-[14px] transition-all bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Buy Now
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
