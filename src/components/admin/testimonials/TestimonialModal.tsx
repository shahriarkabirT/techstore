'use client';

import { useEffect, useState } from 'react';
import ImageUpload from '@/components/shared/ImageUpload';
import { ITestimonial } from '@/types';

interface TestimonialModalProps {
    isOpen: boolean;
    onClose: () => void;
    testimonial: ITestimonial | null;
    onSubmit: (data: Partial<ITestimonial>) => Promise<void>;
    isLoading: boolean;
}

export default function TestimonialModal({
    isOpen,
    onClose,
    testimonial,
    onSubmit,
    isLoading
}: TestimonialModalProps) {
    const [formData, setFormData] = useState<Partial<ITestimonial>>(
        testimonial ? {
            name: testimonial.name,
            designation: testimonial.designation || '',
            quote: testimonial.quote,
            profilePicture: testimonial.profilePicture,
            isActive: testimonial.isActive,
            order: testimonial.order
        } : {
            name: '',
            designation: '',
            quote: '',
            profilePicture: '',
            isActive: true,
            order: 0
        }
    );
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {testimonial ? 'Edit Testimonial' : 'New Testimonial'}
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
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Person Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all placeholder:text-gray-400"
                                placeholder="e.g. John Doe"
                                required
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                            <input
                                type="text"
                                value={formData.designation}
                                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all placeholder:text-gray-400"
                                placeholder="e.g. CEO, Tech Corp (Optional)"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quote</label>
                            <textarea
                                value={formData.quote}
                                onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all placeholder:text-gray-400 min-h-[100px] resize-none"
                                placeholder="What they said about us..."
                                required
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Profile picture <span className="font-normal text-gray-500">(optional — default avatar if empty)</span>
                            </label>
                            <ImageUpload
                                images={formData.profilePicture ? [formData.profilePicture] : []}
                                onImagesChange={(imgs) => {
                                    setFormData({ ...formData, profilePicture: imgs[imgs.length - 1] || '' });
                                    setUploadError(null);
                                }}
                                onError={(msg) => setUploadError(msg)}
                            />
                            {uploadError && <p className="text-sm text-rose-600 mt-2">{uploadError}</p>}
                        </div>

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

                        <div className="col-span-2 flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                            />
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
                            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading && (
                                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {isLoading ? 'Saving...' : testimonial ? 'Update Testimonial' : 'Create Testimonial'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
