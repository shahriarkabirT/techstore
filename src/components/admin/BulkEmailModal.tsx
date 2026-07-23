import React, { useState } from 'react';
import { useSendBulkMarketingEmailMutation } from '@/redux/features/newsletter/newsletterApi';
import { toast } from 'react-hot-toast';
import { X, Send, Link, AlignLeft, Info } from 'lucide-react';

interface BulkEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetEmails: string[] | 'all';
}

export default function BulkEmailModal({ isOpen, onClose, targetEmails }: BulkEmailModalProps) {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [productLink, setProductLink] = useState('');

    const [sendBulkEmail, { isLoading }] = useSendBulkMarketingEmailMutation();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!subject.trim() || !message.trim()) {
            return toast.error('Subject and message are required');
        }

        try {
            const res = await sendBulkEmail({
                target: targetEmails,
                subject,
                message,
                productLink
            }).unwrap();

            toast.success(res.message || 'Email campaign started in the background!');
            setSubject('');
            setMessage('');
            setProductLink('');
            onClose();
        } catch (error: any) {
            toast.error(error.data?.message || 'Failed to send bulk email');
        }
    };

    const targetDescription = targetEmails === 'all'
        ? 'All active subscribers'
        : `${targetEmails.length} selected subscriber${targetEmails.length !== 1 ? 's' : ''}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Send Marketing Email</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Sending to: <span className="font-semibold text-primary">{targetDescription}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-colors"
                        disabled={isLoading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-indigo-800 text-sm">
                        <Info className="w-5 h-5 shrink-0 text-indigo-500" />
                        <div>
                            <strong>Pro Tip:</strong> Use <code>{'{name}'}</code> in your message. It will be automatically replaced by the recipient&apos;s name (extracted from their email) to personalize the message!
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">
                            Subject Line
                        </label>
                        <input
                            type="text"
                            required
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            placeholder="e.g., Big Summer Sale! Check out our new arrivals"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                            <Link className="w-4 h-4 text-gray-400" />
                            Featured Product Link <span className="text-gray-400 font-normal">(Optional)</span>
                        </label>
                        <input
                            type="url"
                            value={productLink}
                            onChange={(e) => setProductLink(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            placeholder="https://yourstore.com/products/awesome-item"
                            disabled={isLoading}
                        />
                        <p className="text-xs text-gray-500 mt-1.5">If provided, a prominent &quot;Check It Out&quot; button will be added to the email.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                            <AlignLeft className="w-4 h-4 text-gray-400" />
                            Message Content
                        </label>
                        <textarea
                            required
                            rows={8}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                            placeholder="Dear {name},&#10;&#10;We are excited to announce..."
                            disabled={isLoading}
                        />
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !subject.trim() || !message.trim()}
                            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 disabled:bg-primary/50 rounded-xl transition-all"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Sending Strategy...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Send Campaign
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
