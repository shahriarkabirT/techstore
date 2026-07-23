import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { requirePermission } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const admin = await requirePermission('users');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role') || '';

        const skip = (page - 1) * limit;

        const query: any = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        if (role) {
            query.role = role;
        }

        const users = await User.find(query)
            .select('-password') // Exclude password
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments(query);

        return NextResponse.json({
            success: true,
            users,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit,
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
