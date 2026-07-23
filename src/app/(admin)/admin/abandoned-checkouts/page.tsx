'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { useDebounce } from '@/hooks/useDebounce';

interface AbandonedCheckout {
    _id: string;
    customerInfo: {
        name?: string;
        phone?: string;
        email?: string;
        address?: string;
        city?: string;
        notes?: string;
    };
    cartItems: {
        productId: string;
        title: string;
        price: number;
        quantity: number;
        image?: string;
        variant?: Record<string, unknown>;
    }[];
    cartTotal: number;
    status: 'abandoned' | 'recovered' | 'expired';
    createdAt: string;
}

export default function AbandonedCheckoutsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [checkouts, setCheckouts] = useState<AbandonedCheckout[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1 });
    const [statusFilter, setStatusFilter] = useState(searchParams?.get('status') || '');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 400);

    useEffect(() => {
        const currentStatus = searchParams?.get('status') || '';
        setStatusFilter(currentStatus);
        setPage(1);
    }, [searchParams]);

    const fetchCheckouts = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: Record<string, string | number> = { page, limit: 20 };
            if (statusFilter) params.status = statusFilter;
            if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

            const res = await axios.get('/api/abandoned-checkout', { params });
            if (res.data.success) {
                setCheckouts(res.data.checkouts);
                setPagination(res.data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch incomplete checkouts:', error);
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    }, [page, statusFilter, debouncedSearch]);

    useEffect(() => {
        fetchCheckouts();
    }, [fetchCheckouts]);

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await axios.patch(`/api/abandoned-checkout/${id}`, { status: newStatus });
            toast.success('Status updated');
            fetchCheckouts();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this entry?')) return;
        try {
            await axios.delete(`/api/abandoned-checkout/${id}`);
            toast.success('Deleted');
            fetchCheckouts();
        } catch (error) {
            toast.error('Failed to delete');
        }
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

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const getStatusStyle = (status: string) => {
        const styles: Record<string, string> = {
            abandoned: 'bg-amber-50 text-amber-700 border-amber-200',
            recovered: 'bg-green-50 text-green-700 border-green-200',
            expired: 'bg-gray-50 text-gray-500 border-gray-200',
        };
        return styles[status] || 'bg-gray-50 text-gray-500 border-gray-200';
    };

    const getTimeSince = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Incomplete checkouts</h1>
                    <p className="text-sm text-gray-500 mt-1">{pagination.total} total entries</p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-gray-900 transition-all shadow-sm w-56"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            const v = e.target.value;
                            if (v) {
                                router.push(`/admin/abandoned-checkouts?status=${v}`);
                            } else {
                                router.push('/admin/abandoned-checkouts');
                            }
                        }}
                        className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:border-gray-900 transition-all cursor-pointer shadow-sm appearance-none pr-8"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 0.5rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '1.5em 1.5em'
                        }}
                    >
                        <option value="">All status</option>
                        <option value="abandoned">Abandoned</option>
                        <option value="recovered">Recovered</option>
                        <option value="expired">Expired</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-gray-400">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-3" />
                        Loading...
                    </div>
                ) : checkouts.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 mx-auto mb-3 text-gray-300">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                        </svg>
                        No incomplete checkouts found
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cart total</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {checkouts.map((c) => (
                                    <>
                                        <tr
                                            key={c._id}
                                            className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                                            onClick={() => setExpandedId(expandedId === c._id ? null : c._id)}
                                        >
                                            <td className="px-4 py-3">
                                                <span className="font-medium text-gray-900">{c.customerInfo.name || '—'}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-gray-700">{c.customerInfo.phone || '—'}</div>
                                                {c.customerInfo.email && (
                                                    <div className="text-xs text-gray-400">{c.customerInfo.email}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                                    {c.cartItems.length}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                                {formatPrice(c.cartTotal)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${getStatusStyle(c.status)}`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-gray-600 text-xs">{getTimeSince(c.createdAt)}</div>
                                                <div className="text-gray-400 text-[10px]">{formatDate(c.createdAt)}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                    {c.status === 'abandoned' && (
                                                        <button
                                                            onClick={() => handleStatusChange(c._id, 'recovered')}
                                                            title="Mark as recovered"
                                                            className="p-1.5 text-green-500 hover:bg-green-50 rounded-md transition-colors"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    {c.status === 'recovered' && (
                                                        <button
                                                            onClick={() => handleStatusChange(c._id, 'abandoned')}
                                                            title="Revert to abandoned"
                                                            className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-md transition-colors"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(c._id)}
                                                        title="Delete"
                                                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-md transition-colors"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expanded row */}
                                        {expandedId === c._id && (
                                            <tr key={`${c._id}-details`}>
                                                <td colSpan={7} className="px-4 py-4 bg-gray-50/70">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {/* Customer details */}
                                                        <div>
                                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Customer details</h4>
                                                            <div className="space-y-1.5 text-sm">
                                                                {c.customerInfo.address && (
                                                                    <p className="text-gray-600">
                                                                        <span className="text-gray-400 font-medium">Address: </span>
                                                                        {c.customerInfo.address}
                                                                    </p>
                                                                )}
                                                                {c.customerInfo.city && (
                                                                    <p className="text-gray-600">
                                                                        <span className="text-gray-400 font-medium">City: </span>
                                                                        {c.customerInfo.city}
                                                                    </p>
                                                                )}
                                                                {c.customerInfo.notes && (
                                                                    <p className="text-gray-600">
                                                                        <span className="text-gray-400 font-medium">Notes: </span>
                                                                        {c.customerInfo.notes}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Cart items */}
                                                        <div>
                                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cart items ({c.cartItems.length})</h4>
                                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                                {c.cartItems.map((item, idx) => (
                                                                    <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-100">
                                                                        {item.image ? (
                                                                            <div className="relative w-10 h-10 rounded overflow-hidden bg-gray-100 shrink-0">
                                                                                <Image src={item.image} alt={item.title} fill className="object-cover" sizes="40px" />
                                                                            </div>
                                                                        ) : (
                                                                            <div className="w-10 h-10 rounded bg-gray-100 shrink-0 flex items-center justify-center text-gray-300">
                                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-5 h-5">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                                                                </svg>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex-grow min-w-0">
                                                                            <p className="text-xs font-medium text-gray-800 truncate">{item.title}</p>
                                                                            <p className="text-[10px] text-gray-400">
                                                                                {formatPrice(item.price)} × {item.quantity}
                                                                            </p>
                                                                        </div>
                                                                        <span className="text-xs font-bold text-gray-700 shrink-0">
                                                                            {formatPrice(item.price * item.quantity)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 flex items-center justify-between bg-gray-50">
                        <span className="text-sm text-gray-500">
                            Page {page} of {pagination.pages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(page - 1)}
                                disabled={page <= 1}
                                className="px-3 py-1 bg-white border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(page + 1)}
                                disabled={page >= pagination.pages}
                                className="px-3 py-1 bg-white border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
