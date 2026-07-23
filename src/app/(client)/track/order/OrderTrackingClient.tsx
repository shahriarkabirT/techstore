'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Search, Truck, CheckCircle, Clock, XCircle, ArrowRight, MapPin, CreditCard, ShoppingBag, RotateCcw, Ban, AlertTriangle, Loader2 } from 'lucide-react';

interface TrackedProduct {
    title: string;
    price: number;
    quantity: number;
    image: string;
}

interface TrackedOrder {
    orderId: string;
    orderStatus: string;
    paymentStatus: string;
    paymentMethod: string;
    customerName: string;
    city: string;
    deliveryLocation: string;
    products: TrackedProduct[];
    subtotal: number;
    shippingCost: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    createdAt: string;
    updatedAt: string;
}

const STATUS_FLOW = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'] as const;

const STATUS_CONFIG: Record<string, { icon: typeof Package; color: string; bg: string; ring: string; label: string }> = {
    Pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-200', label: 'Order Pending' },
    Confirmed: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-200', label: 'Order Confirmed' },
    Processing: { icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50', ring: 'ring-indigo-200', label: 'Processing' },
    Shipped: { icon: Truck, color: 'text-violet-600', bg: 'bg-violet-50', ring: 'ring-violet-200', label: 'Shipped' },
    Delivered: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200', label: 'Delivered' },
    Cancelled: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-200', label: 'Cancelled' },
    Returned: { icon: RotateCcw, color: 'text-orange-600', bg: 'bg-orange-50', ring: 'ring-orange-200', label: 'Returned' },
    Blocked: { icon: Ban, color: 'text-gray-600', bg: 'bg-gray-100', ring: 'ring-gray-300', label: 'Blocked' },
};

export default function OrderTrackingClient() {
    const [orderId, setOrderId] = useState('');
    const [order, setOrder] = useState<TrackedOrder | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const resultRef = useRef<HTMLDivElement>(null);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleTrack = async (e: FormEvent) => {
        e.preventDefault();
        const trimmed = orderId.trim();
        if (!trimmed) return;

        setLoading(true);
        setError('');
        setOrder(null);
        setHasSearched(true);

        try {
            const res = await fetch(`/api/track-order?orderId=${encodeURIComponent(trimmed)}`);
            const data = await res.json();

            if (!data.success) {
                setError(data.message || 'Order not found');
            } else {
                setOrder(data.order);
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Scroll to result
    useEffect(() => {
        if ((order || error) && resultRef.current) {
            resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [order, error]);

    const currentStatusConfig = order ? STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.Pending : null;
    const isTerminalStatus = order && ['Cancelled', 'Returned', 'Blocked'].includes(order.orderStatus);
    const activeStepIndex = order && !isTerminalStatus
        ? STATUS_FLOW.indexOf(order.orderStatus as typeof STATUS_FLOW[number])
        : -1;

    return (
        <div className="min-h-[80vh] bg-gradient-to-b from-gray-50/80 to-white">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-100">
                <div className="container mx-auto px-4 py-8 md:py-12">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
                                <Truck className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Order Tracking</h1>
                        </div>
                        <p className="text-gray-500 text-sm md:text-base">Track your order progress and view details</p>
                    </div>
                </div>
            </div>

            {/* Search Section */}
            <div className="container mx-auto px-4 -mt-1">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleTrack} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 mt-8">
                        <label htmlFor="track-order-input" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                            Enter Order Number
                        </label>
                        <div className="flex gap-3">
                            <div className="flex-grow relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 pointer-events-none" />
                                <input
                                    id="track-order-input"
                                    type="text"
                                    value={orderId}
                                    onChange={(e) => setOrderId(e.target.value)}
                                    placeholder="e.g. ORD-123456"
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
                                    autoComplete="off"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !orderId.trim()}
                                className="px-6 md:px-8 py-3.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-gray-900/10 active:scale-[0.98]"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        Track
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Result Section */}
                    <div ref={resultRef} className="mt-6 pb-16">
                        {/* Loading State */}
                        {loading && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
                                <p className="text-sm text-gray-500 font-medium">Looking up your order...</p>
                            </div>
                        )}

                        {/* Error State */}
                        {!loading && error && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-12 text-center">
                                <div className="w-16 h-16 mx-auto mb-5 bg-red-50 rounded-2xl flex items-center justify-center">
                                    <AlertTriangle className="w-7 h-7 text-red-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Order Not Found</h3>
                                <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                                    We couldn&apos;t find any order with that number. Please check your order ID and try again.
                                </p>
                                <Link
                                    href="/products"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-900/10"
                                >
                                    <ShoppingBag className="w-4 h-4" />
                                    Back to Shopping
                                </Link>
                            </div>
                        )}

                        {/* Order Found */}
                        {!loading && order && currentStatusConfig && (
                            <div className="space-y-4">
                                {/* Status Banner */}
                                <div className={`${currentStatusConfig.bg} rounded-2xl border ${currentStatusConfig.ring} ring-1 p-6 md:p-8`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl ${currentStatusConfig.bg} ring-2 ${currentStatusConfig.ring} flex items-center justify-center shrink-0`}>
                                            <currentStatusConfig.icon className={`w-6 h-6 ${currentStatusConfig.color}`} />
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h2 className={`text-lg font-black ${currentStatusConfig.color}`}>
                                                    {currentStatusConfig.label}
                                                </h2>
                                                <span className="text-xs font-mono font-bold text-gray-400 bg-white/80 px-2 py-0.5 rounded">
                                                    {order.orderId}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                Placed on {formatDate(order.createdAt)}
                                                {order.updatedAt !== order.createdAt && (
                                                    <> · Last updated {formatDate(order.updatedAt)}</>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Tracker — only for normal flow */}
                                {!isTerminalStatus && activeStepIndex >= 0 && (
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Order Progress</h3>

                                        {/* Desktop horizontal stepper */}
                                        <div className="hidden md:block">
                                            <div className="flex items-center justify-between relative">
                                                {/* Background line */}
                                                <div className="absolute top-5 left-[10%] right-[10%] h-[2px] bg-gray-100" />
                                                {/* Active line */}
                                                <div
                                                    className="absolute top-5 left-[10%] h-[2px] bg-emerald-500 transition-all duration-700"
                                                    style={{
                                                        width: `${(activeStepIndex / (STATUS_FLOW.length - 1)) * 80}%`,
                                                    }}
                                                />

                                                {STATUS_FLOW.map((status, i) => {
                                                    const stepConfig = STATUS_CONFIG[status];
                                                    const StepIcon = stepConfig.icon;
                                                    const isCompleted = i <= activeStepIndex;
                                                    const isCurrent = i === activeStepIndex;

                                                    return (
                                                        <div key={status} className="relative z-10 flex flex-col items-center gap-2">
                                                            <div
                                                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                                                                    isCurrent
                                                                        ? 'bg-emerald-500 ring-4 ring-emerald-500/20 scale-110'
                                                                        : isCompleted
                                                                            ? 'bg-emerald-500'
                                                                            : 'bg-gray-100'
                                                                }`}
                                                            >
                                                                <StepIcon className={`w-4 h-4 ${isCompleted ? 'text-white' : 'text-gray-400'}`} />
                                                            </div>
                                                            <span className={`text-xs font-bold ${isCurrent ? 'text-gray-900' : isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                                                                {stepConfig.label}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Mobile vertical stepper */}
                                        <div className="md:hidden space-y-0">
                                            {STATUS_FLOW.map((status, i) => {
                                                const stepConfig = STATUS_CONFIG[status];
                                                const StepIcon = stepConfig.icon;
                                                const isCompleted = i <= activeStepIndex;
                                                const isCurrent = i === activeStepIndex;
                                                const isLast = i === STATUS_FLOW.length - 1;

                                                return (
                                                    <div key={status} className="flex gap-3">
                                                        <div className="flex flex-col items-center">
                                                            <div
                                                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                                                    isCurrent
                                                                        ? 'bg-emerald-500 ring-4 ring-emerald-500/20'
                                                                        : isCompleted
                                                                            ? 'bg-emerald-500'
                                                                            : 'bg-gray-100'
                                                                }`}
                                                            >
                                                                <StepIcon className={`w-3.5 h-3.5 ${isCompleted ? 'text-white' : 'text-gray-400'}`} />
                                                            </div>
                                                            {!isLast && (
                                                                <div className={`w-[2px] h-8 ${isCompleted && i < activeStepIndex ? 'bg-emerald-500' : 'bg-gray-100'}`} />
                                                            )}
                                                        </div>
                                                        <div className={`pt-1 ${!isLast ? 'pb-4' : ''}`}>
                                                            <span className={`text-sm font-bold ${isCurrent ? 'text-gray-900' : isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                                                                {stepConfig.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Order Summary Card */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    {/* Info Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-100">
                                        <div className="bg-white p-4 md:p-5">
                                            <div className="flex items-center gap-2 mb-1">
                                                <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment</span>
                                            </div>
                                            <p className="text-sm font-bold text-gray-900">
                                                {order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}
                                            </p>
                                        </div>
                                        <div className="bg-white p-4 md:p-5">
                                            <div className="flex items-center gap-2 mb-1">
                                                <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment Status</span>
                                            </div>
                                            <p className={`text-sm font-bold ${order.paymentStatus === 'Paid' ? 'text-emerald-600' : order.paymentStatus === 'Failed' ? 'text-red-600' : 'text-amber-600'}`}>
                                                {order.paymentStatus}
                                            </p>
                                        </div>
                                        <div className="bg-white p-4 md:p-5">
                                            <div className="flex items-center gap-2 mb-1">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Delivery Zone</span>
                                            </div>
                                            <p className="text-sm font-bold text-gray-900">
                                                {order.deliveryLocation === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka'}
                                                {order.city && <span className="text-gray-400 font-normal"> · {order.city}</span>}
                                            </p>
                                        </div>
                                        <div className="bg-white p-4 md:p-5">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Package className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Items</span>
                                            </div>
                                            <p className="text-sm font-bold text-gray-900">
                                                {order.products.reduce((sum, p) => sum + p.quantity, 0)} item{order.products.length > 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Products */}
                                    <div className="p-5 md:p-6 border-t border-gray-100">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Order Items</h3>
                                        <div className="space-y-3">
                                            {order.products.map((item, i) => (
                                                <div key={i} className="flex items-center gap-4 py-2">
                                                    {item.image ? (
                                                        <Image
                                                            src={item.image}
                                                            alt={item.title}
                                                            width={48}
                                                            height={48}
                                                            className="w-12 h-12 object-cover rounded-lg border border-gray-100 bg-gray-50"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center">
                                                            <Package className="w-5 h-5 text-gray-300" />
                                                        </div>
                                                    )}
                                                    <div className="flex-grow min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                                                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-900 shrink-0">
                                                        {formatPrice(item.price * item.quantity)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Totals */}
                                    <div className="border-t border-gray-100 p-5 md:p-6 bg-gray-50/50">
                                        <div className="space-y-2 text-sm max-w-xs ml-auto">
                                            <div className="flex justify-between text-gray-500">
                                                <span>Subtotal</span>
                                                <span>{formatPrice(order.subtotal)}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-500">
                                                <span>Shipping</span>
                                                <span>{formatPrice(order.shippingCost)}</span>
                                            </div>
                                            {order.taxAmount > 0 && (
                                                <div className="flex justify-between text-gray-500">
                                                    <span>Tax</span>
                                                    <span>{formatPrice(order.taxAmount)}</span>
                                                </div>
                                            )}
                                            {order.discountAmount > 0 && (
                                                <div className="flex justify-between text-emerald-600">
                                                    <span>Discount</span>
                                                    <span>-{formatPrice(order.discountAmount)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between font-black text-gray-900 pt-2 border-t border-gray-200 text-base">
                                                <span>Total</span>
                                                <span>{formatPrice(order.totalAmount)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                                    <Link
                                        href="/products"
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-900/10 active:scale-[0.98]"
                                    >
                                        <ShoppingBag className="w-4 h-4" />
                                        Continue Shopping
                                    </Link>
                                    <Link
                                        href="/"
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all border border-gray-200 active:scale-[0.98]"
                                    >
                                        Back to Home
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Empty State — only if no search yet */}
                        {!loading && !hasSearched && (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-5 bg-gray-50 rounded-2xl flex items-center justify-center">
                                    <Truck className="w-7 h-7 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Track Your Order</h3>
                                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                                    Enter your order number above to see real-time updates on your delivery status.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
