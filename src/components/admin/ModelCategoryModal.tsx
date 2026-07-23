'use client';

import { useState } from 'react';
import {
    useGetModelCategoriesQuery,
    useCreateModelCategoryMutation,
    useUpdateModelCategoryMutation,
    useDeleteModelCategoryMutation,
} from '@/redux/features/modelCategory/modelCategoryApi';
import { showError, showSuccess } from '@/lib/toast';

interface ModelCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ModelCategoryModal({ isOpen, onClose }: ModelCategoryModalProps) {
    const { data, isLoading } = useGetModelCategoriesQuery({ limit: 100 });
    const [createCategory, { isLoading: isCreating }] = useCreateModelCategoryMutation();
    const [updateCategory, { isLoading: isUpdating }] = useUpdateModelCategoryMutation();
    const [deleteCategory] = useDeleteModelCategoryMutation();

    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    if (!isOpen) return null;

    const handleCreate = async () => {
        if (!newCategoryName.trim()) return;
        try {
            const res = await createCategory({ name: newCategoryName.trim() }).unwrap();
            if (res.success) {
                showSuccess('Created', 'Category added successfully');
                setNewCategoryName('');
            }
        } catch (error: any) {
            showError(error?.data?.message || 'Failed to create category');
        }
    };

    const handleUpdate = async (id: string, currentName: string) => {
        if (!editingName.trim() || editingName === currentName) {
            setEditingId(null);
            return;
        }
        try {
            const res = await updateCategory({ id, body: { name: editingName.trim() } }).unwrap();
            if (res.success) {
                showSuccess('Updated', 'Category updated successfully');
                setEditingId(null);
            }
        } catch (error: any) {
            showError(error?.data?.message || 'Failed to update category');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this category? Models using it might lose their category reference.')) return;
        try {
            const res = await deleteCategory(id).unwrap();
            if (res.success) {
                showSuccess('Deleted', 'Category deleted successfully');
            }
        } catch (error: any) {
            showError(error?.data?.message || 'Failed to delete category');
        }
    };

    const categories = data?.categories || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Manage Model Categories</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex gap-3">
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="New category name (e.g. Apple)"
                        className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-900 outline-none transition-all placeholder:text-gray-400"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    />
                    <button
                        onClick={handleCreate}
                        disabled={isCreating}
                        className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-50"
                    >
                        {isCreating ? 'Adding...' : 'Add'}
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {isLoading ? (
                        <div className="flex justify-center p-4"><div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" /></div>
                    ) : categories.length === 0 ? (
                        <div className="text-center text-sm text-gray-500 py-4">No categories found.</div>
                    ) : (
                        <ul className="space-y-3">
                            {categories.map((category) => (
                                <li key={category._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                                    {editingId === category._id ? (
                                        <input
                                            type="text"
                                            autoFocus
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleUpdate(category._id, category.name);
                                                if (e.key === 'Escape') setEditingId(null);
                                            }}
                                            className="flex-1 bg-white border border-blue-500 rounded px-3 py-1.5 text-sm font-medium text-gray-900 outline-none mr-3"
                                        />
                                    ) : (
                                        <span className="text-sm font-semibold text-gray-900 flex-1">{category.name}</span>
                                    )}

                                    <div className="flex items-center gap-2">
                                        {editingId === category._id ? (
                                            <>
                                                <button onClick={() => handleUpdate(category._id, category.name)} disabled={isUpdating} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                                                </button>
                                                <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => { setEditingId(category._id); setEditingName(category.name); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                                                </button>
                                                <button onClick={() => handleDelete(category._id)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
