'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useMemo } from 'react';
import { useGetCategoryTreeQuery } from '@/redux/features/categories/categoryApi';
import { useGetBrandsQuery } from '@/redux/features/brand/brandApi';
import Image from 'next/image';

interface ProductFiltersProps {
    onClose?: () => void;
}

export default function ProductFilters({ onClose }: ProductFiltersProps) {
    const { data: categoryTree = [], isLoading: isCategoriesLoading } = useGetCategoryTreeQuery();
    const { data: allBrands = [] } = useGetBrandsQuery();
    const activeBrands = allBrands.filter((b: any) => b.isActive);
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
    const [inStock, setInStock] = useState(searchParams.get('inStock') === 'true');
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        price: true,
        categories: true,
        availability: true,
        brands: true,
    });

    const activeCategory = searchParams.get('category');
    const activeBrand = searchParams.get('brand');

    const activeFilters = useMemo(() => {
        const filters = [];
        if (searchParams.get('minPrice') || searchParams.get('maxPrice')) {
            filters.push({ key: 'price', label: `৳${searchParams.get('minPrice') || 0} - ${searchParams.get('maxPrice') || 'Max'}` });
        }
        if (searchParams.get('inStock') === 'true') {
            filters.push({ key: 'inStock', label: 'In Stock' });
        }
        if (searchParams.get('brand')) {
            const brand = activeBrands.find((b: any) => b._id === searchParams.get('brand'));
            if (brand) filters.push({ key: 'brand', label: brand.name });
        }
        return filters;
    }, [searchParams, activeBrands]);

    const updateFilters = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (minPrice) params.set('minPrice', minPrice); else params.delete('minPrice');
        if (maxPrice) params.set('maxPrice', maxPrice); else params.delete('maxPrice');
        if (inStock) params.set('inStock', 'true'); else params.delete('inStock');
        params.set('page', '1');
        router.push(`/products?${params.toString()}`, { scroll: false });
    };

    const toggleCategory = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCategoryClick = (slug: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (activeCategory === slug) {
            params.delete('category');
        } else {
            params.set('category', slug);
        }
        params.set('page', '1');
        router.push(`/products?${params.toString()}`, { scroll: false });
    };

    const clearFilters = () => {
        router.push('/products', { scroll: false });
        setMinPrice('');
        setMaxPrice('');
        setInStock(false);
    };

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const renderCategoryTree = (categories: any[], level = 0) => {
        return (
            <div className={`space-y-1 ${level > 0 ? 'ml-4 border-l border-gray-100 pl-2' : ''}`}>
                {categories.map((cat) => {
                    const hasItems =
                        (cat.subCategories?.length > 0) ||
                        (cat.childCategories?.length > 0) ||
                        (cat.subChildCategories?.length > 0);

                    const children = cat.subCategories || cat.childCategories || cat.subChildCategories || [];
                    const isExpanded = expandedCategories[cat._id];
                    const isActive = activeCategory === cat.slug;

                    return (
                        <div key={cat._id} className="space-y-1">
                            <div
                                className={`flex items-center justify-between group rounded-md transition-all duration-300 ease-out ${isActive ? 'bg-primary/5 text-primary' : 'hover:bg-primary/5'}`}
                            >
                                <span
                                    onClick={() => {
                                        handleCategoryClick(cat.slug);
                                        if (hasItems) {
                                            setExpandedCategories(prev => ({ ...prev, [cat._id]: !prev[cat._id] }));
                                        }
                                        onClose?.();
                                    }}
                                    className={`flex-grow text-left py-2 px-3 text-sm font-medium cursor-pointer transition-colors duration-300 ${isActive ? 'text-primary' : 'text-gray-600 group-hover:text-primary'}`}
                                >
                                    {cat.name}
                                </span>
                                {hasItems && (
                                    <div
                                        onClick={(e) => toggleCategory(cat._id, e)}
                                        className={`p-1.5 transition-transform duration-300 ease-out cursor-pointer ${isExpanded ? 'rotate-180' : ''} ${isActive ? 'text-white/70 hover:text-white' : 'text-gray-400 group-hover:text-gray-900'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-2.5 h-2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            {hasItems && isExpanded && renderCategoryTree(children, level + 1)}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Active Filters */}
            {activeFilters.length > 0 && (
                <div className="bg-gray-50/50 rounded-lg p-3.5 border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold text-gray-900">Selected</h3>
                        <button onClick={clearFilters} className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer">Reset</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {activeFilters.map((filter) => (
                            <div
                                key={filter.key}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 shadow-sm"
                            >
                                {filter.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Categories */}
            <div className="border-b border-gray-50 pb-6">
                <button
                    onClick={() => toggleSection('categories')}
                    className="flex items-center justify-between w-full text-xs font-semibold text-gray-900 mb-4 group cursor-pointer"
                >
                    Departments
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-3 h-3 transition-transform duration-300 ${openSections.categories ? 'rotate-180' : ''} text-gray-300 group-hover:text-gray-900`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                </button>
                {openSections.categories && (
                    <div className="overflow-y-auto pr-2 custom-scrollbar">
                        {isCategoriesLoading ? (
                            <div className="space-y-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-6 bg-gray-50 rounded-lg animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            renderCategoryTree(categoryTree)
                        )}
                    </div>
                )}
            </div>

            {/* Price Range */}
            <div className="border-b border-gray-50 pb-6">
                <button
                    onClick={() => toggleSection('price')}
                    className="flex items-center justify-between w-full text-xs font-semibold text-gray-900 mb-4 group cursor-pointer"
                >
                    Price Range
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-3 h-3 transition-transform duration-300 ${openSections.price ? 'rotate-180' : ''} text-gray-300 group-hover:text-gray-900`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                </button>
                {openSections.price && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-grow">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400">৳</span>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    className="w-full bg-gray-50 border-none rounded-lg text-xs font-medium focus:ring-1 focus:ring-gray-900/10 py-2.5 pl-6 pr-2 transition-all"
                                />
                            </div>
                            <div className="relative flex-grow">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-black text-gray-400">৳</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold focus:ring-1 focus:ring-gray-900/10 py-2.5 pl-6 pr-2 transition-all"
                                />
                            </div>
                        </div>
                        <button
                            onClick={updateFilters}
                            className="w-full py-2.5 bg-primary text-white rounded-lg font-semibold text-xs hover:bg-primary-dark transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                        >
                            Refine Results
                        </button>
                    </div>
                )}
            </div>

            {/* Filter by Brand — only shown if brands exist */}
            {activeBrands.length > 0 && (
                <div className="rounded-lg border border-gray-100 shadow-[0_1px_8px_rgba(0,0,0,0.04)] bg-white p-4">
                    <button
                        onClick={() => toggleSection('brands')}
                        className="flex items-center justify-between w-full text-xs font-semibold text-gray-900 mb-3 group cursor-pointer"
                    >
                        Filter by Brand
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-3 h-3 transition-transform duration-300 ${openSections.brands ? 'rotate-180' : ''} text-gray-300 group-hover:text-gray-900`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                    </button>
                    {openSections.brands && (
                        <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1 brand-scrollbar">
                            {activeBrands.map((brand: any) => {
                                const isActive = activeBrand === brand._id;
                                return (
                                    <button
                                        key={brand._id}
                                        onClick={() => {
                                            const params = new URLSearchParams(searchParams.toString());
                                            if (isActive) {
                                                params.delete('brand');
                                            } else {
                                                params.set('brand', brand._id);
                                            }
                                            params.set('page', '1');
                                            router.push(`/products?${params.toString()}`, { scroll: false });
                                            onClose?.();
                                        }}
                                        className={`flex items-center gap-2.5 w-full rounded-md py-2 px-3 transition-all duration-300 cursor-pointer ${
                                            isActive ? 'bg-gray-900 text-white' : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        <div className={`w-6 h-6 rounded border overflow-hidden flex-shrink-0 relative ${isActive ? 'border-white/20 bg-white' : 'border-gray-200 bg-white'}`}>
                                            {brand.logo ? (
                                                <Image src={brand.logo} alt={brand.name} fill className="object-contain p-0.5" sizes="24px" />
                                            ) : (
                                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[8px] font-medium text-gray-400">
                                                    {brand.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-sm font-medium">{brand.name}</span>
                                        {isActive && (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 ml-auto">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Availability */}
            <div className="pb-6">
                <button
                    onClick={() => toggleSection('availability')}
                    className="flex items-center justify-between w-full text-xs font-semibold text-gray-900 mb-4 group cursor-pointer"
                >
                    Status
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-3 h-3 transition-transform duration-300 ${openSections.availability ? 'rotate-180' : ''} text-gray-300 group-hover:text-gray-900`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                </button>
                {openSections.availability && (
                    <label className="flex items-center gap-2.5 group cursor-pointer">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                checked={inStock}
                                onChange={(e) => {
                                    setInStock(e.target.checked);
                                    const params = new URLSearchParams(searchParams.toString());
                                    if (e.target.checked) params.set('inStock', 'true'); else params.delete('inStock');
                                    router.push(`/products?${params.toString()}`, { scroll: false });
                                }}
                                className="peer appearance-none w-4 h-4 border border-gray-200 rounded checked:bg-gray-900 checked:border-gray-900 transition-all cursor-pointer"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="white" className="absolute w-2.5 h-2.5 left-0.5 top-0.5 invisible peer-checked:visible pointer-events-none">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                        </div>
                        <span className="text-xs font-medium text-gray-500 group-hover:text-gray-900 transition-colors">Exclude Out of Stock</span>
                    </label>
                )}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #F3F4F6;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #E5E7EB;
                }
                .brand-scrollbar::-webkit-scrollbar {
                    width: 3px;
                }
                .brand-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                    border-radius: 10px;
                }
                .brand-scrollbar::-webkit-scrollbar-thumb {
                    background: #E5E7EB;
                    border-radius: 10px;
                }
                .brand-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #D1D5DB;
                }
                .brand-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: #E5E7EB transparent;
                }
            `}</style>
        </div>
    );
}
