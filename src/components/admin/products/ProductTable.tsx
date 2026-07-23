'use client';

import Image from 'next/image';
import Link from 'next/link';

interface ProductTableProps {
    products: any[];
    isLoading: boolean;
    isFetching: boolean;
    onDelete: (id: string) => void;
    onView: (product: any) => void;
    onToggleActive: (id: string, currentStatus: boolean) => void;
    onToggleFeatured: (id: string, currentStatus: boolean) => void;
    formatPrice: (price: number) => string;
    selectedIds: string[];
    onSelect: (id: string) => void;
    onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ProductTable({
    products,
    isLoading,
    isFetching,
    onDelete,
    onView,
    onToggleActive,
    onToggleFeatured,
    formatPrice,
    selectedIds,
    onSelect,
    onSelectAll
}: ProductTableProps) {
    return (
        <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 w-4 h-4 cursor-pointer"
                                        checked={products.length > 0 && selectedIds.length === products.length}
                                        onChange={onSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                                        Loading products...
                                    </td>
                                </tr>
                            ) : products.length > 0 ? (
                                products.map((product: any) => (
                                    <tr key={product._id} className={`hover:bg-gray-50 transition-colors bg-white ${isFetching ? 'opacity-50' : ''}`}>
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 w-4 h-4 cursor-pointer"
                                                checked={selectedIds.includes(product._id)}
                                                onChange={() => onSelect(product._id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 relative">
                                                    {product.images?.[0] ? (
                                                        <Image
                                                            src={product.images[0]}
                                                            alt=""
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm mb-0.5 line-clamp-1">{product.title}</p>
                                                    <p className="text-xs text-gray-500 font-mono">{product.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-600">
                                                {product.category?.name || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">{formatPrice(product.price)}</span>
                                                {product.discount > 0 && (
                                                    <span className="text-xs text-rose-600">-{product.discount}%</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-rose-600'}`}>
                                                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => onToggleActive(product._id, product.isActive)}
                                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${product.isActive
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                        : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {product.isActive ? 'Published' : 'Draft'}
                                                </button>
                                                <button
                                                    onClick={() => onToggleFeatured(product._id, product.isFeatured || false)}
                                                    className={`p-1.5 rounded-lg border transition-all ${product.isFeatured
                                                        ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 shadow-sm'
                                                        : 'bg-white text-gray-300 border-gray-200 hover:text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                    title={product.isFeatured ? 'Featured Product' : 'Mark as Featured'}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill={product.isFeatured ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => onView(product)}
                                                    className="p-1.5 text-indigo-500 hover:text-indigo-700 border border-transparent hover:border-indigo-100 hover:bg-indigo-50 rounded-md transition-all"
                                                    title="Quick View"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.644C3.391 9.573 5.502 7.332 8.081 6.332a8.56 8.56 0 0 1 7.838 0c2.58 1 4.69 3.241 6.046 5.346a1.012 1.012 0 0 1 0 .644c-1.356 2.091-3.467 4.331-6.046 5.331a8.56 8.56 0 0 1-7.838 0c-2.58-1-4.69-3.241-6.046-5.331ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                    </svg>
                                                </button>
                                                <Link
                                                    href={`/admin/products/${product._id}/edit`}
                                                    className="p-1.5 text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-200 hover:bg-gray-50 rounded-md transition-all"
                                                    title="Edit"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                    </svg>
                                                </Link>
                                                <button
                                                    onClick={() => onDelete(product._id)}
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
                                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                                        No products found.
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
                        Loading products...
                    </div>
                ) : products.length > 0 ? (
                    products.map((product: any) => (
                        <div key={product._id} className={`bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4 ${isFetching ? 'opacity-50' : ''}`}>
                            <div className="flex items-start gap-4">
                                <div className="pt-1">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 w-4 h-4 cursor-pointer"
                                        checked={selectedIds.includes(product._id)}
                                        onChange={() => onSelect(product._id)}
                                    />
                                </div>
                                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 relative">
                                    {product.images?.[0] ? (
                                        <Image
                                            src={product.images[0]}
                                            alt=""
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 text-sm truncate">{product.title}</h3>
                                    <p className="text-[10px] text-gray-400 font-mono truncate">{product.slug}</p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className="text-xs font-semibold text-gray-900">{formatPrice(product.price)}</span>
                                        {product.discount > 0 && (
                                            <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-bold">-{product.discount}%</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    <p className="text-[9px] uppercase font-semibold text-gray-400 tracking-wider">Category</p>
                                    <p className="text-xs text-gray-700 font-medium truncate">{product.category?.name || 'Uncategorized'}</p>
                                </div>
                                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    <p className="text-[9px] uppercase font-semibold text-gray-400 tracking-wider">Stock Status</p>
                                    <p className={`text-xs font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-rose-600'}`}>
                                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                    </p>
                                </div>
                            </div>

                             <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onToggleActive(product._id, product.isActive)}
                                        className={`px-3 py-1 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${product.isActive
                                            ? 'bg-green-50 text-green-700 border-green-200'
                                            : 'bg-gray-50 text-gray-600 border-gray-200'
                                            }`}
                                    >
                                        {product.isActive ? 'Published' : 'Draft'}
                                    </button>
                                    <button
                                        onClick={() => onToggleFeatured(product._id, product.isFeatured || false)}
                                        className={`p-1.5 rounded-lg border ${product.isFeatured
                                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                                            : 'bg-white text-gray-300 border-gray-200'
                                            }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill={product.isFeatured ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onView(product)}
                                        className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.644C3.391 9.573 5.502 7.332 8.081 6.332a8.56 8.56 0 0 1 7.838 0c2.58 1 4.69 3.241 6.046 5.346a1.012 1.012 0 0 1 0 .644c-1.356 2.091-3.467 4.331-6.046 5.331a8.56 8.56 0 0 1-7.838 0c-2.58-1-4.69-3.241-6.046-5.331ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                        </svg>
                                        View
                                    </button>
                                    <Link
                                        href={`/admin/products/${product._id}/edit`}
                                        className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                        </svg>
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => onDelete(product._id)}
                                        className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white p-12 rounded-xl border border-gray-200 text-center text-sm text-gray-500">
                        No products found.
                    </div>
                )}
            </div>
        </div>
    );
}
