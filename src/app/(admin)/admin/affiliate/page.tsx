'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Check, X, Loader2, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default function AdminAffiliatePage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [stats, setStats] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/admin/affiliate');
            const data = await res.json();
            if (data.success) {
                setTransactions(data.transactions);
                setStats(data.stats);
            }
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleWithdrawalAction = async (id: string, actionStatus: 'paid' | 'cancelled') => {
        if (!confirm(`Are you sure you want to mark this as ${actionStatus}?`)) return;
        
        try {
            const res = await fetch('/api/admin/affiliate', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: actionStatus })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Withdrawal marked as ${actionStatus}`);
                fetchData();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const filteredTx = filter === 'all' ? transactions : transactions.filter(t => filter === 'withdrawals' ? t.type === 'withdrawal' : t.type === 'earning');

    // Aggregate stats
    const totalPendingEarnings = stats.find(s => s._id.type === 'earning' && s._id.status === 'pending')?.totalAmount || 0;
    const totalClearedEarnings = stats.find(s => s._id.type === 'earning' && s._id.status === 'cleared')?.totalAmount || 0;
    const totalPendingWithdrawals = stats.find(s => s._id.type === 'withdrawal' && s._id.status === 'pending')?.totalAmount || 0;
    const totalPaidWithdrawals = stats.find(s => s._id.type === 'withdrawal' && s._id.status === 'paid')?.totalAmount || 0;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Affiliate Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage referrals, earnings, and payout requests</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500 font-medium">Pending Earnings</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">৳{totalPendingEarnings.toFixed(2)}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500 font-medium">Cleared Earnings</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">৳{totalClearedEarnings.toFixed(2)}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-yellow-200 shadow-sm bg-yellow-50/30">
                    <p className="text-sm text-yellow-800 font-medium">Pending Withdrawals</p>
                    <p className="text-2xl font-bold text-yellow-900 mt-2">৳{totalPendingWithdrawals.toFixed(2)}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-green-200 shadow-sm bg-green-50/30">
                    <p className="text-sm text-green-800 font-medium">Paid Withdrawals</p>
                    <p className="text-2xl font-bold text-green-900 mt-2">৳{totalPaidWithdrawals.toFixed(2)}</p>
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <h2 className="font-semibold text-gray-900">All Transactions</h2>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setFilter('all')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>All</button>
                        <button onClick={() => setFilter('withdrawals')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'withdrawals' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Withdrawals</button>
                        <button onClick={() => setFilter('earnings')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'earnings' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Earnings</button>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Details</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTx.length > 0 ? filteredTx.map((tx) => (
                                <tr key={tx._id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(tx.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{tx.user?.name}</div>
                                        <div className="text-xs text-gray-500">{tx.user?.phone}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${tx.type === 'earning' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-900">
                                        ৳{tx.amount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize
                                            ${tx.status === 'cleared' || tx.status === 'paid' ? 'bg-green-50 text-green-700' : ''}
                                            ${tx.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : ''}
                                            ${tx.status === 'cancelled' ? 'bg-red-50 text-red-700' : ''}
                                        `}>
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {tx.type === 'earning' && tx.orderId ? (
                                            <Link href={`/admin/orders/${tx.orderId._id}`} className="text-primary hover:underline">
                                                Order #{tx.orderId.orderId}
                                            </Link>
                                        ) : (
                                            <div className="text-xs">
                                                <span className="block font-medium text-gray-700">{tx.paymentMethod}</span>
                                                <span>{tx.paymentDetails}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {tx.type === 'withdrawal' && tx.status === 'pending' && (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleWithdrawalAction(tx._id, 'paid')}
                                                    className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                                                    title="Mark as Paid"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleWithdrawalAction(tx._id, 'cancelled')}
                                                    className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                                                    title="Cancel & Refund"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        No transactions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
