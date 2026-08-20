import mongoose, { Schema, Model } from 'mongoose';
import { IAffiliateTransactionDocument } from '@/types';

const AffiliateTransactionSchema = new Schema<IAffiliateTransactionDocument>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        type: {
            type: String,
            enum: ['earning', 'withdrawal'],
            required: true,
        },
        orderId: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
        },
        status: {
            type: String,
            enum: ['pending', 'cleared', 'cancelled', 'paid'],
            default: 'pending',
        },
        paymentMethod: {
            type: String,
            trim: true,
        },
        paymentDetails: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const AffiliateTransaction: Model<IAffiliateTransactionDocument> = mongoose.models.AffiliateTransaction || mongoose.model<IAffiliateTransactionDocument>('AffiliateTransaction', AffiliateTransactionSchema);

export default AffiliateTransaction;
