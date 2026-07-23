'use client';

import ImageUpload from '@/components/shared/ImageUpload';
import VariantManager from '@/components/admin/VariantManager';
import CategoryHierarchySelector from '@/components/shared/CategoryHierarchySelector';
import CompatibleModelSelector from '@/components/admin/CompatibleModelSelector';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useCreateProductMutation } from '@/redux/features/product/productApi';
import { useGetBrandsQuery } from '@/redux/features/brand/brandApi';
import { showError, showSuccess } from '@/lib/toast';
import RichTextEditor from '@/components/shared/RichTextEditor';

export default function NewProductPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: '',
        productType: 'single' as 'single' | 'variant',
        mrp: '0',
        price: '0',
        discountType: 'percentage',
        discountValue: '0',
        tax: '0',
        stock: '0',
        category: '',
        subCategory: '',
        childCategory: '',
        subChildCategory: '',
        shortDescription: '',
        fullDescription: '',
        sizeGuide: '',
        images: [''],
        variants: [],
        sku: '',
        tags: '',
        compatibleModels: [],
        weight: '0',
        isActive: true,
        freeShipping: false,
        preorder: false,
        isFeatured: false,
        brand: '',
        productCost: '',
    });
    const [createProduct, { isLoading: isSubmitting }] = useCreateProductMutation();
    const { data: brands = [] } = useGetBrandsQuery();
    const [isPricingExpanded, setIsPricingExpanded] = useState(false);
    const [modelInput, setModelInput] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (e: any) => {
        const { name, value, type, checked } = e.target;

        setFormData((prev) => {
            const val = type === 'checkbox' ? checked : value;
            let finalVal = val;

            // Strip leading zeros for numeric inputs unless it's a decimal like "0."
            if (type === 'number' && typeof val === 'string' && val.length > 1 && val.startsWith('0') && val[1] !== '.') {
                finalVal = Number(val).toString();
            }

            const next = { ...prev, [name]: finalVal };

            // Pricing synchronization logic
            if (name === 'mrp') {
                const mrp = Number(finalVal) || 0;
                const discountValue = Number(next.discountValue) || 0;
                if (next.discountType === 'percentage') {
                    next.price = Number((mrp - (mrp * discountValue) / 100).toFixed(2)).toString();
                } else {
                    next.price = Math.max(0, mrp - discountValue).toString();
                }
            } else if (name === 'price') {
                const price = Number(value) || 0;
                const mrp = Number(next.mrp) || 0;
                if (mrp > 0) {
                    if (next.discountType === 'percentage') {
                        next.discountValue = (((mrp - price) / mrp) * 100).toFixed(2);
                    } else {
                        next.discountValue = (mrp - price).toString();
                    }
                }
            } else if (name === 'discountValue' || name === 'discountType') {
                const mrp = Number(next.mrp) || 0;
                const discountValue = Number(name === 'discountValue' ? value : next.discountValue) || 0;
                const discountType = name === 'discountType' ? value : next.discountType;

                if (discountType === 'percentage') {
                    next.price = Number((mrp - (mrp * discountValue) / 100).toFixed(2)).toString();
                } else {
                    next.price = Math.max(0, mrp - discountValue).toString();
                }
            }

            return next;
        });

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // Basic Info
        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        } else if (formData.title.trim().length < 3) {
            newErrors.title = 'Title must be at least 3 characters';
        }

        // Pricing logic
        const mrp = Number(formData.mrp);
        const price = Number(formData.price);

        if (isNaN(mrp) || mrp < 0) {
            newErrors.mrp = 'MRP must be a positive number';
        }
        if (isNaN(price) || price < 1) {
            newErrors.price = 'Selling price must be at least 1';
        } else if (price > mrp) {
            newErrors.price = 'Selling price cannot be greater than MRP';
        }

        // Category
        if (!formData.category) {
            newErrors.category = 'Category is required';
        }

        // Media
        const validImages = formData.images.filter(img => img.trim());
        if (validImages.length === 0) {
            newErrors.images = 'At least one product image is required';
        }

        // Variants
        if (formData.variants && formData.variants.length > 0) {
            formData.variants.forEach((v: any, idx: number) => {
                const vMrp = Number(v.mrp) || 0;
                const vPrice = Number(v.price) || 0;

                if (Number(v.stock) < 0) {
                    newErrors[`variant_${idx}_stock`] = 'Stock cannot be negative';
                }
                if (vPrice > vMrp) {
                    newErrors[`variant_${idx}_price`] = 'Selling price > MRP';
                }
                if (vPrice < 1) {
                    newErrors[`variant_${idx}_price`] = 'Price must be at least 1';
                }
                if (vMrp < 0) {
                    newErrors[`variant_${idx}_mrp`] = 'MRP cannot be negative';
                }
            });
        }

        if (Object.keys(newErrors).length > 0) {
            const firstError = Object.values(newErrors)[0];
            showError(firstError);
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Auto-calculate total stock from variants
    const totalVariantStock = (formData.variants || []).reduce((acc, curr: any) => acc + (Number(curr.stock) || 0), 0);


    const handleApplyToGlobal = (variant: any) => {
        setFormData(prev => ({
            ...prev,
            mrp: (variant.mrp || 0).toString(),
            price: (variant.price || 0).toString(),
            discountType: variant.discountType || 'percentage',
            discountValue: (variant.discountValue || 0).toString(),
            tax: (variant.tax || 0).toString(),
            stock: (variant.stock || 0).toString(),
            weight: variant.weight === null ? '' : variant.weight.toString(),
            productCost: (variant.productCost || 0).toString(),
        }));
        showSuccess('Applied', 'Variant values applied to global product');
    };

    const handleSyncToAllVariants = (field: string) => {
        const val = (formData as any)[field];
        setFormData(prev => ({
            ...prev,
            variants: (prev.variants || []).map((v: any) => {
                const updatedVariant = {
                    ...v,
                    [field]: field === 'discountType' ? val : Number(val) || 0
                };

                // Recalculate price if pricing fields changed
                if (['mrp', 'discountType', 'discountValue'].includes(field)) {
                    const mrp = Number(updatedVariant.mrp) || 0;
                    const dValue = Number(updatedVariant.discountValue) || 0;
                    const dType = updatedVariant.discountType;
                    if (dType === 'percentage') {
                        updatedVariant.price = Number((mrp - (mrp * dValue) / 100).toFixed(2));
                    } else {
                        updatedVariant.price = Math.max(0, mrp - dValue);
                    }
                } else if (field === 'price') {
                    // Recalculate discount if price changed
                    const mrp = Number(updatedVariant.mrp) || 0;
                    const price = Number(updatedVariant.price) || 0;
                    if (mrp > 0) {
                        if (updatedVariant.discountType === 'percentage') {
                            updatedVariant.discountValue = Number((((mrp - price) / mrp) * 100).toFixed(2));
                        } else {
                            updatedVariant.discountValue = Number((mrp - price).toFixed(2));
                        }
                    }
                }
                return updatedVariant;
            })
        }));
        showSuccess('Sync Success', `Applied global ${field} to all variants`);
    };

    const handleApplyGlobalToAll = () => {
        const mrp = Number(formData.mrp) || 0;
        const price = Number(formData.price) || 0;
        const discountType = formData.discountType;
        const discountValue = Number(formData.discountValue) || 0;
        const tax = Number(formData.tax) || 0;
        const weight = Number(formData.weight) || 0;
        const stock = Number(formData.stock) || 0;
        const productCost = Number(formData.productCost) || 0;

        setFormData(prev => ({
            ...prev,
            variants: (prev.variants || []).map((v: any) => ({
                ...v,
                mrp,
                price: Number(price.toFixed(2)),
                discountType,
                discountValue: Number(discountValue.toFixed(2)),
                tax,
                weight,
                stock,
                productCost
            }))
        }));
        showSuccess('Applied to All', 'All global defaults applied to variants');
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const res = await createProduct({
                ...formData,
                variants: (formData.variants || []).map((v: any) => {
                    const row: Record<string, unknown> = {
                        ...v,
                        mrp: Number(v.mrp) || 0,
                        price: Number(v.price) || 0,
                        stock: Number(v.stock) || 0,
                        weight: v.weight === '' || v.weight === null ? null : Number(v.weight),
                        discountValue: Number(v.discountValue) || 0,
                        tax: Number(v.tax) || 0,
                    };
                    const vpc = v.productCost;
                    if (vpc !== '' && vpc !== undefined && vpc !== null && !Number.isNaN(Number(vpc)) && Number(vpc) >= 0) {
                        row.productCost = Number(vpc);
                    }
                    return row;
                }) as any,
                category: formData.category as any,
                images: formData.images.filter((img) => img.trim()),
                sizeGuide: formData.sizeGuide,
                tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
                compatibleModels: formData.compatibleModels,
                discountType: formData.discountType as any,
                discountValue: Number(formData.discountValue) || 0,
                weight: formData.weight === '' ? null : Number(formData.weight),
                tax: Number(formData.tax) || 0,
                mrp: Number(formData.mrp),
                price: Number(formData.price),
                stock: Number(formData.stock) || 0,
                productCost:
                    formData.productCost === '' || formData.productCost == null
                        ? undefined
                        : Math.max(0, Number(formData.productCost)),
                subCategory: (formData.subCategory || undefined) as any,
                childCategory: (formData.childCategory || undefined) as any,
                subChildCategory: (formData.subChildCategory || undefined) as any,
                brand: (formData.brand || undefined) as any,
            }).unwrap();

            if (res.success) {
                showSuccess('Product Created', `${formData.title} has been added to inventory`);
                router.push('/admin/products');
            }
        } catch (error: any) {
            console.error('Error creating product:', error);
            const msg = error.data?.message || 'Something went wrong';
            showError('Creation Failed', msg);
            setErrors({ submit: msg });
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/products" className="text-gray-900 hover:text-black transition-colors bg-white p-2 rounded-lg border border-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Add New Product</h1>
                        <p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest mt-0.5">Inventory Management System</p>
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0">
                    <Link
                        href="/admin/products"
                        className="px-5 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95"
                    >
                        Cancel
                    </Link>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="btn bg-gray-900 text-white hover:bg-gray-800 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-gray-900/10 active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Creating...' : 'Create Product'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Information Card */}
                    <div className="bg-white p-8 rounded-xl border border-gray-200 space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
                            <div className="w-1.5 h-6 bg-gray-900 rounded-full" />
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Basic Information</h3>
                        </div>

                        <div className="space-y-4">

                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900 mb-2">Product Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className={`w-full bg-white border rounded-lg px-4 py-3 text-sm font-medium text-gray-900 outline-none transition-all placeholder:text-gray-400 ${errors.title ? 'border-rose-600' : 'border-gray-300 focus:border-gray-900'}`}
                                    placeholder="e.g. Premium Cotton T-Shirt"
                                />
                                {errors.title && <p className="text-[10px] text-rose-600 font-bold mt-2 uppercase tracking-tight">{errors.title}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900 mb-2">Base SKU</label>
                                    <input
                                        type="text"
                                        name="sku"
                                        value={formData.sku}
                                        onChange={handleInputChange}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 focus:border-gray-900 transition-all placeholder:text-gray-400 outline-none"
                                        placeholder="PROD-101"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900 mb-2">Short Description</label>
                                <textarea
                                    name="shortDescription"
                                    value={formData.shortDescription}
                                    onChange={handleInputChange}
                                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-normal text-gray-900 focus:border-gray-900 transition-all min-h-[80px] resize-none placeholder:text-gray-400 outline-none"
                                    placeholder="Quick summary for product list..."
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900 mb-2">Full Description</label>
                                <RichTextEditor
                                    value={formData.fullDescription}
                                    onChange={(val) => setFormData(p => ({ ...p, fullDescription: val }))}
                                    placeholder="Detailed product specifications..."
                                />
                            </div>

                            <hr className="border-gray-100 my-4" />

                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900 mb-2">Size Guide <span className="font-normal normal-case text-gray-400">(Optional — upload your size chart)</span></label>
                                <ImageUpload
                                    images={formData.sizeGuide ? [formData.sizeGuide] : []}
                                    onImagesChange={(images) => setFormData((prev) => ({ ...prev, sizeGuide: images.length > 0 ? images[0] : '' }))}
                                    onError={(error) => setErrors((prev) => ({ ...prev, sizeGuideImage: error }))}
                                    aspectRatio="auto"
                                    recommendedSize="800x400px"
                                />
                            </div>
                            
                            <hr className="border-gray-100 my-4" />

                            <div className="flex flex-col gap-3">
                                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900">Product Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, productType: 'single' }))}
                                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${formData.productType === 'single' ? 'bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-900/10' : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-5.25v9" />
                                        </svg>
                                        <span className="text-xs font-bold uppercase tracking-widest">Single Product</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, productType: 'variant' }))}
                                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${formData.productType === 'variant' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/10' : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                        </svg>
                                        <span className="text-xs font-bold uppercase tracking-widest">Variant-based</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Card - Shown for both but adapted for variant mode */}
                    <div className="bg-white p-8 rounded-xl border border-gray-200 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-1.5 h-6 ${formData.productType === 'single' ? 'bg-amber-500' : 'bg-indigo-600'} rounded-full`} />
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                                    {formData.productType === 'single' ? 'Product Pricing and Stock' : 'Global Pricing Defaults'}
                                </h3>
                            </div>
                            {formData.productType === 'variant' && (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsPricingExpanded(!isPricingExpanded)}
                                        className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100 flex items-center gap-1.5"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3 h-3 transition-transform ${isPricingExpanded ? 'rotate-180' : ''}`}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                        </svg>
                                        {isPricingExpanded ? 'Hide Defaults' : 'Show Defaults'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleApplyGlobalToAll}
                                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-100 transition-all active:scale-95 border border-indigo-100"
                                    >
                                        Apply All
                                    </button>
                                </div>
                            )}
                        </div>

                        {(formData.productType === 'single' || isPricingExpanded) && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900">Market Price (MRP)</label>
                                            {formData.productType === 'variant' && (
                                                <button type="button" onClick={() => handleSyncToAllVariants('mrp')} title="Sync to all variants" className="p-1 hover:bg-indigo-50 text-indigo-500 rounded transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 font-semibold">৳</span>
                                            <input
                                                type="number"
                                                name="mrp"
                                                value={formData.mrp}
                                                onChange={handleInputChange}
                                                className={`w-full bg-white border rounded-lg pl-10 pr-4 py-3 text-sm font-medium text-gray-900 focus:border-gray-900 transition-all outline-none ${errors.mrp ? 'border-rose-600' : 'border-gray-300'}`}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900">Selling Price</label>
                                            {formData.productType === 'variant' && (
                                                <button type="button" onClick={() => handleSyncToAllVariants('price')} title="Sync to all variants" className="p-1 hover:bg-indigo-50 text-indigo-500 rounded transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 font-semibold">৳</span>
                                            <input
                                                type="number"
                                                name="price"
                                                value={formData.price}
                                                onChange={handleInputChange}
                                                className={`w-full bg-white border rounded-lg pl-10 pr-4 py-3 text-sm font-medium text-gray-900 focus:border-gray-900 transition-all outline-none ${errors.price ? 'border-rose-600' : 'border-gray-300'}`}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900">Unit cost <span className="text-gray-400 font-normal normal-case">(opt.)</span></label>
                                            {formData.productType === 'variant' && (
                                                <button type="button" onClick={() => handleSyncToAllVariants('productCost')} title="Sync to all variants" className="p-1 hover:bg-indigo-50 text-indigo-500 rounded transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 font-semibold">৳</span>
                                            <input
                                                type="number"
                                                name="productCost"
                                                min={0}
                                                step="0.01"
                                                value={formData.productCost}
                                                onChange={handleInputChange}
                                                className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-sm font-medium text-gray-900 focus:border-gray-900 transition-all outline-none"
                                                placeholder="Leave empty"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900">Discount Type</label>
                                            {formData.productType === 'variant' && (
                                                <button type="button" onClick={() => handleSyncToAllVariants('discountType')} title="Sync to all variants" className="p-1 hover:bg-indigo-50 text-indigo-500 rounded transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <select
                                            name="discountType"
                                            value={formData.discountType}
                                            onChange={handleInputChange}
                                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 focus:border-gray-900 transition-all cursor-pointer outline-none"
                                        >
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="flat">Flat Amount (৳)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900">Discount Value</label>
                                            {formData.productType === 'variant' && (
                                                <button type="button" onClick={() => handleSyncToAllVariants('discountValue')} title="Sync to all variants" className="p-1 hover:bg-indigo-50 text-indigo-500 rounded transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="number"
                                            name="discountValue"
                                            value={formData.discountValue}
                                            onChange={handleInputChange}
                                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 focus:border-gray-900 transition-all outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900">Tax Type</label>
                                            {formData.productType === 'variant' && (
                                                <button type="button" onClick={() => handleSyncToAllVariants('taxType')} title="Sync to all variants" className="p-1 hover:bg-indigo-50 text-indigo-500 rounded transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <select
                                            name="taxType"
                                            value={(formData as any).taxType || 'percentage'}
                                            onChange={handleInputChange}
                                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 focus:border-gray-900 transition-all cursor-pointer outline-none"
                                        >
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="flat">Flat Amount (৳)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900">Tax Value</label>
                                            {formData.productType === 'variant' && (
                                                <button type="button" onClick={() => handleSyncToAllVariants('tax')} title="Sync to all variants" className="p-1 hover:bg-indigo-50 text-indigo-500 rounded transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="number"
                                            name="tax"
                                            value={formData.tax}
                                            onChange={handleInputChange}
                                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 focus:border-gray-900 transition-all outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900">Weight (g)</label>
                                            {formData.productType === 'variant' && (
                                                <button type="button" onClick={() => handleSyncToAllVariants('weight')} title="Sync to all variants" className="p-1 hover:bg-indigo-50 text-indigo-500 rounded transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="number"
                                            name="weight"
                                            value={formData.weight}
                                            onChange={handleInputChange}
                                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 focus:border-gray-900 transition-all outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                    {formData.productType === 'single' ? (
                                        <div>
                                            <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900 mb-2">Inventory Stock</label>
                                            <input
                                                type="number"
                                                name="stock"
                                                value={formData.stock}
                                                onChange={handleInputChange}
                                                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 focus:border-gray-900 transition-all outline-none"
                                                placeholder="0"
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900">Default Stock</label>
                                                <button type="button" onClick={() => handleSyncToAllVariants('stock')} title="Sync to all variants" className="p-1 hover:bg-indigo-50 text-indigo-500 rounded transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <input
                                                type="number"
                                                name="stock"
                                                value={formData.stock}
                                                onChange={handleInputChange}
                                                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 focus:border-gray-900 transition-all outline-none"
                                                placeholder="0"
                                            />
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {formData.productType === 'variant' && (
                        /* Variant Manager Card */
                        <div className="bg-white p-8 rounded-xl border border-gray-200 space-y-6">
                            <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
                                <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Product Variants</h3>
                                <div className="ml-auto text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    Total Stock: <span className="text-indigo-600">{totalVariantStock}</span>
                                </div>
                            </div>
                            <VariantManager
                                variants={formData.variants}
                                onChange={(val) => setFormData(prev => ({ ...prev, variants: val }))}
                                errors={errors}
                                baseSku={formData.sku || ''}
                                defaultMrp={Number(formData.mrp) || 0}
                                defaultPrice={Number(formData.price) || 0}
                                defaultDiscountType={formData.discountType as any}
                                defaultDiscountValue={Number(formData.discountValue) || 0}
                                defaultTax={Number(formData.tax) || 0}
                                onApplyToGlobal={handleApplyToGlobal}
                            />
                        </div>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Organization Card */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
                            <div className="w-1.5 h-6 bg-rose-600 rounded-full" />
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Organization</h3>
                        </div>

                        <div className="space-y-4">
                            <CategoryHierarchySelector
                                category={formData.category}
                                subCategory={formData.subCategory}
                                childCategory={formData.childCategory}
                                subChildCategory={formData.subChildCategory}
                                onChange={(field, val) => setFormData(p => ({ ...p, [field]: val }))}
                                errors={errors}
                            />

                            {/* Brand Selector */}
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900 mb-2">Brand <span className="text-gray-400 normal-case">(optional)</span></label>
                                <select
                                    value={formData.brand}
                                    onChange={(e) => setFormData(p => ({ ...p, brand: e.target.value }))}
                                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 focus:border-gray-900 transition-all cursor-pointer outline-none"
                                >
                                    <option value="">No Brand</option>
                                    {brands.filter((b: any) => b.isActive).map((b: any) => (
                                        <option key={b._id} value={b._id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Toggles */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer group" onClick={() => handleInputChange({ target: { name: 'freeShipping', type: 'checkbox', checked: !formData.freeShipping } })}>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold text-gray-900 group-hover:text-black transition-colors">Free Shipping</span>
                                        <span className="text-[9px] text-gray-400">Waive delivery charge</span>
                                    </div>
                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${formData.freeShipping ? 'bg-black' : 'bg-gray-200'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${formData.freeShipping ? 'left-4.5' : 'left-0.5'}`} />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer group" onClick={() => handleInputChange({ target: { name: 'preorder', type: 'checkbox', checked: !formData.preorder } })}>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold text-gray-900 group-hover:text-black transition-colors">Pre-Order</span>
                                        <span className="text-[9px] text-gray-400">Allow purchase when out of stock</span>
                                    </div>
                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${formData.preorder ? 'bg-black' : 'bg-gray-200'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${formData.preorder ? 'left-4.5' : 'left-0.5'}`} />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer group" onClick={() => handleInputChange({ target: { name: 'isFeatured', type: 'checkbox', checked: !formData.isFeatured } })}>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold text-gray-900 group-hover:text-black transition-colors">Featured Product</span>
                                        <span className="text-[9px] text-gray-400">Display in featured sections</span>
                                    </div>
                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${formData.isFeatured ? 'bg-amber-500' : 'bg-gray-200'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${formData.isFeatured ? 'left-4.5' : 'left-0.5'}`} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900 mb-2">Tags</label>
                                <input
                                    type="text"
                                    name="tags"
                                    value={formData.tags}
                                    onChange={handleInputChange}
                                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 focus:border-gray-900 transition-all placeholder:text-gray-400 outline-none"
                                    placeholder="new, summer, sale"
                                />
                                <p className="text-[10px] text-gray-600 mt-2 font-medium tracking-tight">Use commas to separate tags</p>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900 mb-2">Compatible Models <span className="font-normal normal-case text-gray-400">(opt.)</span></label>
                                <CompatibleModelSelector 
                                    selectedModels={formData.compatibleModels as string[]}
                                    onChange={(models) => setFormData(p => ({ ...p, compatibleModels: models as never[] }))}
                                />
                                <p className="text-[10px] text-gray-600 mt-2 font-medium tracking-tight">Select compatible models or add new ones</p>
                            </div>
                        </div>
                    </div>

                    {/* Images Card */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Product Scene</h3>
                            </div>
                        </div>

                        <ImageUpload
                            images={formData.images.filter(img => img)}
                            onImagesChange={(images) => setFormData((prev) => ({ ...prev, images }))}
                            onError={(error) => setErrors((prev) => ({ ...prev, images: error }))}
                            aspectRatio="1:1"
                            recommendedSize="800x800px"
                        />
                        {errors.images && <p className="text-[10px] text-rose-600 font-bold mt-2 uppercase tracking-tight">{errors.images}</p>}
                    </div>

                    {/* Submit Error */}
                    {errors.submit && (
                        <div className="p-4 bg-white border border-rose-600 text-rose-600 text-xs font-bold rounded-xl uppercase tracking-tight">
                            {errors.submit}
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}
