'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getOrderStatusDescription } from '@/lib/utils';

export default function ProfileOrderDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refundModal, setRefundModal] = useState(false);
    const [refundReason, setRefundReason] = useState('');
    const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/user/orders/${id}`);
                const data = await res.json();
                if (data.success) {
                    setOrder(data.order);
                } else {
                    router.push('/profile?tab=orders');
                }
            } catch (error) {
                console.error(error);
                router.push('/profile?tab=orders');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id, router]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusStyle = (status: string) => {
        const styles: Record<string, string> = {
            Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            Confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
            Processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            Shipped: 'bg-purple-50 text-purple-700 border-purple-200',
            Cancelled: 'bg-red-50 text-red-700 border-red-200',
            Returned: 'bg-red-50 text-red-700 border-red-200',
            Delivered: 'bg-green-50 text-green-700 border-green-200',
            Paid: 'bg-green-50 text-green-700 border-green-200',
            Failed: 'bg-red-50 text-red-700 border-red-200',
        };
        return styles[status] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    const submitRefund = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!refundReason.trim()) {
            toast.error('Please provide a reason');
            return;
        }

        setIsSubmittingRefund(true);
        try {
            const res = await fetch('/api/user/refunds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.orderId,
                    reason: refundReason
                })
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Refund request submitted successfully');
                setRefundModal(false);
                setRefundReason('');
                // Re-fetch order to update UI
                const refreshRes = await fetch(`/api/user/orders/${id}`);
                const refreshData = await refreshRes.json();
                if (refreshData.success) setOrder(refreshData.order);
            } else {
                toast.error(data.message || 'Failed to submit request');
            }
        } catch (error) {
            toast.error('Network Error');
        } finally {
            setIsSubmittingRefund(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[500px] flex items-center justify-center p-8 bg-gray-50/50">
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-4"></div>
                    <p className="text-sm font-medium text-gray-500">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (!order) return null;

    const canRequestRefund = order.orderStatus === 'Delivered' && !order.refundDetails?.refundedAt;

    return (
        <div className="bg-gray-50 min-h-screen py-10 px-4">
            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link 
                            href="/profile"
                            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-gray-500"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Order #{order.orderId}</h1>
                            <p className="text-sm text-gray-500 mt-0.5">{formatDate(order.createdAt)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span 
                            className={`group relative px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusStyle(order.orderStatus)}`}
                        >
                            {order.orderStatus}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-max max-w-[220px] bg-gray-900 text-white text-[10px] leading-relaxed px-2 py-1 rounded shadow-lg z-50 font-medium normal-case tracking-normal pointer-events-none text-center">
                                {getOrderStatusDescription(order.orderStatus)}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-900"></div>
                            </div>
                        </span>
                        <span className={`px-3 py-1 border rounded-full text-xs font-bold tracking-wider ${getStatusStyle(order.paymentStatus)}`}>
                            Payment: {order.paymentStatus}
                        </span>
                        {canRequestRefund && (
                            <button
                                onClick={() => setRefundModal(true)}
                                className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-red-100 transition-colors flex items-center gap-1.5"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                                </svg>
                                Request Refund
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    
                    {/* Left Column (Items & Summary) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Order Items</h2>
                            <div className="space-y-4">
                                {order.products?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 relative">
                                            {item.image ? (
                                                <Image src={item.image} alt={item.title} fill className="object-cover" sizes="80px" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <h3 className="text-sm font-bold text-gray-900 truncate pr-4">{item.title}</h3>
                                            {item.variant && Object.keys(item.variant).length > 0 && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                </p>
                                            )}
                                            <div className="text-xs font-semibold text-gray-600 mt-1.5 flex items-center justify-between">
                                                <span>{formatPrice(item.price)} × {item.quantity}</span>
                                                <span className="text-gray-900 text-sm">{formatPrice(item.price * item.quantity)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary Block */}
                            <div className="mt-8 pt-6 border-t border-gray-100 space-y-3 pl-0 sm:pl-24">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium tracking-wide">Subtotal</span>
                                    <span className="font-bold text-gray-900">{formatPrice(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium tracking-wide">Shipping</span>
                                    <span className="font-bold text-gray-900">{formatPrice(order.shippingCost)}</span>
                                </div>
                                {order.taxAmount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 font-medium tracking-wide">Tax</span>
                                        <span className="font-bold text-gray-900">{formatPrice(order.taxAmount)}</span>
                                    </div>
                                )}
                                {order.discountAmount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600 font-bold">
                                        <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                                        <span>-{formatPrice(order.discountAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-black text-gray-900 pt-4 border-t border-gray-100 mt-4">
                                    <span>Total</span>
                                    <span>{formatPrice(order.totalAmount)}</span>
                                </div>
                            </div>
                        </div>

                        {order.refundDetails?.refundedAt && (
                            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-24 h-24 text-red-900">
                                      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h2 className="text-base font-bold text-red-800 mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    Refund Details
                                </h2>
                                <div className="space-y-2 relative z-10">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-red-700 font-medium">Refunded On</span>
                                        <span className="text-red-900 font-bold">{formatDate(order.refundDetails.refundedAt)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-red-700 font-medium">Reason</span>
                                        <span className="text-red-900 font-bold max-w-[60%] text-right">{order.refundDetails.reason || 'Requested by customer'}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column (Customer & Payment Infos) */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Delivery Details</h2>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Contact</h3>
                                    <p className="text-sm font-bold text-gray-900">{order.customerInfo.name}</p>
                                    <p className="text-sm text-gray-600 mt-0.5">{order.customerInfo.phone}</p>
                                </div>
                                <div className="h-px bg-gray-100 w-full line"></div>
                                <div>
                                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Address</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">{order.customerInfo.address}</p>
                                    {order.customerInfo.city && (
                                        <p className="text-sm text-gray-600 mt-0.5 font-medium">{order.customerInfo.city}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Payment Method</h2>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                                        </svg>
                                    </div>
                                    <span className="font-bold text-gray-900 text-sm">{order.paymentMethod}</span>
                                </div>
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {order.paymentStatus}
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Refund Request Modal */}
            {refundModal && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold tracking-tight text-gray-900">Request Refund</h2>
                            <p className="text-sm text-gray-500 mt-1">Submit a return request for Order #{order.orderId}</p>
                        </div>
                        <form onSubmit={submitRefund} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Return *</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all sm:text-sm resize-none"
                                    placeholder="Please describe why you are requesting a refund..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => { setRefundModal(false); setRefundReason(''); }}
                                    className="px-4 py-2 font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmittingRefund}
                                    className="px-4 py-2 font-medium text-white bg-gray-900 rounded-xl hover:bg-black focus:outline-none shadow-sm disabled:opacity-70 flex items-center gap-2"
                                >
                                    {isSubmittingRefund ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Submitting...
                                        </>
                                    ) : (
                                        'Submit Request'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

