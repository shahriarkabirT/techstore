'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface IPolicy {
    _id: string;
    title: string;
    slug: string;
    isActive: boolean;
    createdAt: string;
}

export default function PoliciesPage() {
    const router = useRouter();
    const [policies, setPolicies] = useState<IPolicy[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPolicies = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await axios.get('/api/policies');
            if (res.data.success) {
                setPolicies(res.data.policies);
            }
        } catch (error) {
            toast.error('Failed to load policies');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPolicies();
    }, [fetchPolicies]);

    const handleToggleStatus = async (policy: IPolicy) => {
        try {
            await axios.put(`/api/policies/${policy._id}`, { isActive: !policy.isActive });
            toast.success(`Policy ${!policy.isActive ? 'published' : 'unpublished'}`);
            fetchPolicies();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this policy?')) return;
        try {
            await axios.delete(`/api/policies/${id}`);
            toast.success('Policy deleted');
            fetchPolicies();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete policy');
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Consumer Policies</h1>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Manage store policies</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/policies/new"
                        className="btn bg-gray-900 text-white hover:bg-gray-800 px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                    >
                        Create Policy
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Policy Title</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                                        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-3" />
                                        Loading policies...
                                    </td>
                                </tr>
                            ) : policies.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">No policies found.</td>
                                </tr>
                            ) : (
                                policies.map((policy) => (
                                    <tr key={policy._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{policy.title}</p>
                                                <p className="text-[10px] text-gray-500 font-medium whitespace-nowrap">/policy/{policy.slug}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs text-gray-600">{formatDate(policy.createdAt)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleStatus(policy)}
                                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                    policy.isActive
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                        : 'bg-rose-50 text-rose-600 border border-rose-100'
                                                }`}
                                            >
                                                {policy.isActive ? 'Active' : 'Draft'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={`/admin/policies/${policy._id}/edit`}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                    </svg>
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(policy._id)}
                                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
