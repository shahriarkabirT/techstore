'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import OrderTable from '@/components/admin/orders/OrderTable';
import axios from 'axios';
import toast from 'react-hot-toast';
import { RefreshCw, Search, Truck, X, Pencil } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import BulkCourierModal from '@/components/admin/orders/BulkCourierModal';

export default function AdminOrdersPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1 });
    const [statusFilter, setStatusFilter] = useState(searchParams?.get('status') || '');
    const [sourceFilter, setSourceFilter] = useState(searchParams?.get('source') || '');
    const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
    const [searchInput, setSearchInput] = useState('');
    const searchQuery = useDebounce(searchInput, 400);

    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    const [isBulkCourierModalOpen, setIsBulkCourierModalOpen] = useState(false);
    
    // Note Modal State
    const [noteModal, setNoteModal] = useState({ isOpen: false, orderId: '', note: '', isEditing: false });
    const [isSavingNote, setIsSavingNote] = useState(false);

    useEffect(() => {
        setStatusFilter(searchParams?.get('status') || '');
        setSourceFilter(searchParams?.get('source') || '');
        setPage(1);
    }, [searchParams]);

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
            Delivered: 'bg-green-50 text-green-700 border-green-200',
            'Partially Delivered': 'bg-cyan-50 text-cyan-700 border-cyan-200',
            Cancelled: 'bg-red-50 text-red-700 border-red-200',
            Returned: 'bg-red-50 text-red-700 border-red-200',
            Paid: 'bg-green-50 text-green-700 border-green-200',
            Failed: 'bg-red-50 text-red-700 border-red-200',
            'Delivery Charge Paid': 'bg-orange-50 text-orange-700 border-orange-200',
        };
        return styles[status] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: '12',
                archived: activeTab === 'archived' ? 'true' : 'false'
            });
            if (statusFilter) params.append('status', statusFilter);
            if (sourceFilter) params.append('source', sourceFilter);
            if (searchQuery) params.append('search', searchQuery);

            const res = await fetch(`/api/orders?${params}`);
            const data = await res.json();
            if (data.success) {
                setOrders(data.orders);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to fetch orders');
        } finally {
            setIsLoading(false);
        }
    }, [page, statusFilter, sourceFilter, activeTab, searchQuery]);

    const updateQueryParam = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams?.toString() || '');
        if (value) params.set(key, value);
        else params.delete(key);
        router.push(`${pathname}?${params.toString()}`);
    };

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleSelectOrder = (id: string, selected: boolean) => {
        setSelectedOrderIds(prev =>
            selected ? [...prev, id] : prev.filter(orderId => orderId !== id)
        );
    };

    const handleSelectAll = (selected: boolean) => {
        setSelectedOrderIds(selected ? orders.map((o: any) => o._id) : []);
    };

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

    const handleRestore = async (id: string) => {
        try {
            const res = await axios.put(`/api/orders/${id}`, { isArchived: false });
            if (res.data.success) {
                toast.success('Order restored');
                fetchOrders();
            }
        } catch (error) {
            toast.error('Failed to restore order');
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

    const handleSaveNote = async () => {
        setIsSavingNote(true);
        try {
            const res = await axios.put(`/api/orders/${noteModal.orderId}`, { adminNote: noteModal.note });
            if (res.data.success) {
                toast.success('Note saved successfully');
                setNoteModal({ isOpen: false, orderId: '', note: '', isEditing: false });
                fetchOrders();
            }
        } catch (error) {
            toast.error('Failed to save note');
        } finally {
            setIsSavingNote(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-gray-500">Manage customer orders ({pagination.total})</p>
                        <button 
                            onClick={fetchOrders}
                            disabled={isLoading}
                            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
                            title="Refresh Orders"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex items-center">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3" />
                        <input
                            type="text"
                            placeholder="Search order ID, phone, name..."
                            value={searchInput}
                            onChange={(e) => {
                                setSearchInput(e.target.value);
                                setPage(1);
                            }}
                            className="pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 w-56 sm:w-64"
                        />
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => { setActiveTab('active'); setPage(1); }}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'active'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => { setActiveTab('archived'); setPage(1); }}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'archived'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Archived
                        </button>
                    </div>

                    <select
                        value={sourceFilter}
                        onChange={(e) => updateQueryParam('source', e.target.value)}
                        className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none cursor-pointer min-w-[128px]"
                    >
                        <option value="">All channels</option>
                        <option value="landing">Landing page</option>
                        <option value="online">Online store</option>
                        <option value="pos">POS</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => updateQueryParam('status', e.target.value)}
                        className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none cursor-pointer min-w-[128px]"
                    >
                        <option value="">All status</option>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Partially Delivered">Partially Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Returned">Returned</option>
                    </select>
                </div>
            </div>

            <OrderTable
                orders={orders}
                isLoading={isLoading}
                formatPrice={formatPrice}
                formatDate={formatDate}
                getStatusStyle={getStatusStyle}
                onArchive={handleArchive}
                onRestore={handleRestore}
                onHardDelete={handleHardDelete}
                isArchived={activeTab === 'archived'}
                selectedOrderIds={selectedOrderIds}
                onSelectOrder={handleSelectOrder}
                onSelectAll={handleSelectAll}
                onEditNote={(orderId, currentNote) => setNoteModal({ isOpen: true, orderId, note: currentNote, isEditing: !currentNote })}
            />

            {pagination.pages > 1 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-6">
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

            {/* Sticky Bulk Action Bar */}
            {selectedOrderIds.length > 0 && activeTab !== 'archived' && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <span className="text-sm font-semibold whitespace-nowrap">
                        {selectedOrderIds.length} order{selectedOrderIds.length > 1 ? 's' : ''} selected
                    </span>
                    <div className="w-px h-6 bg-gray-700"></div>
                    <button
                        onClick={() => setIsBulkCourierModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                    >
                        <Truck className="w-4 h-4" />
                        Dispatch via Courier
                    </button>
                    <button
                        onClick={() => setSelectedOrderIds([])}
                        className="text-gray-400 hover:text-white text-sm px-2 transition-colors ml-2"
                    >
                        Cancel
                    </button>
                </div>
            )}

            <BulkCourierModal
                isOpen={isBulkCourierModalOpen}
                onClose={() => setIsBulkCourierModalOpen(false)}
                selectedOrderIds={selectedOrderIds}
                onSuccess={() => {
                    setIsBulkCourierModalOpen(false);
                    setSelectedOrderIds([]);
                    fetchOrders();
                }}
            />

            {/* Note Modal */}
            {noteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">Admin Note</h3>
                            <button
                                onClick={() => setNoteModal({ isOpen: false, orderId: '', note: '', isEditing: false })}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <p className="text-sm text-gray-500">Add a private note for this order. This will only be visible to administrators.</p>
                            {noteModal.isEditing ? (
                                <textarea
                                    value={noteModal.note}
                                    onChange={(e) => setNoteModal({ ...noteModal, note: e.target.value })}
                                    placeholder="Enter note here..."
                                    className="w-full h-32 p-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none transition-all"
                                />
                            ) : (
                                <div className="relative w-full min-h-[8rem] p-4 text-sm bg-gray-50 border border-gray-200 rounded-xl whitespace-pre-wrap text-gray-800">
                                    {noteModal.note}
                                    <button
                                        onClick={() => setNoteModal(prev => ({ ...prev, isEditing: true }))}
                                        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-primary bg-white hover:bg-gray-50 rounded-lg border border-gray-200 shadow-sm transition-colors"
                                        title="Edit Note"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                            {noteModal.isEditing ? (
                                <>
                                    <button
                                        onClick={() => {
                                            if (noteModal.note) {
                                                setNoteModal(prev => ({ ...prev, isEditing: false }));
                                            } else {
                                                setNoteModal({ isOpen: false, orderId: '', note: '', isEditing: false });
                                            }
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveNote}
                                        disabled={isSavingNote}
                                        className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isSavingNote ? 'Saving...' : 'Save Note'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setNoteModal({ isOpen: false, orderId: '', note: '', isEditing: false })}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                                    >
                                        Close
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
