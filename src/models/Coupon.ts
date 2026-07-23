import mongoose, { Schema, Model } from 'mongoose';
import { ICouponDocument } from '@/types';

const CouponSchema = new Schema<ICouponDocument>(
    {
        code: {
            type: String,
            required: [true, 'Coupon code is required'],
            unique: true,
            trim: true,
            uppercase: true,
        },
        description: {
            type: String,
            trim: true,
        },
        discountType: {
            type: String,
            enum: ['percentage', 'flat'],
            required: true,
        },
        discountValue: {
            type: Number,
            required: true,
        },
        minOrderAmount: {
            type: Number,
            default: 0,
        },
        maxDiscountAmount: {
            type: Number,
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        expiryDate: {
            type: Date,
        },
        usageLimit: {
            type: Number,
        },
        usedCount: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

const Coupon: Model<ICouponDocument> = mongoose.models.Coupon || mongoose.model<ICouponDocument>('Coupon', CouponSchema);

export default Coupon;
