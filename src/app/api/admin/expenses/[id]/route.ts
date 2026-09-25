import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        
        const resolvedParams = await params;
        const { id } = resolvedParams;
        
        const body = await req.json();

        const expense = await Expense.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        );

        if (!expense) {
            return NextResponse.json({ success: false, message: 'Expense not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Expense updated successfully',
            expense
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        
        const resolvedParams = await params;
        const { id } = resolvedParams;

        const expense = await Expense.findByIdAndDelete(id);

        if (!expense) {
            return NextResponse.json({ success: false, message: 'Expense not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Expense deleted successfully'
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
