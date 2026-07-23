'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('@/components/shared/RichTextEditor'), { ssr: false });

type ContentMode = 'editor' | 'html';

export default function NewPolicyPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [contentMode, setContentMode] = useState<ContentMode>('editor');
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        content: '',
        isActive: true,
        order: 0,
    });

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        setFormData(prev => ({
            ...prev,
            title,
            slug: generateSlug(title),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.slug || !formData.content) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsLoading(true);
        try {
            const res = await axios.post('/api/policies', formData);
            if (res.data.success) {
                toast.success('Policy created successfully');
                router.push('/admin/policies');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create policy');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/policies"
                    className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Create Policy</h1>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Add a new store policy</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-widest">Policy Title *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={handleTitleChange}
                            placeholder="e.g. Return Policy"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-widest">URL Slug *</label>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                            placeholder="e.g. return-policy"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-widest">Display Order</label>
                        <input
                            type="number"
                            value={formData.order}
                            onChange={(e) => setFormData(prev => ({ ...prev, order: Number(e.target.value) }))}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3 pt-8">
                        <input
                            type="checkbox"
                            className="toggle toggle-primary"
                            checked={formData.isActive}
                            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        />
                        <label className="text-sm font-bold text-gray-700">Published Status</label>
                    </div>
                </div>

                {/* Content Mode Selector */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-widest">Policy Content *</label>
                        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
                            <button
                                type="button"
                                onClick={() => setContentMode('editor')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                                    contentMode === 'editor'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                ✍️ Text Editor
                            </button>
                            <button
                                type="button"
                                onClick={() => setContentMode('html')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                                    contentMode === 'html'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {'</>'} HTML
                            </button>
                        </div>
                    </div>

                    {contentMode === 'editor' ? (
                        <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-transparent transition-all">
                            <RichTextEditor
                                value={formData.content}
                                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                                placeholder="Write your policy content here..."
                                className="border-none min-h-[400px]"
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-700 font-medium">
                                ⚠️ Paste raw HTML here. It will be rendered as-is on the client side.
                            </div>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                placeholder={'<h2>Policy Title</h2>\n<p>Your policy content...</p>'}
                                rows={18}
                                className="w-full bg-gray-900 text-green-400 font-mono text-sm border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-600 resize-y placeholder:text-gray-600"
                                spellCheck={false}
                            />
                            {formData.content && (
                                <div className="border border-gray-200 rounded-xl p-4">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Preview</p>
                                    <div
                                        className="prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: formData.content }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                    <Link
                        href="/admin/policies"
                        className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-8 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            'Save Policy'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
