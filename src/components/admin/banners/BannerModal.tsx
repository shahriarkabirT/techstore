'use client';

import { useEffect, useState } from 'react';
import ImageUpload from '@/components/shared/ImageUpload';
import { IBanner } from '@/types';

interface BannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    banner: IBanner | null;
    onSubmit: (data: Partial<IBanner>) => Promise<void>;
    isLoading: boolean;
    defaultPosition?: 'primary' | 'secondary' | 'secondary-top' | 'secondary-bottom' | 'promotional-left' | 'promotional-right';
}

export default function BannerModal({
    isOpen,
    onClose,
    banner,
    onSubmit,
    isLoading,
    defaultPosition
}: BannerModalProps) {
    const [formData, setFormData] = useState<Partial<IBanner>>(
        banner ? {
            title: banner.title,
            subtitle: banner.subtitle || '',
            image: banner.image,
            link: banner.link || '',
            isActive: banner.isActive,
            position: banner.position || 'primary',
            order: banner.order
        } : {
            title: '',
            subtitle: '',
            image: '',
            link: '',
            isActive: true,
            position: defaultPosition || 'primary',
            order: 0
        }
    );
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const submitData = { ...formData };
        if (!submitData.title) {
            if (submitData.position === 'secondary') submitData.title = `Secondary Banner ${new Date().toISOString().slice(0, 10)}`;
            else if (submitData.position === 'secondary-top') submitData.title = `Secondary Top Banner ${new Date().toISOString().slice(0, 10)}`;
            else if (submitData.position === 'secondary-bottom') submitData.title = `Secondary Bottom Banner ${new Date().toISOString().slice(0, 10)}`;
            else if (submitData.position === 'promotional-left') submitData.title = `Promo Left Banner ${new Date().toISOString().slice(0, 10)}`;
            else if (submitData.position === 'promotional-right') submitData.title = `Promo Right Banner ${new Date().toISOString().slice(0, 10)}`;
            else submitData.title = `Primary Banner ${new Date().toISOString().slice(0, 10)}`;
        }
        await onSubmit(submitData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {banner ? 'Edit Banner' : 'New Banner'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {formData.position === 'primary' && (
                            <>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all placeholder:text-gray-400"
                                        placeholder="Optional Banner Title"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                                    <input
                                        type="text"
                                        value={formData.subtitle}
                                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all placeholder:text-gray-400"
                                        placeholder="Optional Subtitle"
                                    />
                                </div>
                            </>
                        )}

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
                            <ImageUpload
                                images={formData.image ? [formData.image] : []}
                                onImagesChange={(imgs) => {
                                    setFormData({ ...formData, image: imgs[imgs.length - 1] || '' });
                                    setUploadError(null);
                                }}
                                onError={(msg) => setUploadError(msg)}
                                aspectRatio={
                                    formData.position === 'primary' ? '13:7' :
                                    formData.position === 'promotional-left' || formData.position === 'promotional-right' ? '16:9' :
                                    '16:9'
                                }
                                recommendedSize={
                                    formData.position === 'primary' ? '1300x700px' :
                                    formData.position === 'promotional-left' || formData.position === 'promotional-right' ? '800x450px' :
                                    '800x450px'
                                }
                            />
                            {uploadError && (
                                <p className="text-sm text-rose-600 mt-2 flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {uploadError}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                            <input
                                type="text"
                                value={formData.link}
                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all placeholder:text-gray-400"
                                placeholder="/products/sale"
                            />
                        </div>

                        {formData.position !== 'promotional-left' && formData.position !== 'promotional-right' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                            <input
                                type="number"
                                value={formData.order}
                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all placeholder:text-gray-400"
                                placeholder="0"
                            />
                        </div>
                        )}

                        <div className="col-span-2 flex items-center gap-2">
                            <div className="flex items-center h-5">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                />
                            </div>
                            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                                Active (visible on site)
                            </label>
                        </div>

                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading && (
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {isLoading ? 'Saving...' : banner ? 'Update Banner' : 'Create Banner'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
