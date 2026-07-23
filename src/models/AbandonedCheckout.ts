import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IAbandonedCheckoutDocument extends Document {
    customerInfo: {
        name?: string;
        phone?: string;
        email?: string;
        address?: string;
        city?: string;
        notes?: string;
    };
    cartItems: {
        productId: string;
        title: string;
        price: number;
        quantity: number;
        image?: string;
        variant?: Record<string, unknown>;
    }[];
    cartTotal: number;
    status: 'abandoned' | 'recovered' | 'expired';
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AbandonedCheckoutSchema = new Schema<IAbandonedCheckoutDocument>(
    {
        customerInfo: {
            name: { type: String, trim: true, maxlength: 200 },
            phone: { type: String, trim: true, maxlength: 20 },
            email: { type: String, trim: true, lowercase: true, maxlength: 100 },
            address: { type: String, trim: true, maxlength: 500 },
            city: { type: String, trim: true, maxlength: 100 },
            notes: { type: String, trim: true, maxlength: 500 },
        },
        cartItems: [
            {
                productId: { type: String, required: true },
                title: { type: String, required: true, maxlength: 300 },
                price: { type: Number, required: true },
                quantity: { type: Number, required: true, min: 1 },
                image: { type: String, default: '' },
                variant: { type: Schema.Types.Mixed, default: {} },
            },
        ],
        cartTotal: {
            type: Number,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: ['abandoned', 'recovered', 'expired'],
            default: 'abandoned',
        },
        ipAddress: { type: String },
        userAgent: { type: String, maxlength: 500 },
    },
    {
        timestamps: true,
    }
);

// Indexes
AbandonedCheckoutSchema.index({ status: 1 });
AbandonedCheckoutSchema.index({ createdAt: -1 });
AbandonedCheckoutSchema.index({ 'customerInfo.phone': 1 });
// Auto-delete after 30 days
AbandonedCheckoutSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const AbandonedCheckout: Model<IAbandonedCheckoutDocument> =
    mongoose.models.AbandonedCheckout ||
    mongoose.model<IAbandonedCheckoutDocument>('AbandonedCheckout', AbandonedCheckoutSchema);

export default AbandonedCheckout;
