'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
    useGetMessagesQuery,
    useUpdateMessageStatusMutation,
    useDeleteMessageMutation
} from '@/redux/features/contact/contactApi';
import {
    Mail,
    User,
    MessageSquare,
    Trash2,
    CheckCircle2,
    Clock,
    Phone,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Calendar,
    ArrowUpRight
} from 'lucide-react';

export default function AdminMessagesPage() {
    const [page, setPage] = useState(1);
    const { data: messagesData, isLoading: loading } = useGetMessagesQuery({ page });
    const [updateStatus] = useUpdateMessageStatusMutation();
    const [deleteMessage] = useDeleteMessageMutation();

    const messages = messagesData?.messages || [];
    const pagination = messagesData?.pagination || { page: 1, pages: 1, total: 0 };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            const data = await updateStatus({ id, status }).unwrap();
            if (data.success) {
                toast.success(`Marked as ${status}`);
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;
        try {
            const data = await deleteMessage(id).unwrap();
            if (data.success) {
                toast.success('Message deleted');
            }
        } catch (error) {
            toast.error('Failed to delete message');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'replied':
                return <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold uppercase tracking-wider"><CheckCircle2 className="w-3.5 h-3.5" /> Replied</span>;
            case 'read':
                return <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider"><Clock className="w-3.5 h-3.5" /> Read</span>;
            default:
                return <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse"><Loader2 className="w-3.5 h-3.5" /> Pending</span>;
        }
    };

    if (loading && messages.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Customer Messages</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage and respond to customer inquiries from the contact page.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest block text-center">Total Inquiries</span>
                    <span className="text-lg font-bold text-gray-900 block text-center">{pagination.total}</span>
                </div>
            </div>

            {messages.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-24 text-center">
                    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MessageSquare className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No messages yet</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">Customer inquiries from your contact page will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {messages.map((message) => (
                        <div key={message._id} className={`bg-white border transition-all duration-300 group rounded-[2rem] overflow-hidden ${message.status === 'pending' ? 'border-amber-100 shadow-xl shadow-amber-50/50' : 'border-gray-100 shadow-sm hover:shadow-md'}`}>
                            <div className="p-8">
                                <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
                                    <div className="flex gap-4">
                                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-primary font-black text-xl shadow-inner uppercase">
                                            {message.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">{message.name}</h3>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                                <a href={`mailto:${message.email}`} className="text-sm font-medium text-gray-400 hover:text-primary flex items-center gap-1.5">
                                                    <Mail className="w-3.5 h-3.5" />
                                                    {message.email}
                                                </a>
                                                {message.phone && (
                                                    <a href={`tel:${message.phone}`} className="text-sm font-medium text-gray-400 hover:text-primary flex items-center gap-1.5 border-l border-gray-100 pl-4">
                                                        <Phone className="w-3.5 h-3.5" />
                                                        {message.phone}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {getStatusBadge(message.status)}
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(message.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg text-xs font-black text-gray-500 uppercase tracking-widest mb-1">
                                        <ArrowUpRight className="w-3 h-3" />
                                        {message.subject}
                                    </div>
                                    <p className="text-gray-600 leading-relaxed font-medium bg-gray-50/50 p-6 rounded-2xl border border-gray-100/50">
                                        {message.message}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-50">
                                    <div className="flex items-center gap-2">
                                        {message.status !== 'replied' && (
                                            <button
                                                onClick={() => handleUpdateStatus(message._id, 'replied')}
                                                className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                            >
                                                Mark as Replied
                                            </button>
                                        )}
                                        {message.status === 'pending' && (
                                            <button
                                                onClick={() => handleUpdateStatus(message._id, 'read')}
                                                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                            >
                                                Mark as Read
                                            </button>
                                        )}
                                        {message.status !== 'pending' && (
                                            <button
                                                onClick={() => handleUpdateStatus(message._id, 'pending')}
                                                className="px-4 py-2.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl text-xs font-bold transition-all"
                                            >
                                                Set Pending
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleDelete(message._id)}
                                        className="p-3 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                        title="Delete Message"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-10">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 border border-gray-200 rounded-xl hover:bg-white hover:shadow-sm disabled:opacity-50 transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-bold text-gray-500 tracking-widest uppercase">
                        Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                        disabled={page === pagination.pages}
                        className="p-2 border border-gray-200 rounded-xl hover:bg-white hover:shadow-sm disabled:opacity-50 transition-all"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}
