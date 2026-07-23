'use client';

interface CategoryToolbarProps {
    config: any;
    filters: any;
    setFilters: (newFilters: any) => void;
    onBulkDelete: () => void;
    selectedCount: number;
    onAdd: () => void;
    parentChain?: {
        categories: any[];
        subCategories: any[];
        childCategories: any[];
    };
    level?: number;
}

export default function CategoryToolbar({
    config,
    filters,
    setFilters,
    onBulkDelete,
    selectedCount,
    onAdd,
    parentChain,
    level
}: CategoryToolbarProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-row items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight">{config.title}</h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 hidden sm:block">{config.subtitle}</p>
                </div>
                <div className="flex flex-row items-center gap-2 w-auto shrink-0">
                    {selectedCount > 0 && (
                        <button
                            onClick={onBulkDelete}
                            className="bg-rose-600 text-white hover:bg-rose-700 px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                            Delete ({selectedCount})
                        </button>
                    )}
                    <button
                        onClick={onAdd}
                        className="bg-gray-900 text-white hover:bg-black px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm"
                    >
                        <span className="sm:hidden">Add New</span>
                        <span className="hidden sm:inline">Add New {config.title.slice(0, -1)}</span>
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center w-full min-w-0">
                <div className="flex-1 w-full lg:w-auto relative shrink-0 lg:max-w-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all"
                    />
                </div>
                <div className="flex flex-wrap items-center w-full lg:w-auto gap-3">
                    {parentChain && level !== undefined && level > 0 && (
                        <select
                            value={filters.categoryFilter || ''}
                            onChange={(e) => setFilters({ ...filters, categoryFilter: e.target.value, subCategoryFilter: '', childCategoryFilter: '' })}
                            className="flex-1 sm:flex-none min-w-[140px] bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 px-3 py-2 outline-none cursor-pointer hover:bg-white hover:border-gray-300 focus:border-gray-900 rounded-lg transition-all shadow-sm truncate"
                        >
                            <option value="">All Categories</option>
                            {parentChain.categories.map((c: any) => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    )}
                    {parentChain && level !== undefined && level > 1 && (
                        <select
                            value={filters.subCategoryFilter || ''}
                            onChange={(e) => setFilters({ ...filters, subCategoryFilter: e.target.value, childCategoryFilter: '' })}
                            className="flex-1 sm:flex-none min-w-[140px] bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 px-3 py-2 outline-none cursor-pointer hover:bg-white hover:border-gray-300 focus:border-gray-900 rounded-lg transition-all shadow-sm truncate"
                        >
                            <option value="">All Sub-Categories</option>
                            {parentChain.subCategories.map((s: any) => (
                                <option key={s._id} value={s._id}>{s.name}</option>
                            ))}
                        </select>
                    )}
                    {parentChain && level !== undefined && level > 2 && (
                        <select
                            value={filters.childCategoryFilter || ''}
                            onChange={(e) => setFilters({ ...filters, childCategoryFilter: e.target.value })}
                            className="flex-1 sm:flex-none min-w-[140px] bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 px-3 py-2 outline-none cursor-pointer hover:bg-white hover:border-gray-300 focus:border-gray-900 rounded-lg transition-all shadow-sm truncate"
                        >
                            <option value="">All Child Categories</option>
                            {parentChain.childCategories.map((c: any) => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    )}
                    <select
                        value={filters.isActive}
                        onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                        className="flex-1 sm:flex-none min-w-[120px] bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 px-3 py-2 outline-none cursor-pointer hover:bg-white hover:border-gray-300 focus:border-gray-900 rounded-lg transition-all shadow-sm"
                    >
                        <option value="">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                    
                    <div className="flex gap-2 flex-1 sm:flex-none items-center">
                        <select
                            value={filters.sortBy}
                            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                            className="flex-1 min-w-[120px] bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 px-3 py-2 outline-none cursor-pointer hover:bg-white hover:border-gray-300 focus:border-gray-900 rounded-lg transition-all shadow-sm"
                        >
                            <option value="createdAt">Date Created</option>
                            <option value="name">Name</option>
                        </select>
                        <button
                            onClick={() => setFilters({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                            className="p-2 border border-gray-200 bg-gray-50 text-gray-500 hover:text-gray-900 hover:bg-white hover:border-gray-300 rounded-lg transition-all shadow-sm shrink-0"
                            title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                        >
                            {filters.sortOrder === 'asc' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
