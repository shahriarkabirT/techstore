import mongoose, { Schema, Model } from 'mongoose';
import { IReviewDocument } from '@/types';

const ReviewSchema = new Schema<IReviewDocument>(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
        reviewerName: {
            type: String,
            required: false,
        },
        reviewerAvatar: {
            type: String,
            required: false,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
        images: {
            type: [String],
            default: [],
        },
        isApproved: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
ReviewSchema.index({ productId: 1, isApproved: 1 });
ReviewSchema.index({ userId: 1 });

const Review: Model<IReviewDocument> = mongoose.models.Review || mongoose.model<IReviewDocument>('Review', ReviewSchema);

export default Review;
