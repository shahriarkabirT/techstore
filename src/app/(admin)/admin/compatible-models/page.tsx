'use client';

import { useState, useEffect } from 'react';
import {
    useGetCompatibleModelsQuery,
    useCreateCompatibleModelMutation,
    useUpdateCompatibleModelMutation,
    useDeleteCompatibleModelMutation,
} from '@/redux/features/compatibleModel/compatibleModelApi';
import type { ICompatibleModel } from '@/types';
import { showError, showSuccess } from '@/lib/toast';
import ModelCategoryModal from '@/components/admin/ModelCategoryModal';
import { useGetModelCategoriesQuery } from '@/redux/features/modelCategory/modelCategoryApi';

export default function CompatibleModelsPage() {
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const { data, isLoading, isFetching } = useGetCompatibleModelsQuery({ page, limit: 20, search: debouncedSearch });
    const [createModel, { isLoading: isCreating }] = useCreateCompatibleModelMutation();
    const [updateModel, { isLoading: isUpdating }] = useUpdateCompatibleModelMutation();
    const [deleteModel] = useDeleteCompatibleModelMutation();

    const [newModelName, setNewModelName] = useState('');
    const [newModelCategoryId, setNewModelCategoryId] = useState('');
    const [newModelOrder, setNewModelOrder] = useState('0');
    const [editing, setEditing] = useState<{ id: string; name: string; category?: string; order: number } | null>(null);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    const { data: categoryData } = useGetModelCategoriesQuery({ limit: 100 });
    const categories = categoryData?.categories || [];

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput);
            setPage(1); // Reset page on new search
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const handleCreate = async () => {
        if (!newModelName.trim()) {
            showError('Model name is required');
            return;
        }

        try {
            const res = await createModel({ 
                name: newModelName.trim(),
                category: newModelCategoryId || undefined,
                order: parseInt(newModelOrder) || 0 
            }).unwrap();
            if (res.success) {
                showSuccess('Created', 'Model added successfully');
                setNewModelName('');
                setNewModelCategoryId('');
                setNewModelOrder('0');
            }
        } catch (error: any) {
            showError(error?.data?.message || 'Failed to create model');
        }
    };

    const handleUpdate = async (id: string, currentName: string, currentCategory: any, currentOrder: number) => {
        if (!editing) return;
        
        const currentCategoryId = typeof currentCategory === 'object' ? currentCategory?._id : currentCategory;
        const normalizedCurrent = currentCategoryId || 'General';
        const normalizedEditing = editing.category || 'General';

        if (editing.name.trim() === currentName && normalizedEditing === normalizedCurrent && editing.order === currentOrder) {
            setEditing(null);
            return;
        }

        try {
            const res = await updateModel({
                id,
                body: { 
                    name: editing.name.trim(),
                    category: editing.category?.trim(),
                    order: editing.order
                },
            }).unwrap();
            if (res.success) {
                showSuccess('Updated', 'Model updated successfully');
                setEditing(null);
            }
        } catch (error: any) {
            showError(error?.data?.message || 'Failed to update model');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this model?')) return;
        try {
            const res = await deleteModel(id).unwrap();
            if (res.success) {
                showSuccess('Deleted', 'Model deleted successfully');
            }
        } catch (error: any) {
            showError(error?.data?.message || 'Failed to delete model');
        }
    };

    const handleToggleStatus = async (model: ICompatibleModel) => {
        try {
            await updateModel({
                id: model._id,
                body: { isActive: !model.isActive },
            }).unwrap();
            showSuccess('Updated', `Model ${!model.isActive ? 'activated' : 'deactivated'}`);
        } catch (error: any) {
            showError(error?.data?.message || 'Failed to update status');
        }
    };

    const models = data?.models || [];
    const totalPages = data?.totalPages || 1;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Compatible Models</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage a centralized list of models (e.g., iPhone 15 Pro, Galaxy S24) to quickly select when creating products.
                </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-1.5 h-6 rounded-full bg-blue-600" />
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                        Add New Model
                    </h3>
                </div>

                <div className="flex items-end gap-3">
                    <div className="flex-1">
                        <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900 mb-2">
                            Model Name
                        </label>
                        <input
                            type="text"
                            value={newModelName}
                            onChange={(e) => setNewModelName(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-900 outline-none transition-all placeholder:text-gray-400"
                            placeholder="e.g. iPhone 15 Pro Max"
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900 mb-2 flex justify-between items-center">
                            <span>Category</span>
                            <button onClick={() => setIsCategoryModalOpen(true)} className="text-indigo-600 hover:text-indigo-800 text-[9px] hover:underline">Manage Categories</button>
                        </label>
                        <select
                            value={newModelCategoryId}
                            onChange={(e) => setNewModelCategoryId(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-900 outline-none transition-all"
                        >
                            <option value="">-- No Category --</option>
                            {categories.map(cat => (
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-24">
                        <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-900 mb-2">
                            Order
                        </label>
                        <input
                            type="number"
                            value={newModelOrder}
                            onChange={(e) => setNewModelOrder(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-900 outline-none transition-all"
                            placeholder="0"
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        />
                    </div>
                    <button
                        onClick={handleCreate}
                        disabled={isCreating}
                        className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-50 h-[42px]"
                    >
                        {isCreating ? 'Adding...' : 'Add'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search models..."
                        className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-900 focus:border-gray-900 outline-none transition-all placeholder:text-gray-400 w-64"
                    />
                    <div className="text-xs text-gray-500 font-medium">
                        Total Models: {data?.total || 0}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50/50">
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest w-20">Order</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Model Name</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Category</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest w-24">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest text-right w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 relative">
                            {isLoading || isFetching ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center">
                                        <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                                    </td>
                                </tr>
                            ) : models.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">
                                        No models found. Add one above.
                                    </td>
                                </tr>
                            ) : (
                                models.map((model) => (
                                    <tr key={model._id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            {editing?.id === model._id ? (
                                                <input
                                                    type="number"
                                                    value={editing.order}
                                                    onChange={(e) => setEditing({ ...editing, order: parseInt(e.target.value) || 0 })}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleUpdate(model._id, model.name, model.category, model.order);
                                                        if (e.key === 'Escape') setEditing(null);
                                                    }}
                                                    className="w-16 bg-white border border-blue-500 rounded px-2 py-1.5 text-sm font-medium text-gray-900 outline-none"
                                                />
                                            ) : (
                                                <span className="text-sm font-medium text-gray-500">{model.order}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {editing?.id === model._id ? (
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    value={editing.name}
                                                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleUpdate(model._id, model.name, model.category, model.order);
                                                        if (e.key === 'Escape') setEditing(null);
                                                    }}
                                                    className="w-full bg-white border border-blue-500 rounded px-3 py-1.5 text-sm font-medium text-gray-900 outline-none"
                                                />
                                            ) : (
                                                <span className="text-sm font-semibold text-gray-900">{model.name}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {editing?.id === model._id ? (
                                                <select
                                                    value={editing.category || ''}
                                                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                                                    className="w-full bg-white border border-blue-500 rounded px-3 py-1.5 text-sm font-medium text-gray-900 outline-none"
                                                >
                                                    <option value="">-- None --</option>
                                                    {categories.map(cat => (
                                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                    {(model.category as any)?.name || 'General'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleStatus(model)}
                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${model.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                            >
                                                <span
                                                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${model.isActive ? 'translate-x-4' : 'translate-x-1'}`}
                                                />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {editing?.id === model._id ? (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdate(model._id, model.name, model.category, model.order)}
                                                        disabled={isUpdating}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => setEditing(null)}
                                                        className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => setEditing({ id: model._id, name: model.name, category: (model.category as any)?._id || '', order: model.order })}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(model._id)}
                                                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                        </svg>
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50/50">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-500 font-medium">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            <ModelCategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} />
        </div>
    );
}
