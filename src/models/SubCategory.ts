import mongoose, { Schema, Model } from 'mongoose';
import { ISubCategoryDocument } from '@/types';

const SubCategorySchema = new Schema<ISubCategoryDocument>(
    {
        name: {
            type: String,
            required: [true, 'SubCategory name is required'],
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
        categoryId: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Parent Category is required'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        bannerImage: {
            type: String,
            default: '',
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
        showOnMid: {
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

SubCategorySchema.index({ categoryId: 1 });

if (mongoose.models.SubCategory) {
    // Force delete to override
    delete (mongoose.models as any).SubCategory;
}

const SubCategory: Model<ISubCategoryDocument> = mongoose.model<ISubCategoryDocument>('SubCategory', SubCategorySchema);

export default SubCategory;
