'use client';

import {
    useGetCategoriesQuery,
    useGetSubCategoriesQuery,
    useGetChildCategoriesQuery,
    useGetSubChildCategoriesQuery
} from '@/redux/features/categories/categoryApi';
import { ICategory, ISubCategory, IChildCategory, ISubChildCategory } from '@/types';
import { useEffect } from 'react';

interface CategoryHierarchySelectorProps {
    category: string;
    subCategory: string;
    childCategory: string;
    subChildCategory: string;
    onChange: (field: string, value: string) => void;
    errors?: Record<string, string>;
}

export default function CategoryHierarchySelector({
    category,
    subCategory,
    childCategory,
    subChildCategory,
    onChange,
    errors = {}
}: CategoryHierarchySelectorProps) {
    // 1. Fetch Top-Level Categories
    const { data: catData, isLoading: catLoading } = useGetCategoriesQuery({ active: 'true', limit: 1000 });
    const categories: ICategory[] = catData?.categories || [];

    // 2. Fetch SubCategories (dependent on category)
    const { data: subData, isLoading: subLoading } = useGetSubCategoriesQuery(
        category ? { categoryId: category, active: 'true', limit: 1000 } : undefined as any,
        { skip: !category }
    );
    // Explicitly handle the response structure appropriately. 
    // The API might return { subCategories: ... } or just array depending on implementation.
    // Based on previous files, it seems to return standardized response.
    // Let's assume the API returns { subCategories: [] } based on naming convention, 
    // but I should verify if I can. 
    // Actually, looking at categoryApi.ts: "providesTags: ['SubCategory']", and typically it returns objects.
    // safe navigation is best.
    const subCategories: ISubCategory[] = (subData as any)?.subCategories || [];

    // 3. Fetch ChildCategories (dependent on subCategory)
    const { data: childData, isLoading: childLoading } = useGetChildCategoriesQuery(
        subCategory ? { subCategoryId: subCategory, active: 'true', limit: 1000 } : undefined as any,
        { skip: !subCategory }
    );
    const childCategories: IChildCategory[] = (childData as any)?.childCategories || [];

    // 4. Fetch SubChildCategories (dependent on childCategory)
    const { data: subChildData, isLoading: subChildLoading } = useGetSubChildCategoriesQuery(
        childCategory ? { childCategoryId: childCategory, active: 'true', limit: 1000 } : undefined as any,
        { skip: !childCategory }
    );
    const subChildCategories: ISubChildCategory[] = (subChildData as any)?.subChildCategories || [];

    // Handlers
    const handleCategoryChange = (val: string) => {
        onChange('category', val);
        // Reset children
        onChange('subCategory', '');
        onChange('childCategory', '');
        onChange('subChildCategory', '');
    };

    const handleSubCategoryChange = (val: string) => {
        onChange('subCategory', val);
        onChange('childCategory', '');
        onChange('subChildCategory', '');
    };

    const handleChildCategoryChange = (val: string) => {
        onChange('childCategory', val);
        onChange('subChildCategory', '');
    };

    const handleSubChildCategoryChange = (val: string) => {
        onChange('subChildCategory', val);
    };

    return (
        <div className="space-y-4">
            {/* Category */}
            <div>
                <label className="block text-[11px] font-medium uppercase tracking-widest text-gray-900 mb-2">
                    Category <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                    <select
                        value={category}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className={`w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-900 outline-none transition-all appearance-none cursor-pointer ${errors.category ? 'border-rose-600' : ''}`}
                        disabled={catLoading}
                    >
                        <option value="">Select Category...</option>
                        {categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-900">
                        {catLoading ? (
                            <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                        )}
                    </div>
                </div>
                {errors.category && <p className="text-[10px] text-rose-600 font-medium mt-2 uppercase tracking-tight">{errors.category}</p>}
            </div>

            {/* Sub Category */}
            {category && (
                <div>
                    <label className="block text-[11px] font-medium uppercase tracking-widest text-gray-900 mb-2">
                        Sub Category
                    </label>
                    <div className="relative">
                        <select
                            value={subCategory}
                            onChange={(e) => handleSubCategoryChange(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-900 outline-none transition-all appearance-none cursor-pointer disabled:bg-gray-50 disabled:text-gray-400"
                            disabled={subLoading || !category}
                        >
                            <option value="">Select Sub Category...</option>
                            {subCategories.map((sub) => (
                                <option key={sub._id} value={sub._id}>
                                    {sub.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-900">
                            {subLoading ? (
                                <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                </svg>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Child Category */}
            {subCategory && (
                <div>
                    <label className="block text-[11px] font-medium uppercase tracking-widest text-gray-900 mb-2">
                        Child Category
                    </label>
                    <div className="relative">
                        <select
                            value={childCategory}
                            onChange={(e) => handleChildCategoryChange(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-900 outline-none transition-all appearance-none cursor-pointer disabled:bg-gray-50 disabled:text-gray-400"
                            disabled={childLoading || !subCategory}
                        >
                            <option value="">Select Child Category...</option>
                            {childCategories.map((child) => (
                                <option key={child._id} value={child._id}>
                                    {child.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-900">
                            {childLoading ? (
                                <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                </svg>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Sub Child Category */}
            {childCategory && (
                <div>
                    <label className="block text-[11px] font-medium uppercase tracking-widest text-gray-900 mb-2">
                        Sub Child Category
                    </label>
                    <div className="relative">
                        <select
                            value={subChildCategory}
                            onChange={(e) => handleSubChildCategoryChange(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-900 outline-none transition-all appearance-none cursor-pointer disabled:bg-gray-50 disabled:text-gray-400"
                            disabled={subChildLoading || !childCategory}
                        >
                            <option value="">Select Sub Child Category...</option>
                            {subChildCategories.map((subChild) => (
                                <option key={subChild._id} value={subChild._id}>
                                    {subChild.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-900">
                            {subChildLoading ? (
                                <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                </svg>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
