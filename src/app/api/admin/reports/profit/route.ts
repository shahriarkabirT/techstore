import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { aggregateProfitByProduct, aggregateProfitDaily, aggregateProfitMetrics } from '@/lib/profitAggregation';

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

        return NextResponse.json({
            success: true,
            summary,
            byProduct,
            daily,
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
