'use client';

import { IVariant } from '@/types';
import Image from 'next/image';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useGetAttributesQuery } from '@/redux/features/attribute/attributeApi';

interface VariantManagerProps {
    variants: IVariant[];
    onChange: (variants: IVariant[]) => void;
    errors?: Record<string, string>;
    baseSku?: string;
    // Pricing Defaults
    defaultMrp?: number;
    defaultPrice?: number;
    defaultDiscountType?: 'flat' | 'percentage';
    defaultDiscountValue?: number;
    defaultTaxType?: 'flat' | 'percentage';
    defaultTax?: number;
    onApplyToGlobal?: (variant: IVariant) => void;
}

/**
 * Generate a slug for SKU from a label string.
 */
function skuSlug(str: string): string {
    return str
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 6);
}

/**
 * Auto-generate a SKU from variant attributes.
 */
function generateSku(baseSku: string, attributesMap: Record<string, string>): string {
    const parts = [baseSku || 'VAR'];
    // Sort keys alphabetically so SKU parts are always in a stable order
    const sortedKeys = Object.keys(attributesMap).sort();
    for (const key of sortedKeys) {
        if (attributesMap[key]) {
            parts.push(skuSlug(attributesMap[key]));
        }
    }
    return parts.join('-');
}

/**
 * Compute cartesian product of selected options and return variant combinations.
 */
function cartesianProduct(
    selectedValuesByAttr: { attrSlug: string; values: any[] }[]
) {
    if (selectedValuesByAttr.length === 0) return [];

    // Filter out attributes that have no selected values
    const arrays = selectedValuesByAttr
        .filter((attr) => attr.values.length > 0)
        .map((attr) => attr.values.map((v) => ({ slug: attr.attrSlug, value: v })));

    if (arrays.length === 0) return [];

    const combos = arrays.reduce((acc, currArray) => {
        const newAcc = [];
        for (const item of acc) {
            for (const currItem of currArray) {
                newAcc.push([...item, currItem]);
            }
        }
        return newAcc;
    }, [[]] as any[][]);

    return combos.map((combo) => {
        const result: Record<string, string> = {};
        let colorCode: string | undefined = undefined;
        for (const item of combo) {
            result[item.slug] = item.value.label;
            if (item.value.colorCode) {
                colorCode = item.value.colorCode; // Last color code wins
            }
        }
        return { attributes: result, colorCode };
    });
}

function comboKey(attributes?: Record<string, string>): string {
    if (!attributes) return '';
    // Stable string representation of attributes map
    return Object.keys(attributes)
        .sort()
        .map((k) => `${k}:${attributes[k]}`)
        .join('|');
}

