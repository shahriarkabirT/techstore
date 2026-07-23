'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

const PRESETS = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
];

function formatCurrency(n: number) {
    return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(n);
}

export default function ProfitReportPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeDays, setActiveDays] = useState(30);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchReport = useCallback(async (startDate: string, endDate: string) => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/admin/reports/profit?startDate=${startDate}T00:00:00.000Z&endDate=${endDate}T23:59:59.999Z`,
            );
            const json = await res.json();
            if (json.success) setData(json);
            else toast.error(json.message || 'Failed to load');
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

    const applyCustom = () => {
        if (customStart && customEnd) {
            setActiveDays(-1);
            fetchReport(customStart, customEnd);
        }
    };

    const s = data?.summary;

    const chartData = (data?.daily || []).map((item: any) => ({
        date: item.date,
        revenue: (item.revenueWithCost || 0) + (item.revenueWithoutCost || 0),
        expenses: item.totalCogs || 0,
        profit: item.grossProfit || 0,
    }));

    const formatXAxis = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
        } catch {
            return dateStr;
        }
    };

    const formatYAxis = (value: number) => {
        if (value >= 100000) {
            return `৳${(value / 1000).toFixed(0)}K`;
        }
        if (value >= 1000) {
            return `৳${(value / 1000).toFixed(1)}K`;
        }
        return `৳${value}`;
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border border-gray-100/80 rounded-xl shadow-xl p-4.5 min-w-[220px] backdrop-blur-[10px] z-50">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-3">
                        {formatXAxis(label)}
                    </p>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                <span className="text-xs font-semibold text-gray-500">Revenue</span>
                            </div>
                            <span className="text-xs font-black text-gray-900 tabular-nums">
                                {formatCurrency(payload[0].value)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                <span className="text-xs font-semibold text-gray-500">Expenses</span>
                            </div>
                            <span className="text-xs font-black text-gray-900 tabular-nums">
                                {formatCurrency(payload[1].value)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-t border-gray-50 pt-2 mt-1">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                                <span className="text-xs font-bold text-gray-700">Profit</span>
                            </div>
                            <span className="text-xs font-black text-indigo-600 tabular-nums">
                                {formatCurrency(payload[2].value)}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
            <div>
                <Link href="/admin/dashboard" className="text-xs font-bold text-gray-500 hover:text-gray-800 uppercase">
                    ← Dashboard
                </Link>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight shrink-0">Profit &amp; cost</h1>
                    <div className="flex flex-row flex-nowrap items-center gap-2 shrink-0 overflow-x-auto pb-0.5 -mx-1 px-1 sm:mx-0 sm:px-0 sm:overflow-visible">
                        {PRESETS.map((p) => (
                            <button
                                key={p.days}
                                type="button"
                                onClick={() => setActiveDays(p.days)}
                                className={`shrink-0 px-3 py-2 rounded-lg text-xs font-black uppercase border whitespace-nowrap ${
                                    activeDays === p.days ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                <p className="mt-2 max-w-2xl text-sm text-gray-500 leading-relaxed">
                    Gross profit = (selling price − unit cost) × quantity on each line, for <strong>paid</strong> orders only.
                    Lines without a stored unit cost are excluded from profit and shown as &quot;no cost&quot; revenue.
                </p>
            </div>

            <div className="flex flex-wrap items-end gap-3 bg-white p-4 rounded-xl border border-gray-200">
                <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">From</label>
                    <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">To</label>
                    <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    />
                </div>
                <button
                    type="button"
                    onClick={applyCustom}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-black uppercase hover:bg-emerald-700 hover:scale-[1.01] transition-transform"
                >
                    Apply range
                </button>
            </div>

            {loading && !data ? (
                <div className="py-20 text-center text-gray-500 text-sm font-medium">Loading…</div>
            ) : s ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Gross profit</p>
                            <p className="text-2xl font-black text-emerald-700 mt-1 tabular-nums">{formatCurrency(s.grossProfit)}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">COGS</p>
                            <p className="text-2xl font-black text-gray-900 mt-1 tabular-nums">{formatCurrency(s.totalCogs)}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Revenue (with cost)</p>
                            <p className="text-xl font-black text-gray-900 mt-1 tabular-nums">{formatCurrency(s.revenueWithCost)}</p>
                            <p className="text-[11px] text-gray-400 mt-1">{s.linesWithCost} line items</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Revenue (no cost)</p>
                            <p className="text-xl font-black text-amber-700 mt-1 tabular-nums">{formatCurrency(s.revenueWithoutCost)}</p>
                            <p className="text-[11px] text-gray-400 mt-1">{s.linesWithoutCost} line items — add unit cost on products to include</p>
                        </div>
                    </div>

                    {/* Premium Profit & Loss Interactive Graph */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                            <div>
                                <h2 className="text-base font-black text-gray-900 tracking-tight">Profit &amp; Loss Over Time</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Visualizing revenue, expenses, and gross profit trends</p>
                            </div>
                            <div className="flex items-center gap-6 self-end sm:self-center">
                                {/* Granularity Badge */}
                                <div className="px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100 text-[10px] font-black uppercase text-gray-500 tracking-wider">
                                    {data?.meta?.granularity || 'Daily'}
                                </div>
                                {/* Legend Indicators */}
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-xs font-bold text-gray-500">Revenue</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                                        <span className="text-xs font-bold text-gray-500">Expenses</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-indigo-600" />
                                        <span className="text-xs font-bold text-gray-500">Profit</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="h-[360px] w-full">
                            {mounted && chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                    <AreaChart
                                        data={chartData}
                                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                                            </linearGradient>
                                            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12}/>
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                                            </linearGradient>
                                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.12}/>
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={formatXAxis}
                                            stroke="#94a3b8"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            tickFormatter={formatYAxis}
                                            stroke="#94a3b8"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            dx={-10}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#10b981"
                                            strokeWidth={2.5}
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                            dot={{ r: 4, strokeWidth: 1.5, fill: '#fff' }}
                                            activeDot={{ r: 6, strokeWidth: 2, fill: '#10b981' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="expenses"
                                            stroke="#ef4444"
                                            strokeWidth={2.5}
                                            fillOpacity={1}
                                            fill="url(#colorExpenses)"
                                            dot={{ r: 4, strokeWidth: 1.5, fill: '#fff' }}
                                            activeDot={{ r: 6, strokeWidth: 2, fill: '#ef4444' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="profit"
                                            stroke="#4f46e5"
                                            strokeWidth={2.5}
                                            fillOpacity={1}
                                            fill="url(#colorProfit)"
                                            dot={{ r: 4, strokeWidth: 1.5, fill: '#fff' }}
                                            activeDot={{ r: 6, strokeWidth: 2, fill: '#4f46e5' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-xs text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                    No daily stats available for this period.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h2 className="text-sm font-black text-gray-900 uppercase">Top products by gross profit</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-left text-[10px] font-bold uppercase text-gray-500">
                                        <th className="px-4 py-3">Product</th>
                                        <th className="px-4 py-3 text-right">Qty sold</th>
                                        <th className="px-4 py-3 text-right">Revenue</th>
                                        <th className="px-4 py-3 text-right">COGS</th>
                                        <th className="px-4 py-3 text-right">Gross profit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(data.byProduct || []).length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                                No line-level cost data in this period. Set optional <strong>unit cost</strong> on products and new
                                                orders will capture it.
                                            </td>
                                        </tr>
                                    ) : (
                                        data.byProduct.map((row: any) => (
                                            <tr key={row.productId} className="border-t border-gray-100 hover:bg-gray-50/80">
                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    <div className="max-w-xs line-clamp-2">{row.title}</div>
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">{row.quantity}</td>
                                                <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(row.revenue)}</td>
                                                <td className="px-4 py-3 text-right tabular-nums text-gray-600">{formatCurrency(row.cogs)}</td>
                                                <td className="px-4 py-3 text-right tabular-nums font-bold text-emerald-700">
                                                    {formatCurrency(row.grossProfit)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-900">
                        <strong>Tip:</strong> Cost is copied to each order line when the order is placed, so changing a product&apos;s cost later does
                        not rewrite past orders — your historical profit stays stable.
                    </div>
                </>
            ) : null}
        </div>
    );
}
