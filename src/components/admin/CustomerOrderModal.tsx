'use client';

import React from 'react';
import { useGetCustomerOrdersQuery } from '@/redux/features/user/userApi';
import { X, Calendar, Package, CreditCard, ShoppingBag } from 'lucide-react';

interface CustomerOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: {
        name: string;
        phone: string;
    } | null;
}

const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency: 'BDT',
        minimumFractionDigits: 0
    }).format(price);
};

export default function CustomerOrderModal({ isOpen, onClose, customer }: CustomerOrderModalProps) {
    const { data, isLoading } = useGetCustomerOrdersQuery(customer?.phone || '', {
        skip: !isOpen || !customer?.phone,
    });

    if (!isOpen || !customer) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Order History</h2>
                        <p className="text-sm text-gray-500 mt-1 italic">
                            Showing all orders for <span className="font-semibold text-primary">{customer.name}</span> ({customer.phone})
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="py-20 text-center text-gray-400 italic">Loading order history...</div>
                    ) : data?.orders && data.orders.length > 0 ? (
                        <div className="space-y-4">
                            {data.orders.map((order: any) => (
                                <div key={order._id} className="border border-gray-100 rounded-2xl p-5 hover:border-primary/20 transition-colors bg-gray-50/30">
                                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order ID</span>
                                                <span className="font-bold text-gray-900">{order.orderId}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(order.createdAt)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${order.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                                                {order.paymentStatus}
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${order.orderStatus === 'Delivered' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {order.orderStatus}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        {order.products.map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center text-xs">
                                                <div className="flex items-center gap-2">
                                                    <ShoppingBag className="w-3 h-3 text-gray-400" />
                                                    <span className="text-gray-700">{item.title}</span>
                                                    <span className="text-gray-400 font-medium">x{item.quantity}</span>
                                                </div>
                                                <span className="font-medium text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <CreditCard className="w-3 h-3" />
                                            {order.paymentMethod}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs text-gray-400 block uppercase font-bold">Total Amount</span>
                                            <span className="text-lg font-bold text-primary">{formatPrice(order.totalAmount)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center text-gray-400 italic">No orders found for this customer.</div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors shadow-sm"
                    >
                        Close History
                    </button>
                </div>
            </div>
        </div>
    );
}
