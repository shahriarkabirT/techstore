'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, PieChart } from 'lucide-react';

interface ProfitBarProps {
    profit: {
        grossProfit: number;
        totalExpenses: number;
        netProfit: number;
        totalCogs: number;
        revenueWithCost: number;
        revenueWithoutCost: number;
        linesWithCost: number;
        linesWithoutCost: number;
        marginPercent: number;
        netMarginPercent: number;
        growth: number;
        netGrowth: number;
    };
}

function formatBdt(n: number) {
    return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(n);
}

export function ProfitBar({ profit }: ProfitBarProps) {
    const revenue = Math.max(profit.revenueWithCost, 1);
    const isLoss = profit.netProfit < 0;

    const cogsWidth = Math.min((profit.totalCogs / revenue) * 100, 100);
    const opexWidth = Math.min((profit.totalExpenses / revenue) * 100, 100 - cogsWidth);
    const profitWidth = isLoss ? 0 : 100 - cogsWidth - opexWidth;

    const cogsDisplayPct = ((profit.totalCogs / revenue) * 100).toFixed(1);
    const opexDisplayPct = ((profit.totalExpenses / revenue) * 100).toFixed(1);
    const profitDisplayPct = ((profit.netProfit / revenue) * 100).toFixed(1);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
                        <PieChart className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-gray-900">Profit & Loss Overview</h2>
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                            Paid orders only · Lines without unit cost are excluded from profit (shown as &quot;unknown&quot; revenue)
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                    <Link
                        href="/admin/expenses"
                        className="text-xs font-black text-rose-600 hover:text-rose-700"
                    >
                        Manage expenses
                    </Link>
                    <Link
                        href="/admin/reports/profit"
                        className="text-xs font-black text-emerald-700 hover:text-emerald-800 shrink-0"
                    >
                        Full report →
                    </Link>
                </div>
            </div>

            <div className="flex flex-wrap items-end gap-6 mb-5">
                <div>
                    <p className="text-[10px] font-bold text-gray-500 mb-1">True Net profit</p>
                    <p className="text-2xl font-black text-emerald-700 tabular-nums">{formatBdt(profit.netProfit)}</p>
                    <div className={`flex items-center text-xs font-bold mt-1 ${profit.netGrowth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {profit.netGrowth >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                        {Math.abs(profit.netGrowth).toFixed(1)}% vs last period
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-500 mb-1">Gross profit</p>
                    <p className="text-lg font-black text-gray-800 tabular-nums">{formatBdt(profit.grossProfit)}</p>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-500 mb-1">OPEX (Expenses)</p>
                    <p className="text-lg font-black text-rose-600 tabular-nums">{formatBdt(profit.totalExpenses)}</p>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-500 mb-1">COGS (Product cost)</p>
                    <p className="text-lg font-black text-gray-800 tabular-nums">{formatBdt(profit.totalCogs)}</p>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-500 mb-1">Net Margin</p>
                    <p className="text-lg font-black text-gray-800 tabular-nums">{profit.netMarginPercent.toFixed(1)}%</p>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-gray-500">
                    <span>Revenue distribution</span>
                    <span>
                        <span className="text-gray-600">{cogsDisplayPct}%</span>
                        <span className="text-gray-300 mx-1">+</span>
                        <span className="text-rose-600">{opexDisplayPct}%</span>
                        <span className="text-gray-300 mx-1">=</span>
                        <span className={isLoss ? 'text-red-600' : 'text-emerald-700'}>{profitDisplayPct}%</span>
                    </span>
                </div>
                <div className={`h-3 rounded-full overflow-hidden flex ${isLoss ? 'bg-red-50' : 'bg-gray-100'}`}>
                    <div
                        className="h-full bg-gray-700 transition-all duration-500"
                        style={{ width: `${cogsWidth}%` }}
                        title="Product Costs (COGS)"
                    />
                    <div
                        className="h-full bg-rose-500 transition-all duration-500"
                        style={{ width: `${opexWidth}%` }}
                        title="Operational Expenses (OPEX)"
                    />
                    {!isLoss && (
                        <div
                            className="h-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${profitWidth}%` }}
                            title="Net Profit"
                        />
                    )}
                </div>
                <div className="flex flex-wrap gap-4 text-[11px] text-gray-600">
                    <span>
                        <span className="inline-block w-2 h-2 rounded-full bg-gray-700 mr-1.5 align-middle" />
                        COGS ({cogsDisplayPct}%)
                    </span>
                    <span>
                        <span className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1.5 align-middle" />
                        OPEX ({opexDisplayPct}%)
                    </span>
                    <span>
                        <span className={`inline-block w-2 h-2 rounded-full mr-1.5 align-middle ${isLoss ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        {isLoss ? 'Net Loss' : 'Net Profit'} ({profitDisplayPct}%)
                    </span>
                </div>
            </div>
        </div>
    );
}
