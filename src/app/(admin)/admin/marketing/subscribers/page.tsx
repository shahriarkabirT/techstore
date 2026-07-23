'use client';

import { useState } from 'react';
import { useGetSubscribersQuery, useDeleteSubscriberMutation } from '@/redux/features/newsletter/newsletterApi';
import { toast } from 'react-hot-toast';
import { Trash2, Mail, Calendar, Download, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import BulkEmailModal from '@/components/admin/BulkEmailModal';

const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
};

export default function SubscribersPage() {
    const [page, setPage] = useState(1);
    const { data: subscribersData, isLoading } = useGetSubscribersQuery({ page, limit: 10 });
    const [deleteSubscriber] = useDeleteSubscriberMutation();
    const [searchQuery, setSearchQuery] = useState('');

    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailTargets, setEmailTargets] = useState<string[] | 'all'>([]);

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to remove this subscriber?')) {
            try {
                await deleteSubscriber(id).unwrap();
                toast.success('Subscriber removed');
            } catch (error) {
                toast.error('Failed to remove subscriber');
            }
        }
    };

    const handleExport = () => {
        const subscribers = subscribersData?.data?.subscribers || [];
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Email,Subscribed At\n"
            + subscribers.map(s => `${s.email},${s.subscribedAt}`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "newsletter_subscribers.csv");
        document.body.appendChild(link);
        link.click();
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading subscribers...</div>;

    const subscribers = subscribersData?.data?.subscribers || [];
    const pagination = subscribersData?.data?.pagination;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Newsletter Subscribers</h1>
                    <p className="text-gray-500 text-sm">View and manage your email marketing audience</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setEmailTargets('all');
                            setIsEmailModalOpen(true);
                        }}
                        className="flex items-center gap-2 bg-primary text-white border border-transparent px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        <Send className="w-5 h-5" />
                        Send Bulk Email
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                    >
                        <Download className="w-5 h-5" />
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Email Address</th>
                                <th className="px-6 py-4">Subscribed Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 italic">
                            {subscribers.map((subscriber) => (
                                <tr key={subscriber._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/5 rounded-lg text-primary">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold text-gray-900">{subscriber.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {formatDate(subscriber.subscribedAt)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setEmailTargets([subscriber.email]);
                                                    setIsEmailModalOpen(true);
                                                }}
                                                className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors tooltip-trigger"
                                                title="Send Test/Individual Email"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(subscriber._id)}
                                                className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {pagination && pagination.pages > 1 && (
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-sm text-gray-500 italic">
                            Showing <span className="font-bold">{subscribers.length}</span> of <span className="font-bold">{pagination.total}</span> subscribers
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="p-2 border border-gray-100 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-bold w-8 text-center">{page}</span>
                            <button
                                disabled={page === pagination.pages}
                                onClick={() => setPage(page + 1)}
                                className="p-2 border border-gray-100 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <BulkEmailModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                targetEmails={emailTargets}
            />
        </div>
    );
}
