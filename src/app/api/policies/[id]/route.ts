import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import connectDB from '@/lib/db';
import Policy from '@/models/Policy';
import mongoose from 'mongoose';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await context.params;

        let policy;

        // Try to find by ID first if it's a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(id)) {
            policy = await Policy.findById(id);
        }

        // If not found by ID (or invalid ObjectId), treat it as a slug
        if (!policy) {
            policy = await Policy.findOne({ slug: id });
        }

        if (!policy) {
            return NextResponse.json(
                { success: false, message: 'Policy not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            policy,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requirePermission('policies');
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized access' },
                { status: 401 }
            );
        }

        await connectDB();
        const { id } = await context.params;
        const body = await request.json();

        // If slug is changed, check for existing
        if (body.slug) {
            const existingPolicy = await Policy.findOne({ slug: body.slug, _id: { $ne: id } });
            if (existingPolicy) {
                return NextResponse.json(
                    { success: false, message: 'A policy with this slug already exists' },
                    { status: 400 }
                );
            }
        }

        const policy = await Policy.findByIdAndUpdate(
            id,
            body,
            { new: true, runValidators: true }
        );

        if (!policy) {
            return NextResponse.json(
                { success: false, message: 'Policy not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Policy updated successfully',
            policy,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requirePermission('policies');
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized access' },
                { status: 401 }
            );
        }

        await connectDB();
        const { id } = await context.params;

        const policy = await Policy.findByIdAndDelete(id);

        if (!policy) {
            return NextResponse.json(
                { success: false, message: 'Policy not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Policy deleted successfully',
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
