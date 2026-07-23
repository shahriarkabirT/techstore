'use client';

import Link from 'next/link';
import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

import {
    useGetProductsQuery,
    useDeleteProductMutation,
    useUpdateProductMutation,
    useBulkDeleteProductsMutation
} from '@/redux/features/product/productApi';
import {
    useGetCategoriesQuery,
    useGetSubCategoriesQuery,
    useGetChildCategoriesQuery,
    useGetSubChildCategoriesQuery,
} from '@/redux/features/categories/categoryApi';
import ProductTable from '@/components/admin/products/ProductTable';
import ProductViewModal from '@/components/admin/products/ProductViewModal';
import ConfirmationModal from '@/components/shared/ConfirmationModal';
import { IProduct } from '@/types';

export default function AdminProductsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AdminProductsPageInner />
        </Suspense>
    );
}

function AdminProductsPageInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const status = searchParams.get('status');
    const [page, setPage] = useState(1);
    const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filter state
    const [searchInput, setSearchInput] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [selectedChildCategory, setSelectedChildCategory] = useState('');
    const [selectedSubChildCategory, setSelectedSubChildCategory] = useState('');

    // Proper debounce
    const debouncedSearch = useDebounce(searchInput, 400);


    // Reset child filters when parent changes
    const handleCategoryChange = (id: string) => {
        setSelectedCategory(id);
        setSelectedSubCategory('');
        setSelectedChildCategory('');
        setSelectedSubChildCategory('');
        setPage(1);
    };
    const handleSubCategoryChange = (id: string) => {
        setSelectedSubCategory(id);
        setSelectedChildCategory('');
        setSelectedSubChildCategory('');
        setPage(1);
    };
    const handleChildCategoryChange = (id: string) => {
        setSelectedChildCategory(id);
        setSelectedSubChildCategory('');
        setPage(1);
    };
    const handleSubChildCategoryChange = (id: string) => {
        setSelectedSubChildCategory(id);
        setPage(1);
    };

    const clearFilters = () => {
        setSearchInput('');
        setSelectedCategory('');
        setSelectedSubCategory('');
        setSelectedChildCategory('');
        setSelectedSubChildCategory('');
        setPage(1);
    };

    const hasActiveFilters = debouncedSearch || selectedCategory || selectedSubCategory || selectedChildCategory || selectedSubChildCategory;

    // Delete Confirmation State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const [deleteAction, setDeleteAction] = useState<'single' | 'bulk'>('single');

    // Selection State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    let activeParam: string | undefined = 'all';
    if (status === 'published') activeParam = 'true';
    if (status === 'draft') activeParam = 'false';

    // Determine the category filter param: subChild > child > sub > category
    const categoryParam = selectedSubChildCategory || selectedChildCategory || selectedSubCategory || selectedCategory || undefined;

    const {
        data: response,
        isLoading,
        isFetching
    } = useGetProductsQuery({
        page,
        limit: 12,
        active: activeParam,
        search: debouncedSearch || undefined,
        category: categoryParam,
    });

    // Load categories
    const { data: categoriesData } = useGetCategoriesQuery({ limit: 1000 });
    const { data: subCategoriesData } = useGetSubCategoriesQuery(
        { categoryId: selectedCategory, limit: 1000 },
        { skip: !selectedCategory }
    );
    const { data: childCategoriesData } = useGetChildCategoriesQuery(
        { subCategoryId: selectedSubCategory, limit: 1000 },
        { skip: !selectedSubCategory }
    );
    const { data: subChildCategoriesData } = useGetSubChildCategoriesQuery(
        { childCategoryId: selectedChildCategory, limit: 1000 },
        { skip: !selectedChildCategory }
    );

    const categories = (categoriesData as any)?.categories || [];
    const subCategories = (subCategoriesData as any)?.subCategories || [];
    const childCategories = (childCategoriesData as any)?.childCategories || [];
    const subChildCategories = (subChildCategoriesData as any)?.subChildCategories || [];

    const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
    const [bulkDeleteProducts, { isLoading: isBulkDeleting }] = useBulkDeleteProductsMutation();
    const [updateProduct] = useUpdateProductMutation();

    const products = response?.products || [];
    const pagination = response?.pagination || { total: 0, pages: 1 };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const handleDeleteClick = (id: string) => {
        setProductToDelete(id);
        setDeleteAction('single');
        setIsDeleteModalOpen(true);
    };

    const handleBulkDeleteClick = () => {
        if (selectedIds.length === 0) return;
        setDeleteAction('bulk');
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            if (deleteAction === 'single' && productToDelete) {
                await deleteProduct(productToDelete).unwrap();
                toast.success('Product deleted successfully');
                // Remove from selection if deleted
                if (selectedIds.includes(productToDelete)) {
                    setSelectedIds(prev => prev.filter(id => id !== productToDelete));
                }
            } else if (deleteAction === 'bulk') {
                await bulkDeleteProducts(selectedIds).unwrap();
                toast.success('Products deleted successfully');
                setSelectedIds([]);
            }
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
        } catch (error: any) {
            console.error('Error deleting product(s):', error);
            toast.error(error.data?.message || 'Failed to delete product(s)');
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            await updateProduct({ id, body: { isActive: !currentStatus } }).unwrap();
            toast.success('Product status updated');
        } catch (error) {
            console.error('Error updating product:', error);
            toast.error('Failed to update status');
        }
    };

    const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
        try {
            await updateProduct({ id, body: { isFeatured: !currentStatus } }).unwrap();
            toast.success(currentStatus ? 'Removed from featured' : 'Marked as featured');
        } catch (error) {
            console.error('Error updating featured status:', error);
            toast.error('Failed to update featured status');
        }
    };

    const handleView = (product: IProduct) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(products.map((p: IProduct) => p._id));
        } else {
            setSelectedIds([]);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage inventory ({pagination.total} items)</p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkDeleteClick}
                            className="btn bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                        >
                            Delete Selected ({selectedIds.length})
                        </button>
                    )}

                    <select
                        value={status || 'all'}
                        onChange={(e) => {
                            const newStatus = e.target.value;
                            if (newStatus === 'all') {
                                router.push('/admin/products');
                            } else {
                                router.push(`/admin/products?status=${newStatus}`);
                            }
                        }}
                        className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:border-gray-900 transition-all cursor-pointer shadow-sm appearance-none pr-8 relative"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 0.5rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '1.5em 1.5em'
                        }}
                    >
                        <option value="all">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Drafts</option>
                    </select>

                    <Link
                        href="/admin/products/new"
                        className="btn bg-gray-900 text-white hover:bg-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm text-center"
                    >
                        Add Product
                    </Link>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                <div className="flex flex-col gap-3">
                    {/* Search Row */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                id="admin-product-search"
                                placeholder="Search by name, SKU, or product ID..."
                                value={searchInput}
                                onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900/10 transition-all"
                            />
                            {searchInput && (
                                <button
                                    onClick={() => setSearchInput('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-400 transition-all"
                            >
                                <X className="w-3.5 h-3.5" />
                                Clear all
                            </button>
                        )}
                    </div>

                    {/* Category Filters Row */}
                    <div className="flex flex-wrap gap-3">
                        {/* Category */}
                        <div className="relative">
                            <select
                                id="filter-category"
                                value={selectedCategory}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:border-gray-900 transition-all cursor-pointer min-w-[160px]"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                    backgroundPosition: 'right 0.5rem center',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundSize: '1.5em 1.5em'
                                }}
                            >
                                <option value="">All Categories</option>
                                {categories.map((cat: any) => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Sub Category */}
                        {selectedCategory && (
                            <div className="relative">
                                <select
                                    id="filter-subcategory"
                                    value={selectedSubCategory}
                                    onChange={(e) => handleSubCategoryChange(e.target.value)}
                                    className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:border-gray-900 transition-all cursor-pointer min-w-[160px]"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                        backgroundPosition: 'right 0.5rem center',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundSize: '1.5em 1.5em'
                                    }}
                                >
                                    <option value="">All Sub-Categories</option>
                                    {subCategories.map((sub: any) => (
                                        <option key={sub._id} value={sub._id}>{sub.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Child Category */}
                        {selectedSubCategory && (
                            <div className="relative">
                                <select
                                    id="filter-childcategory"
                                    value={selectedChildCategory}
                                    onChange={(e) => handleChildCategoryChange(e.target.value)}
                                    className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:border-gray-900 transition-all cursor-pointer min-w-[160px]"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                        backgroundPosition: 'right 0.5rem center',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundSize: '1.5em 1.5em'
                                    }}
                                >
                                    <option value="">All Child Categories</option>
                                    {childCategories.map((child: any) => (
                                        <option key={child._id} value={child._id}>{child.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Sub Child Category */}
                        {selectedChildCategory && (
                            <div className="relative">
                                <select
                                    id="filter-subchildcategory"
                                    value={selectedSubChildCategory}
                                    onChange={(e) => handleSubChildCategoryChange(e.target.value)}
                                    className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:border-gray-900 transition-all cursor-pointer min-w-[160px]"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                        backgroundPosition: 'right 0.5rem center',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundSize: '1.5em 1.5em'
                                    }}
                                >
                                    <option value="">All Sub-Child Categories</option>
                                    {subChildCategories.map((subChild: any) => (
                                        <option key={subChild._id} value={subChild._id}>{subChild.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Active filter badges */}
                        {hasActiveFilters && (
                            <div className="flex items-center gap-2 ml-auto">
                                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                    Filters active
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ProductTable
                products={products}
                isLoading={isLoading}
                isFetching={isFetching}
                onDelete={handleDeleteClick}
                onView={handleView}
                onToggleActive={handleToggleActive}
                onToggleFeatured={handleToggleFeatured}
                formatPrice={formatPrice}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onSelectAll={handleSelectAll}
            />

            <ProductViewModal
                product={selectedProduct}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title={deleteAction === 'bulk' ? 'Delete Products' : 'Delete Product'}
                message={deleteAction === 'bulk'
                    ? `Are you sure you want to delete ${selectedIds.length} products? This action cannot be undone.`
                    : "Are you sure you want to permanently delete this product? This action cannot be undone."
                }
                confirmText={deleteAction === 'bulk' ? 'Delete All' : 'Delete'}
                variant="danger"
                isLoading={isDeleting || isBulkDeleting}
            />

            {pagination.pages > 1 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-6">
                    <div className="px-4 py-3 flex flex-col sm:flex-row items-center justify-between bg-gray-50 gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">
                                Page {page} of {pagination.pages}
                            </span>
                            <div className="flex items-center gap-1.5 border-l pl-3 border-gray-300">
                                <span className="text-sm text-gray-500">Go to:</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={pagination.pages}
                                    defaultValue={page}
                                    key={`page-input-${page}`}
                                    onBlur={(e) => {
                                        const p = parseInt(e.target.value);
                                        if (p >= 1 && p <= pagination.pages && p !== page) {
                                            setPage(p);
                                        } else {
                                            e.target.value = page.toString();
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.currentTarget.blur();
                                        }
                                    }}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:border-[#FF5087] focus:ring-1 focus:ring-[#FF5087] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(page - 1)}
                                disabled={page <= 1}
                                className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                Previous
                            </button>
                            
                            <div className="hidden md:flex gap-1">
                                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === pagination.pages || Math.abs(p - page) <= 2)
                                    .map((p, i, arr) => {
                                        const elements = [];
                                        if (i > 0 && arr[i - 1] !== p - 1) {
                                            elements.push(<span key={`ellipsis-${p}`} className="px-2 py-1 text-gray-400">...</span>);
                                        }
                                        elements.push(
                                            <button
                                                key={p}
                                                onClick={() => setPage(p)}
                                                className={`px-3 py-1.5 border rounded text-sm transition-colors ${
                                                    page === p 
                                                    ? 'bg-[#FF5087] border-[#FF5087] text-white font-medium shadow-sm' 
                                                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        );
                                        return elements;
                                    })
                                }
                            </div>

                            <button
                                onClick={() => setPage(page + 1)}
                                disabled={page >= pagination.pages}
                                className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
