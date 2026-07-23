'use client';

import { useState, useEffect } from 'react';
import ImageUpload from '@/components/shared/ImageUpload';

interface CategoryFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData: any;
    isSubmitting: boolean;
    parents: any[];
    level: number;
    config: any;
}

function getDefaultFormData(initialData: any, config: any) {
    if (!initialData) {
        return {
            name: '',
            description: '',
            parentId: '',
            bannerImage: '',
            image: '',
            isActive: true,
            showToLandingPage: false,
            showOnMid: false,
            order: 0
        };
    }

    let parentId = '';
    if (config.parentField) {
        const parentObj = initialData[config.parentField];
        parentId = typeof parentObj === 'object' ? parentObj?._id : parentObj;
    }

    return {
        name: initialData.name || '',
        description: initialData.description || '',
        parentId: parentId || '',
        bannerImage: initialData.bannerImage || '',
        image: initialData.image || '',
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
        showToLandingPage: initialData.showToLandingPage !== undefined ? initialData.showToLandingPage : false,
        showOnMid: initialData.showOnMid !== undefined ? initialData.showOnMid : false,
        order: initialData.order !== undefined ? initialData.order : 0
    };
}


export default function CategoryForm({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isSubmitting,
    parents,
    level,
    config
}: CategoryFormProps) {
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    const [prevInitialData, setPrevInitialData] = useState(initialData);

    const [formData, setFormData] = useState(() => getDefaultFormData(initialData, config));

    if (isOpen !== prevIsOpen || initialData !== prevInitialData) {
        setPrevIsOpen(isOpen);
        setPrevInitialData(initialData);
        if (isOpen) {
            setFormData(getDefaultFormData(initialData, config));
        } else {
            setFormData(getDefaultFormData(null, config));
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        if (config.parentField && !formData.parentId) {
            alert(`Please select a ${config.parentLabel}`);
            return;
        }

        if ((level === 0) && (!formData.bannerImage)) {
            alert('Banner Image is required.');
            return;
        }

        // Clean payload construction
        const payload: any = {
            name: formData.name,
            description: formData.description,
            isActive: formData.isActive,
            showToLandingPage: formData.showToLandingPage,
            showOnMid: (formData as any).showOnMid || false,
            order: (formData as any).order ?? 0
        };

        if (level === 0) {
            payload.bannerImage = formData.bannerImage;
        }

        if (config.parentField) {
            payload[config.parentField] = formData.parentId;
        }

        await onSubmit(payload);
    };

    if (!isOpen) return null;

    // Helper to format parent options with hierarchy
    const formatParentOption = (parent: any) => {
        if (level === 2 && parent.categoryId) {
            // Child Category Parent is SubCategory, show (Category)
            const catName = typeof parent.categoryId === 'object' ? parent.categoryId.name : '';
            return `${parent.name} ${catName ? `(${catName})` : ''}`;
        }
        if (level === 3 && parent.subCategoryId) {
            // SubChild Category Parent is ChildCategory, show (SubCategory)
            const subCatName = typeof parent.subCategoryId === 'object' ? parent.subCategoryId.name : '';
            return `${parent.name} ${subCatName ? `(${subCatName})` : ''}`;
        }
        return parent.name;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {initialData ? 'Edit' : 'Add New'} {config.title.slice(0, -1)}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {initialData ? 'Update existing details' : 'Fill in the information below'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                                    placeholder="e.g. Summer Collection"
                                    required
                                />
                            </div>

                            {config.parentField && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent ({config.parentLabel}) <span className="text-rose-500">*</span></label>
                                    <select
                                        value={formData.parentId}
                                        onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all cursor-pointer"
                                        required
                                    >
                                        <option value="">Select Parent...</option>
                                        {parents.map((p: any) => (
                                            <option key={p._id} value={p._id}>
                                                {formatParentOption(p)}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Select the parent category this item belongs to.</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={(formData as any).order ?? 0}
                                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) } as any)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                                    placeholder="0"
                                />
                                <p className="text-xs text-gray-500 mt-1">Lower number = appears first. Used to sort categories on the landing page and nav bar.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    <span className="ml-3 text-sm font-medium text-gray-700">{formData.isActive ? 'Active' : 'Inactive'}</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Landing Page Visibility</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.showToLandingPage}
                                        onChange={(e) => setFormData({ ...formData, showToLandingPage: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    <span className="ml-3 text-sm font-medium text-gray-700">{formData.showToLandingPage ? 'Visible' : 'Hidden'}</span>
                                </label>
                                <p className="text-xs text-gray-500 mt-1 pb-2">If enabled, products from this category will form a slider on the homepage.</p>
                            </div>

                            {level === 1 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mid-Section Slider</label>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={(formData as any).showOnMid || false}
                                            onChange={(e) => setFormData({ ...formData, showOnMid: e.target.checked } as any)}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                        <span className="ml-3 text-sm font-medium text-gray-700">{(formData as any).showOnMid ? 'Visible' : 'Hidden'}</span>
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1 pb-2">Shows a product slider after the promotional banners (mid-section).</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all min-h-[120px] resize-none"
                                    placeholder="Optional description..."
                                />
                            </div>
                        </div>
                    </div>

                    {level === 0 && (
                    <div className="border-t border-gray-100 pt-6">
                        <h3 className="text-sm font-medium text-gray-900 mb-4 block">Images</h3>
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Banner Image <span className="text-rose-500">*</span>
                                </label>
                                <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                                    <ImageUpload
                                        images={formData.bannerImage ? [formData.bannerImage] : []}
                                        onImagesChange={(imgs) => setFormData({ ...formData, bannerImage: imgs[imgs.length - 1] || '' })}
                                        aspectRatio="4:3"
                                        recommendedSize="800x600px"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </span>
                            ) : (
                                initialData ? 'Update Changes' : 'Create Item'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
