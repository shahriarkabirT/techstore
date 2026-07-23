'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import Image from 'next/image';
import RichTextEditor from '@/components/shared/RichTextEditor';

interface BlogFormProps {
    initialData?: any;
    isEdit?: boolean;
}

export default function BlogForm({ initialData, isEdit }: BlogFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        thumbnail: initialData?.thumbnail || '',
        content: initialData?.content || '',
        isActive: initialData?.isActive ?? true,
        seoMetadata: {
            title: initialData?.seoMetadata?.title || '',
            description: initialData?.seoMetadata?.description || '',
            keywords: initialData?.seoMetadata?.keywords || '',
        }
    });

    const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const res = await axios.post('/api/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success && res.data.imageUrl) {
                setFormData(prev => ({ ...prev, thumbnail: res.data.imageUrl }));
                toast.success('Thumbnail uploaded');
            } else {
                toast.error(res.data.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Thumbnail upload error:', error);
            toast.error('Failed to upload thumbnail');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.title.trim()) return toast.error('Title is required');
        if (!formData.thumbnail) return toast.error('Thumbnail is required');
        if (!formData.content.trim()) return toast.error('Content is required');

        setIsLoading(true);
        try {
            if (isEdit && initialData?._id) {
                await axios.patch(`/api/admin/blogs/${initialData._id}`, formData);
                toast.success('Blog updated successfully');
            } else {
                await axios.post('/api/admin/blogs', formData);
                toast.success('Blog created successfully');
            }
            router.push('/admin/blogs');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save blog');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                        {isEdit ? 'Edit Blog' : 'Create New Blog'}
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.push('/admin/blogs')}
                        className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn bg-gray-900 text-white hover:bg-gray-800 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                        {isLoading ? 'Saving...' : 'Save Blog'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                Blog Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="input w-full"
                                placeholder="Enter blog title"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                Content <span className="text-red-500">*</span>
                            </label>
                            <RichTextEditor
                                value={formData.content}
                                onChange={(content) => setFormData({ ...formData, content })}
                                placeholder="Write your blog content here..."
                            />
                        </div>
                    </div>

                    {/* SEO section */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">SEO Metadata</h3>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">SEO Title</label>
                            <input
                                type="text"
                                value={formData.seoMetadata.title}
                                onChange={(e) => setFormData({ ...formData, seoMetadata: { ...formData.seoMetadata, title: e.target.value } })}
                                className="input w-full"
                                placeholder="Optional custom SEO title"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">SEO Keywords</label>
                            <input
                                type="text"
                                value={formData.seoMetadata.keywords}
                                onChange={(e) => setFormData({ ...formData, seoMetadata: { ...formData.seoMetadata, keywords: e.target.value } })}
                                className="input w-full"
                                placeholder="e.g. ecommerce, fashion, tips"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">SEO Description</label>
                            <textarea
                                value={formData.seoMetadata.description}
                                onChange={(e) => setFormData({ ...formData, seoMetadata: { ...formData.seoMetadata, description: e.target.value } })}
                                className="input w-full min-h-[100px]"
                                placeholder="Brief description for search engines"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Status */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">Status</h3>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                            />
                            <span className="text-sm font-medium text-gray-700">Published</span>
                        </label>
                        <p className="text-xs text-gray-500 mt-2">Uncheck to hide this blog post from the public.</p>
                    </div>

                    {/* Thumbnail */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">
                            Thumbnail <span className="text-red-500">*</span>
                        </h3>
                        
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleThumbnailUpload}
                        />

                        {formData.thumbnail ? (
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 group">
                                <Image
                                    src={formData.thumbnail}
                                    alt="Thumbnail"
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 bg-white rounded-lg text-gray-900 hover:bg-gray-100 transition-colors"
                                        title="Change Image"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, thumbnail: '' })}
                                        className="p-2 bg-rose-500 rounded-lg text-white hover:bg-rose-600 transition-colors"
                                        title="Remove Image"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="w-full aspect-video border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors flex flex-col items-center justify-center text-gray-500 gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Uploading...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                        </svg>
                                        <span className="text-xs font-bold uppercase tracking-widest mt-1">Upload Cover</span>
                                    </>
                                )}
                            </button>
                        )}
                        <p className="text-[10px] text-gray-400 mt-3 text-center">Recommended: 1200x630px (16:9 ratio)</p>
                    </div>
                </div>
            </div>
        </form>
    );
}
