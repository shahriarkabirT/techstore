'use client';

import Link from 'next/link';
import { useGetUserOrdersQuery } from '@/redux/features/orders/ordersApi';
import { getOrderStatusDescription } from '@/lib/utils';

export default function OrderHistory() {
    const { data, isLoading, error } = useGetUserOrdersQuery({ page: 1, limit: 20 });
    const orders = data?.orders || [];


    if (error) {
        return (
            <div className="text-center py-20 bg-rose-50 rounded-3xl border-2 border-dashed border-rose-100">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto text-rose-300 mb-4 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Failed to load orders</h3>
                <p className="text-sm text-gray-500 mt-1 mb-6">There was a problem connecting to the server. Please check your connection and try again.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black shadow-lg shadow-gray-200 transition-all inline-block"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Order History</h2>
                    <p className="text-sm text-gray-500 mt-1">Check the status of recent orders.</p>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-gray-50 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : orders.length > 0 ? (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order._id} className="p-6 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 transition-all group">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0Zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0Z" />
                                        </svg>
                                    </div>
                                    <div>
                            <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-gray-900">Order #{order.orderId}</h3>
                                            <span 
                                                className={`group relative px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider 
                                                ${order.orderStatus === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                                    order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' :
                                                        order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                            'bg-blue-100 text-blue-700'}`}>
                                                {order.orderStatus}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-max max-w-[220px] bg-gray-900 text-white text-[10px] leading-relaxed px-2 py-1 rounded shadow-lg z-50 font-medium normal-case tracking-normal pointer-events-none text-center">
                                                    {getOrderStatusDescription(order.orderStatus)}
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-900"></div>
                                                </div>
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-6 md:w-auto w-full pt-4 md:pt-0 border-t md:border-t-0 border-gray-50">
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total</p>
                                        <p className="font-bold text-gray-900">
                                            {new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).format(order.totalAmount)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Link
                                            href={`/profile/orders/${order.orderId}`}
                                            className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto text-gray-300 mb-4 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0Zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0Z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No orders yet</h3>
                    <p className="text-sm text-gray-500 mt-1 mb-6">Start shopping to see your orders here.</p>
                    <Link
                        href="/products"
                        className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black shadow-lg shadow-gray-200 transition-all inline-block"
                    >
                        Start Shopping
                    </Link>
                </div>
            )}

        </div>
    );
}
