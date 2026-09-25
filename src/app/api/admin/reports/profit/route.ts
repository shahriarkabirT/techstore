import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { aggregateProfitByProduct, aggregateProfitDaily, aggregateProfitMetrics } from '@/lib/profitAggregation';
import Expense from '@/models/Expense';

export async function GET(request: Request) {
    try {
        const admin = await requirePermission('reports');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { searchParams } = new URL(request.url);

        const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date();
        const startDate = searchParams.get('startDate')
            ? new Date(searchParams.get('startDate')!)
            : new Date(new Date().setDate(endDate.getDate() - 30));

        endDate.setHours(23, 59, 59, 999);

        const query: Record<string, unknown> = { createdAt: { $gte: startDate, $lte: endDate } };
        const periodMs = endDate.getTime() - startDate.getTime();
        const useMonthly = periodMs > 90 * 24 * 60 * 60 * 1000;

        const [summary, byProduct, daily] = await Promise.all([
            aggregateProfitMetrics(query),
            aggregateProfitByProduct(query, 20),
            aggregateProfitDaily(query, useMonthly ? '%Y-%m' : '%Y-%m-%d'),
        ]);

        const expenseQuery = { date: { $gte: startDate, $lte: endDate } };
        const expenseAgg = await Expense.aggregate([
            { $match: expenseQuery },
            {
                $group: {
                    _id: { $dateToString: { format: useMonthly ? '%Y-%m' : '%Y-%m-%d', date: '$date' } },
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const totalExpenses = expenseAgg.reduce((acc, curr) => acc + curr.total, 0);

        const dailyMap = new Map();
        daily.forEach((d: any) => {
            dailyMap.set(d.date, { ...d, operationalExpenses: 0 });
        });

        expenseAgg.forEach((e: any) => {
            if (dailyMap.has(e._id)) {
                dailyMap.get(e._id).operationalExpenses = e.total;
            } else {
                dailyMap.set(e._id, {
                    date: e._id,
                    grossProfit: 0,
                    revenueWithCost: 0,
                    revenueWithoutCost: 0,
                    totalCogs: 0,
                    operationalExpenses: e.total,
                });
            }
        });

        const mergedDaily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

        mergedDaily.forEach((d: any) => {
            d.netProfit = d.grossProfit - d.operationalExpenses;
        });

        const updatedSummary = {
            ...summary,
            operationalExpenses: totalExpenses,
            netProfit: summary.grossProfit - totalExpenses,
        };

        return NextResponse.json({
            success: true,
            summary: updatedSummary,
            byProduct,
            daily: mergedDaily,
            meta: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                granularity: useMonthly ? 'month' : 'day',
            },
        });
    } catch (error: any) {
        console.error('Profit report error:', error);
        return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
    }
}
