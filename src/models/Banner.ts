import mongoose, { Schema, Model } from 'mongoose';
import { IBannerDocument } from '@/types';

const BannerSchema = new Schema<IBannerDocument>(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: 100,
        },
        subtitle: {
            type: String,
            trim: true,
            maxlength: 200,
        },
        image: {
            type: String,
            required: [true, 'Image URL is required'],
        },
        link: {
            type: String,
            trim: true,
        },
        position: {
            type: String,
            enum: ['primary', 'secondary', 'secondary-top', 'secondary-bottom', 'promotional-left', 'promotional-right'],
            default: 'primary',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        order: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Index for sorting by order
BannerSchema.index({ order: 1 });

const Banner: Model<IBannerDocument> = mongoose.models.Banner || mongoose.model<IBannerDocument>('Banner', BannerSchema);

export default Banner;
