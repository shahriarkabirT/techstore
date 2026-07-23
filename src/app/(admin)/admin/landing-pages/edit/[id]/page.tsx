'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Loader2, Save, Plus, Trash2, Rocket, Search, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import RichTextEditor from '@/components/shared/RichTextEditor';
import ImageUpload from '@/components/shared/ImageUpload';

interface LandingPageData {
    _id: string;
    slug: string;
    headerTitle: string;
    customTitle: string;
    customDescription: string;
    bannerImage: string;
    reviewImages: string[];
    customDetails: string;
    whyChooseUs: { title: string; description: string; icon: string }[];
    faqs: { question: string; answer: string }[];
    product: any;
    templateType: 'standard' | 'combo';
    offerEndTime: string;
    comboProducts: any[];
    freeShipping?: boolean;
    offer?: string;
}

interface ProductOption {
    _id: string;
    title: string;
    images: string[];
}

export default function EditLandingPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState<Partial<LandingPageData>>({
        slug: '',
        headerTitle: '',
        customTitle: '',
        customDescription: '',
        bannerImage: '',
        reviewImages: [],
        customDetails: '',
        whyChooseUs: [],
        faqs: [],
        templateType: 'standard',
        offerEndTime: '',
        comboProducts: [],
        freeShipping: false,
        product: null,
        offer: '',
    });

    const [products, setProducts] = useState<ProductOption[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    useEffect(() => {
        const fetchLandingPage = async () => {
            try {
                const res = await axios.get(`/api/admin/landing-pages/${id}`);
                if (res.data.success) {
                    const lp = res.data.landingPage;
                    setFormData({
                        slug: lp.slug || '',
                        headerTitle: lp.headerTitle || '',
                        customTitle: lp.customTitle || '',
                        customDescription: lp.customDescription || '',
                        bannerImage: lp.bannerImage || '',
                        reviewImages: lp.reviewImages || [],
                        customDetails: lp.customDetails || '',
                        whyChooseUs: lp.whyChooseUs || [],
                        faqs: lp.faqs || [],
                        templateType: lp.templateType || 'standard',
                        offerEndTime: lp.offerEndTime ? new Date(lp.offerEndTime).toISOString().slice(0, 16) : '',
                        comboProducts: lp.comboProducts || [],
                        freeShipping: lp.freeShipping ?? false,
                        product: lp.product || null,
                        offer: lp.offer || '',
                    });
                }
            } catch (error) {
                toast.error('Failed to load landing page data');
                router.push('/admin/landing-pages');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchLandingPage();
    }, [id, router]);

    const searchProducts = async (query: string) => {
        setProductSearch(query);
        if (query.length === 0) {
            setProducts([]);
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

    const addComboProduct = (product: ProductOption) => {
        const currentCombo = formData.comboProducts || [];
        if (!currentCombo.find(p => p._id === product._id)) {
            setFormData(prev => ({ ...prev, comboProducts: [...currentCombo, product] }));
        }
        setProductSearch('');
        setProducts([]);
    };

    const removeComboProduct = (productId: string) => {
        const currentCombo = formData.comboProducts || [];
        setFormData(prev => ({ ...prev, comboProducts: currentCombo.filter(p => p._id !== productId) }));
    };

    const handleSave = async () => {
        if (!formData.product) {
            toast.error('Please select a main product');
            return;
        }
        setIsSaving(true);
        try {
            const dataToSave = {
                ...formData,
                product: formData.product?._id,
                comboProducts: formData.comboProducts?.map(p => p._id || p)
            };
            const res = await axios.put(`/api/admin/landing-pages/${id}`, dataToSave);
            if (res.data.success) {
                toast.success('Landing page updated successfully!');
                router.push('/admin/landing-pages');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update');
        } finally {
            setIsSaving(false);
        }
    };

    // Array handlers
    const addFaq = () => setFormData(prev => ({ ...prev, faqs: [...(prev.faqs || []), { question: '', answer: '' }] }));
    const updateFaq = (index: number, field: string, value: string) => {
        const newFaqs = [...(formData.faqs || [])];
        newFaqs[index] = { ...newFaqs[index], [field]: value };
        setFormData(prev => ({ ...prev, faqs: newFaqs }));
    };
    const removeFaq = (index: number) => {
        const newFaqs = [...(formData.faqs || [])];
        newFaqs.splice(index, 1);
        setFormData(prev => ({ ...prev, faqs: newFaqs }));
    };

    const addWhyChooseUs = () => setFormData(prev => ({ ...prev, whyChooseUs: [...(prev.whyChooseUs || []), { title: '', description: '', icon: '' }] }));
    const updateWhyChooseUs = (index: number, field: string, value: string) => {
        const newWhyList = [...(formData.whyChooseUs || [])];
        newWhyList[index] = { ...newWhyList[index], [field]: value };
        setFormData(prev => ({ ...prev, whyChooseUs: newWhyList }));
    };
    const removeWhyChooseUs = (index: number) => {
        const newWhyList = [...(formData.whyChooseUs || [])];
        newWhyList.splice(index, 1);
        setFormData(prev => ({ ...prev, whyChooseUs: newWhyList }));
    };

    if (isLoading) {
        return (
            <div className="p-10 flex justify-center items-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                <Link href="/admin/landing-pages" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Rocket className="w-6 h-6 text-primary" />
                        Edit Landing Page
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Configure advanced landing page blocks</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Edit Area */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Basic Info */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Basic Information</h2>
                        
                        {/* Main Product Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Select Main Product *</label>
                            {formData.product ? (
                                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
                                    {formData.product.images?.[0] && (
                                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                                            <Image src={formData.product.images[0]} alt="" fill className="object-cover" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-gray-900 truncate">{formData.product.title}</p>
                                    </div>
                                    <button onClick={() => { setFormData({ ...formData, product: null }); setProductSearch(''); }}
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
                                                <button key={p._id} onClick={() => { setFormData({ ...formData, product: p }); setProducts([]); setProductSearch(''); }}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0">
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

                        <div>
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Template Type</label>
                            <select 
                                value={formData.templateType || 'standard'} 
                                onChange={e => setFormData({ ...formData, templateType: e.target.value as 'standard' | 'combo' })}
                                className="w-full px-4 py-3 mt-1 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                            >
                                <option value="standard">Standard Single Product</option>
                                <option value="combo">Dynamic Combo Offer</option>
                            </select>
                        </div>

                        <div
                            className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100 cursor-pointer"
                            onClick={() => setFormData({ ...formData, freeShipping: !formData.freeShipping })}
                        >
                            <div>
                                <p className="text-sm font-bold text-gray-900">Free delivery on this landing page</p>
                                <p className="text-xs text-gray-500 mt-0.5">Entire order ships free (all products in cart)</p>
                            </div>
                            <div className={`w-11 h-6 rounded-full relative transition-colors ${formData.freeShipping ? 'bg-emerald-600' : 'bg-gray-200'}`}>
                                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${formData.freeShipping ? 'left-5' : 'left-0.5'}`} />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Custom URL Slug</label>
                            <input type="text" value={formData.slug || ''} onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                className="w-full px-4 py-3 mt-1 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Top Header Text</label>
                            <input type="text" value={formData.headerTitle || ''} onChange={e => setFormData({ ...formData, headerTitle: e.target.value })}
                                placeholder="Text for the top sticky bar..."
                                className="w-full px-4 py-3 mt-1 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Custom Title</label>
                            <input type="text" value={formData.customTitle || ''} onChange={e => setFormData({ ...formData, customTitle: e.target.value })}
                                className="w-full px-4 py-3 mt-1 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Custom Description</label>
                            <textarea rows={3} value={formData.customDescription || ''} onChange={e => setFormData({ ...formData, customDescription: e.target.value })}
                                className="w-full px-4 py-3 mt-1 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Offer Banner Text <span className="text-gray-400 font-normal">(optional)</span></label>
                            <input type="text" value={formData.offer || ''} onChange={e => setFormData({ ...formData, offer: e.target.value })}
                                placeholder="e.g. যেকোনো দুইটি পারফিউম কম্বো অর্ডার করলেই পাচ্ছেন আরো ২টি সম্পূর্ণ ফ্রী!"
                                className="w-full px-4 py-3 mt-1 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                    </div>

                    {/* Combo Template Extra Fields */}
                    {formData.templateType === 'combo' && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Combo Offer Settings</h2>
                            
                            <div>
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Offer End Time</label>
                                <input type="datetime-local" value={formData.offerEndTime || ''} onChange={e => setFormData({ ...formData, offerEndTime: e.target.value })}
                                    className="w-full px-4 py-3 mt-1 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Combo Products ({formData.comboProducts?.length || 0})</label>
                                
                                {/* Selected Combo Products */}
                                {formData.comboProducts && formData.comboProducts.length > 0 && (
                                    <div className="flex flex-col gap-2">
                                        {formData.comboProducts.map(p => (
                                            <div key={p._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                                {p.images?.[0] && (
                                                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-white">
                                                        <Image src={p.images[0]} alt="" fill className="object-cover" />
                                                    </div>
                                                )}
                                                <p className="font-bold text-sm text-gray-900 flex-1 truncate">{p.title}</p>
                                                <button onClick={() => removeComboProduct(p._id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Product Search for Combo */}
                                <div className="relative mt-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="text" placeholder="Search products to add to combo..."
                                        value={productSearch} onChange={e => searchProducts(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                    {isLoadingProducts && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />}
                                    
                                    {products.length > 0 && (
                                        <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl border border-gray-200 shadow-xl z-50 max-h-60 overflow-y-auto">
                                            {products.map(p => (
                                                <button key={p._id} onClick={() => addComboProduct(p)}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0">
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
                            </div>
                        </div>
                    )}

                    {/* Banner Image */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Banner Image</h2>
                        <ImageUpload 
                            images={formData.bannerImage ? [formData.bannerImage] : []}
                            onImagesChange={(imgs) => setFormData({...formData, bannerImage: imgs[0] || ''})}
                            aspectRatio="16:9"
                            recommendedSize="1920x1080px or 1200x600px"
                        />
                    </div>

                    {/* Customer Review Images */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Customer Review Images (Max 10)</h2>
                        <ImageUpload 
                            images={formData.reviewImages || []}
                            onImagesChange={(imgs) => setFormData({...formData, reviewImages: imgs.slice(0, 10)})}
                            maxImages={10}
                            allowMultiple={true}
                            aspectRatio="2:3"
                            recommendedSize="800x1200px (portrait)"
                        />
                    </div>

                    {/* Rich Text Details */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Custom Details (Optional)</h2>
                        <p className="text-xs text-gray-500">Overrides the standard product description. Use HTML/Rich formatting.</p>
                        <RichTextEditor 
                            value={formData.customDetails || ''} 
                            onChange={(val) => setFormData({...formData, customDetails: val})}
                        />
                    </div>
                </div>

                {/* Sidebar Edit Area */}
                <div className="space-y-6">
                    
                    {/* Why Choose Us */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h2 className="text-base font-bold text-gray-900">Why Choose Us</h2>
                            <button onClick={addWhyChooseUs} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {(formData.whyChooseUs || []).map((item, i) => (
                                <div key={i} className="p-3 bg-gray-50 rounded-xl relative border border-gray-100">
                                    <button onClick={() => removeWhyChooseUs(i)} className="absolute top-2 right-2 p-1 text-rose-500 hover:bg-rose-50 rounded">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                    <input type="text" placeholder="Title (e.g. Fast Delivery)" value={item.title} onChange={e => updateWhyChooseUs(i, 'title', e.target.value)}
                                        className="w-full text-sm mb-2 p-2 rounded border border-gray-200" />
                                    <textarea placeholder="Description" rows={2} value={item.description} onChange={e => updateWhyChooseUs(i, 'description', e.target.value)}
                                        className="w-full text-xs p-2 rounded border border-gray-200 resize-none" />
                                </div>
                            ))}
                            {(formData.whyChooseUs || []).length === 0 && <p className="text-xs text-gray-400">Add points to build trust.</p>}
                        </div>
                    </div>

                    {/* FAQs */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h2 className="text-base font-bold text-gray-900">FAQs</h2>
                            <button onClick={addFaq} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {(formData.faqs || []).map((faq, i) => (
                                <div key={i} className="p-3 bg-gray-50 rounded-xl relative border border-gray-100">
                                    <button onClick={() => removeFaq(i)} className="absolute top-2 right-2 p-1 text-rose-500 hover:bg-rose-50 rounded">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                    <input type="text" placeholder="Question" value={faq.question} onChange={e => updateFaq(i, 'question', e.target.value)}
                                        className="w-full font-bold text-sm mb-2 p-2 rounded border border-gray-200 pr-8" />
                                    <textarea placeholder="Answer" rows={3} value={faq.answer} onChange={e => updateFaq(i, 'answer', e.target.value)}
                                        className="w-full text-sm p-2 rounded border border-gray-200 resize-none" />
                                </div>
                            ))}
                            {(formData.faqs || []).length === 0 && <p className="text-xs text-gray-400">Add frequently asked questions.</p>}
                        </div>
                    </div>

                </div>
            </div>

            {/* Sticky Save Bar */}
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 flex justify-end px-6 z-40">
                <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg disabled:opacity-50 transition-all hover:shadow-xl"
                >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Changes
                </button>
            </div>
            
            {/* Safe spacing for sticky bar */}
            <div className="h-16"></div>
        </div>
    );
}
