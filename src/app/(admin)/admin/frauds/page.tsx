'use client';

import { useState, useEffect } from 'react';
import { IFraudDocument } from '@/types';
import toast from 'react-hot-toast';

export default function FraudsPage() {
    const [frauds, setFrauds] = useState<IFraudDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newFraud, setNewFraud] = useState({ phone: '', ip: '', name: '', reason: '' });

    useEffect(() => {
        fetchFrauds();
    }, []);

    const fetchFrauds = async () => {
        try {
            const res = await fetch('/api/frauds');
            const data = await res.json();
            if (data.success) {
                setFrauds(data.frauds);
            }
        } catch (error) {
            console.error('Failed to fetch frauds', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddFraud = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/frauds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newFraud)
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Successfully blocked');
                setIsAddModalOpen(false);
                setNewFraud({ phone: '', ip: '', name: '', reason: '' });
                fetchFrauds();
            } else {
                toast.error(data.message || 'Failed to block');
            }
        } catch (error) {
            toast.error('Network Error');
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'blocked' ? 'flagged' : 'blocked';
        try {
            const res = await fetch(`/api/frauds/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus })
            });
            const data = await res.json();
            if (data.success) {
                setFrauds(frauds.map(f => f._id.toString() === id ? data.fraud : f));
                toast.success(`Status updated to ${nextStatus}`);
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to permanently delete this fraud entry? This will allow them to check out again.')) return;
        try {
            const res = await fetch(`/api/frauds/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setFrauds(frauds.filter(f => f._id.toString() !== id));
                toast.success('Entry removed successfully');
            }
        } catch (error) {
            toast.error('Deletion failed');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Fraud Protection</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage blocked and flagged customers by Phone and IP.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center justify-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Manually Block
                </button>
            </div>

            <div className="bg-white border text-sm border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">Loading DB...</div>
                    ) : frauds.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">No fraud entries found. Good!</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="font-semibold text-gray-900 px-6 py-4">Customer Info</th>
                                    <th className="font-semibold text-gray-900 px-6 py-4">IP Address</th>
                                    <th className="font-semibold text-gray-900 px-6 py-4">Status</th>
                                    <th className="font-semibold text-gray-900 px-6 py-4">Reason</th>
                                    <th className="font-semibold text-gray-900 px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {frauds.map(fraud => (
                                    <tr key={fraud._id.toString()} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{fraud.name || 'Unknown'}</div>
                                            <div className="text-gray-500 text-xs mt-0.5">{fraud.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                                            {fraud.ip || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${fraud.status === 'blocked' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {fraud.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={fraud.reason}>
                                            {fraud.reason || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleToggleStatus(fraud._id.toString(), fraud.status)}
                                                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                                                >
                                                    {fraud.status === 'blocked' ? 'Flag Only' : 'Block'}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(fraud._id.toString())}
                                                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {isAddModalOpen && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold tracking-tight text-gray-900">Manually Block User</h2>
                            <p className="text-sm text-gray-500 mt-1">Block by phone number or IP address immediately.</p>
                        </div>
                        <form onSubmit={handleAddFraud} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                                <input
                                    type="text"
                                    required
                                    value={newFraud.phone}
                                    onChange={(e) => setNewFraud({ ...newFraud, phone: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all sm:text-sm"
                                    placeholder="Enter exact phone format"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">IP Address (Optional)</label>
                                <input
                                    type="text"
                                    value={newFraud.ip}
                                    onChange={(e) => setNewFraud({ ...newFraud, ip: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all sm:text-sm"
                                    placeholder="e.g. 192.168.1.1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name (Optional)</label>
                                <input
                                    type="text"
                                    value={newFraud.name}
                                    onChange={(e) => setNewFraud({ ...newFraud, name: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all sm:text-sm"
                                    placeholder="Name associated"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                <input
                                    type="text"
                                    value={newFraud.reason}
                                    onChange={(e) => setNewFraud({ ...newFraud, reason: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all sm:text-sm"
                                    placeholder="e.g. Returned parcel 3 times"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none">Cancel</button>
                                <button type="submit" className="px-4 py-2 font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 focus:outline-none shadow-sm">Enforce Block</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
