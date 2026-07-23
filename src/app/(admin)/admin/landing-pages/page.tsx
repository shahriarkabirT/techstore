'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import {
    Plus,
    Trash2,
    Copy,
    ExternalLink,
    Eye,
    ShoppingCart,
    ToggleLeft,
    ToggleRight,
    Search,
    Loader2,
    Link2,
    TrendingUp,
    X,
    Rocket,
    Edit2,
} from 'lucide-react';
import Link from 'next/link';
import ImageUpload from '@/components/shared/ImageUpload';

interface LandingPageData {
    _id: string;
    product: {
        _id: string;
        title: string;
        slug: string;
        images: string[];
        price: number;
        mrp: number;
        discountedPrice?: number;
        stock: number;
        isActive: boolean;
    };
    slug: string;
    customTitle: string;
    customDescription: string;
    isActive: boolean;
    views: number;
    orders: number;
    createdAt: string;
}

interface ProductOption {
    _id: string;
    title: string;
    slug: string;
    images: string[];
    price: number;
    stock: number;
}

export default function LandingPagesAdmin() {
    const [landingPages, setLandingPages] = useState<LandingPageData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create form state
    const [products, setProducts] = useState<ProductOption[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
    const [customSlug, setCustomSlug] = useState('');
    const [headerTitle, setHeaderTitle] = useState('');
    const [customTitle, setCustomTitle] = useState('');
    const [customDescription, setCustomDescription] = useState('');
    const [templateType, setTemplateType] = useState<'standard' | 'combo'>('standard');
    const [freeShipping, setFreeShipping] = useState(false);
    const [bannerImage, setBannerImage] = useState('');
    const [reviewImages, setReviewImages] = useState<string[]>([]);
    const [offer, setOffer] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    
    // Combo fields
    const [offerEndTime, setOfferEndTime] = useState('');
    const [comboProducts, setComboProducts] = useState<ProductOption[]>([]);
    const [comboSearch, setComboSearch] = useState('');
    const [comboSearchResults, setComboSearchResults] = useState<ProductOption[]>([]);
    const [isSearchingCombo, setIsSearchingCombo] = useState(false);

    useEffect(() => {
        fetchLandingPages();
    }, []);

    const fetchLandingPages = async () => {
        try {
            setIsLoading(true);
            const res = await axios.get('/api/admin/landing-pages');
            if (res.data.success) {
                setLandingPages(res.data.landingPages);
            }
        } catch {
            toast.error('Failed to load landing pages');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchInitialProducts = async () => {
        try {
            setIsLoadingProducts(true);
            const res = await axios.get('/api/products?limit=10');
            if (res.data.success) {
                setProducts(res.data.products || []);
            }
        } catch {
            // silent fail
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const searchProducts = async (query: string) => {
        setProductSearch(query);
        if (query.length === 0) {
            fetchInitialProducts();
            return;
        }
        try {
            setIsLoadingProducts(true);
            const res = await axios.get(`/api/products?search=${encodeURIComponent(query)}&limit=10`);
            if (res.data.success) {
                setProducts(res.data.products || []);
            }
        } catch {
            // silent fail
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const searchComboProducts = async (query: string) => {
        setComboSearch(query);
        try {
            setIsSearchingCombo(true);
            const url = query.length > 0 
                ? `/api/products?search=${encodeURIComponent(query)}&limit=10`
                : `/api/products?limit=10`;
            const res = await axios.get(url);
            if (res.data.success) {
                setComboSearchResults(res.data.products || []);
            }
        } catch {
        } finally {
            setIsSearchingCombo(false);
        }
    };

    const addComboProduct = (product: ProductOption) => {
        if (!comboProducts.find(p => p._id === product._id)) {
            setComboProducts(prev => [...prev, product]);
        }
        setComboSearch('');
        setComboSearchResults([]);
    };

    const removeComboProduct = (productId: string) => {
        setComboProducts(prev => prev.filter(p => p._id !== productId));
    };

    const handleCreate = async () => {
        if (!selectedProduct) return toast.error('Please select a product');
        setIsCreating(true);
        try {
            const res = await axios.post('/api/admin/landing-pages', {
                productId: selectedProduct._id,
                slug: customSlug || undefined,
                headerTitle: headerTitle || undefined,
                customTitle: customTitle || undefined,
                customDescription: customDescription || undefined,
                bannerImage: bannerImage || undefined,
                templateType,
                offerEndTime: templateType === 'combo' && offerEndTime ? new Date(offerEndTime).toISOString() : undefined,
                comboProducts: templateType === 'combo' ? comboProducts.map(p => p._id) : undefined,
                freeShipping,
                reviewImages: reviewImages.length > 0 ? reviewImages : undefined,
                offer: offer || undefined,
            });
            if (res.data.success) {
                toast.success('Landing page created!');
                setShowCreateModal(false);
                resetForm();
                fetchLandingPages();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create');
        } finally {
            setIsCreating(false);
        }
    };

    const handleToggle = async (id: string, currentActive: boolean) => {
        try {
            await axios.put(`/api/admin/landing-pages/${id}`, { isActive: !currentActive });
            setLandingPages(prev =>
                prev.map(lp => lp._id === id ? { ...lp, isActive: !currentActive } : lp)
            );
            toast.success(currentActive ? 'Landing page deactivated' : 'Landing page activated');
        } catch {
            toast.error('Failed to update');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this landing page?')) return;
        try {
            await axios.delete(`/api/admin/landing-pages/${id}`);
            setLandingPages(prev => prev.filter(lp => lp._id !== id));
            toast.success('Landing page deleted');
        } catch {
            toast.error('Failed to delete');
        }
    };

    const copyLink = (slug: string) => {
        const url = `${window.location.origin}/p/${slug}`;
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
    };

    const resetForm = () => {
        setSelectedProduct(null);
        setCustomSlug('');
        setHeaderTitle('');
        setCustomTitle('');
        setCustomDescription('');
        setBannerImage('');
        setReviewImages([]);
        setOffer('');
        setTemplateType('standard');
        setFreeShipping(false);
        setProductSearch('');
        setProducts([]);
        setOfferEndTime('');
        setComboProducts([]);
        setComboSearch('');
        setComboSearchResults([]);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Rocket className="w-6 h-6 text-primary" />
                        Landing Pages
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Generate high-conversion product landing pages</p>
                </div>
                <button onClick={() => { setShowCreateModal(true); fetchInitialProducts(); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-xl transition-all">
                    <Plus className="w-4 h-4" />
                    Create Landing Page
                </button>
            </div>

            {/* Stats */}
            {landingPages.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg"><Link2 className="w-4 h-4 text-blue-600" /></div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{landingPages.length}</p>
                                <p className="text-xs text-gray-500">Total Pages</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 rounded-lg"><Eye className="w-4 h-4 text-purple-600" /></div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{landingPages.reduce((s, l) => s + l.views, 0)}</p>
                                <p className="text-xs text-gray-500">Total Views</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 rounded-lg"><ShoppingCart className="w-4 h-4 text-emerald-600" /></div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{landingPages.reduce((s, l) => s + l.orders, 0)}</p>
                                <p className="text-xs text-gray-500">Total Orders</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Landing Pages Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : landingPages.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                    <Rocket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-700 mb-1">No Landing Pages Yet</h3>
                    <p className="text-sm text-gray-400 mb-6">Create your first product landing page to start driving conversions</p>
                    <button onClick={() => { setShowCreateModal(true); fetchInitialProducts(); }}
                        className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm">
                        <Plus className="w-4 h-4 inline mr-1" /> Create First Page
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-50 bg-gray-50/50">
                                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">Product</th>
                                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">Slug</th>
                                    <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                    <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">Views</th>
                                    <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">Orders</th>
                                    <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">Rate</th>
                                    <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {landingPages.map(lp => {
                                    const rate = lp.views > 0 ? ((lp.orders / lp.views) * 100).toFixed(1) : '0.0';
                                    return (
                                        <tr key={lp._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {lp.product?.images?.[0] && (
                                                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                                                            <Image src={lp.product.images[0]} alt="" fill className="object-cover" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-gray-900 truncate max-w-[200px]">{lp.customTitle || lp.product?.title}</p>
                                                        <p className="text-[10px] text-gray-400">
                                                            {lp.product?.price ? formatCurrency(lp.product.price) : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-xs bg-gray-50 px-2 py-1 rounded border border-gray-100">/p/{lp.slug}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => handleToggle(lp._id, lp.isActive)}
                                                    className="transition-all hover:scale-110">
                                                    {lp.isActive
                                                        ? <ToggleRight className="w-6 h-6 text-emerald-500" />
                                                        : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1 text-gray-600">
                                                    <Eye className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="font-bold">{lp.views}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1 text-gray-600">
                                                    <ShoppingCart className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="font-bold">{lp.orders}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                                                    <span className="font-bold text-primary">{rate}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => copyLink(lp.slug)} title="Copy Link"
                                                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors">
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                    <Link href={`/admin/landing-pages/edit/${lp._id}`} title="Edit Landing Page"
                                                        className="p-2 hover:bg-amber-50 rounded-lg text-amber-500 transition-colors">
                                                        <Edit2 className="w-4 h-4" />
                                                    </Link>
                                                    <button onClick={() => window.open(`/p/${lp.slug}`, '_blank')} title="Preview Mode"
                                                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(lp._id)} title="Delete"
                                                        className="p-2 hover:bg-rose-50 rounded-lg text-rose-400 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className={`bg-white rounded-2xl shadow-2xl w-full border border-gray-100 flex flex-col max-h-[90vh] ${templateType === 'combo' ? 'max-w-4xl' : 'max-w-lg'}`}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Rocket className="w-5 h-5 text-primary" />
                                Create Landing Page
                            </h2>
                            <button onClick={() => { setShowCreateModal(false); resetForm(); }}
                                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className={templateType === 'combo' ? 'grid grid-cols-1 md:grid-cols-2 gap-8' : 'space-y-4'}>
                                
                                {/* Left side: Basic info */}
                                <div className="space-y-4">
                                    {/* Product Search */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Select Product *</label>
                                        {selectedProduct ? (
                                            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
                                                {selectedProduct.images?.[0] && (
                                                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                                                        <Image src={selectedProduct.images[0]} alt="" fill className="object-cover" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm text-gray-900 truncate">{selectedProduct.title}</p>
                                                </div>
                                                <button onClick={() => { setSelectedProduct(null); setProductSearch(''); }}
                                                    className="p-1 hover:bg-white/50 rounded-full text-gray-400">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input type="text" placeholder="Search products..."
                                                    value={productSearch} onChange={e => searchProducts(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                                                {isLoadingProducts && (
                                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
                                                )}
                                                {products.length > 0 && (
                                                    <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl border border-gray-200 shadow-xl z-50 max-h-48 overflow-y-auto">
                                                        {products.map(p => (
                                                            <button key={p._id} onClick={() => { setSelectedProduct(p); setProducts([]); setProductSearch(''); }}
                                                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left">
                                                                {p.images?.[0] && (
                                                                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                                                                        <Image src={p.images[0]} alt="" fill className="object-cover" />
                                                                    </div>
                                                                )}
                                                                <span className="text-sm font-medium text-gray-900 truncate">{p.title}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Template Type */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Template Type</label>
                                        <select 
                                            value={templateType} 
                                            onChange={e => setTemplateType(e.target.value as 'standard' | 'combo')}
                                            className="w-full px-4 py-3 mt-1 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                                        >
                                            <option value="standard">Standard Single Product</option>
                                            <option value="combo">Dynamic Combo Offer</option>
                                        </select>
                                    </div>

                                    <div
                                        className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100 cursor-pointer"
                                        onClick={() => setFreeShipping(!freeShipping)}
                                    >
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Free delivery on this landing page</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Entire order ships free (all products)</p>
                                        </div>
                                        <div className={`w-11 h-6 rounded-full relative transition-colors ${freeShipping ? 'bg-emerald-600' : 'bg-gray-200'}`}>
                                            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${freeShipping ? 'left-5' : 'left-0.5'}`} />
                                        </div>
                                    </div>

                                    {/* Custom Slug */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Custom URL Slug <span className="text-gray-400 font-normal">(optional)</span></label>
                                        <div className="flex items-center gap-0 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all">
                                            <span className="px-3 py-3 bg-gray-50 text-xs text-gray-400 font-mono border-r border-gray-200 shrink-0">/p/</span>
                                            <input type="text" placeholder="custom-url-slug"
                                                value={customSlug} onChange={e => setCustomSlug(e.target.value)}
                                                className="flex-1 px-3 py-3 text-sm focus:outline-none font-mono" />
                                        </div>
                                        <p className="text-[10px] text-gray-400">Leave empty to auto-generate from product title</p>
                                    </div>

                                    {/* Custom Title */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Top Header Text <span className="text-gray-400 font-normal">(optional)</span></label>
                                        <input type="text" placeholder="Text for the top sticky bar..."
                                            value={headerTitle} onChange={e => setHeaderTitle(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                                    </div>

                                    {/* Custom Title */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Custom Title <span className="text-gray-400 font-normal">(optional)</span></label>
                                        <input type="text" placeholder="Override product title..."
                                            value={customTitle} onChange={e => setCustomTitle(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                                    </div>

                                    {/* Custom Description */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Custom Description <span className="text-gray-400 font-normal">(optional)</span></label>
                                        <textarea placeholder="Override product description..."
                                            value={customDescription} onChange={e => setCustomDescription(e.target.value)} rows={2}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
                                    </div>

                                    {/* Offer text */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Offer Banner Text <span className="text-gray-400 font-normal">(optional)</span></label>
                                        <input type="text" placeholder="e.g. যেকোনো দুইটি পারফিউম কম্বো অর্ডার করলেই পাচ্ছেন আরো ২টি সম্পূর্ণ ফ্রী!"
                                            value={offer} onChange={e => setOffer(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                                    </div>

                                    {/* Banner Image */}
                                    <div className="space-y-2 pb-4">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Hero Banner Image <span className="text-gray-400 font-normal">(optional)</span></label>
                                        <ImageUpload 
                                            images={bannerImage ? [bannerImage] : []}
                                            onImagesChange={(imgs) => setBannerImage(imgs[0] || '')}
                                            aspectRatio="16:9"
                                            recommendedSize="1920x1080px or 1200x600px"
                                        />
                                    </div>

                                    {/* Customer Review Images */}
                                    <div className="space-y-2 pb-4">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Customer Review Images <span className="text-gray-400 font-normal">(Max 10)</span></label>
                                        <ImageUpload 
                                            images={reviewImages}
                                            onImagesChange={(imgs) => setReviewImages(imgs.slice(0, 10))}
                                            maxImages={10}
                                            allowMultiple={true}
                                            aspectRatio="2:3"
                                            recommendedSize="800x1200px (portrait)"
                                        />
                                    </div>
                                </div>

                                {/* Right side: Combo settings */}
                                {templateType === 'combo' && (
                                    <div className="space-y-6 md:border-l md:border-gray-100 md:pl-8">
                                        {/* Offer Timer */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Offer End Time</label>
                                            <input 
                                                type="datetime-local" 
                                                value={offerEndTime}
                                                onChange={e => setOfferEndTime(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            />
                                            <p className="text-[10px] text-gray-400">Leave empty to disable countdown timer.</p>
                                        </div>

                                        {/* Combo Products Search */}
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Combo Products ({comboProducts.length})</label>
                                            
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input type="text" placeholder="Search products to add..."
                                                    value={comboSearch} 
                                                    onChange={e => searchComboProducts(e.target.value)}
                                                    onFocus={() => { if (!comboSearch) searchComboProducts(''); }}
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                                {isSearchingCombo && (
                                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
                                                )}
                                                {comboSearchResults.length > 0 && (
                                                    <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl border border-gray-200 shadow-xl z-20 max-h-48 overflow-y-auto">
                                                        {comboSearchResults.map(p => (
                                                            <button key={p._id} onClick={() => addComboProduct(p)}
                                                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left">
                                                                {p.images?.[0] && (
                                                                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                                                                        <Image src={p.images[0]} alt="" fill className="object-cover" />
                                                                    </div>
                                                                )}
                                                                <span className="text-sm font-medium text-gray-900 truncate">{p.title}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Selected Combo Products */}
                                            {comboProducts.length > 0 && (
                                                <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-2">
                                                    {comboProducts.map(p => (
                                                        <div key={p._id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                {p.images?.[0] && (
                                                                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                                                                        <Image src={p.images[0]} alt="" fill className="object-cover" />
                                                                    </div>
                                                                )}
                                                                <p className="font-bold text-sm text-gray-900 truncate">{p.title}</p>
                                                            </div>
                                                            <button onClick={() => removeComboProduct(p._id)}
                                                                className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors shrink-0">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                            <button onClick={() => { setShowCreateModal(false); resetForm(); }}
                                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleCreate} disabled={isCreating || !selectedProduct}
                                className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2 transition-all">
                                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                                Create Page
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
}
