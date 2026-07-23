'use client';

import { useState, useRef, useEffect } from 'react';
import {
    useGetCompatibleModelsQuery,
    useCreateCompatibleModelMutation
} from '@/redux/features/compatibleModel/compatibleModelApi';
import { useGetModelCategoriesQuery } from '@/redux/features/modelCategory/modelCategoryApi';
import type { ICompatibleModel } from '@/types';
import { showError, showSuccess } from '@/lib/toast';

interface CompatibleModelSelectorProps {
    selectedModels: string[];
    onChange: (models: string[]) => void;
}

export default function CompatibleModelSelector({ selectedModels, onChange }: CompatibleModelSelectorProps) {
    const [page, setPage] = useState(1);
    const [inputValue, setInputValue] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [accumulatedModels, setAccumulatedModels] = useState<ICompatibleModel[]>([]);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');
    
    const wrapperRef = useRef<HTMLDivElement>(null);
    const categoryWrapperRef = useRef<HTMLDivElement>(null);

    const { data: categoriesData } = useGetModelCategoriesQuery({ limit: 100 });

    const { data, isLoading, isFetching } = useGetCompatibleModelsQuery({
        page,
        limit: 15,
        search: debouncedSearch,
        isActive: true,
        category: selectedCategory || undefined
    });

    const [createModel, { isLoading: isCreating }] = useCreateCompatibleModelMutation();

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(inputValue);
            setPage(1); // Reset page on new search
        }, 300);
        return () => clearTimeout(timer);
    }, [inputValue]);

    const [prevData, setPrevData] = useState<any>(null);

    if (data !== prevData) {
        setPrevData(data);
        if (data?.models) {
            if (page === 1) {
                setAccumulatedModels(data.models);
            } else {
                setAccumulatedModels(prev => {
                    const newModels = data.models.filter((m: ICompatibleModel) => !prev.find(p => p._id === m._id));
                    return [...prev, ...newModels];
                });
            }
        }
    }

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
            if (categoryWrapperRef.current && !categoryWrapperRef.current.contains(event.target as Node)) {
                setIsCategoryOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Group available models by category
    const availableModels = accumulatedModels.filter(
        (m) => !selectedModels.includes(m.name)
    );
    
    // Sort models by order then name, and group by category
    const groupedModels = availableModels.reduce((acc, model) => {
        const catName = (model.category as any)?.name || 'General';
        if (!acc[catName]) acc[catName] = [];
        acc[catName].push(model.name);
        return acc;
    }, {} as Record<string, string[]>);

    const activeModelNames = accumulatedModels.map(m => m.name);
    const hasFilteredSuggestions = availableModels.length > 0;

    const handleSelect = (modelName: string) => {
        if (!selectedModels.includes(modelName)) {
            onChange([...selectedModels, modelName]);
        }
        setInputValue('');
        setIsOpen(false);
    };

    const handleRemove = (modelName: string) => {
        onChange(selectedModels.filter(m => m !== modelName));
    };

    const handleCreateNew = async () => {
        if (!inputValue.trim()) return;
        
        // If it already exists in the list (but maybe case differs), just select it
        const existing = activeModelNames.find(name => name.toLowerCase() === inputValue.toLowerCase().trim());
        if (existing) {
            handleSelect(existing);
            return;
        }

        try {
            const res = await createModel({ name: inputValue.trim() }).unwrap();
            if (res.success) {
                showSuccess('Created', `Added ${res.model.name} to database`);
                handleSelect(res.model.name);
            }
        } catch (error: any) {
            showError(error?.data?.message || 'Failed to create model');
        }
    };

    const hasMore = data && data.page < data.totalPages;

    const filteredCategories = categoriesData?.categories?.filter(cat => 
        cat.name.toLowerCase().includes(categorySearch.toLowerCase())
    ) || [];

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-2 relative">
                <div className="relative" ref={categoryWrapperRef}>
                    <div 
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 cursor-pointer flex justify-between items-center hover:border-gray-400 transition-all"
                        onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    >
                        <span className="truncate">
                            {selectedCategory ? categoriesData?.categories?.find(c => c._id === selectedCategory)?.name : 'All Categories'}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-500 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>

                    {isCategoryOpen && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 flex flex-col">
                            <div className="p-2 border-b border-gray-100">
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                                    placeholder="Search categories..."
                                    value={categorySearch}
                                    onChange={(e) => setCategorySearch(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                />
                            </div>
                            <ul className="py-1 overflow-y-auto flex-1">
                                <li
                                    className={`px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm font-medium ${!selectedCategory ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-700'}`}
                                    onClick={() => {
                                        setSelectedCategory('');
                                        setPage(1);
                                        setAccumulatedModels([]);
                                        setIsCategoryOpen(false);
                                        setCategorySearch('');
                                    }}
                                >
                                    All Categories
                                </li>
                                {filteredCategories.map(cat => (
                                    <li
                                        key={cat._id}
                                        className={`px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm font-medium ${selectedCategory === cat._id ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-700'}`}
                                    onClick={() => {
                                            setSelectedCategory(cat._id);
                                            setPage(1);
                                            setAccumulatedModels([]);
                                            setIsCategoryOpen(false);
                                            setCategorySearch('');
                                        }}
                                    >
                                        {cat.name}
                                    </li>
                                ))}
                                {filteredCategories.length === 0 && (
                                    <li className="px-4 py-3 text-sm text-gray-500 text-center">No categories found</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="relative flex-1" ref={wrapperRef}>
                    <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 focus:border-gray-900 outline-none transition-all placeholder:text-gray-400"
                    placeholder="Search or type to add new model..."
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            if (hasFilteredSuggestions) {
                                // Select the first item from the first category if we just hit enter
                                const firstCat = Object.keys(groupedModels)[0];
                                if (firstCat && groupedModels[firstCat].length > 0) {
                                    handleSelect(groupedModels[firstCat][0]);
                                }
                            } else if (inputValue.trim()) {
                                handleCreateNew();
                            }
                        }
                    }}
                />

                {/* Dropdown Suggestions */}
                {isOpen && (inputValue.trim() || hasFilteredSuggestions) && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 flex flex-col">
                        <ul className="py-1 overflow-y-auto flex-1">
                            {Object.entries(groupedModels).map(([category, models]) => (
                                <div key={category}>
                                    <div className="px-4 py-1.5 bg-gray-50/80 text-[10px] font-black text-gray-500 uppercase tracking-widest sticky top-0 border-y border-gray-100">
                                        {category}
                                    </div>
                                    {models.map((modelName) => (
                                        <li
                                            key={modelName}
                                            onClick={() => handleSelect(modelName)}
                                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 font-medium flex items-center justify-between group"
                                        >
                                            {modelName}
                                            <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 uppercase tracking-widest font-bold">Select</span>
                                        </li>
                                    ))}
                                </div>
                            ))}
                            
                            {inputValue.trim() && !activeModelNames.some(name => name.toLowerCase() === inputValue.toLowerCase()) && (
                                <li 
                                    onClick={handleCreateNew}
                                    className="px-4 py-2 border-t border-gray-100 hover:bg-indigo-50 cursor-pointer text-sm text-indigo-700 font-medium flex items-center justify-between"
                                >
                                    <span className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                        Add &quot;{inputValue}&quot;
                                    </span>
                                    {isCreating ? (
                                        <span className="text-[10px] uppercase tracking-widest font-bold">Adding...</span>
                                    ) : (
                                        <span className="text-[10px] uppercase tracking-widest font-bold">Create New</span>
                                    )}
                                </li>
                            )}
                        </ul>
                        {(isLoading || isFetching) && (
                            <div className="p-3 text-center text-xs text-gray-500 border-t border-gray-100 bg-gray-50/50">Loading...</div>
                        )}
                        {!isLoading && hasMore && (
                            <div 
                                className="p-2 border-t border-gray-100 text-center"
                            >
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPage(p => p + 1);
                                    }}
                                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-widest py-1 px-4 rounded hover:bg-indigo-50 transition-colors"
                                >
                                    Load More Results
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

            {/* Available Models to Add */}
            {hasFilteredSuggestions && !inputValue && (
                <div className="mt-3">
                    <div className="space-y-4">
                        {Object.entries(groupedModels).map(([category, models]) => (
                            <div key={category}>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{category}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {models.map((model) => (
                                        <button
                                            key={`add-${model}`}
                                            type="button"
                                            onClick={() => handleSelect(model)}
                                            className="flex items-center gap-1 bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors uppercase tracking-tight"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                            </svg>
                                            {model}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    {hasMore && (
                        <div className="mt-4 pt-2 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setPage(p => p + 1)}
                                disabled={isFetching}
                                className="text-[11px] font-bold text-gray-500 hover:text-indigo-600 uppercase tracking-widest transition-colors flex items-center gap-1"
                            >
                                {isFetching ? 'Loading...' : 'See More Models'}
                                {!isFetching && (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Selected Chips */}
            {selectedModels.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                    {selectedModels.map((model) => (
                        <div key={model} className="flex items-center gap-1.5 bg-gray-100 text-gray-800 px-3 py-1.5 rounded-lg text-xs font-semibold">
                            {model}
                            <button
                                type="button"
                                onClick={() => handleRemove(model)}
                                className="text-gray-400 hover:text-rose-500 transition-colors bg-white hover:bg-rose-50 rounded-full p-0.5"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
