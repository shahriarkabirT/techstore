import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import connectDB from '@/lib/db';
import Policy from '@/models/Policy';

export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const isActive = searchParams.get('isActive');

        const query: any = {};
        if (isActive !== null) {
            query.isActive = isActive === 'true';
        }

        const policies = await Policy.find(query).sort({ order: 1, createdAt: -1 });

        return NextResponse.json({
            success: true,
            policies,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const admin = await requirePermission('policies');
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized access' },
                { status: 401 }
            );
        }

        await connectDB();
        const body = await request.json();

        // Check for existing slug
        const existingPolicy = await Policy.findOne({ slug: body.slug });
        if (existingPolicy) {
            return NextResponse.json(
                { success: false, message: 'A policy with this slug already exists' },
                { status: 400 }
            );
        }

        const policy = await Policy.create(body);

        return NextResponse.json({
            success: true,
            message: 'Policy created successfully',
            policy,
        }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
