import mongoose, { Schema, Model } from 'mongoose';
import { IBrandDocument } from '@/types';

const BrandSchema = new Schema<IBrandDocument>(
    {
        name: {
            type: String,
            required: [true, 'Brand name is required'],
            trim: true,
            maxlength: 100,
        },
        slug: {
            type: String,
            required: [true, 'Slug is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        logo: {
            type: String,
            required: [true, 'Brand logo is required'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        order: {
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

BrandSchema.index({ name: 'text' });

const Brand: Model<IBrandDocument> = mongoose.models.Brand || mongoose.model<IBrandDocument>('Brand', BrandSchema);

export default Brand;
