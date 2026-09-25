import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;
        
        // Optional filters
        const category = searchParams.get('category');
        const type = searchParams.get('type');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const query: any = {};
        if (category) query.category = category;
        if (type) query.type = type;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const [expenses, total] = await Promise.all([
            Expense.find(query).sort({ date: -1 }).skip(skip).limit(limit).lean(),
            Expense.countDocuments(query)
        ]);

        return NextResponse.json({
            success: true,
            expenses,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        
        const expense = new Expense({
            title: body.title,
            amount: body.amount,
            date: body.date || new Date(),
            category: body.category,
            type: body.type,
            notes: body.notes
        });

        await expense.save();

        return NextResponse.json({
            success: true,
            message: 'Expense added successfully',
            expense
        }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
