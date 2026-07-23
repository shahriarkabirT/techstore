'use client';

import { useState, useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { trackViewContent, trackAddToCart } from '@/lib/gtm-datalayer';
import { calculateDiscountedPrice } from '@/lib/utils';
import ProductImageGallery from '@/components/client/product-detail/ProductImageGallery';
import ProductInfo from '@/components/client/product-detail/ProductInfo';
import CompatibleModelsSelector from '@/components/client/product-detail/CompatibleModelsSelector';

interface ProductDetailInteractiveProps {
    initialProduct: any;
    globalAttributes: any[];
    contactPhone: string;
    whatsappNumber: string;
}

function isSameVariant(v1: any, v2: any) {
    if (!v1 && !v2) return true;
    if (!v1 || !v2) return false;
    
    if (v1.attributes || v2.attributes) {
        const a1 = v1.attributes || {};
        const a2 = v2.attributes || {};
        const keys1 = Object.keys(a1);
        const keys2 = Object.keys(a2);
        if (keys1.length !== keys2.length) return false;
        return keys1.every(k => a1[k] === a2[k]);
    }
    
    return (
        v1.size === v2.size &&
        v1.colorName === v2.colorName &&
        v1.material === v2.material &&
        v1.ram === v2.ram &&
        v1.storage === v2.storage &&
        v1.model === v2.model
    );
}

export default function ProductDetailInteractive({ 
    initialProduct: product, 
    globalAttributes,
    contactPhone,
    whatsappNumber
}: ProductDetailInteractiveProps) {
    const router = useRouter();
    const { addToCart, isInCart, items } = useCart();
    const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

    const [quantity, setQuantity] = useState(1);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
    const [selectedModel, setSelectedModel] = useState<string>('');
    
    const activeVariant = product?.variants?.find((v: any) => {
        if (v.attributes && Object.keys(v.attributes).length > 0) {
            if (Object.keys(selectedVariants).length === 0) return false;
            return Object.entries(selectedVariants).every(([slug, val]) => v.attributes[slug] === val);
        }
        return false;
    });

    let displayImageVariant = product?.variants?.find((v: any) => {
        if (!v.attributes || Object.keys(selectedVariants).length === 0) return false;
        const matchesAll = Object.entries(selectedVariants).every(([slug, val]) => v.attributes[slug] === val);
        return matchesAll && v.images && v.images.length > 0;
    });

    if (!displayImageVariant && Object.keys(selectedVariants).length > 0) {
        const colorAttributeSlug = Object.keys(selectedVariants).find(slug => {
            const globalAttr = globalAttributes?.find((a: any) => a.slug === slug);
            return globalAttr?.type === 'color' || slug === 'color' || slug === 'colorName';
        });

        if (colorAttributeSlug) {
            const selectedColor = selectedVariants[colorAttributeSlug];
            displayImageVariant = product?.variants?.find((v: any) => {
                return v.attributes && v.attributes[colorAttributeSlug] === selectedColor && v.images && v.images.length > 0;
            });
        }
    }

    if (!displayImageVariant && Object.keys(selectedVariants).length > 0) {
        const firstSelectedSlug = Object.keys(selectedVariants)[0];
        const firstSelectedValue = selectedVariants[firstSelectedSlug];
        displayImageVariant = product?.variants?.find((v: any) => {
            return v.attributes && v.attributes[firstSelectedSlug] === firstSelectedValue && v.images && v.images.length > 0;
        });
    }

    const resolvedImageVariant = displayImageVariant || activeVariant;
    
    const currentMrp = activeVariant?.mrp || product?.mrp || product?.price || 0;
    const currentDiscountValue = (activeVariant && activeVariant.discountValue !== undefined) ? activeVariant.discountValue : (product?.discountValue || 0);
    const currentDiscountType = activeVariant?.discountType || product?.discountType || 'percentage';
    const discountedPrice = activeVariant?.price || calculateDiscountedPrice(currentMrp, currentDiscountValue, currentDiscountType);

    useEffect(() => {
        if (product && product._id && discountedPrice) {
            trackViewContent({
                content_ids: [String(product._id)],
                content_name: product.title,
                content_type: 'product',
                value: discountedPrice,
                currency: 'BDT',
                contents: [{ 
                    id: String(product._id), 
                    quantity: 1, 
                    item_price: discountedPrice,
                    item_name: product.title,
                    item_category: product?.category?.name
                }]
            });
        }
    }, [product, discountedPrice]);

    const [selectionError, setSelectionError] = useState<{ type: string; source: 'cart' | 'buy' } | null>(null);
    const [showAddedToCart, setShowAddedToCart] = useState(false);
    const [showSizeGuide, setShowSizeGuide] = useState(false);

    useEffect(() => {
        if (showAddedToCart) {
            const t = setTimeout(() => setShowAddedToCart(false), 2000);
            return () => clearTimeout(t);
        }
    }, [showAddedToCart]);

    if (!product) { notFound(); return null; }

    const requiredOptions = product.variants?.length > 0
        ? [...new Set<string>(product.variants.flatMap((v: any) => {
            if (v.attributes && Object.keys(v.attributes).length > 0) {
                return Object.keys(v.attributes);
            }
            return [];
        }))]
        : [];

    const hasModels = (product.compatibleModels?.length ?? 0) > 0;
    const missingSelection = (requiredOptions as string[]).find(slug => !selectedVariants[slug]);
    const actualMissingSelection = missingSelection || (hasModels && !selectedModel ? 'model' : null);
    const isSelectionComplete = !actualMissingSelection;

    const currentStock = !product?.isActive ? 0 : (activeVariant ? (activeVariant.stock || 0) : (product?.stock || 0));
    const checkVariantToSync: any = { ...selectedVariants };
    if (activeVariant?.colorCode) checkVariantToSync.colorCode = activeVariant.colorCode;
    
    const currentCartItem = items.find((item: any) => 
        item.productId === product?._id && 
        isSameVariant(item.variant, { attributes: checkVariantToSync })
    );
    const cartItemQuantity = currentCartItem ? currentCartItem.quantity : 0;
    const availableToBuy = (product?.preorder && currentStock <= 0) ? 99 : Math.max(0, currentStock - cartItemQuantity);

    const handleVariantChange = (slug: string, value: string) => {
        if (selectionError) setSelectionError(null);

        if (selectedVariants[slug] === value) {
            const updated = { ...selectedVariants };
            delete updated[slug];
            setSelectedVariants(updated);
            return;
        }
        
        const nextSelections = { ...selectedVariants, [slug]: value };

        const exactMatch = product.variants?.find((v: any) => {
            if (v.attributes && Object.keys(v.attributes).length > 0) {
                return Object.entries(nextSelections).every(([k, val]) => v.attributes[k] === val);
            }
            const fieldMap: Record<string, string> = { 'size': 'size', 'color': 'colorName', 'material': 'material', 'ram': 'ram', 'storage': 'storage' };
            return Object.entries(nextSelections).every(([k, val]) => {
                const vf = fieldMap[k] || k;
                return v[vf] === val;
            });
        });

        if (exactMatch) {
            setSelectedVariants(nextSelections);
            const matchStock = exactMatch.stock || 0;
            if (quantity > matchStock && matchStock > 0) setQuantity(matchStock);
            else if (matchStock === 0) setQuantity(1);
        } else {
            const bestFit = product.variants?.find((v: any) => {
                if (v.attributes && v.attributes[slug] === value) return true;
                const fieldMap: Record<string, string> = { 'size': 'size', 'color': 'colorName', 'material': 'material', 'ram': 'ram', 'storage': 'storage' };
                const vf = fieldMap[slug] || slug;
                return v[vf] === value;
            });
            
            if (bestFit) {
                const smart: Record<string, string> = { ...selectedVariants };
                requiredOptions.forEach(k => {
                    if (bestFit.attributes && bestFit.attributes[k]) smart[k] = bestFit.attributes[k];
                    else {
                        const fieldMap: Record<string, string> = { 'size': 'size', 'color': 'colorName', 'material': 'material', 'ram': 'ram', 'storage': 'storage' };
                        const kf = fieldMap[k] || k;
                        if (bestFit[kf]) smart[k] = bestFit[kf];
                    }
                });
                smart[slug] = value;
                setSelectedVariants(smart);
                const fitStock = bestFit.stock || 0;
                if (quantity > fitStock && fitStock > 0) setQuantity(fitStock);
                else if (fitStock === 0) setQuantity(1);
            } else {
                setSelectedVariants(nextSelections);
            }
        }
    };

    const handleAddToCart = () => {
        if (!isSelectionComplete) { setSelectionError({ type: actualMissingSelection!, source: 'cart' }); return; }
        
        const variantToSync: any = { ...selectedVariants };
        if (selectedModel) variantToSync['model'] = selectedModel;
        if (activeVariant?.colorCode) variantToSync.colorCode = activeVariant.colorCode;
        if (activeVariant?.tax !== undefined) variantToSync.tax = activeVariant.tax;
        if (selectedModel) variantToSync.model = selectedModel;

        addToCart({
            ...product,
            isPreorder: product.preorder && currentStock <= 0,
            mrp: currentMrp,
            price: currentMrp,
            discountedPrice,
            discountValue: currentDiscountValue,
            discountType: currentDiscountType,
            tax: activeVariant?.tax !== undefined ? activeVariant.tax : (product.tax || 0),
            title: `${product.title}${Object.values(selectedVariants).length ? ` (${Object.values(selectedVariants).join(', ')})` : ''}`,
        }, quantity, variantToSync);

        trackAddToCart({
            content_ids: [String(product._id)],
            contents: [{ 
                id: String(product._id), 
                quantity, 
                item_price: discountedPrice,
                item_name: product.title,
                item_category: product.category?.name
            }],
            value: discountedPrice * quantity,
            currency: 'BDT'
        });

        setShowAddedToCart(true);
    };

    const handleBuyNow = () => {
        if (!isSelectionComplete) { setSelectionError({ type: actualMissingSelection!, source: 'buy' }); return; }
        
        const variantToSync: any = { ...selectedVariants };
        if (selectedModel) variantToSync['model'] = selectedModel;
        if (activeVariant?.colorCode) variantToSync.colorCode = activeVariant.colorCode;
        if (activeVariant?.tax !== undefined) variantToSync.tax = activeVariant.tax;
        if (selectedModel) variantToSync.model = selectedModel;

        sessionStorage.setItem('directBuyItem', JSON.stringify([{
            productId: (product as any)._id || (product as any).id || (product as any).productId,
            title: `${product.title}${Object.values(selectedVariants).length ? ` (${Object.values(selectedVariants).join(', ')})` : ''}`,
            price: discountedPrice || currentMrp,
            originalPrice: currentMrp,
            discount: currentDiscountValue,
            discountType: currentDiscountType,
            tax: activeVariant?.tax !== undefined ? activeVariant.tax : (product.tax || 0),
            image: product.images?.[0] || '',
            quantity,
            stock: product.stock || 0,
            variant: variantToSync,
            isPreorder: product.preorder && currentStock <= 0,
        }]));

        router.push('/checkout?directBuy=true');
    };

    const mainColumnOptions: string[] = [...requiredOptions];
    const optionsData: Record<string, string[]> = {};

    if (product.variants?.length > 0) {
        requiredOptions.forEach(slug => {
            const rawOptions = [...new Set(product.variants?.map((v: any) => {
                if (v.attributes && v.attributes[slug]) return v.attributes[slug];
                const fieldMap: Record<string, string> = { 'size': 'size', 'color': 'colorName', 'material': 'material', 'ram': 'ram', 'storage': 'storage' };
                const vf = fieldMap[slug] || slug;
                return v[vf];
            }).filter(Boolean))] as string[];
            
            optionsData[slug] = rawOptions;
        });
    }

    const renderOptionGroup = (slug: string) => {
        const rawOptions = optionsData[slug];
        if (!rawOptions || rawOptions.length === 0) return null;
        
        const globalAttr = globalAttributes.find((a: any) => a.slug === slug);
        const attrName = globalAttr?.name || slug.charAt(0).toUpperCase() + slug.slice(1);
        const isColor = globalAttr?.type === 'color' || slug === 'color';
        
        const options = [...rawOptions].sort((a, b) => {
            const valA = globalAttr?.values?.find((v: any) => v.label === a);
            const valB = globalAttr?.values?.find((v: any) => v.label === b);
            return (valA?.order ?? 999) - (valB?.order ?? 999);
        });

        return (
            <div key={slug}>
                <div className="flex items-center gap-2 mb-1 lg:mb-2 border-b border-gray-100 pb-2">
                    <span className="text-[10px] lg:text-xs font-black text-gray-700 uppercase tracking-wide">Select {attrName}</span>
                    {selectedVariants[slug] && (
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">{selectedVariants[slug]}</span>
                    )}
                    {slug === 'size' && (typeof product.sizeGuide === 'object' ? (product.sizeGuide as any).image : product.sizeGuide) && (
                        <button 
                            type="button" 
                            onClick={() => setShowSizeGuide(true)}
                            className="ml-auto flex items-center gap-1.5 text-[10px] lg:text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest border border-gray-200 px-2.5 py-1 rounded-md bg-gray-50 hover:bg-gray-100"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 lg:w-3.5 lg:h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V10.5" />
                            </svg>
                            Size Guide
                        </button>
                    )}
                </div>
                {isColor ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {options.map(opt => {
                            let colorCode: string | undefined = undefined;
                            const globalVal = globalAttr?.values?.find((v: any) => v.label === opt);
                            if (globalVal?.colorCode) {
                                colorCode = globalVal.colorCode;
                            } else {
                                const matchingVariant = product.variants?.find((v: any) => 
                                    v.attributes && v.attributes[slug] === opt
                                );
                                colorCode = matchingVariant?.colorCode;
                            }

                            const isSelected = selectedVariants[slug] === opt;
                            const isMissing = selectionError?.type === slug;

                            return (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => handleVariantChange(slug, opt)}
                                    className={`relative group px-3 lg:px-4 py-1.5 lg:py-2 border rounded-lg text-[11px] lg:text-xs font-bold transition-all overflow-hidden
                                        ${isSelected 
                                            ? 'bg-gray-900 border-gray-900 text-white shadow-md shadow-gray-900/20' 
                                            : isMissing
                                                ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse-fast'
                                                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-2 relative z-10">
                                        {colorCode && (
                                            <span 
                                                className={`w-3 h-3 lg:w-3.5 lg:h-3.5 rounded-full shadow-inner ${isSelected ? 'ring-2 ring-white/40' : 'ring-1 ring-black/10'}`}
                                                style={{ backgroundColor: colorCode }}
                                            />
                                        )}
                                        {opt}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="mt-2">
                        <select
                            value={selectedVariants[slug] || ""}
                            onChange={(e) => handleVariantChange(slug, e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg text-sm bg-white transition-all focus:outline-none focus:ring-1 appearance-none bg-no-repeat bg-right ${
                                selectionError?.type === slug
                                    ? 'border-rose-300 ring-1 ring-rose-300 text-rose-600 bg-rose-50'
                                    : 'border-gray-300 text-gray-700 focus:border-gray-900 focus:ring-gray-900 hover:border-gray-400'
                            }`}
                            style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundSize: '1rem', backgroundPosition: 'right 0.75rem center' }}
                        >
                            <option value="" disabled>Choose an option</option>
                            {options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        );
    };

    const mainVariantSlot = mainColumnOptions.length > 0 ? (
        <div className="space-y-2 lg:space-y-4 pt-1 lg:pt-2">
            {mainColumnOptions.map(renderOptionGroup)}
        </div>
    ) : null;

    return (
        <>
            {/* Col 1: Images */}
            <div className="lg:col-span-5">
                <ProductImageGallery
                    key={resolvedImageVariant?._id ?? 'default'}
                    images={product.images || []}
                    title={product.title}
                    discountValue={currentDiscountValue}
                    discountType={currentDiscountType}
                    activeVariantImages={resolvedImageVariant?.images}
                />
            </div>

            {/* Col 2: Product Info */}
            <div className="lg:col-span-4">
                <ProductInfo
                    product={product}
                    discountedPrice={discountedPrice}
                    currentMrp={currentMrp}
                    currentDiscountValue={currentDiscountValue}
                    currentDiscountType={currentDiscountType}
                    currentStock={currentStock}
                    availableToBuy={availableToBuy}
                    quantity={quantity}
                    onQuantityChange={setQuantity}
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNow}
                    showAddedToCart={showAddedToCart}
                    selectionError={selectionError}
                    inWishlist={isInWishlist(product._id)}
                    onWishlistToggle={() => isInWishlist(product._id) ? removeFromWishlist(product._id) : addToWishlist(product._id)}
                    whatsappNumber={whatsappNumber}
                    contactPhone={contactPhone}
                    variantSlot={
                        <>
                            {mainVariantSlot}
                            {hasModels && (
                                <div className="mt-2 lg:mt-4">
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
                        </>
                    }
                />
            </div>

            {/* Size Guide Modal */}
            {showSizeGuide && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pb-20">
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
                        onClick={() => setShowSizeGuide(false)}
                    />
                    <div className="relative w-full max-w-2xl mx-auto flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0 bg-white z-10">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V10.5" />
                                </svg>
                                Size Guide
                            </h3>
                            <button 
                                onClick={() => setShowSizeGuide(false)}
                                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        {(typeof product.sizeGuide === 'object' ? (product.sizeGuide as any).image : product.sizeGuide) ? (
                            <div className="relative w-full flex items-center justify-center shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={typeof product.sizeGuide === 'object' ? (product.sizeGuide as any).image : product.sizeGuide} 
                                    alt="Size Guide" 
                                    className="w-full h-auto max-h-[75vh] object-contain"
                                />
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </>
    );
}
