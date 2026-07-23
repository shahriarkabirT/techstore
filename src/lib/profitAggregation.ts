import Order from '@/models/Order';

const paidMatch = (base: Record<string, unknown>) => ({ ...base, paymentStatus: 'Paid' as const });

/** Line-level fields used in profit pipelines */
const lineFieldsStage = {
    $addFields: {
        hasUnitCost: { $gt: [{ $ifNull: ['$products.unitProductCost', -1] }, -1] },
        lineRevenue: { $multiply: ['$products.price', '$products.quantity'] },
    },
};

const lineProfitFieldsStage = {
    $addFields: {
        lineCogs: {
            $cond: [
                '$hasUnitCost',
                { $multiply: ['$products.unitProductCost', '$products.quantity'] },
                0,
            ],
        },
        lineGrossProfit: {
            $cond: [
                '$hasUnitCost',
                {
                    $multiply: [
                        { $subtract: ['$products.price', '$products.unitProductCost'] },
                        '$products.quantity',
                    ],
                },
                0,
            ],
        },
        lineRevenueUnknown: {
            $cond: ['$hasUnitCost', 0, '$lineRevenue'],
        },
    },
};

export interface ProfitMetrics {
    grossProfit: number;
    totalCogs: number;
    revenueWithCost: number;
    revenueWithoutCost: number;
    linesWithCost: number;
    linesWithoutCost: number;
}

export async function aggregateProfitMetrics(dateQuery: Record<string, unknown>): Promise<ProfitMetrics> {
    const [row] = await Order.aggregate([
        { $match: paidMatch(dateQuery) },
        { $unwind: '$products' },
        lineFieldsStage,
        lineProfitFieldsStage,
        {
            $group: {
                _id: null,
                grossProfit: { $sum: '$lineGrossProfit' },
                totalCogs: { $sum: '$lineCogs' },
                revenueWithCost: { $sum: { $cond: ['$hasUnitCost', '$lineRevenue', 0] } },
                revenueWithoutCost: { $sum: '$lineRevenueUnknown' },
                linesWithCost: { $sum: { $cond: ['$hasUnitCost', 1, 0] } },
                linesWithoutCost: { $sum: { $cond: ['$hasUnitCost', 0, 1] } },
            },
        },
    ]);

    return {
        grossProfit: row?.grossProfit ?? 0,
        totalCogs: row?.totalCogs ?? 0,
        revenueWithCost: row?.revenueWithCost ?? 0,
        revenueWithoutCost: row?.revenueWithoutCost ?? 0,
        linesWithCost: row?.linesWithCost ?? 0,
        linesWithoutCost: row?.linesWithoutCost ?? 0,
    };
}

export async function aggregateProfitByProduct(
    dateQuery: Record<string, unknown>,
    limit = 15
): Promise<{ productId: string; title: string; quantity: number; revenue: number; cogs: number; grossProfit: number }[]> {
    return Order.aggregate([
        { $match: paidMatch(dateQuery) },
        { $unwind: '$products' },
        lineFieldsStage,
        lineProfitFieldsStage,
        { $match: { hasUnitCost: true } },
        {
            $group: {
                _id: '$products.productId',
                title: { $first: '$products.title' },
                quantity: { $sum: '$products.quantity' },
                revenue: { $sum: '$lineRevenue' },
                cogs: { $sum: '$lineCogs' },
                grossProfit: { $sum: '$lineGrossProfit' },
            },
        },
        { $sort: { grossProfit: -1 } },
        { $limit: limit },
        {
            $project: {
                _id: 0,
                productId: { $toString: '$_id' },
                title: 1,
                quantity: 1,
                revenue: 1,
                cogs: 1,
                grossProfit: 1,
            },
        },
    ]);
}

export async function aggregateProfitDaily(
    dateQuery: Record<string, unknown>,
    dateFormat: '%Y-%m-%d' | '%Y-%m'
): Promise<{ date: string; grossProfit: number; revenueWithCost: number; revenueWithoutCost: number; totalCogs: number }[]> {
    return Order.aggregate([
        { $match: paidMatch(dateQuery) },
        { $unwind: '$products' },
        lineFieldsStage,
        lineProfitFieldsStage,
        {
            $group: {
                _id: {
                    $dateToString: { format: dateFormat, date: '$createdAt' },
                },
                grossProfit: { $sum: '$lineGrossProfit' },
                revenueWithCost: { $sum: { $cond: ['$hasUnitCost', '$lineRevenue', 0] } },
                revenueWithoutCost: { $sum: '$lineRevenueUnknown' },
                totalCogs: { $sum: '$lineCogs' },
            },
        },
        { $sort: { _id: 1 } },
        {
            $project: {
                _id: 0,
                date: '$_id',
                grossProfit: 1,
                revenueWithCost: 1,
                revenueWithoutCost: 1,
                totalCogs: 1,
            },
        },
    ]);
}
