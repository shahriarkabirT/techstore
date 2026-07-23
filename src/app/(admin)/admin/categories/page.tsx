'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    useGetCategoriesQuery, useAddCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation, useBulkDeleteCategoriesMutation,
    useGetSubCategoriesQuery, useAddSubCategoryMutation, useUpdateSubCategoryMutation, useDeleteSubCategoryMutation, useBulkDeleteSubCategoriesMutation,
    useGetChildCategoriesQuery, useAddChildCategoryMutation, useUpdateChildCategoryMutation, useDeleteChildCategoryMutation, useBulkDeleteChildCategoriesMutation,
    useGetSubChildCategoriesQuery, useAddSubChildCategoryMutation, useUpdateSubChildCategoryMutation, useDeleteSubChildCategoryMutation, useBulkDeleteSubChildCategoriesMutation,
} from '@/redux/features/categories/categoryApi';
import toast from 'react-hot-toast';
import { CATEGORY_LEVELS, CategoryLevel } from '@/constants/categoryConfig';
import CategoryToolbar from '@/components/admin/categories/CategoryToolbar';
import CategoryTable from '@/components/admin/categories/CategoryTable';
import CategoryForm from '@/components/admin/categories/CategoryForm';
import ConfirmationModal from '@/components/shared/ConfirmationModal';
import { useDebounce } from '@/hooks/useDebounce';

