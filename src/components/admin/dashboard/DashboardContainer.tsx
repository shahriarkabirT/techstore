'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Calendar,
    Filter,
    RefreshCcw,
    TrendingUp,
    ChevronDown
} from 'lucide-react';
import { DashboardStats } from './DashboardStats';
import { SalesChart } from './SalesChart';
import { TopPerforming } from './TopPerforming';
import { ProfitBar } from './ProfitBar';
import toast from 'react-hot-toast';

export const DashboardContainer = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [period, setPeriod] = useState('30days'); // 7days, 30days, year, custom
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [customRange, setCustomRange] = useState({ start: '', end: '' });

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            let url = '/api/admin/stats';
            let start = new Date();
            let end = new Date();

            if (period === '7days') {
                start.setDate(end.getDate() - 7);
            } else if (period === '30days') {
                start.setDate(end.getDate() - 30);
            } else if (period === 'year') {
                start = new Date(parseInt(selectedYear), 0, 1);
                end = new Date(parseInt(selectedYear), 11, 31, 23, 59, 59);
            } else if (period === 'custom') {
                if (!customRange.start || !customRange.end) {
                    setLoading(false);
                    return;
                }
                start = new Date(customRange.start);
                end = new Date(customRange.end);
                end.setHours(23, 59, 59);
            }

            const response = await axios.get(`${url}?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
            setData(response.data);
        } catch (error: any) {
            toast.error('Failed to load dashboard data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [period, selectedYear, customRange]);

    useEffect(() => {
        if (period !== 'custom' || (customRange.start && customRange.end)) {
            fetchStats();
        }
    }, [fetchStats, period, customRange, selectedYear]);

    const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <RefreshCcw className="animate-spin text-blue-600" size={32} />
                <p className="text-gray-500 font-medium font-mono text-xs uppercase tracking-widest text-center">Calculating insights...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
            {/* Header & Filters Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1 text-center lg:text-left">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Dashboard Insights</h1>
                    <p className="text-xs md:text-sm text-gray-400 font-medium mt-1">Metrics and audit summaries for your business</p>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3">
                    {/* Period Switcher */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
                        {[
                            { label: '7D', value: '7days' },
                            { label: '30D', value: '30days' },
                            { label: 'Yearly', value: 'year' },
                            { label: 'Custom', value: 'custom' },
                        ].map((p) => (
                            <button
                                key={p.value}
                                onClick={() => setPeriod(p.value)}
                                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all whitespace-nowrap ${period === p.value
                                        ? 'bg-gray-900 text-white shadow-lg'
                                        : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Secondary Filters (Year or Custom) */}
                    {(period === 'year' || period === 'custom') && (
                        <div className="flex items-center gap-2 h-9">
                            {period === 'year' && (
                                <div className="relative h-full">
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        className="h-full bg-white border border-gray-200 text-gray-900 pl-4 pr-10 rounded-xl text-xs font-black focus:outline-none focus:ring-2 focus:ring-gray-900/5 shadow-sm appearance-none cursor-pointer"
                                    >
                                        {years.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                </div>
                            )}

                            {period === 'custom' && (
                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm h-full">
                                    <input
                                        type="date"
                                        value={customRange.start}
                                        onChange={(e) => setCustomRange(p => ({ ...p, start: e.target.value }))}
                                        className="text-xs font-black text-gray-900 bg-transparent focus:outline-none"
                                    />
                                    <span className="text-gray-300 text-xs">-</span>
                                    <input
                                        type="date"
                                        value={customRange.end}
                                        onChange={(e) => setCustomRange(p => ({ ...p, end: e.target.value }))}
                                        className="text-xs font-black text-gray-900 bg-transparent focus:outline-none"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Dashboard Content */}
            {data && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                    <DashboardStats data={data.summary} />

                    {data.summary?.profit && <ProfitBar profit={data.summary.profit} />}

                    <div className="grid grid-cols-1 gap-8">
                        <SalesChart data={data.charts.dailySales} />

                        <TopPerforming
                            selling={data.topSelling}
                            valued={data.topValued}
                        />
                    </div>

                    {/* Footer Note */}
                    <div className="flex items-center justify-center py-8 border-t border-gray-50">
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
                            <TrendingUp size={14} className="text-gray-400" />
                            <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">
                                All calculations are based on completed and paid transactions
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
