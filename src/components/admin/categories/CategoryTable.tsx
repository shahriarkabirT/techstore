'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

interface CategoryTableProps {
    items: any[];
    isLoading: boolean;
    selectedIds: string[];
    onSelect: (id: string) => void;
    onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onEdit: (item: any) => void;
    onDelete: (id: string) => void;
    onToggleActive: (id: string, currentStatus: boolean) => void;
    config: any;
    level: number;
}

export default function CategoryTable({
    items,
    isLoading,
    selectedIds,
    onSelect,
    onSelectAll,
    onEdit,
    onDelete,
    onToggleActive,
    config,
    level
}: CategoryTableProps) {
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

    const showImages = level === 0;

    const handleToggle = async (id: string, currentStatus: boolean) => {
        setLoadingIds(prev => new Set(prev).add(id));
        try {
            await onToggleActive(id, currentStatus);
        } finally {
            setLoadingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        }
    };

    return (
        <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 w-4">
                                    <input
                                        type="checkbox"
                                        onChange={onSelectAll}
                                        checked={items.length > 0 && selectedIds.length === items.length}
                                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                    />
                                </th>
                                {showImages && <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Images</th>}
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={showImages ? 6 : 5} className="px-6 py-12 text-center text-sm text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : items.length > 0 ? (
                                items.map((item: any) => (
                                    <tr key={item._id} className="hover:bg-gray-50 transition-colors bg-white">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(item._id)}
                                                onChange={() => onSelect(item._id)}
                                                className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                            />
                                        </td>
                                        {showImages && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    {item.bannerImage ? (
                                                        <div className="relative w-12 h-9 rounded bg-gray-100 overflow-hidden border border-gray-200" title="Banner">
                                                            <Image src={item.bannerImage} alt="Banner" fill className="object-cover" />
                                                        </div>
                                                    ) : item.image ? (
                                                        <div className="relative w-12 h-9 rounded bg-gray-100 overflow-hidden border border-gray-200">
                                                            <Image src={item.image} alt="Image" fill className="object-cover" />
                                                        </div>
                                                    ) : <div className="w-12 h-9 rounded bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] text-gray-400">No Img</div>}
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">{item.name}</span>
                                                {config.parentField && item[config.parentField] && (
                                                    <span className="text-xs text-gray-500 mt-0.5">
                                                        Parent: {item[config.parentField]?.name || '...'}
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-400 font-mono mt-0.5">{item.slug}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-sm font-bold text-gray-700 border border-gray-200">
                                                {item.order ?? 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleToggle(item._id, item.isActive)}
                                                disabled={loadingIds.has(item._id)}
                                                className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 min-w-[70px] justify-center ${item.isActive
                                                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                                    } transition-colors disabled:opacity-50`}
                                            >
                                                {loadingIds.has(item._id) ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    item.isActive ? 'Active' : 'Inactive'
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {item.description && (
                                                    <div className="relative group">
                                                        <button
                                                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-all translate-y-[2px]"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                                                            </svg>
                                                        </button>
                                                        <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                                                            <div className="font-semibold mb-1">Description</div>
                                                            <p className="leading-relaxed text-gray-300">{item.description}</p>
                                                            <div className="absolute -bottom-1 right-3 w-2 h-2 bg-gray-900 rotate-45"></div>
                                                        </div>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => onEdit(item)}
                                                    className="p-1.5 text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-200 hover:bg-gray-50 rounded-md transition-all"
                                                    title="Edit"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => onDelete(item._id)}
                                                    className="p-1.5 text-gray-400 hover:text-rose-600 border border-transparent hover:border-rose-100 hover:bg-rose-50 rounded-md transition-all"
                                                    title="Delete"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={showImages ? 6 : 5} className="px-6 py-12 text-center text-sm text-gray-500">
                                        No items found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {isLoading ? (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 text-center text-sm text-gray-500">
                        Loading...
                    </div>
                ) : items.length > 0 ? (
                    items.map((item: any) => (
                        <div key={item._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(item._id)}
                                        onChange={() => onSelect(item._id)}
                                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                    />
                                    <div className="flex items-center gap-2">
                                        {showImages && (
                                            item.bannerImage || item.image ? (
                                                <div className="relative w-10 h-10 rounded bg-gray-100 overflow-hidden border border-gray-200">
                                                    <Image src={item.bannerImage || item.image} alt="" fill className="object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded bg-gray-50 border border-gray-100 flex items-center justify-center text-[8px] text-gray-400">No Img</div>
                                            )
                                        )}
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900">{item.name}</span>
                                            <span className="text-[10px] text-gray-400 font-mono tracking-tighter">{item.slug}</span>
                                        </div>
                                        {item.order !== undefined && (
                                            <span className="ml-auto text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">
                                                #{item.order}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleToggle(item._id, item.isActive)}
                                    disabled={loadingIds.has(item._id)}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider flex items-center gap-1 min-w-[60px] justify-center ${item.isActive
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : 'bg-gray-50 text-gray-600 border-gray-200'
                                        } disabled:opacity-50`}
                                >
                                    {loadingIds.has(item._id) ? (
                                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    ) : (
                                        item.isActive ? 'Active' : 'Inactive'
                                    )}
                                </button>
                            </div>

                            {config.parentField && item[config.parentField] && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                    <span className="font-semibold text-gray-400 uppercase text-[9px]">Parent:</span>
                                    {item[config.parentField]?.name}
                                </div>
                            )}

                            {item.description && (
                                <p className="text-xs text-gray-600 bg-blue-50/50 p-3 rounded-lg border border-blue-100/50 leading-relaxed italic">
                                    &quot;{item.description}&quot;
                                </p>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50">
                                <button
                                    onClick={() => onEdit(item)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                    </svg>
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(item._id)}
                                    className="flex items-center justify-center p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg transition-all"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white p-12 rounded-xl border border-gray-200 text-center text-sm text-gray-500">
                        No items found.
                    </div>
                )}
            </div>
        </div>
    );
}
