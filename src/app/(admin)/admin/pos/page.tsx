'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Search, ShoppingCart, Plus, Minus, Trash2, Printer, X, CheckCircle, User as UserIcon, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import axios from 'axios';
import { useDebounce } from '@/hooks/useDebounce';

// --- Interfaces ---
interface POSProduct {
    _id: string;
    title: string;
    images: string[];
    price: number;
    discountedPrice: number;
    stock: number;
    sku?: string;
    variants: any[];
    tax: number;
    taxType: string;
}

interface CartItem extends POSProduct {
    cartItemId: string;
    quantity: number;
    selectedVariant?: any;
}

interface Customer {
    name: string;
    phone: string;
}

export default function POSTerminal() {
    const [products, setProducts] = useState<POSProduct[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const PRODUCTS_PER_PAGE = 24;
    
    // Checkout state
    const [customer, setCustomer] = useState<Customer>({ name: '', phone: '' });
    const [isWalkIn, setIsWalkIn] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState<'Cash'|'Card'|'Digital'>('Cash');
    const [amountTendered, setAmountTendered] = useState<number>(0);
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState<number>(0);
    const [couponError, setCouponError] = useState('');
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [brandName, setBrandName] = useState('My Store');
    
    const [receiptData, setReceiptData] = useState<any>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const barcodeBuffer = useRef<string>('');
    const barcodeTimeout = useRef<NodeJS.Timeout | null>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Variant modal state
    const [variantModalProduct, setVariantModalProduct] = useState<POSProduct | null>(null);

    // Fetch Products (with pagination)
    const fetchProducts = useCallback(async (search = '', category = 'all', page = 1, append = false) => {
        if (append) {
            setIsLoadingMore(true);
        } else {
            setIsLoading(true);
        }
        try {
            const res = await axios.get('/api/pos/products', {
                params: { search, category, limit: PRODUCTS_PER_PAGE, page }
            });
            if (res.data.success) {
                if (append) {
                    setProducts(prev => [...prev, ...res.data.products]);
                } else {
                    setProducts(res.data.products);
                }
                setCurrentPage(res.data.pagination.page);
                setTotalPages(res.data.pagination.pages);
                setTotalProducts(res.data.pagination.total);
            }
        } catch (error) {
            toast.error('Failed to fetch products');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    const handleLoadMore = useCallback(() => {
        if (currentPage < totalPages && !isLoadingMore) {
            fetchProducts(searchTerm, activeCategory, currentPage + 1, true);
        }
    }, [currentPage, totalPages, isLoadingMore, searchTerm, activeCategory, fetchProducts]);

    // Infinite scroll observer
    useEffect(() => {
        const el = loadMoreRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    handleLoadMore();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [handleLoadMore]);

    const handleCategoryChange = useCallback((catId: string) => {
        setActiveCategory(catId);
        setCurrentPage(1);
        fetchProducts(searchTerm, catId, 1, false);
    }, [searchTerm, fetchProducts]);

    const debouncedSearchTerm = useDebounce(searchTerm, 350);

    // Use a ref so the search effect always reads the latest activeCategory
    // without adding it as a dep (which would cause double-fetch on category change,
    // since handleCategoryChange already calls fetchProducts directly).
    const activeCategoryRef = useRef(activeCategory);
    activeCategoryRef.current = activeCategory;

    useEffect(() => {
        setCurrentPage(1);
        fetchProducts(debouncedSearchTerm, activeCategoryRef.current, 1, false);
    }, [debouncedSearchTerm, fetchProducts]);

    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value);
    }, []);

    // Fetch Categories and Settings
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get('/api/categories');
                if (res.data.success) setCategories(res.data.categories);
            } catch (error) {}
        };
        const fetchSettings = async () => {
            try {
                const res = await axios.get('/api/settings/general');
                if (res.data.success && res.data.settings?.brandName) {
                    setBrandName(res.data.settings.brandName);
                }
            } catch (error) {}
        };
        fetchCategories();
        fetchSettings();
        fetchProducts();
    }, [fetchProducts]);

    // Cart Actions
    const addToCart = useCallback((product: POSProduct, variant?: any) => {
        setCart(prev => {
            const existing = prev.find(item => 
                item._id === product._id && (!variant || item.selectedVariant?._id === variant._id)
            );
            if (existing) {
                if (existing.quantity >= (variant ? variant.stock : product.stock)) {
                    toast.error('Insufficient stock');
                    return prev;
                }
                return prev.map(item => item.cartItemId === existing.cartItemId 
                    ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { 
                ...product, 
                cartItemId: Math.random().toString(), 
                quantity: 1, 
                selectedVariant: variant,
                price: variant ? (variant.mrp || variant.price) : product.price,
                discountedPrice: variant ? (variant.discountedPrice ?? variant.price) : product.discountedPrice,
                tax: variant ? (variant.tax ?? product.tax) : product.tax,
                taxType: variant ? (variant.taxType ?? product.taxType) : product.taxType,
            }];
        });
    }, []);

    const handleBarcodeScan = useCallback(async (code: string) => {
        toast('Scanning: ' + code, { icon: '🔍' });
        try {
            const res = await axios.get('/api/pos/products', { params: { barcode: code } });
            if (res.data.success && res.data.products.length > 0) {
                addToCart(res.data.products[0]);
                toast.success('Added to cart');
            } else {
                toast.error('Product not found');
            }
        } catch {
            toast.error('Scan failed');
        }
    }, [addToCart]);

    // Barcode Scanner Listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if active element is an input (except our search box)
            if (document.activeElement?.tagName === 'INPUT' && document.activeElement !== searchInputRef.current && document.activeElement?.id !== 'pos-search') {
                return;
            }

            if (e.key === 'Enter') {
                if (barcodeBuffer.current.length > 3) {
                    handleBarcodeScan(barcodeBuffer.current);
                }
                barcodeBuffer.current = '';
                return;
            }

            if (e.key.length === 1) {
                barcodeBuffer.current += e.key;
                if (barcodeTimeout.current) clearTimeout(barcodeTimeout.current);
                barcodeTimeout.current = setTimeout(() => {
                    barcodeBuffer.current = '';
                }, 100); // Scanners are fast
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleBarcodeScan]);

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.cartItemId === id) {
                const newQ = item.quantity + delta;
                if (newQ < 1) return item;
                const maxStock = item.selectedVariant ? item.selectedVariant.stock : item.stock;
                if (newQ > maxStock) {
                    toast.error('Max stock reached');
                    return item;
                }
                return { ...item, quantity: newQ };
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.cartItemId !== id));

    // Calculations
    const subtotal = cart.reduce((acc, item) => acc + (item.discountedPrice * item.quantity), 0);
    const tax = cart.reduce((acc, item) => {
        const itemTax = item.taxType === 'percentage' 
            ? (item.discountedPrice * item.tax / 100) 
            : item.tax;
        return acc + (itemTax * item.quantity);
    }, 0);
    const total = subtotal + tax - discount;

    // Validate coupon against server
    const validateCoupon = useCallback(async (code: string) => {
        if (!code.trim()) {
            setDiscount(0);
            setCouponError('');
            return;
        }
        setIsValidatingCoupon(true);
        setCouponError('');
        try {
            const res = await axios.post('/api/coupons/validate', { code, cartTotal: subtotal });
            if (res.data.success) {
                setDiscount(res.data.data.discount);
                setCouponError('');
                toast.success(res.data.message);
            }
        } catch (error: any) {
            setDiscount(0);
            setCouponError(error.response?.data?.message || 'Invalid coupon');
        } finally {
            setIsValidatingCoupon(false);
        }
    }, [subtotal]);

    useEffect(() => {
        if (paymentMethod === 'Cash' && amountTendered === 0) {
            setAmountTendered(total);
        }
    }, [total, paymentMethod, amountTendered]);

    const handleCheckout = async () => {
        if (cart.length === 0) return toast.error('Cart is empty');
        if (paymentMethod === 'Cash' && amountTendered < total) return toast.error('Insufficient amount tendered');

        setIsCheckingOut(true);
        try {
            const items = cart.map(item => ({
                productId: item._id,
                title: item.title,
                quantity: item.quantity,
                variant: item.selectedVariant ? { 
                    Size: item.selectedVariant.size, 
                    Color: item.selectedVariant.colorName,
                    Material: item.selectedVariant.material,
                    RAM: item.selectedVariant.ram,
                    Storage: item.selectedVariant.storage
                } : {}
            }));

            const payload = {
                items,
                customerInfo: isWalkIn ? { name: 'Walk-in Customer' } : customer,
                paymentMethod,
                amountTendered,
                couponCode: couponCode || undefined
            };

            const res = await axios.post('/api/pos/checkout', payload);
            if (res.data.success) {
                toast.success('Sale completed!');
                setReceiptData(res.data.order);
                setCart([]);
                setCustomer({ name: '', phone: '' });
                setCouponCode('');
                setDiscount(0);
                setCouponError('');
                setAmountTendered(0);
                // Let receipt render, then print
                setTimeout(() => window.print(), 500);
            } else {
                toast.error(res.data.message || 'Checkout failed');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Checkout failed');
        } finally {
            setIsCheckingOut(false);
        }
    };

    if (receiptData) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8 pos-terminal">
                <div className="bg-white text-black p-8 rounded-lg shadow-xl max-w-sm w-full relative">
                    <div className="pos-receipt">
                        <div className="text-center font-bold text-lg mb-2">{brandName}</div>
                        <div className="text-center text-xs mb-4">Retail POS Receipt</div>
                        <hr className="receipt-divider" />
                        <div className="flex justify-between text-xs my-2">
                            <span>Receipt #{receiptData.orderId}</span>
                            <span>{new Date(receiptData.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs mb-2">Cashier: {receiptData.cashierInfo?.name}</div>
                        <hr className="receipt-divider" />
                        <table className="w-full text-xs mt-2">
                            <thead>
                                <tr className="border-b border-dashed border-gray-400">
                                    <th className="py-1">Item</th>
                                    <th className="py-1 text-center">Qty</th>
                                    <th className="py-1 text-right">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {receiptData.products.map((p: any, i: number) => (
                                    <tr key={i}>
                                        <td className="py-1">{p.title}</td>
                                        <td className="py-1 text-center">{p.quantity}</td>
                                        <td className="py-1 text-right">{formatCurrency(p.price)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <hr className="receipt-divider" />
                        <div className="flex justify-between text-xs mt-2">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(receiptData.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span>Tax:</span>
                            <span>{formatCurrency(receiptData.taxAmount)}</span>
                        </div>
                        {receiptData.discountAmount > 0 && (
                            <div className="flex justify-between text-xs">
                                <span>Discount:</span>
                                <span>-{formatCurrency(receiptData.discountAmount)}</span>
                            </div>
                        )}
                        <hr className="receipt-divider" />
                        <div className="flex justify-between font-bold mt-2">
                            <span>TOTAL:</span>
                            <span>{formatCurrency(receiptData.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-xs mt-2">
                            <span>Paid via {receiptData.paymentMethod}:</span>
                            <span>{formatCurrency(receiptData.amountTendered)}</span>
                        </div>
                        {receiptData.changeAmount > 0 && (
                            <div className="flex justify-between text-xs font-bold mt-1">
                                <span>Change:</span>
                                <span>{formatCurrency(receiptData.changeAmount)}</span>
                            </div>
                        )}
                        <div className="text-center text-xs mt-8 pb-4">Thank you for shopping!</div>
                    </div>
                    {/* Screen-only controls */}
                    <div className="no-print mt-4 space-y-2">
                        <button onClick={() => window.print()} className="w-full py-2 bg-blue-600 text-white rounded flex items-center justify-center gap-2">
                            <Printer size={18} /> Print Receipt
                        </button>
                        <button onClick={() => { setReceiptData(null); setAmountTendered(0); setDiscount(0); setCouponError(''); setCouponCode(''); }} className="w-full py-2 bg-gray-200 text-gray-800 rounded">
                            New Sale
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const hasMore = currentPage < totalPages;

    return (
        <div className="fixed inset-0 z-50 flex flex-col pos-terminal">
            {/* Header */}
            <header className="h-14 border-b border-[var(--pos-border)] flex items-center px-4 justify-between bg-[var(--pos-surface)]">
                <div className="flex items-center gap-4">
                    <div className="font-bold text-xl tracking-wide flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-[var(--pos-accent)] flex items-center justify-center text-white">P</div>
                        POS Terminal
                    </div>
                    <span className="text-sm text-[var(--pos-text-dim)] ml-4">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-[var(--pos-text-muted)]">{totalProducts} products</span>
                    <button onClick={() => window.location.href='/admin/dashboard'} className="pos-btn pos-btn-ghost text-sm">
                        <X size={16} /> Exit POS
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel: Products Dashboard */}
                <div className="flex-1 flex flex-col border-r border-[var(--pos-border)] bg-[var(--pos-bg)]">
                    <div className="p-4 bg-[var(--pos-surface)] border-b border-[var(--pos-border)]">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pos-text-muted)] pointer-events-none" size={20} />
                            <input
                                id="pos-search"
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search products..."
                                className="pos-input py-3 text-lg" style={{ paddingLeft: '3rem' }}
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto mt-4 pb-2 hide-scrollbar">
                            <button 
                                onClick={() => handleCategoryChange('all')}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border ${activeCategory === 'all' ? 'bg-[var(--pos-accent)] border-[var(--pos-accent)] text-white' : 'border-[var(--pos-border)] text-[var(--pos-text-muted)] hover:text-[var(--pos-text)]'}`}
                            >
                                All Products
                            </button>
                            {categories.map(cat => (
                                <button key={cat._id}
                                    onClick={() => handleCategoryChange(cat._id)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border ${activeCategory === cat._id ? 'bg-[var(--pos-accent)] border-[var(--pos-accent)] text-white' : 'border-[var(--pos-border)] text-[var(--pos-text-muted)] hover:text-[var(--pos-text)]'}`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--pos-accent)]"></div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {products.map(product => (
                                        <div key={product._id} onClick={() => {
                                                if (product.variants?.length > 0) {
                                                    setVariantModalProduct(product);
                                                } else {
                                                    addToCart(product);
                                                }
                                            }} 
                                            className="bg-[var(--pos-surface)] rounded-xl border border-[var(--pos-border)] overflow-hidden pos-product-card flex flex-col">
                                            <div className="aspect-square relative bg-[var(--pos-bg)] p-2">
                                                {product.images?.[0] ? (
                                                    <Image src={product.images[0]} alt={product.title} fill sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-contain" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[var(--pos-text-dim)] text-xs">No Image</div>
                                                )}
                                            </div>
                                            <div className="p-3 flex flex-col flex-1 justify-between">
                                                <div className="text-sm font-medium line-clamp-2 leading-tight">{product.title}</div>
                                                <div className="mt-2 flex items-center justify-between">
                                                    <span className="font-bold text-[var(--pos-accent)]">{formatCurrency(product.discountedPrice)}</span>
                                                    <span className="text-xs text-[var(--pos-text-muted)]">{product.stock} in stock</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {products.length === 0 && <div className="col-span-full py-20 text-center text-[var(--pos-text-muted)]">No products found.</div>}
                                </div>

                                {/* Infinite scroll sentinel */}
                                {hasMore && (
                                    <div ref={loadMoreRef} className="flex items-center justify-center py-6">
                                        {isLoadingMore && (
                                            <div className="flex items-center gap-2 text-sm text-[var(--pos-text-muted)]">
                                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[var(--pos-accent)]"></div>
                                                Loading more...
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Product count */}
                                {products.length > 0 && (
                                    <div className="text-center text-xs text-[var(--pos-text-dim)] mt-2 pb-2">
                                        {products.length} of {totalProducts} products
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Right Panel: Cart & Checkout (approx 400px) */}
                <div className="w-96 flex flex-col bg-[var(--pos-surface)]">
                    {/* Customer Selection */}
                    <div className="p-4 border-b border-[var(--pos-border)]">
                        <div className="flex items-center gap-2 mb-3">
                            <button onClick={() => setIsWalkIn(true)} className={`flex-1 py-1.5 text-sm rounded ${isWalkIn ? 'bg-[var(--pos-border-light)] text-white' : 'text-[var(--pos-text-muted)] border border-[var(--pos-border)]'}`}>Walk-in</button>
                            <button onClick={() => setIsWalkIn(false)} className={`flex-1 py-1.5 text-sm rounded ${!isWalkIn ? 'bg-[var(--pos-border-light)] text-white' : 'text-[var(--pos-text-muted)] border border-[var(--pos-border)]'}`}>Customer</button>
                        </div>
                        {!isWalkIn && (
                            <div className="space-y-2">
                                <input type="text" placeholder="Phone Number" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="pos-input text-sm py-2" />
                                <input type="text" placeholder="Name" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="pos-input text-sm py-2" />
                            </div>
                        )}
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-[var(--pos-text-muted)] space-y-4">
                                <ShoppingCart size={48} className="opacity-20" />
                                <div>Cart is empty</div>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.cartItemId} className="flex gap-3 bg-[var(--pos-bg)] p-3 rounded-lg border border-[var(--pos-border)] pos-cart-item-enter">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{item.title}</div>
                                        <div className="text-xs text-[var(--pos-text-muted)] mt-0.5">
                                            {formatCurrency(item.discountedPrice)}
                                            {item.selectedVariant && ` • ${Object.values({s: item.selectedVariant.size, c: item.selectedVariant.colorName}).filter(Boolean).join('/')}`}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <button onClick={() => removeFromCart(item.cartItemId)} className="text-[var(--pos-danger)] hover:bg-[rgba(239,68,68,0.1)] p-1 rounded"><Trash2 size={14}/></button>
                                        <div className="flex items-center gap-2 bg-[var(--pos-surface)] rounded border border-[var(--pos-border)]">
                                            <button onClick={() => updateQuantity(item.cartItemId, -1)} className="p-1 hover:text-[var(--pos-accent)]"><Minus size={14}/></button>
                                            <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.cartItemId, 1)} className="p-1 hover:text-[var(--pos-accent)]"><Plus size={14}/></button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Checkout Footer */}
                    <div className="p-4 border-t border-[var(--pos-border)] bg-[var(--pos-bg)]">
                        <div className="space-y-2 text-sm mb-4">
                            <div className="flex justify-between text-[var(--pos-text-muted)]">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-[var(--pos-text-muted)]">
                                <span>Tax</span>
                                <span>{formatCurrency(tax)}</span>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <input type="text" placeholder="Coupon Code" value={couponCode} onChange={e => { setCouponCode(e.target.value); if (!e.target.value.trim()) { setDiscount(0); setCouponError(''); } }} className="pos-input py-1.5 text-xs flex-1" />
                                <button onClick={() => validateCoupon(couponCode)} disabled={!couponCode.trim() || isValidatingCoupon} className="pos-btn pos-btn-ghost text-xs px-3 py-1.5 whitespace-nowrap disabled:opacity-40">
                                    {isValidatingCoupon ? '...' : 'Apply'}
                                </button>
                            </div>
                            {couponError && (
                                <div className="text-xs text-[var(--pos-danger)] mt-1">{couponError}</div>
                            )}
                            {discount > 0 && (
                                <div className="flex justify-between text-[var(--pos-success)]">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(discount)}</span>
                                </div>
                            )}
                            <div className="h-px bg-[var(--pos-border)] my-2"></div>
                            <div className="flex justify-between font-bold text-xl pos-grand-total text-white">
                                <span>Total</span>
                                <span className="text-[var(--pos-accent)]">{formatCurrency(total)}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex gap-2">
                                {[
                                    { id: 'Cash', icon: Banknote },
                                    { id: 'Card', icon: CreditCard },
                                    { id: 'Digital', icon: Smartphone }
                                ].map(method => (
                                    <button key={method.id} onClick={() => setPaymentMethod(method.id as any)} 
                                        className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg border transition-colors ${paymentMethod === method.id ? 'bg-[var(--pos-border-light)] border-[var(--pos-accent)] text-white' : 'border-[var(--pos-border)] text-[var(--pos-text-muted)]'}`}>
                                        <method.icon size={18} />
                                        <span className="text-xs">{method.id}</span>
                                    </button>
                                ))}
                            </div>
                            
                            {paymentMethod === 'Cash' && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-[var(--pos-text-muted)] whitespace-nowrap">Cash Rx:</span>
                                    <input type="number" 
                                        value={amountTendered || ''} 
                                        onChange={e => setAmountTendered(Number(e.target.value))} 
                                        className="pos-input py-2 flex-1 text-right font-bold text-lg" 
                                        placeholder="0.00" 
                                    />
                                    {amountTendered > total && (
                                        <div className="text-xs text-[var(--pos-warning)] whitespace-nowrap text-right">
                                            Change: <br/><b>{formatCurrency(amountTendered - total)}</b>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button onClick={handleCheckout} disabled={cart.length === 0 || isCheckingOut || (paymentMethod === 'Cash' && amountTendered < total)}
                                className="w-full pos-btn pos-btn-primary py-4 text-lg">
                                {isCheckingOut ? 'Processing...' : `Pay ${formatCurrency(total)}`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Variant Selection Modal */}
            {variantModalProduct && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--pos-surface)] p-5 rounded-xl shadow-2xl w-full max-w-md border border-[var(--pos-border)] flex flex-col max-h-[85vh]">
                        <div className="flex justify-between items-start mb-3 pb-2 border-b border-[var(--pos-border)]">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold pr-4 leading-tight">{variantModalProduct.title}</h3>
                                <p className="text-xs text-[var(--pos-text-muted)]">Select a variant to add to cart</p>
                            </div>
                            <button onClick={() => setVariantModalProduct(null)} className="p-1.5 hover:bg-[var(--pos-border-light)] rounded-full text-[var(--pos-text-muted)] hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 hide-scrollbar">
                            {variantModalProduct.variants.map((variant, idx) => {
                                const inStock = variant.stock > 0;
                                return (
                                    <button 
                                        key={variant._id || idx}
                                        disabled={!inStock}
                                        onClick={() => {
                                            addToCart(variantModalProduct, variant);
                                            setVariantModalProduct(null);
                                        }}
                                        className={`w-full text-left p-3 rounded border transition-all flex justify-between items-center ${inStock ? 'border-[var(--pos-border)] bg-[var(--pos-bg)] hover:border-[var(--pos-accent)] hover:shadow cursor-pointer' : 'border-[var(--pos-border)] bg-gray-100 dark:bg-gray-800 opacity-60 cursor-not-allowed'}`}
                                    >
                                        <div>
                                            <div className="font-semibold text-sm flex items-center gap-2">
                                                {Object.values({s: variant.size, c: variant.colorName, m: variant.material, r: variant.ram, st: variant.storage})
                                                    .filter(Boolean)
                                                    .join(' / ')}
                                                {!inStock && <span className="text-[9px] uppercase tracking-wider bg-[var(--pos-danger)] text-white px-1.5 py-0.5 rounded font-bold">Out of stock</span>}
                                            </div>
                                            <div className="text-[var(--pos-text-muted)] text-[11px] mt-0.5 flex gap-2">
                                                <span>SKU: {variant.sku || 'N/A'}</span>
                                                <span className={inStock ? 'text-[var(--pos-success)]' : ''}>Stock: {variant.stock}</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <div className="font-bold text-[var(--pos-accent)] text-sm">
                                                {formatCurrency(variant.discountedPrice !== undefined ? variant.discountedPrice : (variant.price || variant.mrp))}
                                            </div>
                                            {variant.discountedPrice < (variant.mrp || variant.price) && (
                                                <div className="text-[10px] text-[var(--pos-text-dim)] line-through">
                                                    {formatCurrency(variant.mrp || variant.price)}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
