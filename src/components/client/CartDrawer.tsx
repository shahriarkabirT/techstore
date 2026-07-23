'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useGetPublicGeneralSettingsQuery } from '@/redux/features/settings/settingsApi';
import { trackViewCart } from '@/lib/gtm-datalayer';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const { items, isLoading, updateQuantity, removeFromCart, getTotal } = useCart();
    const { data: generalSettingsData } = useGetPublicGeneralSettingsQuery();
    const generalSettings = generalSettingsData?.settings;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0,
        }).format(price);
    };

    // Lock body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const subtotal = getTotal();

    useEffect(() => {
        if (isOpen && items.length > 0) {
            trackViewCart({
                contents: items.map(i => ({
                    id: String(i.productId),
                    quantity: i.quantity,
                    item_price: i.price,
                    item_name: i.title,
                })),
                value: subtotal,
                currency: 'BDT',
            });
        }
    }, [isOpen, items, subtotal]);

    const hasFreeShippingItem = items.some(item => item.freeShipping);
    const totalTax = items.reduce((acc, item) => {
        const itemTax = (item.variant as any)?.tax !== undefined
            ? (item.variant as any).tax
            : item.tax || 0;
        const itemTaxType = item.taxType || 'percentage';
        if (itemTaxType === 'flat') return acc + itemTax * item.quantity;
        return acc + (item.price * item.quantity * itemTax) / 100;
    }, 0);
    const baseShippingCost = generalSettings?.shippingChargeInsideDhaka ?? 60;
    const shippingCost = hasFreeShippingItem ? 0 : baseShippingCost;
    const total = subtotal + totalTax + shippingCost;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Drawer Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] flex flex-col transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <ShoppingBag className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
                        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">
                            Shopping Cart
                        </h2>
                        {items.length > 0 && (
                            <span className="text-[11px] font-bold text-gray-400">
                                {items.reduce((c, i) => c + i.quantity, 0)} items
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                        aria-label="Close cart"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                    </div>
                ) : items.length === 0 ? (
                    /* Empty State */
                    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
                        <div className="w-20 h-20 rounded-lg bg-gray-50 flex items-center justify-center mb-5">
                            <ShoppingBag className="w-10 h-10 text-gray-300" strokeWidth={1} />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">Your cart is empty</h3>
                        <p className="text-sm text-gray-400 mb-6">Looks like you haven&apos;t added anything yet.</p>
                        <button
                            onClick={onClose}
                            className="text-sm font-semibold text-gray-900 border border-gray-200 px-6 py-2.5 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            Continue Shopping
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto overscroll-contain">
                            <div className="divide-y divide-gray-50">
                                {items.map((item, idx) => (
                                    <div
                                        key={`${item.productId || idx}-${item.variant ? JSON.stringify(item.variant) : idx}`}
                                        className="px-5 py-4 flex gap-4 group"
                                    >
                                        {/* Thumbnail */}
                                        <div className="relative w-[72px] h-[72px] flex-shrink-0 bg-gray-50 rounded-md overflow-hidden border border-gray-100">
                                            {item.image ? (
                                                <Image
                                                    src={item.image}
                                                    alt={item.title}
                                                    fill
                                                    className="object-cover"
                                                    sizes="72px"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                                                    <ShoppingBag className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-[13px] font-semibold text-gray-900 truncate leading-tight">
                                                {item.title}
                                            </h4>

                                            {/* Variant Tags */}
                                            {item.variant && Object.keys(item.variant).length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {Object.entries(item.variant).map(([key, value]) => {
                                                        if (key === 'colorCode' || key === 'tax' || key === 'taxType') return null;
                                                        const isColor = key.toLowerCase() === 'color';
                                                        const swatchColor = isColor ? item.variant?.colorCode : null;
                                                        return (
                                                            <span
                                                                key={`${item.productId}-${JSON.stringify(item.variant)}-${key}`}
                                                                className="inline-flex items-center gap-1 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-medium"
                                                            >
                                                                {swatchColor && (
                                                                    <span
                                                                        className="w-2 h-2 rounded-full border border-gray-200"
                                                                        style={{ backgroundColor: swatchColor }}
                                                                    />
                                                                )}
                                                                {key}: {String(value)}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Price */}
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-[13px] font-bold text-gray-900">
                                                    {formatPrice(item.price)}
                                                </span>
                                                {item.originalPrice > item.price && (
                                                    <span className="text-[10px] text-gray-400 line-through">
                                                        {formatPrice(item.originalPrice)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Quantity + Remove */}
                                            <div className="flex items-center justify-between mt-2.5">
                                                <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variant)}
                                                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <Minus className="w-3.5 h-3.5" />
                                                    </button>
                                                    <span className="w-8 h-8 flex items-center justify-center text-xs font-bold text-gray-900 border-x border-gray-200">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variant)}
                                                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                                                        disabled={item.quantity >= item.stock}
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.productId, item.variant)}
                                                    className="p-1.5 text-gray-300 hover:text-rose-500 transition-colors"
                                                    aria-label="Remove item"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Item Total */}
                                        <div className="flex-shrink-0 text-right">
                                            <span className="text-[13px] font-bold text-gray-900">
                                                {formatPrice(item.price * item.quantity)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer Summary */}
                        <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4 space-y-3">
                            {/* Summary Lines */}
                            <div className="space-y-1.5 text-sm">
                                <div className="flex justify-between text-gray-500">
                                    <span>Subtotal</span>
                                    <span className="font-medium text-gray-700">{formatPrice(subtotal)}</span>
                                </div>
                                {totalTax > 0 && (
                                    <div className="flex justify-between text-gray-500">
                                        <span>Tax</span>
                                        <span className="font-medium text-gray-700">{formatPrice(totalTax)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-500">
                                    <span>Shipping</span>
                                    {shippingCost === 0 ? (
                                        <span className="text-green-600 font-bold uppercase tracking-wider text-[10px] bg-green-50 px-2 py-0.5 rounded border border-green-100">Free</span>
                                    ) : (
                                        <span className="font-medium text-gray-700">{formatPrice(shippingCost)}</span>
                                    )}
                                </div>
                            </div>

                            {/* Total */}
                            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                <span className="text-sm font-bold text-gray-900">Total</span>
                                <span className="text-lg font-black text-gray-900">{formatPrice(total)}</span>
                            </div>

                            {/* Actions */}
                            <Link
                                href="/checkout"
                                onClick={onClose}
                                className="block w-full bg-gray-900 text-white text-center py-3 rounded-md text-sm font-bold tracking-wide hover:bg-gray-800 transition-colors"
                            >
                                Checkout
                            </Link>
                            <Link
                                href="/cart"
                                onClick={onClose}
                                className="block w-full text-center py-2 text-[13px] font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                View Full Cart
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
