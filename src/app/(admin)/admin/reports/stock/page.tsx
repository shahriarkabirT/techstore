'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ProductViewModal from '@/components/admin/products/ProductViewModal';
import { IProduct } from '@/types';

function formatCurrency(n: number) {
    return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).format(n);
}

export default function StockReportPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [stockFilter, setStockFilter] = useState<'all' | 'out' | 'low' | 'ok'>('all');
    
    // Product Detail Modal State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
    const [isProductLoading, setIsProductLoading] = useState(false);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/reports/stock');
            const json = await res.json();
            if (json.success) setData(json);
            else toast.error(json.message || 'Failed to load report');
        } catch {
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleViewProduct = async (id: string) => {
        setIsProductLoading(true);
        try {
            const res = await fetch(`/api/products/${id}`);
            const json = await res.json();
            if (json.success) {
                setSelectedProduct(json.product);
                setIsViewModalOpen(true);
            } else {
                toast.error(json.message || 'Failed to load product details');
            }
        } catch (error) {
            toast.error('Network error fetching product');
        } finally {
            setIsProductLoading(false);
        }
    };

    const downloadCSV = () => {
        if (!data) return;
        let csv = 'Product,Category,Stock,Sold,Price,Type\n';
        data.allProducts.forEach((p: any) => {
            csv += `"${p.title}","${p.category}",${p.stock},${p.soldCount},${p.price},${p.productType}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const filteredProducts = data?.allProducts?.filter((p: any) => {
        const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;
        if (stockFilter === 'out') return p.stock === 0;
        if (stockFilter === 'low') return p.stock > 0 && p.stock <= (data.summary.lowStockThreshold || 5);
        if (stockFilter === 'ok') return p.stock > (data.summary.lowStockThreshold || 5);
        return true;
    }) || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Stock Report</h1>
                    <p className="text-sm text-gray-500 mt-1">Monitor inventory levels, identify low-stock items, and prevent stockouts.</p>
                </div>
                <button
                    onClick={downloadCSV}
                    disabled={!data}
                    className="px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-40 flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                    Export CSV
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin" />
                </div>
            ) : data ? (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total SKUs</p>
                            <p className="text-2xl font-black text-gray-900 mt-1">{data.summary.totalProducts}</p>
                        </div>
                        <div className="bg-white border border-red-200 rounded-xl p-5 shadow-sm bg-red-50/30">
                            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Out of Stock</p>
                            <p className="text-2xl font-black text-red-600 mt-1">{data.summary.outOfStockCount}</p>
                        </div>
                        <div className="bg-white border border-yellow-200 rounded-xl p-5 shadow-sm bg-yellow-50/30">
                            <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider">Low Stock (≤{data.summary.lowStockThreshold})</p>
                            <p className="text-2xl font-black text-yellow-600 mt-1">{data.summary.lowStockCount}</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Units</p>
                            <p className="text-2xl font-black text-gray-900 mt-1">{data.summary.totalStock.toLocaleString()}</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Inventory Value</p>
                            <p className="text-xl font-black text-gray-900 mt-1">{formatCurrency(data.summary.totalStockValue)}</p>
                        </div>
                    </div>

                    {/* Alerts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Out of Stock */}
                        {data.outOfStockProducts.length > 0 && (
                            <div className="bg-white border border-red-200 rounded-xl shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-red-100 bg-red-50/50 flex items-center gap-2">
                                    <span className="text-red-500 text-lg">🔴</span>
                                    <h3 className="text-sm font-bold text-red-800">Out of Stock ({data.outOfStockProducts.length})</h3>
                                </div>
                                <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                                    {data.outOfStockProducts.map((p: any) => (
                                        <div 
                                            key={p._id} 
                                            onClick={() => handleViewProduct(p._id)}
                                            className="flex items-center gap-3 px-5 py-2.5 hover:bg-red-50/50 transition-colors cursor-pointer group"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate group-hover:text-red-600 transition-colors">{p.title}</p>
                                                <p className="text-[10px] text-gray-500">{p.category} · {p.soldCount} sold</p>
                                            </div>
                                            <span className="text-xs font-black text-red-600 bg-red-100 px-2 py-0.5 rounded">0</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Low Stock */}
                        {data.lowStockProducts.length > 0 && (
                            <div className="bg-white border border-yellow-200 rounded-xl shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-yellow-100 bg-yellow-50/50 flex items-center gap-2">
                                    <span className="text-yellow-500 text-lg">🟡</span>
                                    <h3 className="text-sm font-bold text-yellow-800">Low Stock ({data.lowStockProducts.length})</h3>
                                </div>
                                <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                                    {data.lowStockProducts.map((p: any) => (
                                        <div 
                                            key={p._id} 
                                            onClick={() => handleViewProduct(p._id)}
                                            className="flex items-center gap-3 px-5 py-2.5 hover:bg-yellow-50/50 transition-colors cursor-pointer group"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate group-hover:text-yellow-700 transition-colors">{p.title}</p>
                                                <p className="text-[10px] text-gray-500">{p.category} · {p.soldCount} sold</p>
                                            </div>
                                            <span className="text-xs font-black text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded">{p.stock}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Category-wise Stock */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-200">
                            <h3 className="text-sm font-bold text-gray-900">Stock by Category</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold text-gray-900">Category</th>
                                        <th className="px-5 py-3 font-semibold text-gray-900 text-right">Products</th>
                                        <th className="px-5 py-3 font-semibold text-gray-900 text-right">Total Stock</th>
                                        <th className="px-5 py-3 font-semibold text-gray-900 text-right">Out of Stock</th>
                                        <th className="px-5 py-3 font-semibold text-gray-900 text-right">Stock Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.categoryStock.map((c: any) => (
                                        <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-3 font-bold text-gray-900">{c.categoryName}</td>
                                            <td className="px-5 py-3 text-right tabular-nums text-gray-500">{c.totalProducts}</td>
                                            <td className="px-5 py-3 text-right tabular-nums font-bold text-gray-900">{c.totalStock.toLocaleString()}</td>
                                            <td className="px-5 py-3 text-right">
                                                {c.outOfStock > 0 ? (
                                                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">{c.outOfStock}</span>
                                                ) : (
                                                    <span className="text-xs text-gray-500">0</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-right tabular-nums text-gray-500">{formatCurrency(c.stockValue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* All Products Stock Table */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <h3 className="text-sm font-bold text-gray-900">All Products Inventory</h3>
                            <div className="flex items-center gap-2">
                                <div className="flex bg-gray-100 p-0.5 rounded-lg">
                                    {(['all', 'out', 'low', 'ok'] as const).map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setStockFilter(f)}
                                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all uppercase ${stockFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            {f === 'all' ? 'All' : f === 'out' ? 'Out' : f === 'low' ? 'Low' : 'In Stock'}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-gray-900 w-48"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold text-gray-900">Product</th>
                                        <th className="px-5 py-3 font-semibold text-gray-900">Category</th>
                                        <th className="px-5 py-3 font-semibold text-gray-900 text-center">Type</th>
                                        <th className="px-5 py-3 font-semibold text-gray-900 text-right">Stock</th>
                                        <th className="px-5 py-3 font-semibold text-gray-900 text-right">Sold</th>
                                        <th className="px-5 py-3 font-semibold text-gray-900 text-right">Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredProducts.map((p: any) => (
                                        <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-3">
                                                <button 
                                                    onClick={() => handleViewProduct(p._id)}
                                                    className="font-bold text-gray-900 hover:text-primary transition-colors truncate block max-w-xs text-left"
                                                >
                                                    {p.title}
                                                </button>
                                            </td>
                                            <td className="px-5 py-3 text-gray-500">{p.category}</td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${p.productType === 'variant' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {p.productType}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <span className={`text-sm font-black tabular-nums ${
                                                    p.stock === 0 ? 'text-red-600' : p.stock <= (data.summary.lowStockThreshold || 5) ? 'text-yellow-600' : 'text-green-600'
                                                }`}>
                                                    {p.stock}
                                                </span>
                                                {p.productType === 'variant' && p.variantCount > 0 && (
                                                    <span className="text-[10px] text-gray-500 ml-1">({p.variantStock}v)</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-right tabular-nums text-gray-500">{p.soldCount}</td>
                                            <td className="px-5 py-3 text-right tabular-nums text-gray-500">{formatCurrency(p.price)}</td>
                                        </tr>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-12 text-center text-gray-500">No products found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
                            Showing {filteredProducts.length} of {data.allProducts.length} products
                        </div>
                    </div>
                </>
            ) : null}

            <ProductViewModal 
                isOpen={isViewModalOpen}
                product={selectedProduct}
                onClose={() => setIsViewModalOpen(false)}
            />

            {isProductLoading && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}
