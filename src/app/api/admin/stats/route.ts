import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Category from '@/models/Category';
import User from '@/models/User';
import { requirePermission } from '@/lib/auth';
import Expense from '@/models/Expense';
import { aggregateProfitMetrics } from '@/lib/profitAggregation';

export async function GET(request: Request) {
    try {
        const admin = await requirePermission('dashboard');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { searchParams } = new URL(request.url);

        // Date range handling
        const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date();
        const startDate = searchParams.get('startDate')
            ? new Date(searchParams.get('startDate')!)
            : new Date(new Date().setDate(endDate.getDate() - 30));

        const query: any = {
            createdAt: { $gte: startDate, $lte: endDate },
        };

        // Previous period calculation for growth
        const periodMs = endDate.getTime() - startDate.getTime();
        const prevStartDate = new Date(startDate.getTime() - periodMs);
        const prevEndDate = new Date(endDate.getTime() - periodMs);
        const prevQuery = {
            createdAt: { $gte: prevStartDate, $lte: prevEndDate }
        };

        const [
            stats,
            prevStats,
            chartData,
            topSelling,
            topValued,
            recentOrders,
            totalUsers,
            periodUsers,
            prevPeriodUsers,
            profitMetrics,
            prevProfitMetrics,
            expenses,
            prevExpenses,
            inventoryValuation,
        ] = await Promise.all([
            // Current Period Stats
            Order.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "Paid"] }, "$totalAmount", 0] } },
                        totalOrders: { $sum: 1 },
                        paidOrders: { $sum: { $cond: [{ $eq: ["$paymentStatus", "Paid"] }, 1, 0] } },
                        pendingOrders: { $sum: { $cond: [{ $eq: ["$orderStatus", "Pending"] }, 1, 0] } }
                    }
                }
            ]),
            // Previous Period Stats
            Order.aggregate([
                { $match: prevQuery },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "Paid"] }, "$totalAmount", 0] } },
                        totalOrders: { $sum: 1 }
                    }
                }
            ]),
            // Chart Data (Dynamic format based on range)
            Order.aggregate([
                { $match: { ...query, paymentStatus: "Paid" } },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: periodMs > 60 * 24 * 60 * 60 * 1000 ? "%Y-%m" : "%Y-%m-%d",
                                date: "$createdAt"
                            }
                        },
                        revenue: { $sum: "$totalAmount" },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { "_id": 1 } }
            ]),
            // Top Selling Products (By Quantity) - Count only from Paid orders
            Order.aggregate([
                { $match: { ...query, paymentStatus: "Paid" } },
                { $unwind: "$products" },
                {
                    $group: {
                        _id: "$products.productId",
                        name: { $first: "$products.title" },
                        salesCount: { $sum: "$products.quantity" },
                        revenue: { $sum: { $multiply: ["$products.price", "$products.quantity"] } }
                    }
                },
                { $sort: { salesCount: -1 } },
                { $limit: 10 }
            ]),
            // Top Valued Products (By Revenue) - Count only from Paid orders
            Order.aggregate([
                { $match: { ...query, paymentStatus: "Paid" } },
                { $unwind: "$products" },
                {
                    $group: {
                        _id: "$products.productId",
                        name: { $first: "$products.title" },
                        salesCount: { $sum: "$products.quantity" },
                        revenue: { $sum: { $multiply: ["$products.price", "$products.quantity"] } }
                    }
                },
                { $sort: { revenue: -1 } },
                { $limit: 10 }
            ]),
            // Recent Activity
            Order.find(query).sort({ createdAt: -1 }).limit(10).lean(),
            // Customer Stats
            User.countDocuments({ role: 'user' }),
            User.countDocuments({ role: 'user', createdAt: { $gte: startDate, $lte: endDate } }),
            User.countDocuments({ role: 'user', createdAt: { $gte: prevStartDate, $lte: prevEndDate } }),
            aggregateProfitMetrics(query),
            aggregateProfitMetrics(prevQuery),
            Expense.aggregate([
                { $match: { date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: null, totalSpent: { $sum: "$amount" } } }
            ]),
            Expense.aggregate([
                { $match: { date: { $gte: prevStartDate, $lte: prevEndDate } } },
                { $group: { _id: null, totalSpent: { $sum: "$amount" } } }
            ]),
            Product.aggregate([
                {
                    $project: {
                        inventoryValue: {
                            $cond: {
                                if: { $eq: ["$productType", "single"] },
                                then: { $multiply: [{ $ifNull: ["$productCost", 0] }, { $ifNull: ["$stock", 0] }] },
                                else: {
                                    $sum: {
                                        $map: {
                                            input: { $ifNull: ["$variants", []] },
                                            as: "v",
                                            in: { $multiply: [{ $ifNull: ["$$v.productCost", 0] }, { $ifNull: ["$$v.stock", 0] }] }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalValue: { $sum: "$inventoryValue" }
                    }
                }
            ])
        ]);

        const current = stats[0] || { totalRevenue: 0, totalOrders: 0, paidOrders: 0, pendingOrders: 0 };
        const previous = prevStats[0] || { totalRevenue: 0, totalOrders: 0 };
        const totalInventoryValue = inventoryValuation[0]?.totalValue || 0;

        const currentExpenses = expenses[0]?.totalSpent || 0;
        const previousExpenses = prevExpenses[0]?.totalSpent || 0;

        const currentGrossProfit = profitMetrics.grossProfit || 0;
        const currentNetProfit = currentGrossProfit - currentExpenses;
        
        const previousGrossProfit = prevProfitMetrics.grossProfit || 0;
        const previousNetProfit = previousGrossProfit - previousExpenses;

        const calculateGrowth = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return ((curr - prev) / prev) * 100;
        };

        return NextResponse.json({
            success: true,
            summary: {
                revenue: {
                    value: current.totalRevenue,
                    growth: calculateGrowth(current.totalRevenue, previous.totalRevenue)
                },
                orders: {
                    value: current.totalOrders,
                    growth: calculateGrowth(current.totalOrders, previous.totalOrders),
                    paid: current.paidOrders,
                    pending: current.pendingOrders
                },
                aov: {
                    value: current.totalOrders > 0 ? (current.totalRevenue / current.totalOrders) : 0,
                    growth: 0
                },
                users: {
                    value: totalUsers,
                    newUsers: periodUsers,
                    growth: calculateGrowth(periodUsers, prevPeriodUsers)
                },
                inventory: {
                    totalValue: totalInventoryValue
                },
                profit: {
                    grossProfit: currentGrossProfit,
                    totalExpenses: currentExpenses,
                    netProfit: currentNetProfit,
                    totalCogs: profitMetrics.totalCogs,
                    revenueWithCost: profitMetrics.revenueWithCost,
                    revenueWithoutCost: profitMetrics.revenueWithoutCost,
                    linesWithCost: profitMetrics.linesWithCost,
                    linesWithoutCost: profitMetrics.linesWithoutCost,
                    marginPercent:
                        profitMetrics.revenueWithCost > 0
                            ? (currentGrossProfit / profitMetrics.revenueWithCost) * 100
                            : 0,
                    netMarginPercent:
                        profitMetrics.revenueWithCost > 0
                            ? (currentNetProfit / profitMetrics.revenueWithCost) * 100
                            : 0,
                    growth: calculateGrowth(currentGrossProfit, previousGrossProfit),
                    netGrowth: calculateGrowth(currentNetProfit, previousNetProfit),
                },
            },
            charts: {
                dailySales: chartData.map(d => ({ date: d._id, revenue: d.revenue, count: d.count }))
            },
            topSelling: topSelling.map(p => ({
                _id: p._id,
                name: p.name,
                salesCount: p.salesCount,
                revenue: p.revenue
            })),
            topValued: topValued.map(p => ({
                _id: p._id,
                name: p.name,
                salesCount: p.salesCount,
                revenue: p.revenue
            })),
            recentOrders
        });

    } catch (error: any) {
        console.error('Stats API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
