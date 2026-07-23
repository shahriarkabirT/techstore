import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ICustomer {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    city?: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: Date;
}

export interface ICustomerDocument extends ICustomer, Document {
    createdAt: Date;
    updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomerDocument>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
        },
        address: {
            type: String,
            trim: true,
        },
        city: {
            type: String,
            trim: true,
        },
        totalOrders: {
            type: Number,
            default: 0,
        },
        totalSpent: {
            type: Number,
            default: 0,
        },
        lastOrderDate: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster searching
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ email: 1 });
CustomerSchema.index({ name: 1 });

const Customer: Model<ICustomerDocument> = mongoose.models.Customer || mongoose.model<ICustomerDocument>('Customer', CustomerSchema);

export default Customer;
