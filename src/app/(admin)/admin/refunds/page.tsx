'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RefundsManagementPage() {
    const [refunds, setRefunds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [syncingId, setSyncingId] = useState<string | null>(null);

    // Meatball menu & delete confirmation
    const menuRef = useRef<HTMLDivElement>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
                setConfirmDeleteId(null);
            }
        };
        if (openMenuId) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);

    useEffect(() => {
        fetchRefunds(filterStatus);
    }, [filterStatus]);

    const fetchRefunds = async (status: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/refunds?status=${status}`);
            const data = await res.json();
            if (data.success) {
                setRefunds(data.refunds);
            }
        } catch (error) {
            console.error('Failed to fetch refunds', error);
            toast.error('Failed to load refund requests');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        let confirmMessage = `Are you sure you want to mark this request as ${newStatus.toUpperCase()}?`;
        if (newStatus === 'approved') {
            confirmMessage += `\n\nNote: If the original order used a supported automated courier (like Steadfast), approving this will instantly send an automatic Return Pickup Request to them!`;
        }
        if (!confirm(confirmMessage)) return;
        
        setProcessingId(id);
        try {
            const res = await fetch(`/api/admin/refunds/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            
            if (data.success) {
                if (newStatus === 'approved' && data.refund?.courierReturn?.courierName) {
                    toast.success(`Approved! Return pickup requested via ${data.refund.courierReturn.courierName}.`, { duration: 5000 });
                } else if (newStatus === 'approved') {
                    toast.success('Approved! (No automated courier return triggered).', { duration: 4000 });
                } else {
                    toast.success(`Request marked as ${newStatus}`);
                }
                fetchRefunds(filterStatus);
            } else {
                toast.error(data.message || 'Update failed');
            }
        } catch (error) {
            toast.error('Network error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleSyncCourier = async (id: string) => {
        setSyncingId(id);
        try {
            const res = await fetch(`/api/admin/refunds/${id}/sync-courier`, {
                method: 'POST',
            });
            const data = await res.json();

            if (data.success) {
                toast.success(`Courier status: ${data.courierStatus}`);
                // Update the refund in local state
                setRefunds(prev => prev.map(r => {
                    if (r._id === id) {
                        return {
                            ...r,
                            courierReturn: {
                                ...r.courierReturn,
                                courierStatus: data.courierStatus,
                                lastCheckedAt: data.lastCheckedAt,
                            }
                        };
                    }
                    return r;
                }));
            } else {
                toast.error(data.message || 'Sync failed');
            }
        } catch (error) {
            toast.error('Failed to sync courier status');
        } finally {
            setSyncingId(null);
        }
    };

    const handleDeleteRefund = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/refunds/${id}`, {
                method: 'DELETE',
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Refund request deleted');
                setRefunds(prev => prev.filter(r => r._id !== id));
                setOpenMenuId(null);
                setConfirmDeleteId(null);
            } else {
                toast.error(data.message || 'Deletion failed');
            }
        } catch (error) {
            toast.error('Network error occurred');
        }
    };

    const statusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            processing: 'bg-blue-100 text-blue-800 border-blue-200',
            approved: 'bg-indigo-100 text-indigo-800 border-indigo-200',
            returned: 'bg-green-100 text-green-800 border-green-200',
            rejected: 'bg-red-100 text-red-800 border-red-200'
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase transition-colors border ${styles[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                {status}
            </span>
        );
    };

    const courierStatusBadge = (courierReturn: any) => {
        if (!courierReturn?.courierName) {
            return <span className="text-[10px] text-gray-400 font-medium">No Courier</span>;
        }

        const courierStyles: Record<string, string> = {
            pending: 'bg-amber-50 text-amber-700 border-amber-200',
            approved: 'bg-sky-50 text-sky-700 border-sky-200',
            processing: 'bg-violet-50 text-violet-700 border-violet-200',
            completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            cancelled: 'bg-red-50 text-red-700 border-red-200',
        };

        const st = courierReturn.courierStatus || 'pending';

        return (
            <div className="flex flex-col items-center gap-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${courierStyles[st] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                    {st}
                </span>
                <span className="text-[9px] text-gray-400 font-medium capitalize">
                    via {courierReturn.courierName}
                </span>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Refunds</h1>
                    <p className="text-sm text-gray-500 mt-1">Process and manage customer return requests.</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-gray-100 p-1 w-max rounded-lg">
                {['all', 'pending', 'processing', 'approved', 'returned', 'rejected'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all uppercase tracking-wider ${
                            filterStatus === status 
                                ? 'bg-white text-gray-900 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            <div className="bg-white border text-sm border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                            <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-4"></div>
                            Loading Refunds...
                        </div>
                    ) : refunds.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            No {filterStatus !== 'all' ? filterStatus : ''} refund requests found.
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="font-semibold text-gray-900 px-6 py-4">Order ID</th>
                                    <th className="font-semibold text-gray-900 px-6 py-4">Customer</th>
                                    <th className="font-semibold text-gray-900 px-6 py-4">Reason</th>
                                    <th className="font-semibold text-gray-900 px-6 py-4 text-center">Status</th>
                                    <th className="font-semibold text-gray-900 px-6 py-4 text-center">Courier</th>
                                    <th className="font-semibold text-gray-900 px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {refunds.map(refund => (
                                    <tr key={refund._id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            {refund.orderId ? (
                                                <>
                                                    <Link href={`/admin/orders/${refund.orderId._id}`} className="font-bold text-blue-600 hover:text-blue-800 hover:underline">
                                                        #{refund.orderId.orderId}
                                                    </Link>
                                                    <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-1">
                                                        {new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).format(refund.orderId.totalAmount)}
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Order Deleted</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{refund.orderId?.customerInfo?.name || refund.userId?.name || '—'}</div>
                                            <div className="text-gray-500 text-xs mt-0.5">{refund.orderId?.customerInfo?.phone || refund.userId?.phone || ''}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 max-w-xs break-words">
                                            <span className="italic">&quot;{refund.reason}&quot;</span>
                                            <div className="text-xs text-gray-400 mt-2 font-mono">
                                                {new Date(refund.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {statusBadge(refund.status)}
                                            {refund.status === 'returned' && (
                                                <div className="text-[10px] text-green-600 font-bold tracking-wider mt-1 flex items-center justify-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                                    </svg>
                                                    REFUND CLOSED
                                                </div>
                                            )}
                                        </td>
                                        {/* Courier Return Status Column */}
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {courierStatusBadge(refund.courierReturn)}
                                                {refund.courierReturn?.returnRequestId && (
                                                    <button
                                                        onClick={() => handleSyncCourier(refund._id)}
                                                        disabled={syncingId === refund._id}
                                                        title="Sync courier return status"
                                                        className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={2}
                                                            stroke="currentColor"
                                                            className={`w-3.5 h-3.5 ${syncingId === refund._id ? 'animate-spin' : ''}`}
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <select
                                                    value={refund.status}
                                                    disabled={refund.status === 'returned' || processingId === refund._id}
                                                    onChange={(e) => handleUpdateStatus(refund._id, e.target.value)}
                                                    className={`text-xs pl-3 pr-8 py-1.5 rounded-lg border font-medium focus:ring-2 outline-none transition-all cursor-pointer ${
                                                        refund.status === 'returned' 
                                                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60' 
                                                        : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400 focus:ring-gray-900'
                                                    }`}
                                                >
                                                    <option value="pending" disabled>Set Status</option>
                                                    <option value="processing">Mark as Processing</option>
                                                    <option value="approved">Approve Refund</option>
                                                    <option value="returned">Mark as Returned</option>
                                                    <option value="rejected">Reject Request</option>
                                                </select>

                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenMenuId(openMenuId === refund._id ? null : refund._id);
                                                            setConfirmDeleteId(null);
                                                        }}
                                                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                                                        </svg>
                                                    </button>

                                                    {openMenuId === refund._id && (
                                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100" ref={menuRef}>
                                                            {confirmDeleteId !== refund._id ? (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setConfirmDeleteId(refund._id);
                                                                    }}
                                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-semibold"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.053.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                                    </svg>
                                                                    Delete Record
                                                                </button>
                                                            ) : (
                                                                <div className="px-4 py-3 space-y-3">
                                                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none text-center">Delete this refund?</p>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => handleDeleteRefund(refund._id)}
                                                                            className="flex-1 py-2 bg-rose-600 text-white text-[10px] font-bold rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
                                                                        >
                                                                            Yes
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setConfirmDeleteId(null)}
                                                                            className="flex-1 py-2 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-lg hover:bg-gray-200 transition-colors"
                                                                        >
                                                                            No
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
