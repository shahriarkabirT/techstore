'use client';

import React from 'react';
import { Award, TrendingUp, Package } from 'lucide-react';

interface ProductItem {
    _id?: string;
    name: string;
    salesCount: number;
    revenue: number;
}

export const TopPerforming = ({ selling, valued }: { selling: ProductItem[], valued: ProductItem[] }) => {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0,
        }).format(price);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Selling Products (By Quantity) */}
            <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <Package className="text-gray-400" size={18} />
                    <h3 className="text-base md:text-lg font-bold text-gray-900">Top Selling Products</h3>
                </div>
                <div className="space-y-3">
                    {selling.map((item, idx) => (
                        <div key={`selling-${item._id || idx}`} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-gray-50 border border-transparent transition-all">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="flex-shrink-0 w-6 h-6 rounded bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-[10px] font-mono">
                                    {idx + 1}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-gray-800 line-clamp-2">{item.name}</p>
                                    <p className="text-[11px] text-gray-500 font-medium">{item.salesCount} units ordered</p>
                                </div>
                            </div>
                            <div className="flex-shrink-0">
                                <p className="text-sm font-black text-gray-900">{formatPrice(item.revenue)}</p>
                            </div>
                        </div>
                    ))}
                    {selling.length === 0 && <p className="text-sm text-gray-400 text-center py-4 italic">No data available</p>}
                </div>
            </div>

            {/* Top Valued Products (By Revenue) */}
            <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="text-gray-400" size={18} />
                    <h3 className="text-base md:text-lg font-bold text-gray-900">Top Valued Products</h3>
                </div>
                <div className="space-y-3">
                    {valued.map((item, idx) => (
                        <div key={`valued-${item._id || idx}`} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-gray-50 border border-transparent transition-all">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="flex-shrink-0 w-6 h-6 rounded bg-gray-900 flex items-center justify-center text-white font-bold text-[10px] font-mono shadow-sm">
                                    {idx + 1}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-gray-800 line-clamp-2">{item.name}</p>
                                    <p className="text-[11px] text-gray-500 font-medium">{item.salesCount} sales</p>
                                </div>
                            </div>
                            <div className="flex-shrink-0">
                                <p className="text-sm font-black text-gray-700">{formatPrice(item.revenue)}</p>
                            </div>
                        </div>
                    ))}
                    {valued.length === 0 && <p className="text-sm text-gray-400 text-center py-4 italic">No data available</p>}
                </div>
            </div>
        </div>
    );
};
