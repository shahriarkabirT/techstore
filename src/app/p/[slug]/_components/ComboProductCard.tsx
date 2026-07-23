'use client';

import Image from 'next/image';
import { Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useGetAttributesQuery } from '@/redux/features/attribute/attributeApi';

interface Variant {
    _id?: string;
    attributes?: Record<string, string>;
    size?: string;
    colorName?: string;
    colorCode?: string;
    material?: string;
    ram?: string;
    storage?: string;
    price?: number;
    mrp?: number;
    stock?: number;
    images?: string[];
}

interface Product {
    _id: string;
    title: string;
    price: number;
    mrp?: number;
    images?: string[];
    variants?: Variant[];
    compatibleModels?: string[];
    productType?: 'single' | 'variant';
    shortDescription?: string;
}

interface ComboProductCardProps {
    product: Product;
    quantity: number;
    selectedVariants: Record<string, string>;
    onQtyChange: (delta: number) => void;
    onVariantChange: (slug: string, value: string) => void;
    /** Single-product landing: no checkbox, qty min 1, variants always visible */
    singleMode?: boolean;
}

export default function ComboProductCard({
    product,
    quantity,
    selectedVariants,
    onQtyChange,
    onVariantChange,
    singleMode = false,
}: ComboProductCardProps) {
    const { data: attributesData } = useGetAttributesQuery();
    const globalAttributes = attributesData?.attributes || [];

    const hasVariants = product.productType === 'variant' && (product.variants?.length ?? 0) > 0;
    const hasOptions = hasVariants || (product.compatibleModels?.length ?? 0) > 0;

    // Determine active variant
    const activeVariant = hasVariants
        ? product.variants?.find((v) => {
              if (v.attributes && Object.keys(v.attributes).length > 0) {
                  if (Object.keys(selectedVariants).length === 0) return false;

                  return Object.entries(selectedVariants).every(([slug, val]) => {
                      if (slug === 'model') return true;
                      return v.attributes![slug] === val;
                  });
              }
              return false;
          })
        : undefined;

    const displayPrice = activeVariant?.price ?? product.price;
    const displayImage =
        (activeVariant?.images?.[0] ?? product.images?.[0]) || '/placeholder.png';
    const isSelected = singleMode || quantity > 0;

    // Build required dynamic options
    const requiredOptions = hasVariants
        ? [...new Set<string>(product.variants!.flatMap((v) => {
            if (v.attributes && Object.keys(v.attributes).length > 0) {
                return Object.keys(v.attributes);
            }
            return [];
        }))]
        : [];

    return (
        <div
            className={`border-b border-gray-100 transition-all duration-200 ${
                isSelected ? 'bg-red-50/10' : 'bg-white'
            }`}
        >
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 p-2.5 sm:p-3 md:p-4">
                {/* Clickable Toggle Area */}
                <div 
                    className={`flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0 ${!singleMode ? 'cursor-pointer select-none' : ''}`}
                    onClick={() => !singleMode && onQtyChange(isSelected ? -quantity : 1)}
                >
                    {!singleMode && (
                        <div
                            className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-all ${
                                isSelected ? 'bg-red-600 border-red-600' : 'border-gray-200 bg-white'
                            }`}
                        >
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                    )}

                    {/* Product Image */}
                    <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-lg overflow-hidden border border-gray-100 shrink-0 bg-gray-50">
                        <Image src={displayImage} alt={product.title} fill className="object-cover" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm md:text-base text-gray-900 truncate">{product.title}</h4>
                        {!singleMode && (
                            <p className="text-gray-400 text-[10px] md:text-xs">
                                {isSelected ? 'Selected' : 'Click to select'}
                            </p>
                        )}
                    </div>

                    {/* Price */}
                    <div className="hidden sm:block text-right px-4 shrink-0">
                        <span className="font-bold text-gray-900">{formatCurrency(displayPrice)}</span>
                    </div>
                </div>

                {/* Qty Controls */}
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-8 md:h-10 bg-white shadow-sm">
                    <button
                        type="button"
                        onClick={() => onQtyChange(-1)}
                        disabled={singleMode && quantity <= 1}
                        className="w-8 h-full flex items-center justify-center hover:bg-gray-50 font-bold text-lg text-gray-400 disabled:opacity-30"
                    >
                        −
                    </button>
                    <span className="w-8 md:w-10 text-center text-sm font-bold text-gray-900">{quantity}</span>
                    <button
                        type="button"
                        onClick={() => onQtyChange(1)}
                        className="w-8 h-full flex items-center justify-center hover:bg-gray-50 font-bold text-lg text-gray-400"
                    >
                        +
                    </button>
                </div>
            </div>

            {hasOptions && isSelected && (
                <div className="px-12 md:px-16 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    {/* Dynamic Variant Attributes */}
                    {requiredOptions.map((slug) => {
                        const rawOptions = [...new Set(product.variants!.map((v) => {
                            if (v.attributes && v.attributes[slug]) return v.attributes[slug];
                            const fieldMap: Record<string, string> = { 'size': 'size', 'color': 'colorName', 'material': 'material', 'ram': 'ram', 'storage': 'storage' };
                            const vf = fieldMap[slug] || slug;
                            return (v as any)[vf];
                        }).filter(Boolean))] as string[];

                        if (rawOptions.length === 0) return null;

                        const globalAttr = globalAttributes.find((a: any) => a.slug === slug);
                        const attrName = globalAttr?.name || slug.charAt(0).toUpperCase() + slug.slice(1);
                        const isColor = globalAttr?.type === 'color' || slug === 'color';

                        const options = [...rawOptions].sort((a: any, b: any) => {
                            const orderA = globalAttr?.values?.find((v: any) => v.label === a)?.order ?? 999;
                            const orderB = globalAttr?.values?.find((v: any) => v.label === b)?.order ?? 999;
                            return orderA - orderB;
                        });

                        return (
                            <div key={slug} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-3 first:mt-0">
                                <span className="text-[10px] font-black uppercase text-gray-400 min-w-[60px]">{attrName}:</span>
                                {isColor ? (
                                    <div className="flex flex-wrap gap-2">
                                        {options.map((opt) => {
                                            let colorHex: string | undefined = undefined;
                                            const globalVal = globalAttr?.values?.find((v: any) => v.label === opt);
                                            if (globalVal?.colorCode) {
                                                colorHex = globalVal.colorCode;
                                            } else {
                                                const matchingVariant = product.variants!.find((v: any) => 
                                                    v.attributes && v.attributes[slug] === opt
                                                );
                                                colorHex = matchingVariant?.colorCode;
                                            }

                                            const active = selectedVariants[slug] === opt;

                                            return (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    onClick={() => onVariantChange(slug, opt)}
                                                    style={{ backgroundColor: colorHex || opt }}
                                                    className={`w-6 h-6 rounded-full border-2 relative ${
                                                        active ? 'border-red-600 scale-110 shadow-sm' : 'border-white shadow-inner'
                                                    }`}
                                                    title={opt}
                                                >
                                                    {active && <Check className="w-3 h-3 text-white absolute inset-0 m-auto" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex-1 w-full sm:max-w-xs">
                                        <select
                                            value={selectedVariants[slug] || ""}
                                            onChange={(e) => onVariantChange(slug, e.target.value)}
                                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 appearance-none bg-no-repeat bg-right hover:border-gray-300 transition-colors"
                                            style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundSize: '1rem', backgroundPosition: 'right 0.5rem center' }}
                                        >
                                            <option value="" disabled>Choose an option</option>
                                            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Compatible Models */}
                    {(product.compatibleModels?.length ?? 0) > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-3 first:mt-0">
                            <span className="text-[10px] font-black uppercase text-gray-400 min-w-[60px]">Compatible:</span>
                            <div className="flex-1 w-full sm:max-w-xs">
                                <select
                                    value={selectedVariants['model'] || ""}
                                    onChange={(e) => onVariantChange('model', e.target.value)}
                                    className={`w-full px-3 py-1.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 appearance-none bg-no-repeat bg-right transition-colors ${
                                        selectedVariants['model'] ? 'border-gray-200 text-gray-700 hover:border-gray-300 focus:ring-gray-900' : 'border-rose-300 ring-1 ring-rose-300 text-rose-600 bg-rose-50'
                                    }`}
                                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundSize: '1rem', backgroundPosition: 'right 0.5rem center' }}
                                >
                                    <option value="" disabled>Choose a model</option>
                                    {product.compatibleModels!.map(model => (
                                        <option key={model} value={model}>{model}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