function CategoriesContent() {
    const searchParams = useSearchParams();
    const currentLevel = parseInt(searchParams.get('level') || '0') as CategoryLevel;
    const config = CATEGORY_LEVELS[currentLevel] || CATEGORY_LEVELS[0];

    // --- State ---
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        action: 'delete' | 'bulk-delete';
        id?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        action: 'delete'
    });

    const [filters, setFilters] = useState({
        search: '',
        isActive: '',
        sortBy: 'order',
        sortOrder: 'asc',
        categoryFilter: '',
        subCategoryFilter: '',
        childCategoryFilter: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10
    });

    // Debounce search using shared hook
    const debouncedSearch = useDebounce(filters.search, 400);

    // Handle filter changes (sync with pagination reset)
    const handleFilterChange = (newFilters: any) => {
        setFilters(newFilters);
        setPagination(prev => ({ ...prev, page: 1 }));
    };


    // --- Redux Hooks Selection ---
    const queryParams: any = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
        isActive: filters.isActive,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
    };

    if (currentLevel === 1 && filters.categoryFilter) {
        queryParams.categoryId = filters.categoryFilter;
    } else if (currentLevel === 2 && filters.subCategoryFilter) {
        queryParams.subCategoryId = filters.subCategoryFilter;
    } else if (currentLevel === 3 && filters.childCategoryFilter) {
        queryParams.childCategoryId = filters.childCategoryFilter;
    }

    // 1. Get Data Hook
    const categoriesQuery = useGetCategoriesQuery(queryParams, { skip: currentLevel !== 0 });
    const subCategoriesQuery = useGetSubCategoriesQuery(queryParams, { skip: currentLevel !== 1 });
    const childCategoriesQuery = useGetChildCategoriesQuery(queryParams, { skip: currentLevel !== 2 });
    const subChildCategoriesQuery = useGetSubChildCategoriesQuery(queryParams, { skip: currentLevel !== 3 });

    const currentQuery = useMemo(() => {
        if (currentLevel === 0) return categoriesQuery;
        if (currentLevel === 1) return subCategoriesQuery;
        if (currentLevel === 2) return childCategoriesQuery;
        return subChildCategoriesQuery;
    }, [currentLevel, categoriesQuery, subCategoriesQuery, childCategoriesQuery, subChildCategoriesQuery]);

    const { data: queryData, isLoading, isFetching } = currentQuery;
    const items = useMemo(() => {
        if (!queryData) return [];
        // The API returns different keys (categories, subCategories, etc), so we just find the array
        const key = Object.keys(queryData).find(k => Array.isArray(queryData[k]));
        return queryData[key || 'categories'] || [];
    }, [queryData]);

    const meta = queryData?.pagination || { total: 0, pages: 0, page: 1, limit: 10 };

    // 2. Get Parents Chain (for filtering and form)
    const parentQueryParams = { active: 'true', limit: 1000 };
    
    const { data: topCategoriesData } = useGetCategoriesQuery(parentQueryParams, { skip: currentLevel < 1 });
    const { data: topSubCategoriesData } = useGetSubCategoriesQuery(
        { ...parentQueryParams, categoryId: filters.categoryFilter || undefined }, 
        { skip: currentLevel < 2 }
    );
    const { data: topChildCategoriesData } = useGetChildCategoriesQuery(
        { ...parentQueryParams, subCategoryId: filters.subCategoryFilter || undefined }, 
        { skip: currentLevel < 3 }
    );

    const parentChain = useMemo(() => ({
        categories: topCategoriesData?.categories || [],
        subCategories: topSubCategoriesData?.subCategories || [],
        childCategories: topChildCategoriesData?.childCategories || []
    }), [topCategoriesData, topSubCategoriesData, topChildCategoriesData]);

    const parents = useMemo(() => {
        if (currentLevel === 1) return parentChain.categories;
        if (currentLevel === 2) return parentChain.subCategories;
        if (currentLevel === 3) return parentChain.childCategories;
        return [];
    }, [currentLevel, parentChain]);


    // 3. Mutations
    const [addCategory, { isLoading: isAdding0 }] = useAddCategoryMutation();
    const [updateCategory, { isLoading: isUpdating0 }] = useUpdateCategoryMutation();
    const [deleteCategory, { isLoading: isDeleting0 }] = useDeleteCategoryMutation();
    const [bulkDeleteCategories, { isLoading: isBulkDeleting0 }] = useBulkDeleteCategoriesMutation();

    const [addSubCategory, { isLoading: isAdding1 }] = useAddSubCategoryMutation();
    const [updateSubCategory, { isLoading: isUpdating1 }] = useUpdateSubCategoryMutation();
    const [deleteSubCategory, { isLoading: isDeleting1 }] = useDeleteSubCategoryMutation();
    const [bulkDeleteSubCategories, { isLoading: isBulkDeleting1 }] = useBulkDeleteSubCategoriesMutation();

    const [addChildCategory, { isLoading: isAdding2 }] = useAddChildCategoryMutation();
    const [updateChildCategory, { isLoading: isUpdating2 }] = useUpdateChildCategoryMutation();
    const [deleteChildCategory, { isLoading: isDeleting2 }] = useDeleteChildCategoryMutation();
    const [bulkDeleteChildCategories, { isLoading: isBulkDeleting2 }] = useBulkDeleteChildCategoriesMutation();

    const [addSubChildCategory, { isLoading: isAdding3 }] = useAddSubChildCategoryMutation();
    const [updateSubChildCategory, { isLoading: isUpdating3 }] = useUpdateSubChildCategoryMutation();
    const [deleteSubChildCategory, { isLoading: isDeleting3 }] = useDeleteSubChildCategoryMutation();
    const [bulkDeleteSubChildCategories, { isLoading: isBulkDeleting3 }] = useBulkDeleteSubChildCategoriesMutation();

    const isSubmitting = isAdding0 || isUpdating0 || isAdding1 || isUpdating1 || isAdding2 || isUpdating2 || isAdding3 || isUpdating3;
    const isDeleting = isDeleting0 || isDeleting1 || isDeleting2 || isDeleting3 || isBulkDeleting0 || isBulkDeleting1 || isBulkDeleting2 || isBulkDeleting3;


    // --- Handlers ---

    const handleFormSubmit = async (data: any) => {
        try {
            let res: any;
            if (editingItem) {
                // Update
                const updatePayload = { id: editingItem._id, ...data };
                if (currentLevel === 0) res = await updateCategory(updatePayload);
                else if (currentLevel === 1) res = await updateSubCategory(updatePayload);
                else if (currentLevel === 2) res = await updateChildCategory(updatePayload);
                else res = await updateSubChildCategory(updatePayload);
            } else {
                // Create
                if (currentLevel === 0) res = await addCategory(data);
                else if (currentLevel === 1) res = await addSubCategory(data);
                else if (currentLevel === 2) res = await addChildCategory(data);
                else res = await addSubChildCategory(data);
            }

            if (res.data?.success) {
                toast.success(editingItem ? 'Updated successfully' : 'Created successfully');
                setIsFormOpen(false);
                setEditingItem(null);
            } else {
                toast.error(res.error?.data?.message || res.data?.message || 'Operation failed');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error('Something went wrong');
        }
    };

    // Toggle Modal Wrappers
    const confirmDelete = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Item',
            message: 'Are you sure you want to delete this item? This action cannot be undone.',
            action: 'delete',
            id
        });
    };

    const confirmBulkDelete = () => {
        if (selectedIds.length === 0) return;
        setConfirmModal({
            isOpen: true,
            title: 'Delete Items',
            message: `Are you sure you want to delete ${selectedIds.length} items? This action cannot be undone.`,
            action: 'bulk-delete'
        });
    };

    // Actual Logic
    const handleConfirmAction = async () => {
        try {
            let res: any;

            if (confirmModal.action === 'delete' && confirmModal.id) {
                const id = confirmModal.id;
                if (currentLevel === 0) res = await deleteCategory(id);
                else if (currentLevel === 1) res = await deleteSubCategory(id);
                else if (currentLevel === 2) res = await deleteChildCategory(id);
                else res = await deleteSubChildCategory(id);

                if (res.data?.success) {
                    toast.success('Deleted successfully');
                    if (selectedIds.includes(id)) {
                        setSelectedIds(prev => prev.filter(i => i !== id));
                    }
                }
            } else if (confirmModal.action === 'bulk-delete') {
                if (currentLevel === 0) res = await bulkDeleteCategories(selectedIds);
                else if (currentLevel === 1) res = await bulkDeleteSubCategories(selectedIds);
                else if (currentLevel === 2) res = await bulkDeleteChildCategories(selectedIds);
                else res = await bulkDeleteSubChildCategories(selectedIds);

                if (res.data?.success) {
                    toast.success('Items deleted successfully');
                    setSelectedIds([]);
                }
            }

            if (res && !res.data?.success) {
                toast.error(res.error?.data?.message || res.data?.message || 'Operation failed');
            }

            setConfirmModal(prev => ({ ...prev, isOpen: false }));

        } catch (error) {
            console.error('Error executing action:', error);
            toast.error('Something went wrong');
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const payload = { id: id, isActive: !currentStatus };
            let res: any;
            if (currentLevel === 0) res = await updateCategory(payload);
            else if (currentLevel === 1) res = await updateSubCategory(payload);
            else if (currentLevel === 2) res = await updateChildCategory(payload);
            else res = await updateSubChildCategory(payload);

            if (res.data?.success) {
                toast.success('Status updated');
            } else {
                toast.error('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedIds(items.map((item: any) => item._id));
        else setSelectedIds([]);
    };

    const handleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    return (
        <div className="space-y-6">
            <CategoryToolbar
                config={config}
                filters={filters}
                setFilters={handleFilterChange}
                onBulkDelete={confirmBulkDelete}
                selectedCount={selectedIds.length}
                onAdd={() => { setEditingItem(null); setIsFormOpen(true); }}
                parentChain={parentChain}
                level={currentLevel}
            />

            <CategoryTable
                items={items}
                isLoading={isLoading}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onSelectAll={handleSelectAll}
                onEdit={(item) => { setEditingItem(item); setIsFormOpen(true); }}
                onDelete={confirmDelete}
                onToggleActive={handleToggleActive}
                config={config}
                level={currentLevel}
            />

            {/* Pagination */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-500">
                    Showing <span className="font-medium">{items.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> to{' '}
                    <span className="font-medium">{Math.min(pagination.page * pagination.limit, meta.total)}</span> of{' '}
                    <span className="font-medium">{meta.total}</span> results
                </div>
                <div className="flex items-center gap-4">
                    <select
                        value={pagination.limit}
                        onChange={(e) => setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                        className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-gray-900 focus:border-gray-900 block p-2 outline-none"
                    >
                        <option value="5">5 per page</option>
                        <option value="10">10 per page</option>
                        <option value="20">20 per page</option>
                        <option value="50">50 per page</option>
                    </select>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                            disabled={pagination.page === 1}
                            className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <div className="flex items-center gap-1">
                            <span className="px-3 py-1 text-sm font-medium text-gray-900 bg-gray-100 rounded-lg">
                                Page {pagination.page} / {meta.pages || 1}
                            </span>
                        </div>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(meta.pages || 1, prev.page + 1) }))}
                            disabled={pagination.page >= (meta.pages || 1)}
                            className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            <CategoryForm
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setEditingItem(null); }}
                onSubmit={handleFormSubmit}
                initialData={editingItem}
                isSubmitting={isSubmitting}
                parents={parents}
                level={currentLevel}
                config={config}
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmAction}
                title={confirmModal.title}
                message={confirmModal.message}
                isLoading={isDeleting}
                variant="danger"
                confirmText={confirmModal.action === 'bulk-delete' ? 'Delete Items' : 'Delete'}
            />
        </div>
    );
}

export default function AdminCategoriesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CategoriesPageWrapper />
        </Suspense>
    );
}

function CategoriesPageWrapper() {
    const searchParams = useSearchParams();
    const currentLevel = parseInt(searchParams.get('level') || '0') as CategoryLevel;

    return <CategoriesContent key={currentLevel} />;
}

