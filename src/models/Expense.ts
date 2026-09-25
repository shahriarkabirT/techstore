import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExpense extends Document {
    title: string;
    amount: number;
    date: Date;
    category: 'Marketing' | 'Office' | 'Software' | 'Packaging' | 'Fulfillment' | 'Other';
    type: 'Single' | 'Bulk' | 'Overhead';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
    {
        title: { type: String, required: true, trim: true },
        amount: { type: Number, required: true, min: 0 },
        date: { type: Date, required: true, default: Date.now },
        category: {
            type: String,
            enum: ['Marketing', 'Office', 'Software', 'Packaging', 'Fulfillment', 'Other'],
            required: true,
        },
        type: {
            type: String,
            enum: ['Single', 'Bulk', 'Overhead'],
            required: true,
        },
        notes: { type: String, trim: true, maxlength: 1000 },
    },
    { timestamps: true }
);

// Index the date for super-fast dashboard P&L queries
ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ category: 1 });

const Expense: Model<IExpense> = mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
export default Expense;
