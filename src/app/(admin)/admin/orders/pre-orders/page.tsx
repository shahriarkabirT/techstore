'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import OrderTable from '@/components/admin/orders/OrderTable';
import axios from 'axios';
import toast from 'react-hot-toast';
import { RefreshCw, Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

export default function PreOrdersPage() {
    const searchParams = useSearchParams();

    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1 });
    const [searchInput, setSearchInput] = useState('');
    const searchQuery = useDebounce(searchInput, 400);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
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
            Paid: 'bg-green-50 text-green-700 border-green-200',
            Failed: 'bg-red-50 text-red-700 border-red-200',
        };
        return styles[status] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: '12',
                isPreorder: 'true',
                archived: 'false'
            });
            if (searchQuery) params.append('search', searchQuery);

            const res = await fetch(`/api/orders?${params}`);
            const data = await res.json();
            if (data.success) {
                setOrders(data.orders);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Error fetching pre-orders:', error);
            toast.error('Failed to fetch pre-orders');
        } finally {
            setIsLoading(false);
        }
    }, [page, searchQuery]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleArchive = async (id: string) => {
        try {
            const res = await axios.put(`/api/orders/${id}`, { isArchived: true });
            if (res.data.success) {
                toast.success('Order archived');
                fetchOrders();
            }
        } catch (error) {
            toast.error('Failed to archive order');
        }
    };

    const handleHardDelete = async (id: string) => {
        const confirmed = window.confirm(
            'Permanently delete this order? This cannot be undone.'
        );
        if (!confirmed) return;
        try {
            const res = await axios.delete(`/api/orders/${id}`);
            if (res.data.success) {
                toast.success('Order permanently deleted');
                fetchOrders();
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to delete order');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">Pre-Orders</h1>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-gray-500 font-medium">Manage pre-order queue ({pagination.total})</p>
                        <button 
                            onClick={fetchOrders}
                            disabled={isLoading}
                            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative flex items-center">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3" />
                        <input
                            type="text"
                            placeholder="Search pre-orders..."
                            value={searchInput}
                            onChange={(e) => {
                                setSearchInput(e.target.value);
                                setPage(1);
                            }}
                            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 w-64 bg-white shadow-sm transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-xl flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-orange-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-orange-900">Pre-Order Fulfillment</h3>
                    <p className="text-xs text-orange-700/80 mt-0.5 leading-relaxed">These orders contain items that were out of stock. Group them by product to manage procurement efficiently.</p>
                </div>
            </div>

            <OrderTable
                orders={orders}
                isLoading={isLoading}
                formatPrice={formatPrice}
                formatDate={formatDate}
                getStatusStyle={getStatusStyle}
                onArchive={handleArchive}
                onRestore={() => {}}
                onHardDelete={handleHardDelete}
                isArchived={false}
            />

            {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                    <span className="text-sm text-gray-500 font-medium">
                        Page {page} of {pagination.pages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(page - 1)}
                            disabled={page <= 1}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 shadow-sm transition-all"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={page >= pagination.pages}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 shadow-sm transition-all"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
