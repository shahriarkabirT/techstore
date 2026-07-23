'use client';

import { useState } from 'react';
import { useSubscribeMutation } from '@/redux/features/newsletter/newsletterApi';
import { toast } from 'react-hot-toast';
import { Send, Loader2 } from 'lucide-react';

export default function NewsletterForm() {
    const [email, setEmail] = useState('');
    const [subscribe, { isLoading }] = useSubscribeMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        try {
            const result = await subscribe({ email }).unwrap();
            if (result.success) {
                toast.success(result.message || 'Thank you for subscribing!');
                setEmail('');
            }
        } catch (error: any) {
            toast.error(error.data?.message || 'Failed to subscribe. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative group">
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full pl-4 pr-12 py-3 bg-white border border-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
            />
            <button
                type="submit"
                aria-label="Subscribe to newsletter"
                disabled={isLoading}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-black text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Send className="w-4 h-4" />
                )}
            </button>
        </form>
    );
}
