'use client';

import { ICategory } from '@/types';
import { useGetCategoriesQuery } from '@/redux/features/categories/categoryApi';

interface CategorySelectorProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

export default function CategorySelector({ value, onChange, error }: CategorySelectorProps) {
    // Fetch categories using RTK Query
    // We request 'active' categories and a large limit for the dropdown
    const { data: queryData, isLoading } = useGetCategoriesQuery({ active: 'true', limit: 1000 });

    const categories: ICategory[] = queryData?.categories || [];

    return (
        <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest text-gray-900 mb-2">Target Category</label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-900 outline-none transition-all appearance-none cursor-pointer ${error ? 'border-rose-600' : ''}`}
                    disabled={isLoading}
                >
                    <option value="">Select Category...</option>
                    {categories.map((cat) => (
                        <option key={cat._id} value={cat._id} className="py-1">
                            {/* Visual hierarchy if level is present */}
                            {(cat.level || 0) > 0 ? '　'.repeat(cat.level || 0) + '└─ ' : ''}{cat.name}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-900">
                    {isLoading ? (
                        <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                    )}
                </div>
            </div>
            {error && <p className="text-[10px] text-rose-600 font-medium mt-2 uppercase tracking-tight">{error}</p>}
        </div>
    );
}
