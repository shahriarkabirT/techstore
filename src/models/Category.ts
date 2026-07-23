import mongoose, { Schema, Model } from 'mongoose';
import { ICategoryDocument } from '@/types';

const CategorySchema = new Schema<ICategoryDocument>(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
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
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        bannerImage: {
            type: String,
            required: [true, 'Banner Image is required'],
        },
        order: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        showToLandingPage: {
            type: Boolean,
            default: false,
        },
        metaTitle: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        metaDescription: {
            type: String,
            trim: true,
            maxlength: 200,
        },
    },
    {
        timestamps: true,
    }
);

// Index for search
CategorySchema.index({ name: 'text' });

if (mongoose.models.Category) {
    // Force delete to override
    delete (mongoose.models as any).Category;
}

const Category: Model<ICategoryDocument> = mongoose.model<ICategoryDocument>('Category', CategorySchema);

export default Category;
