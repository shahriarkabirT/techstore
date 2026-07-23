'use client';

import { useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useGetBrandsQuery, useCreateBrandMutation, useUpdateBrandMutation, useDeleteBrandMutation } from '@/redux/features/brand/brandApi';
import ConfirmationModal from '@/components/shared/ConfirmationModal';
import ImageUpload from '@/components/shared/ImageUpload';
import { IBrand } from '@/types';

export default function AdminBrandsPage() {
    const { data: brands = [], isLoading } = useGetBrandsQuery();
    const [createBrand, { isLoading: isCreating }] = useCreateBrandMutation();
    const [updateBrand, { isLoading: isUpdating }] = useUpdateBrandMutation();
    const [deleteBrand, { isLoading: isDeleting }] = useDeleteBrandMutation();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<IBrand | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [logo, setLogo] = useState('');
    const [description, setDescription] = useState('');
    const [order, setOrder] = useState<number>(0);

    const openCreate = () => {
        setEditingBrand(null);
        setName('');
        setLogo('');
        setDescription('');
        setOrder(0);
        setIsFormOpen(true);
    };

    const openEdit = (brand: IBrand) => {
        setEditingBrand(brand);
        setName(brand.name);
        setLogo(brand.logo);
        setDescription(brand.description || '');
        setOrder(brand.order || 0);
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { toast.error('Brand name is required'); return; }
        if (!logo.trim()) { toast.error('Brand logo is required'); return; }

        try {
            if (editingBrand) {
                const res = await updateBrand({ id: editingBrand._id, body: { name, logo, description, order } }).unwrap();
                if (res.success) {
                    toast.success('Brand updated successfully');
                    setIsFormOpen(false);
                }
            } else {
                const res = await createBrand({ name, logo, description, order }).unwrap();
                if (res.success) {
                    toast.success('Brand created successfully');
                    setIsFormOpen(false);
                }
            }
        } catch (error: any) {
            toast.error(error.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteBrand(deleteId).unwrap();
            toast.success('Brand deleted');
            setDeleteId(null);
        } catch (error: any) {
            toast.error(error.data?.message || 'Failed to delete brand');
        }
    };

    const handleToggleActive = async (brand: IBrand) => {
        try {
            await updateBrand({ id: brand._id, body: { isActive: !brand.isActive } }).unwrap();
            toast.success('Status updated');
        } catch {
            toast.error('Failed to update status');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Brands</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage product brands ({brands.length} total)</p>
                </div>
                <button
                    onClick={openCreate}
                    className="bg-gray-900 text-white hover:bg-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    Add Brand
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-500">Brand</th>
                            <th className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-500 hidden md:table-cell">Description</th>
                            <th className="text-center px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-500">Status</th>
                            <th className="text-right px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            [...Array(3)].map((_, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4"><div className="h-10 bg-gray-100 rounded-lg animate-pulse w-40" /></td>
                                    <td className="px-6 py-4 hidden md:table-cell"><div className="h-4 bg-gray-100 rounded animate-pulse w-60" /></td>
                                    <td className="px-6 py-4"><div className="h-5 bg-gray-100 rounded-full animate-pulse w-16 mx-auto" /></td>
                                    <td className="px-6 py-4"><div className="h-8 bg-gray-100 rounded animate-pulse w-20 ml-auto" /></td>
                                </tr>
                            ))
                        ) : brands.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-200">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                                        </svg>
                                        <p className="text-sm font-medium text-gray-400">No brands yet</p>
                                        <button onClick={openCreate} className="text-sm font-bold text-gray-900 hover:underline">Create your first brand →</button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            brands.map((brand: IBrand) => (
                                <tr key={brand._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg border border-gray-200 overflow-hidden bg-white flex-shrink-0 relative">
                                                {brand.logo ? (
                                                    <Image src={brand.logo} alt={brand.name} fill className="object-contain p-1" />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold">
                                                        {brand.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <span className="text-sm font-bold text-gray-900">{brand.name}</span>
                                                <p className="text-[10px] text-gray-400 font-mono">{brand.slug}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell">
                                        <span className="text-xs text-gray-500 line-clamp-1">{brand.description || '—'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleToggleActive(brand)}
                                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${brand.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}
                                        >
                                            {brand.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEdit(brand)}
                                                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(brand._id)}
                                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Delete"
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

            {/* Create/Edit Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsFormOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">{editingBrand ? 'Edit Brand' : 'Add New Brand'}</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Brand logo and name will appear on product pages and filters</p>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900 mb-2">Brand Name *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 focus:border-gray-900 transition-all placeholder:text-gray-400 outline-none"
                                    placeholder="e.g. Nike, Samsung, Apple"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900 mb-2">Brand Logo *</label>
                                <ImageUpload
                                    images={logo ? [logo] : []}
                                    onImagesChange={(imgs) => setLogo(imgs[0] || '')}
                                    onError={(err) => toast.error(err)}
                                    aspectRatio="2:1"
                                    recommendedSize="1200x600px"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900 mb-2">Description <span className="text-gray-400 normal-case">(optional)</span></label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 focus:border-gray-900 transition-all placeholder:text-gray-400 outline-none resize-none h-24"
                                    placeholder="Brief description about the brand..."
                                    maxLength={500}
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900 mb-2">Display Order</label>
                                <input
                                    type="number"
                                    value={order}
                                    onChange={(e) => setOrder(Number(e.target.value))}
                                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 focus:border-gray-900 transition-all placeholder:text-gray-400 outline-none"
                                    placeholder="e.g. 1, 2, 3"
                                    min={0}
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Lower numbers appear first on the landing page</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-5 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating || isUpdating}
                                    className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
                                >
                                    {(isCreating || isUpdating) ? 'Saving...' : editingBrand ? 'Save Changes' : 'Create Brand'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Brand"
                message="Are you sure you want to delete this brand? Products associated with it will lose their brand reference."
                confirmText="Delete"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}
