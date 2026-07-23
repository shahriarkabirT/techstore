'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ProductViewModal from '@/components/admin/products/ProductViewModal';
import { IProduct } from '@/types';

const STATUS_COLORS: Record<string, string> = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-100',
    Confirmed: 'bg-blue-50 text-blue-700 border-blue-100',
    Processing: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    Shipped: 'bg-purple-50 text-purple-700 border-purple-100',
    Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Cancelled: 'bg-rose-50 text-rose-700 border-rose-100',
    Returned: 'bg-slate-50 text-slate-500 border-slate-100',
};

const PRESETS = [
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
    { label: 'Last 365 Days', days: 365 },
];

function formatCurrency(n: number) {
    return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).format(n);
}

function formatDate(dateStr: string) {
    // YYYY-MM format (monthly) — show just month name
    if (dateStr.length === 7) {
        const [y, m] = dateStr.split('-');
        return new Date(+y, +m - 1).toLocaleDateString('en-US', { month: 'short' });
    }
    // YYYY-MM-DD format (daily)
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Fill in missing dates/months so the chart is continuous
function fillDateGaps(rawData: any[], days: number, startDate: string, endDate: string) {
    const dataMap = new Map(rawData.map(r => [r.date, r]));
    const filled: any[] = [];
    const isMonthly = days > 90;

    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');

    if (isMonthly) {
        const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
        while (cursor <= end) {
            const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
            const existing = dataMap.get(key);
            filled.push(existing || { date: key, revenue: 0, paidRevenue: 0, orders: 0 });
            cursor.setMonth(cursor.getMonth() + 1);
        }
    } else {
        const cursor = new Date(start);
        while (cursor <= end) {
            const key = cursor.toISOString().split('T')[0];
            const existing = dataMap.get(key);
            filled.push(existing || { date: key, revenue: 0, paidRevenue: 0, orders: 0 });
            cursor.setDate(cursor.getDate() + 1);
        }
    }
    return filled;
}

export default function OrderReportPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeDays, setActiveDays] = useState(30);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    
    // Product Detail Modal State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
    const [isProductLoading, setIsProductLoading] = useState(false);

    const handleViewProduct = async (id: string) => {
        if (!id) return;
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

    const fetchReport = useCallback(async (startDate: string, endDate: string) => {
        setLoading(true);
        setDateRange({ start: startDate, end: endDate });
        try {
            const res = await fetch(`/api/admin/reports/orders?startDate=${startDate}&endDate=${endDate}`);
            const json = await res.json();
            if (json.success) setData(json);
            else toast.error(json.message || 'Failed to load report');
        } catch {
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - activeDays);
        fetchReport(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
    }, [activeDays, fetchReport]);

    const handleCustomRange = () => {
        if (customStart && customEnd) {
            setActiveDays(0);
            fetchReport(customStart, customEnd);
        }
    };

    const downloadCSV = () => {
        if (!data) return;
        let csv = 'Date,Revenue,Paid Revenue,Orders\n';
        data.revenueOverTime.forEach((r: any) => {
            csv += `${r.date},${r.revenue},${r.paidRevenue},${r.orders}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `order-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const chartData = data ? fillDateGaps(data.revenueOverTime, activeDays || Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / 86400000), dateRange.start, dateRange.end) : [];
    const maxRevenue = chartData.length > 0 ? Math.max(...chartData.map((r: any) => r.revenue), 1) : 1;
    const maxPeakCount = data?.peakHours?.length > 0 ? Math.max(...data.peakHours.map((h: any) => h.count)) : 1;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Order Report</h1>
                    <p className="text-sm text-gray-500 mt-1">Analyze order performance, revenue trends, and customer behavior.</p>
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

            {/* Date Presets */}
            <div className="flex flex-wrap items-center gap-2">
                {PRESETS.map(p => (
                    <button
                        key={p.days}
                        onClick={() => { setActiveDays(p.days); setCustomStart(''); setCustomEnd(''); }}
                        className={activeDays === p.days ? 'px-4 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg transition-colors' : 'px-4 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors'}
                    >
                        {p.label}
                    </button>
                ))}
                <div className="flex items-center gap-2 ml-2">
                    <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-gray-900 text-xs" />
                    <span className="text-gray-500 text-xs">to</span>
                    <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-gray-900 text-xs" />
                    <button onClick={handleCustomRange} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors">Go</button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin" />
                </div>
            ) : data ? (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Orders', value: data.summary.totalOrders, growth: data.summary.growth.orders, prefix: '' },
                            { label: 'Total Revenue', value: formatCurrency(data.summary.totalRevenue), growth: data.summary.growth.revenue, prefix: '' },
                            { label: 'Avg Order Value', value: formatCurrency(data.summary.avgOrderValue), growth: null, prefix: '' },
                            { label: 'Cancellation Rate', value: `${data.summary.cancellationRate}%`, growth: null, prefix: '', danger: data.summary.cancellationRate > 15 },
                        ].map((card, i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{card.label}</p>
                                <p className={`text-xl lg:text-2xl font-black mt-1 ${card.danger ? 'text-red-600' : 'text-gray-900'}`}>{card.value}</p>
                                {card.growth !== null && (
                                    <p className={`text-xs font-bold mt-1 ${card.growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {card.growth >= 0 ? '↑' : '↓'} {Math.abs(card.growth)}% vs prev period
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Revenue Chart + Status Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Revenue Over Time */}
                        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 mb-4">Revenue Over Time</h3>
                            {chartData.length > 0 ? (
                                <div className="flex items-end gap-[2px] h-48 overflow-x-auto pb-6 relative">
                                    {chartData.map((r: any, i: number) => (
                                        <div key={i} className="flex flex-col items-center gap-1 min-w-[8px] flex-1 group relative">
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                {formatCurrency(r.revenue)} · {r.orders} orders
                                            </div>
                                            <div
                                                className={`w-full rounded-t transition-colors cursor-pointer ${r.revenue > 0 ? 'bg-gray-900 hover:bg-black' : 'bg-gray-100'}`}
                                                style={{ height: `${Math.max(2, (r.revenue / maxRevenue) * 160)}px` }}
                                            />
                                            {/* Show label every few bars to avoid clutter */}
                                            {(chartData.length <= 31 || i % Math.ceil(chartData.length / 15) === 0) && (
                                                <span className="text-[7px] text-gray-500 font-medium mt-1 rotate-[-45deg] origin-left whitespace-nowrap">
                                                    {formatDate(r.date)}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-12">No data for this period</p>
                            )}
                        </div>

                        {/* Order Status Breakdown */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 mb-4">Orders by Status</h3>
                            <div className="space-y-3">
                                {data.statusBreakdown.map((s: any) => {
                                    const pct = data.summary.totalOrders > 0 ? Math.round((s.count / data.summary.totalOrders) * 100) : 0;
                                    return (
                                        <div key={s.status}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${STATUS_COLORS[s.status] || 'bg-gray-50 text-gray-700'}`}>{s.status}</span>
                                                <span className="text-xs font-bold text-gray-500">{s.count} ({pct}%)</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                <div className="bg-gray-900 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Payment Methods + Sources + Peak Hours */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Payment Methods */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 mb-4">Payment Methods</h3>
                            <div className="space-y-3">
                                {data.paymentMethods.map((p: any) => (
                                    <div key={p.method} className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{p.method}</p>
                                            <p className="text-[10px] text-gray-500 font-medium">{formatCurrency(p.revenue)}</p>
                                        </div>
                                        <span className="text-sm font-black text-gray-900 tabular-nums">{p.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Sources */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 mb-4">Order Sources</h3>
                            <div className="space-y-3">
                                {data.sources.map((s: any) => (
                                    <div key={s.source} className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 capitalize">{s.source}</p>
                                            <p className="text-[10px] text-gray-500 font-medium">{formatCurrency(s.revenue)}</p>
                                        </div>
                                        <span className="text-sm font-black text-gray-900 tabular-nums">{s.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Peak Hours */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 mb-4">Peak Ordering Hours</h3>
                            <div className="flex items-end gap-[2px] h-32">
                                {Array.from({ length: 24 }, (_, h) => {
                                    const entry = data.peakHours.find((p: any) => p.hour === h);
                                    const count = entry?.count || 0;
                                    const heightPct = maxPeakCount > 0 ? (count / maxPeakCount) * 100 : 0;
                                    return (
                                        <div key={h} className="flex-1 flex flex-col items-center group relative">
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                {h}:00 — {count}
                                            </div>
                                            <div
                                                className={`w-full rounded-t transition-colors ${count > 0 ? 'bg-gray-300 hover:bg-gray-900' : 'bg-gray-100'}`}
                                                style={{ height: `${Math.max(2, heightPct)}%` }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex justify-between mt-1">
                                <span className="text-[8px] text-gray-500">12am</span>
                                <span className="text-[8px] text-gray-500">6am</span>
                                <span className="text-[8px] text-gray-500">12pm</span>
                                <span className="text-[8px] text-gray-500">6pm</span>
                                <span className="text-[8px] text-gray-500">11pm</span>
                            </div>
                        </div>
                    </div>

                    {/* Top Products */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Top Selling by Qty */}
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-200">
                                <h3 className="text-sm font-bold text-gray-900">Top Selling Products (by Qty)</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {data.topSellingProducts.map((p: any, i: number) => (
                                    <div 
                                        key={p._id} 
                                        onClick={() => handleViewProduct(p._id)}
                                        className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                                    >
                                        <span className="text-xs font-black text-gray-300 w-6 text-center">{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate group-hover:text-primary transition-colors">{p.name}</p>
                                            <p className="text-[10px] text-gray-500">{formatCurrency(p.totalRevenue)} revenue</p>
                                        </div>
                                        <span className="text-sm font-black text-gray-900 tabular-nums">{p.totalQty} sold</span>
                                    </div>
                                ))}
                                {data.topSellingProducts.length === 0 && (
                                    <p className="text-sm text-gray-500 text-center py-8">No data</p>
                                )}
                            </div>
                        </div>

                        {/* Top Revenue Products */}
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-200">
                                <h3 className="text-sm font-bold text-gray-900">Top Revenue Products (by ৳)</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {data.topRevenueProducts.map((p: any, i: number) => (
                                    <div 
                                        key={p._id} 
                                        onClick={() => handleViewProduct(p._id)}
                                        className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                                    >
                                        <span className="text-xs font-black text-gray-300 w-6 text-center">{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate group-hover:text-gray-600 transition-colors">{p.name}</p>
                                            <p className="text-[10px] text-gray-500">{p.totalQty} units sold</p>
                                        </div>
                                        <span className="text-sm font-black text-gray-900 tabular-nums">{formatCurrency(p.totalRevenue)}</span>
                                    </div>
                                ))}
                                {data.topRevenueProducts.length === 0 && (
                                    <p className="text-sm text-gray-500 text-center py-8">No data</p>
                                )}
                            </div>
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
