'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Share2, Copy, DollarSign, Activity, History, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AffiliateDashboard() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('bkash');
    const [paymentDetails, setPaymentDetails] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            toast.error('Please login to access the Affiliation Program');
            router.push('/login?redirect=/affiliate');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            const res = await fetch('/api/affiliate');
            const result = await res.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        const url = `${window.location.origin}?ref=${data?.affiliateCode}`;
        navigator.clipboard.writeText(url);
        toast.success('Referral link copied!');
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsWithdrawing(true);
        try {
            const res = await fetch('/api/affiliate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: Number(withdrawAmount),
                    paymentMethod,
                    paymentDetails
                })
            });
            const result = await res.json();
            if (result.success) {
                toast.success('Withdrawal requested successfully');
                setShowWithdraw(false);
                fetchDashboardData(); // Refresh data
            } else {
                toast.error(result.message || 'Failed to withdraw');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setIsWithdrawing(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Affiliation Program</h1>
                        <p className="text-gray-500">Earn by sharing your favorite products</p>
                    </div>
                </div>

                {/* Referral Link Card */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-primary" />
                        Your Referral Link
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            readOnly
                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${data?.affiliateCode}`}
                            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none"
                        />
                        <button
                            onClick={copyToClipboard}
                            className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors"
                        >
                            <Copy className="w-4 h-4" />
                            Copy Link
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">Share this link to earn commission on every purchase made through it.</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-gray-500 text-sm">Available Balance</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">৳{data?.affiliateBalance?.toFixed(2)}</h3>
                        <button 
                            onClick={() => setShowWithdraw(!showWithdraw)}
                            className="text-primary text-sm font-medium mt-3 flex items-center gap-1 hover:underline"
                        >
                            Withdraw <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                            <Activity className="w-6 h-6 text-orange-600" />
                        </div>
                        <p className="text-gray-500 text-sm">Pending Earnings</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">৳{data?.pendingEarnings?.toFixed(2)}</h3>
                        <p className="text-xs text-gray-400 mt-2">Clears upon delivery</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                            <History className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className="text-gray-500 text-sm">Total Earned</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">৳{data?.totalAffiliateEarnings?.toFixed(2)}</h3>
                        <p className="text-xs text-gray-400 mt-2">Lifetime earnings</p>
                    </div>
                </div>

                {/* Withdraw Section */}
                {showWithdraw && (
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm animate-in fade-in slide-in-from-top-4">
                        <h2 className="text-lg font-semibold mb-4">Request Withdrawal</h2>
                        <form onSubmit={handleWithdraw} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (৳)</label>
                                    <input 
                                        type="number" 
                                        min="100"
                                        max={data?.affiliateBalance}
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="Min. 100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                    <select 
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    >
                                        <option value="bkash">bKash</option>
                                        <option value="nagad">Nagad</option>
                                        <option value="rocket">Rocket</option>
                                        <option value="bank">Bank Transfer</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Account Details</label>
                                <input 
                                    type="text" 
                                    value={paymentDetails}
                                    onChange={(e) => setPaymentDetails(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Phone number or Bank details"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowWithdraw(false)}
                                    className="px-5 py-2 rounded-lg border border-gray-200 font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isWithdrawing || !withdrawAmount || Number(withdrawAmount) > (data?.affiliateBalance || 0)}
                                    className="px-5 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isWithdrawing && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Recent Transactions */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-semibold">Recent Transactions</h2>
                    </div>
                    {data?.transactions?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.transactions.map((tx: any) => (
                                        <tr key={tx._id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-4 text-gray-600">
                                                {new Date(tx.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${tx.type === 'earning' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                                                    {tx.type === 'earning' ? 'Earning' : 'Withdrawal'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
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
                                            <td className="px-6 py-4 text-right text-gray-500">
                                                {tx.type === 'earning' ? (
                                                    <span>Order <Link href={`/track/order?id=${tx.orderId?.orderId}`} className="text-primary hover:underline">#{tx.orderId?.orderId}</Link></span>
                                                ) : (
                                                    <span>{tx.paymentMethod}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            No transactions yet. Start sharing your link to earn!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
