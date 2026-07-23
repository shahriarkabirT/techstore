'use client';

import { IProduct } from '@/types';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';

interface ProductViewModalProps {
    product: IProduct | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function ProductViewModal({ product, isOpen, onClose }: ProductViewModalProps) {
    if (!isOpen || !product) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white w-full max-w-4xl h-full max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Product Details</h2>
                        <p className="text-[11px] font-semibold text-gray-500 mt-0.5">Quick Inspection View</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-900"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Top Section: Images & Basic Info */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Image Gallery */}
                        <div className="lg:col-span-5 space-y-4">
                            <div className="aspect-square bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden relative group">
                                {product.images?.[0] ? (
                                    <Image
                                        src={product.images[0]}
                                        alt={product.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image Available</div>
                                )}
                            </div>
                            {product.images && product.images.length > 1 && (
                                <div className="grid grid-cols-4 gap-3">
                                    {product.images.slice(1, 5).map((img, idx) => (
                                        <div key={idx} className="aspect-square bg-gray-50 rounded-xl border border-gray-200 overflow-hidden relative">
                                            <Image src={img} alt="" fill className="object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Basic Info */}
                        <div className="lg:col-span-7 space-y-6">
                            <div>
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${product.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-600 border-gray-200'
                                    }`}>
                                    {product.isActive ? 'Published' : 'Draft'}
                                </span>
                                <h1 className="text-2xl font-bold text-gray-900 mt-2 leading-tight tracking-tight">{product.title}</h1>
                                <p className="text-sm text-indigo-600 font-semibold mt-1 font-mono uppercase tracking-tight">SKU: {product.sku || 'N/A'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-[11px] font-bold text-gray-500 mb-1">Market Price (MRP)</p>
                                    <p className="text-lg font-bold text-gray-400 line-through decoration-rose-500/30">{formatCurrency(product.mrp)}</p>
                                </div>
                                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                    <p className="text-[11px] font-bold text-indigo-500 mb-1">Selling Price</p>
                                    <p className="text-lg font-bold text-indigo-600">{formatCurrency(product.price)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-[11px] font-bold text-gray-500 mb-1">Inventory</p>
                                    <p className={`text-sm font-bold ${product.stock > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {product.stock > 0 ? `${product.stock} Units` : 'Out of Stock'}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-[11px] font-bold text-gray-500 mb-1">Weight</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {product.weight ? `${product.weight}g` : 'N/A'}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-[11px] font-bold text-gray-500 mb-1">Discount</p>
                                    <p className="text-sm font-bold text-emerald-600">
                                        {product.discountValue ? (
                                            product.discountType === 'percentage' ? `${product.discountValue}% Off` : `${formatCurrency(product.discountValue)} Off`
                                        ) : 'No Discount'}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-[11px] font-bold text-gray-500 mb-1">Tax Rate</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {product.tax ? `${product.tax}%` : '0%'}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-[11px] font-bold text-gray-500 mb-1">Category & Organization</p>
                                <div className="flex flex-wrap gap-2 items-center">
                                    <span className="text-sm font-bold text-gray-900">{(product.category as any)?.name || 'Uncategorized'}</span>
                                    {product.subCategory && <span className="text-gray-400">/</span>}
                                    {product.subCategory && <span className="text-sm font-medium text-gray-600">{(product.subCategory as any).name}</span>}
                                    {product.tags && product.tags.length > 0 && (
                                        <div className="flex gap-1 ml-auto">
                                            {product.tags.map((tag, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-500 uppercase">{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                            <div className="w-1 h-5 bg-amber-400 rounded-full" />
                            <h3 className="text-sm font-bold text-gray-900">Product Descriptions</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-tight">Short Summary</p>
                                <p className="text-sm text-gray-600 leading-relaxed font-medium italic">
                                    {product.shortDescription || 'No short description provided.'}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-tight">Full Details</p>
                                <div
                                    className="prose prose-sm prose-slate max-w-none max-h-[160px] overflow-y-auto custom-scrollbar pr-2 rich-text-content"
                                    dangerouslySetInnerHTML={{ __html: product.fullDescription || 'No detailed description available.' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Variants Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-5 bg-indigo-500 rounded-full" />
                                <h3 className="text-sm font-bold text-gray-900">Available Variants</h3>
                            </div>
                            <span className="text-[11px] font-bold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full">
                                {product.variants?.length || 0} Options
                            </span>
                        </div>
                        {product.variants && product.variants.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {product.variants.map((v, idx) => (
                                    <div key={v._id || idx} className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3 mb-3">
                                            {v.images && v.images.length > 0 ? (
                                                <div className="w-14 h-14 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 relative shadow-sm">
                                                    <Image src={v.images[0]} alt="" fill className="object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-[10px] font-bold text-gray-400 border border-gray-200 uppercase tracking-tighter">No Img</div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-900 truncate">
                                                    {v.attributes && Object.keys(v.attributes).length > 0
                                                        ? Object.values(v.attributes).join(' / ')
                                                        : [v.size, v.colorName, v.material, v.ram, v.storage].filter(Boolean).join(' / ') || `Variant ${idx + 1}`}
                                                </p>
                                                <p className="text-[10px] font-semibold text-indigo-600 font-mono tracking-tight truncate">{v.sku || 'NO-SKU'}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <span className="font-semibold text-gray-500">Stock</span>
                                                <span className={`font-bold ${v.stock > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{v.stock}</span>
                                            </div>
                                            
                                            {/* Dynamic Attributes */}
                                            {v.attributes && Object.entries(v.attributes).map(([key, val]) => (
                                                <div key={key} className="flex justify-between border-b border-gray-50 pb-1">
                                                    <span className="font-semibold text-gray-500 capitalize">{key}</span>
                                                    {key === 'color' && v.colorCode ? (
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <div className="w-2.5 h-2.5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: v.colorCode }} />
                                                            <span className="font-bold text-gray-900 truncate">{String(val)}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="font-bold text-gray-900">{String(val)}</span>
                                                    )}
                                                </div>
                                            ))}
                                            
                                            {/* Fallback for legacy fields if no attributes present */}
                                            {(!v.attributes || Object.keys(v.attributes).length === 0) && (
                                                <>
                                                    <div className="flex justify-between border-b border-gray-50 pb-1">
                                                        <span className="font-semibold text-gray-500">Size</span>
                                                        <span className="font-bold text-gray-900">{v.size || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between border-b border-gray-50 pb-1">
                                                        <span className="font-semibold text-gray-500">Color</span>
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <div className="w-2.5 h-2.5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: v.colorCode || '#ddd' }} />
                                                            <span className="font-bold text-gray-900 truncate">{v.colorName || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <span className="font-semibold text-gray-500">Price</span>
                                                <span className="font-bold text-indigo-600">{formatCurrency(v.price)}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <span className="font-semibold text-gray-500">MRP</span>
                                                <span className="font-bold text-gray-400 line-through">{formatCurrency(v.mrp)}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <span className="font-semibold text-gray-500">Discount</span>
                                                <span className="font-bold text-emerald-600">
                                                    {v.discountValue ? (v.discountType === 'percentage' ? `${v.discountValue}%` : formatCurrency(v.discountValue)) : '0'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <span className="font-semibold text-gray-500">Weight</span>
                                                <span className="font-bold text-gray-900">{v.weight ? `${v.weight}g` : 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <span className="font-semibold text-gray-500">Tax</span>
                                                <span className="font-bold text-gray-900">{v.tax || 0}%</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-8 rounded-2xl border border-dashed border-gray-200 text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No variants configured for this product.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 sm:flex-none px-8 py-3 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-lg shadow-gray-200"
                    >
                        Close View
                    </button>
                    <div className="flex-1 sm:flex-none flex gap-3">
                        {/* Placeholder for potential edit link if needed in footer */}
                    </div>
                </div>
            </div>
        </div>
    );
}
