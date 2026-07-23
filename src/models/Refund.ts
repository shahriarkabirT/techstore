import mongoose, { Schema, Model } from 'mongoose';
import { IRefundDocument } from '@/types';

const RefundSchema = new Schema<IRefundDocument>(
    {
        orderId: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            // Optional because admins can create refunds for guest checkouts
        },
        reason: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'approved', 'returned', 'rejected'],
            default: 'pending',
        },
        adminNotes: {
            type: String,
            trim: true,
        },
        // Courier-side return request tracking
        courierReturn: {
            courierName: { type: String, trim: true },                  // 'steadfast', 'redx', etc.
            returnRequestId: { type: Number },                          // Courier-side ID
            courierStatus: { type: String, trim: true },                // 'pending' | 'approved' | 'processing' | 'completed' | 'cancelled'
            sentAt: { type: Date },
            lastCheckedAt: { type: Date },
        },
    },
    {
        timestamps: true,
    }
);

if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Refund;
}

const Refund: Model<IRefundDocument> =
    mongoose.models.Refund || mongoose.model<IRefundDocument>('Refund', RefundSchema);

export default Refund;

