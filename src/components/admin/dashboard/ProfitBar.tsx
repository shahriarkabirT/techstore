'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, PieChart } from 'lucide-react';

interface ProfitBarProps {
    profit: {
        grossProfit: number;
        totalCogs: number;
        revenueWithCost: number;
        revenueWithoutCost: number;
        linesWithCost: number;
        linesWithoutCost: number;
        marginPercent: number;
        growth: number;
    };
}

function formatBdt(n: number) {
    return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(n);
}

export function ProfitBar({ profit }: ProfitBarProps) {
    const tracked = profit.revenueWithCost;
    const unknown = profit.revenueWithoutCost;
    const total = tracked + unknown;
    const trackedPct = total > 0 ? Math.round((tracked / total) * 1000) / 10 : 0;
    const unknownPct = total > 0 ? Math.round((unknown / total) * 1000) / 10 : 0;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
                        <PieChart className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-gray-900 uppercase">Gross profit</h2>
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                            Paid orders only · Lines without unit cost are excluded from profit (shown as &quot;unknown&quot; revenue)
                        </p>
                    </div>
                </div>
                <Link
                    href="/admin/reports/profit"
                    className="text-xs font-black text-emerald-700 hover:text-emerald-800 uppercase shrink-0"
                >
                    Full report →
                </Link>
            </div>

            <div className="flex flex-wrap items-end gap-6 mb-5">
                <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Gross profit</p>
                    <p className="text-2xl font-black text-emerald-700 tabular-nums">{formatBdt(profit.grossProfit)}</p>
                    <div className={`flex items-center text-xs font-bold mt-1 ${profit.growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {profit.growth >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                        {Math.abs(profit.growth).toFixed(1)}% vs last period
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">COGS (known)</p>
                    <p className="text-lg font-black text-gray-800 tabular-nums">{formatBdt(profit.totalCogs)}</p>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Margin (on known)</p>
                    <p className="text-lg font-black text-gray-800 tabular-nums">{profit.marginPercent.toFixed(1)}%</p>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500">
                    <span>Revenue breakdown (line items)</span>
                    <span>
                        <span className="text-emerald-700">{trackedPct}%</span>
                        <span className="text-gray-400 mx-1">/</span>
                        <span className="text-amber-600">{unknownPct}%</span>
                    </span>
                </div>
                <div className="h-3 rounded-full bg-gray-100 overflow-hidden flex">
                    <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${trackedPct}%` }}
                        title="Sold lines with cost on file"
                    />
                    <div
                        className="h-full bg-amber-200 transition-all duration-500"
                        style={{ width: `${unknownPct}%` }}
                        title="Sold lines without unit cost"
                    />
                </div>
                <div className="flex flex-wrap gap-4 text-[11px] text-gray-600">
                    <span>
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5 align-middle" />
                        With cost: {formatBdt(tracked)} ({profit.linesWithCost} lines)
                    </span>
                    <span>
                        <span className="inline-block w-2 h-2 rounded-full bg-amber-300 mr-1.5 align-middle" />
                        No cost: {formatBdt(unknown)} ({profit.linesWithoutCost} lines)
                    </span>
                </div>
            </div>
        </div>
    );
}
