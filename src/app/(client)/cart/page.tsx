"use client";

import { useCart } from "@/context/CartContext";
import Link from "next/link";
import Image from "next/image";
import Skeleton from "@/components/shared/Skeleton";
import {
    CartItemSkeleton,
    OrderSummarySkeleton,
} from "@/components/shared/Skeletons";
import { useGetPublicGeneralSettingsQuery } from "@/redux/features/settings/settingsApi";

export default function CartPage() {
    const { items, isLoading, updateQuantity, removeFromCart, getTotal } =
        useCart();
    const { data: generalSettingsData } = useGetPublicGeneralSettingsQuery();
    const generalSettings = generalSettingsData?.settings;

    const formatPriceBDT = (price: number) => {
        return new Intl.NumberFormat("en-BD", {
            style: "currency",
            currency: "BDT",
            minimumFractionDigits: 0,
        }).format(price);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto">
                    <Skeleton width="160px" height="32px" className="mb-8" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                            <div className="card divide-y divide-gray-50 overflow-hidden rounded-2xl">
                                {[1, 2, 3].map((i) => (
                                    <CartItemSkeleton key={i} />
                                ))}
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <OrderSummarySkeleton />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">
                        Shopping Cart
                    </h1>
                    <div className="card p-12 text-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1}
                            stroke="currentColor"
                            className="w-20 h-20 mx-auto text-gray-300 mb-4"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                            />
                        </svg>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">
                            Your cart is empty
                        </h2>
                        <p className="text-gray-500 mb-6">
                            Add some products to your cart to continue shopping.
                        </p>
                        <Link href="/products" className="btn btn-primary">
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const subtotal = getTotal();
    const hasFreeShippingItem = items.some(item => item.freeShipping);
    const totalTax = items.reduce((acc, item) => {
        const itemTax =
            (item.variant as any)?.tax !== undefined
                ? (item.variant as any).tax
                : item.tax || 0;
        const itemTaxType = item.taxType || "percentage";

        if (itemTaxType === "flat") {
            return acc + itemTax * item.quantity;
        }

        return acc + (item.price * item.quantity * itemTax) / 100;
    }, 0);
    const baseShippingCost = generalSettings?.shippingChargeInsideDhaka ?? 60;
    const shippingCost = hasFreeShippingItem ? 0 : baseShippingCost;
    const total = subtotal + shippingCost + totalTax;

    return (
        <div className="min-h-screen bg-background py-8">
            <div className="container mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Cart Items */}
                    <div className="lg:col-span-2">
                        <div className="card divide-y divide-gray-50 overflow-hidden rounded-2xl">
                            {items.map((item) => (
                                <div
                                    key={`${item.productId}-${JSON.stringify(item.variant)}`}
                                    className="p-4 flex gap-4"
                                >
                                    {/* Image */}
                                    <div className="relative w-20 h-20 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                                        {item.image ? (
                                            <Image
                                                src={item.image}
                                                alt={item.title}
                                                fill
                                                className="object-cover"
                                                sizes="80px"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={1}
                                                    stroke="currentColor"
                                                    className="w-6 h-6"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                                                    />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                        {/* Details */}
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-gray-900 truncate text-sm">
                                                    {item.title}
                                                </h3>
                                                {item.isPreorder && (
                                                    <span className="shrink-0 text-[8px] font-black bg-blue-50 text-blue-600 px-1 py-0.5 rounded uppercase tracking-tighter border border-blue-100">
                                                        Pre-order
                                                    </span>
                                                )}
                                            </div>
                                            {item.variant && Object.keys(item.variant).length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {Object.entries(item.variant).map(([key, value]) => {
                                                        if (
                                                            key === "colorCode" ||
                                                            key === "tax" ||
                                                            key === "taxType"
                                                        )
                                                            return null;

                                                        const isColor = key.toLowerCase() === "color";
                                                        const swatchColor = isColor
                                                            ? (item.variant as any)?.colorCode
                                                            : null;

                                                        return (
                                                            <div
                                                                key={`${item.productId}-${JSON.stringify(item.variant)}-${key}`}
                                                                className="flex items-center gap-1 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-medium"
                                                            >
                                                                {swatchColor && (
                                                                    <span
                                                                        className="w-2 h-2 rounded-full border border-gray-200"
                                                                        style={{ backgroundColor: swatchColor }}
                                                                    />
                                                                )}
                                                                {key}: {String(value)}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-primary font-bold text-sm">
                                                    {formatPriceBDT(item.price)}
                                                </span>
                                                {item.originalPrice > item.price && (
                                                    <>
                                                        <span className="text-[10px] text-gray-400 line-through ml-2">
                                                            {formatPriceBDT(item.originalPrice)}
                                                        </span>
                                                        {item.discount > 0 && (
                                                            <span className="text-[9px] font-bold bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded tracking-wider">
                                                                {item.discountType === "flat"
                                                                    ? `-${formatPriceBDT(item.discount)}`
                                                                    : `-${item.discount}%`}
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                                {(() => {
                                                    const itemTax = item.tax || 0;
                                                    if (itemTax === 0) return null;
                                                    const itemTaxType = item.taxType || "percentage";
                                                    const calculatedTax =
                                                        itemTaxType === "flat"
                                                            ? itemTax
                                                            : (item.price * itemTax) / 100;

                                                    return (
                                                        <span className="text-[11px] text-gray-500 font-medium ml-1">
                                                            + Tax{" "}
                                                            {itemTaxType === "percentage" && `(${itemTax}%)`}
                                                            : ৳{calculatedTax.toLocaleString("en-BD")}
                                                        </span>
                                                    );
                                                })()}
                                            </div>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-4 mt-2.5" >
                                                <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variant)}
                                                        className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-white rounded transition-colors text-sm font-bold"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="w-8 text-center text-xs font-bold text-gray-900">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variant)}
                                                        className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-white rounded transition-colors text-sm font-bold"
                                                        disabled={!item.isPreorder && item.quantity >= item.stock}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => removeFromCart(item.productId, item.variant)}
                                                className="text-[11px] font-bold text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-wider"
                                            >
                                                Remove
                                            </button>
                                    </div>

                                    {/* Item Total */}
                                    <div className="text-right flex flex-col justify-between items-end">
                                        <span className="font-bold text-gray-900 text-sm">
                                            {formatPriceBDT(item.price * item.quantity)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="card p-5 sticky top-24 rounded-2xl border-none shadow-sm dark:bg-gray-900/50">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Summary</h2>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-gray-500 font-medium">
                                    <span>Subtotal ({items.length} items)</span>
                                    <span className="text-gray-900">{formatPriceBDT(subtotal)}</span>
                                </div>
                                {totalTax > 0 && (
                                    <div className="flex justify-between text-gray-500 font-medium">
                                        <span>Estimated Tax</span>
                                        <span className="text-gray-900">
                                            {formatPriceBDT(totalTax)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between font-medium text-gray-500">
                                    <span>Shipping</span>
                                    {shippingCost === 0 ? (
                                        <span className="text-green-600 font-bold uppercase tracking-wider text-[10px] bg-green-50 px-2 py-0.5 rounded border border-green-100">Free</span>
                                    ) : (
                                        <span className="text-gray-900">{formatPriceBDT(shippingCost)}</span>
                                    )}
                                </div>
                                <div className="pt-4 mt-4 border-t border-gray-100 flex justify-between items-center">
                                    <span className="text-lg font-bold text-gray-900">Total</span>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-gray-900">
                                            {formatPriceBDT(total)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Link
                                href="/checkout"
                                className="btn btn-primary w-full mt-6 py-4 font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20"
                            >
                                Checkout Now
                            </Link>

                            <Link
                                href="/products"
                                className="btn btn-outline w-full mt-3 font-bold text-[10px] uppercase tracking-widest"
                            >
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div >
            </div >
        </div >
    );
}
