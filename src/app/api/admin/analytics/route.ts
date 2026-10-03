import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Visit from '@/models/Visit';

export async function GET(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const range = searchParams.get('range') || '7d';

        let startDate = new Date();
        let endDate = new Date();

        if (range === 'today') {
            startDate.setHours(0, 0, 0, 0);
        } else if (range === 'yesterday') {
            startDate.setDate(startDate.getDate() - 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);
        } else if (range === '7d') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (range === '30d') {
            startDate.setDate(startDate.getDate() - 30);
        } else if (range === 'all') {
            startDate = new Date(0);
        }

        const dateFilter = { visitedAt: { $gte: startDate, $lte: endDate } };

        const totalVisits = await Visit.countDocuments(dateFilter);
        const uniqueVisitorsArray = await Visit.distinct('sessionId', dateFilter);
        const uniqueVisitors = uniqueVisitorsArray.length;

        // Group by Date for Chart
        const visitsByDate = await Visit.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$visitedAt" } },
                    visits: { $sum: 1 },
                    uniqueSessionIds: { $addToSet: "$sessionId" }
                }
            },
            {
                $project: {
                    date: "$_id",
                    visits: 1,
                    uniqueVisitors: { $size: "$uniqueSessionIds" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Top Countries
        const topCountries = await Visit.aggregate([
            { $match: dateFilter },
            { $group: { _id: "$country", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Top Devices
        const topDevices = await Visit.aggregate([
            { $match: dateFilter },
            { $group: { _id: "$deviceType", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 3 }
        ]);

        // Top Pages
        const topPages = await Visit.aggregate([
            { $match: dateFilter },
            { $group: { _id: "$path", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        return NextResponse.json({
            success: true,
            totalVisits,
            uniqueVisitors,
            visitsByDate,
            topCountries,
            topDevices,
            topPages
        });

    } catch (error) {
        console.error('Analytics Fetch Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