export default function VariantManager({
    variants,
    onChange,
    errors = {},
    baseSku = '',
    defaultMrp = 0,
    defaultPrice = 0,
    defaultDiscountType = 'percentage',
    defaultDiscountValue = 0,
    defaultTaxType = 'percentage',
    defaultTax = 0,
    onApplyToGlobal,
}: VariantManagerProps) {
    const { data: optionsData, isLoading: isLoadingOptions } = useGetAttributesQuery();
    const attributes = useMemo(() => [...(optionsData?.attributes || [])].sort((a, b) => a.order - b.order), [optionsData?.attributes]);

    // Track selected option IDs per attribute slug
    // { "size": Set(["valId1", "valId2"]), "color": Set(["valId3"]) }
    const [selectedIdsMap, setSelectedIdsMap] = useState<Record<string, Set<string>>>({});
    
    // Track manually removed combo keys (so they don't reappear)
    const [removedKeys, setRemovedKeys] = useState<Set<string>>(new Set());

    // Track uploading state per variant index and slot
    const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});

    // Initialize selections from existing variants on mount
    useEffect(() => {
        if (variants.length > 0 && attributes.length > 0) {
            const nextMap: Record<string, Set<string>> = {};
            
            for (const attr of attributes) {
                const attrSlug = attr.slug;
                nextMap[attrSlug] = new Set<string>();
                
                for (const v of variants) {
                    // Check dynamic attributes
                    if (v.attributes && v.attributes[attrSlug]) {
                        const valLabel = v.attributes[attrSlug];
                        const match = attr.values?.find(val => val.label === valLabel);
                        if (match) nextMap[attrSlug].add(match._id);
                    }
                }
            }
            setSelectedIdsMap(nextMap);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attributes.length]);

    // When selections change, generate cartesian product and merge with existing variants
    useEffect(() => {
        // Collect selected values by attribute
        const selectedValuesByAttr = attributes.map(attr => {
            const selectedSet = selectedIdsMap[attr.slug] || new Set();
            return {
                attrSlug: attr.slug,
                values: (attr.values || []).filter(val => selectedSet.has(val._id))
            };
        });

        // Check if anything is selected at all
        const totalSelections = selectedValuesByAttr.reduce((acc, curr) => acc + curr.values.length, 0);

        if (totalSelections === 0) {
            // No selections — clear all variants that came from matrix (wait, we shouldn't wipe out manual variants, but for simplicity here we assume if they deselect all, variants go empty)
            return;
        }

        const combos = cartesianProduct(selectedValuesByAttr);

        // Build a map of existing variants by combo key for preservation
        const existingMap = new Map<string, IVariant>();
        for (const v of variants) {
            existingMap.set(comboKey(v.attributes), v);
        }

        // Build new variant list from combos
        const newVariants: IVariant[] = [];
        for (const combo of combos) {
            const key = comboKey(combo.attributes);

            // Skip manually removed combos
            if (removedKeys.has(key)) continue;

            const existing = existingMap.get(key);
            if (existing) {
                // Keep the exact existing object but maybe update order
                newVariants.push({ ...existing, order: newVariants.length });
            } else {
                newVariants.push({
                    attributes: combo.attributes,
                    colorCode: combo.colorCode,
                    sku: generateSku(baseSku, combo.attributes),
                    stock: 0,
                    weight: null,
                    mrp: defaultMrp,
                    price: defaultPrice,
                    discountType: defaultDiscountType,
                    discountValue: defaultDiscountValue,
                    taxType: defaultTaxType,
                    tax: defaultTax,
                    images: [],
                    inventoryRef: '',
                    order: newVariants.length,
                } as IVariant);
            }
        }

        // Only update if actually different
        const currentKeys = variants.map(v => comboKey(v.attributes)).join(',');
        const newKeys = newVariants.map(v => comboKey(v.attributes)).join(',');
        if (currentKeys !== newKeys || variants.length !== newVariants.length) {
            onChange(newVariants);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedIdsMap, removedKeys]);

    const toggleSelection = useCallback(
        (attrSlug: string, valId: string) => {
            setSelectedIdsMap((prev) => {
                const next = { ...prev };
                if (!next[attrSlug]) next[attrSlug] = new Set();
                
                const newSet = new Set(next[attrSlug]);
                if (newSet.has(valId)) {
                    newSet.delete(valId);
                } else {
                    newSet.add(valId);
                }
                next[attrSlug] = newSet;
                return next;
            });

            // Clear manually removed keys when selection changes
            setRemovedKeys(new Set());
        },
        []
    );

    const moveVariant = useCallback(
        (index: number, direction: 'up' | 'down') => {
            const newVariants = [...variants];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= newVariants.length) return;

            [newVariants[index], newVariants[targetIndex]] = [newVariants[targetIndex], newVariants[index]];

            const orderedVariants = newVariants.map((v, i) => ({ ...v, order: i }));
            onChange(orderedVariants);
        },
        [variants, onChange]
    );

    const removeVariant = useCallback(
        (index: number) => {
            const variant = variants[index];
            const key = comboKey(variant.attributes);
            setRemovedKeys((prev) => new Set(prev).add(key));
            const remaining = variants.filter((_, i) => i !== index);
            const ordered = remaining.map((v, i) => ({ ...v, order: i }));
            onChange(ordered);
        },
        [variants, onChange]
    );

    const updateVariant = useCallback(
        (index: number, field: string, value: any) => {
            const updated = [...variants];
            const variant = { ...updated[index], [field]: value };

            // Pricing sync logic
            if (field === 'mrp') {
                const mrp = Number(value) || 0;
                const discountValue = Number(variant.discountValue) || 0;
                if (variant.discountType === 'percentage') {
                    variant.price = Number((mrp - (mrp * discountValue) / 100).toFixed(2));
                } else {
                    variant.price = Math.max(0, mrp - discountValue);
                }
            } else if (field === 'price') {
                const price = Number(value) || 0;
                const mrp = Number(variant.mrp) || 0;
                if (mrp > 0) {
                    if (variant.discountType === 'percentage') {
                        variant.discountValue = Number((((mrp - price) / mrp) * 100).toFixed(2));
                    } else {
                        variant.discountValue = Number((mrp - price).toFixed(2));
                    }
                }
            } else if (field === 'discountValue' || field === 'discountType') {
                const mrp = Number(variant.mrp) || 0;
                const discountValue = Number(field === 'discountValue' ? value : variant.discountValue) || 0;
                const discountType = field === 'discountType' ? value : variant.discountType;

                if (discountType === 'percentage') {
                    variant.price = Number((mrp - (mrp * discountValue) / 100).toFixed(2));
                } else {
                    variant.price = Math.max(0, mrp - discountValue);
                }
            }

            updated[index] = variant;
            onChange(updated);
        },
        [variants, onChange]
    );

    const handleMultiFileUpload = async (variantIndex: number, files: FileList) => {
        const variant = variants[variantIndex];
        const currentImages = [...(variant.images || [])];
        const slotsRemaining = 5 - currentImages.length;
        const filesToUpload = Array.from(files).slice(0, slotsRemaining);

        if (filesToUpload.length === 0) return;

        setUploadingState((prev) => ({ ...prev, [String(variantIndex)]: true }));

        try {
            const uploadPromises = filesToUpload.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await res.json();
                return data.success ? data.imageUrl : null;
            });

            const results = await Promise.all(uploadPromises);
            const newUrls = results.filter(Boolean) as string[];

            if (newUrls.length > 0) {
                const merged = [...currentImages, ...newUrls].slice(0, 5);
                updateVariant(variantIndex, 'images', merged);
            }
        } catch (error) {
            console.error('Upload error:', error);
        } finally {
            setUploadingState((prev) => ({ ...prev, [String(variantIndex)]: false }));
        }
    };

    const removeImage = useCallback(
        (variantIndex: number, imageSlot: number) => {
            const variant = variants[variantIndex];
            const images = [...(variant.images || [])];
            images.splice(imageSlot, 1);
            updateVariant(variantIndex, 'images', images);
        },
        [variants, updateVariant]
    );
    
    // Check if anything is selected across all attributes
    const hasAnySelection = Object.values(selectedIdsMap).some(set => set.size > 0);

    return (
        <div className="space-y-6">
            {/* Global Options Selectors */}
            <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-6 space-y-5">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-gray-900">Configure Attributes</h3>
                    <a
                        href="/admin/variant-management"
                        target="_blank"
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                        <span>Manage Attributes</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                    </a>
                </div>

                {isLoadingOptions ? (
                    <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                ) : attributes.length === 0 ? (
                    <div className="text-sm text-gray-500 py-4">No global attributes defined. Click &quot;Manage Attributes&quot; above to add some.</div>
                ) : (
                    <div className="space-y-5">
                        {attributes.map(attr => {
                            if (!attr.values || attr.values.length === 0) return null;
                            const selectedSet = selectedIdsMap[attr.slug] || new Set();
                            
                            return (
                                <div key={attr._id}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-gray-700">
                                            {attr.name}
                                        </label>
                                        <span className="text-[9px] font-bold bg-white border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">
                                            {selectedSet.size} selected
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {attr.values.map((val) => {
                                            const isSelected = selectedSet.has(val._id);
                                            return (
                                                <button
                                                    key={val._id}
                                                    type="button"
                                                    onClick={() => toggleSelection(attr.slug, val._id)}
                                                    className={`relative group px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-2
                                                    ${isSelected
                                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm hover:bg-indigo-700 hover:border-indigo-700'
                                                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {attr.type === 'color' && val.colorCode && (
                                                        <span
                                                            className={`w-3.5 h-3.5 rounded-full shadow-inner ${isSelected ? 'ring-2 ring-white/40' : 'ring-1 ring-black/10'}`}
                                                            style={{ backgroundColor: val.colorCode }}
                                                        />
                                                    )}
                                                    {val.label}
                                                    {isSelected && (
                                                        <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5">
                                                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                                            </svg>
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Matrix Result / Variant List */}
            {hasAnySelection && (
                <>
                    <div className="flex items-center justify-between mb-4 mt-8">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-900">Generated Combinations</h3>
                            <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
                                {variants.length} active
                            </span>
                        </div>
                    </div>

                    {variants.length > 0 && (
                        <div className="space-y-4">
                            {variants.map((variant, index) => (
                                <div
                                    key={comboKey(variant.attributes) || index}
                                    className={`relative bg-white rounded-xl border ${errors[`variant_${index}_price`] ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-gray-200'} p-4 shadow-sm hover:shadow-md transition-all group/card`}
                                >
                                    {/* Action Buttons: Delete & Move */}
                                    <div className="absolute -top-2.5 -right-2.5 flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                        <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => moveVariant(index, 'up')}
                                                disabled={index === 0}
                                                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed border-r border-gray-100"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => moveVariant(index, 'down')}
                                                disabled={index === variants.length - 1}
                                                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                </svg>
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeVariant(index)}
                                            className="bg-white text-rose-500 p-1.5 rounded-lg border border-gray-200 shadow-sm hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Variant Badges Header */}
                                    <div className="flex flex-wrap items-center gap-2 mb-4 pr-16">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">
                                            #{index + 1}
                                        </span>
                                        
                                        {/* Dynamic Badges */}
                                        {variant.attributes && Object.entries(variant.attributes).map(([key, val]) => (
                                            <span key={key} className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 flex items-center gap-1.5">
                                                {key === 'color' && variant.colorCode && (
                                                    <span className="w-2.5 h-2.5 rounded-full shadow-inner" style={{ backgroundColor: variant.colorCode }} />
                                                )}
                                                <span className="opacity-50 font-medium mr-1">{key}:</span> {val}
                                            </span>
                                        ))}
                                        
                                        {/* Fallback for legacy variant fields if attributes map doesn't exist */}
                                        {!variant.attributes && variant.size && <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700">{variant.size}</span>}
                                        {!variant.attributes && variant.colorName && <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 flex items-center gap-1.5">{variant.colorCode && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: variant.colorCode }} />}{variant.colorName}</span>}
                                        {!variant.attributes && variant.material && <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700">{variant.material}</span>}
                                        {!variant.attributes && variant.ram && <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700">{variant.ram}</span>}
                                        {!variant.attributes && variant.storage && <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-700">{variant.storage}</span>}

                                        {onApplyToGlobal && (
                                            <button
                                                type="button"
                                                onClick={() => onApplyToGlobal(variant)}
                                                className="ml-auto text-[10px] font-bold bg-black text-white px-2 py-1 rounded hover:bg-gray-800 transition-colors"
                                                title="Apply this variant's pricing to all variants"
                                            >
                                                Apply to All
                                            </button>
                                        )}
                                    </div>

                                    {/* Main Fields Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
                                        {/* Row 1: SKU & Stock */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                                                    SKU
                                                </label>
                                                <input
                                                    type="text"
                                                    value={variant.sku || ''}
                                                    onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                                    className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-mono font-medium text-gray-900 focus:border-gray-900 outline-none transition-all"
                                                    placeholder="VAR-001"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[9px] font-bold uppercase tracking-widest text-emerald-600 mb-1">
                                                    Stock
                                                </label>
                                                <input
                                                    type="number"
                                                    value={variant.stock === 0 ? '' : variant.stock}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        updateVariant(index, 'stock', val === '' ? 0 : Number(val));
                                                    }}
                                                    className="w-full bg-white border border-emerald-200 rounded-lg px-2 py-1.5 text-xs font-bold text-emerald-900 focus:border-emerald-500 outline-none transition-all"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>

                                        {/* Row 2: Pricing */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                                                    Regular Price
                                                </label>
                                                <input
                                                    type="number"
                                                    value={variant.mrp === 0 ? '' : variant.mrp}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        let out: string | number = val;
                                                        if (val === '') out = 0;
                                                        else if (val.includes('.')) out = val;
                                                        else out = Number(val);
                                                        updateVariant(index, 'mrp', out);
                                                    }}
                                                    className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-900 focus:border-gray-900 outline-none transition-all"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-500">
                                                        Discount
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateVariant(
                                                                index,
                                                                'discountType',
                                                                variant.discountType === 'percentage' ? 'flat' : 'percentage'
                                                            )
                                                        }
                                                        className="text-[9px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                                                    >
                                                        {variant.discountType === 'percentage' ? '%' : '৳'}
                                                    </button>
                                                </div>
                                                <input
                                                    type="number"
                                                    value={variant.discountValue === 0 ? '' : variant.discountValue}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        let out: string | number = val;
                                                        if (val === '') out = 0;
                                                        else if (val.includes('.')) out = val;
                                                        else out = Number(val);
                                                        updateVariant(index, 'discountValue', out);
                                                    }}
                                                    className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-900 focus:border-gray-900 outline-none transition-all"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[9px] font-bold uppercase tracking-widest text-indigo-600 mb-1">
                                                    Sale Price
                                                </label>
                                                <input
                                                    type="number"
                                                    value={variant.price === 0 ? '' : variant.price}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        let out: string | number = val;
                                                        if (val === '') out = 0;
                                                        else if (val.includes('.')) out = val;
                                                        else out = Number(val);
                                                        updateVariant(index, 'price', out);
                                                    }}
                                                    className={`w-full bg-white border ${errors[`variant_${index}_price`] ? 'border-rose-500' : 'border-indigo-200'} rounded-lg px-2 py-1.5 text-xs font-bold text-indigo-900 focus:border-indigo-500 outline-none transition-all`}
                                                    placeholder="0.00"
                                                />
                                                {errors[`variant_${index}_price`] && (
                                                    <p className="text-[9px] text-rose-600 font-bold mt-1">
                                                        {errors[`variant_${index}_price`]}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Row 3 (Optional): Inventory Ref & Cost */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-medium uppercase tracking-widest text-gray-500 mb-1">
                                                    Inventory Reference
                                                </label>
                                                <input
                                                    type="text"
                                                    value={variant.inventoryRef || ''}
                                                    onChange={(e) => updateVariant(index, 'inventoryRef', e.target.value)}
                                                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-900 focus:border-gray-900 outline-none transition-all"
                                                    placeholder="e.g. Rack A-12"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium uppercase tracking-widest text-gray-500 mb-1">
                                                    Cost <span className="text-[8px] font-normal">(opt.)</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    value={
                                                        variant.productCost === undefined || variant.productCost === null
                                                            ? ''
                                                            : String(variant.productCost)
                                                    }
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === '') {
                                                            updateVariant(index, 'productCost', undefined);
                                                            return;
                                                        }
                                                        const num = Number(val);
                                                        updateVariant(
                                                            index,
                                                            'productCost',
                                                            Number.isFinite(num) ? num : undefined,
                                                        );
                                                    }}
                                                    className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-900 focus:border-gray-900 outline-none transition-all"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Images Row */}
                                    <div>
                                        <label className="block text-[10px] font-medium uppercase tracking-widest text-gray-500 mb-1">
                                            Images ({(variant.images || []).length}/5)
                                        </label>
                                        <div className="flex gap-2 flex-wrap items-center">
                                            {/* Existing images */}
                                            {(variant.images || []).map((img, slot) => (
                                                <div
                                                    key={slot}
                                                    className="relative w-16 h-16 rounded-lg border border-gray-200 bg-white overflow-hidden group/img flex items-center justify-center"
                                                >
                                                    <Image
                                                        src={img}
                                                        alt={`Variant ${index + 1} img ${slot + 1}`}
                                                        className="object-cover w-full h-full"
                                                        width={64}
                                                        height={64}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(index, slot)}
                                                        className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover/img:opacity-100 cursor-pointer flex items-center justify-center transition-opacity"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}

                                            {/* Add images button (multi-select) */}
                                            {(variant.images || []).length < 5 && (
                                                <div className="relative w-16 h-16 rounded-lg border border-dashed border-gray-300 bg-white overflow-hidden flex items-center justify-center">
                                                    <input
                                                        type="file"
                                                        id={`var-img-${index}`}
                                                        className="hidden"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={(e) => {
                                                            if (e.target.files && e.target.files.length > 0) {
                                                                handleMultiFileUpload(index, e.target.files);
                                                            }
                                                            e.target.value = '';
                                                        }}
                                                    />
                                                    <label
                                                        htmlFor={`var-img-${index}`}
                                                        className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-gray-300 hover:text-gray-500 transition-colors"
                                                    >
                                                        {uploadingState[String(index)] ? (
                                                            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                            </svg>
                                                        )}
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty state when selections made but all removed */}
                    {variants.length === 0 && hasAnySelection && (
                        <div className="text-center py-6 text-gray-400 text-xs">
                            All generated variants have been removed. Adjust your selections above.
                        </div>
                    )}

                </>
            )}
        </div>
    );
}
