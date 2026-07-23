import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { requirePermission } from '@/lib/auth';

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

        // Set end of day for endDate
        endDate.setHours(23, 59, 59, 999);

        const query: any = { createdAt: { $gte: startDate, $lte: endDate } };

        // Previous period for growth comparison
        const periodMs = endDate.getTime() - startDate.getTime();
        const prevStartDate = new Date(startDate.getTime() - periodMs);
        const prevEndDate = new Date(endDate.getTime() - periodMs);
        const prevQuery = { createdAt: { $gte: prevStartDate, $lte: prevEndDate } };

        const [
            currentStats,
            prevStats,
            statusBreakdown,
            revenueOverTime,
            paymentMethodBreakdown,
            sourceBreakdown,
            topSellingProducts,
            topRevenueProducts,
            peakHours,
        ] = await Promise.all([
            // Current period summary
            Order.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: { $cond: [{ $in: ['$paymentStatus', ['Paid']] }, '$totalAmount', 0] } },
                        totalCODRevenue: { $sum: { $cond: [{ $and: [{ $eq: ['$orderStatus', 'Delivered'] }, { $eq: ['$paymentMethod', 'COD'] }] }, '$totalAmount', 0] } },
                        avgOrderValue: { $avg: '$totalAmount' },
                        cancelledOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'Cancelled'] }, 1, 0] } },
                        deliveredOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'Delivered'] }, 1, 0] } },
                    }
                }
            ]),

            // Previous period summary
            Order.aggregate([
                { $match: prevQuery },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: { $cond: [{ $in: ['$paymentStatus', ['Paid']] }, '$totalAmount', 0] } },
                        totalCODRevenue: { $sum: { $cond: [{ $and: [{ $eq: ['$orderStatus', 'Delivered'] }, { $eq: ['$paymentMethod', 'COD'] }] }, '$totalAmount', 0] } },
                    }
                }
            ]),

            // Orders by status
            Order.aggregate([
                { $match: query },
                { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),

            // Revenue over time
            Order.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: periodMs > 90 * 24 * 60 * 60 * 1000 ? '%Y-%m' : '%Y-%m-%d',
                                date: '$createdAt'
                            }
                        },
                        revenue: { $sum: '$totalAmount' },
                        paidRevenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, '$totalAmount', 0] } },
                        orders: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            // Payment method breakdown
            Order.aggregate([
                { $match: query },
                { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
                { $sort: { count: -1 } }
            ]),

            // Order source breakdown
            Order.aggregate([
                { $match: query },
                { $group: { _id: { $ifNull: ['$source', 'online'] }, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
                { $sort: { count: -1 } }
            ]),

            // Top selling products by quantity
            Order.aggregate([
                { $match: { ...query, orderStatus: { $nin: ['Cancelled'] } } },
                { $unwind: '$products' },
                {
                    $group: {
                        _id: '$products.productId',
                        name: { $first: '$products.title' },
                        image: { $first: '$products.image' },
                        totalQty: { $sum: '$products.quantity' },
                        totalRevenue: { $sum: { $multiply: ['$products.price', '$products.quantity'] } }
                    }
                },
                { $sort: { totalQty: -1 } },
                { $limit: 10 }
            ]),

            // Top revenue products
            Order.aggregate([
                { $match: { ...query, orderStatus: { $nin: ['Cancelled'] } } },
                { $unwind: '$products' },
                {
                    $group: {
                        _id: '$products.productId',
                        name: { $first: '$products.title' },
                        image: { $first: '$products.image' },
                        totalQty: { $sum: '$products.quantity' },
                        totalRevenue: { $sum: { $multiply: ['$products.price', '$products.quantity'] } }
                    }
                },
                { $sort: { totalRevenue: -1 } },
                { $limit: 10 }
            ]),

            // Peak order hours
            Order.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: { $hour: '$createdAt' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
        ]);

        const current = currentStats[0] || { totalOrders: 0, totalRevenue: 0, totalCODRevenue: 0, avgOrderValue: 0, cancelledOrders: 0, deliveredOrders: 0 };
        const previous = prevStats[0] || { totalOrders: 0, totalRevenue: 0, totalCODRevenue: 0 };

        const growth = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return Math.round(((curr - prev) / prev) * 100);
        };

        return NextResponse.json({
            success: true,
            summary: {
                totalOrders: current.totalOrders,
                totalRevenue: current.totalRevenue + current.totalCODRevenue,
                avgOrderValue: Math.round(current.avgOrderValue || 0),
                cancellationRate: current.totalOrders > 0 ? Math.round((current.cancelledOrders / current.totalOrders) * 100) : 0,
                deliveredOrders: current.deliveredOrders,
                growth: {
                    orders: growth(current.totalOrders, previous.totalOrders),
                    revenue: growth(current.totalRevenue + current.totalCODRevenue, previous.totalRevenue + previous.totalCODRevenue),
                }
            },
            statusBreakdown: statusBreakdown.map(s => ({ status: s._id, count: s.count })),
            revenueOverTime: revenueOverTime.map(r => ({ date: r._id, revenue: r.revenue, paidRevenue: r.paidRevenue, orders: r.orders })),
            paymentMethods: paymentMethodBreakdown.map(p => ({ method: p._id, count: p.count, revenue: p.revenue })),
            sources: sourceBreakdown.map(s => ({ source: s._id, count: s.count, revenue: s.revenue })),
            topSellingProducts,
            topRevenueProducts,
            peakHours: peakHours.map(h => ({ hour: h._id, count: h.count })),
        });

    } catch (error: any) {
        console.error('Order Report API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
