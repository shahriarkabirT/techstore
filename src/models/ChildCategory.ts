import mongoose, { Schema, Model } from 'mongoose';
import { IChildCategoryDocument } from '@/types';

const ChildCategorySchema = new Schema<IChildCategoryDocument>(
    {
        name: {
            type: String,
            required: [true, 'ChildCategory name is required'],
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
        subCategoryId: {
            type: Schema.Types.ObjectId,
            ref: 'SubCategory',
            required: [true, 'Parent SubCategory is required'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        image: {
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

ChildCategorySchema.index({ name: 'text' });
ChildCategorySchema.index({ subCategoryId: 1 });

if (mongoose.models.ChildCategory) {
    delete (mongoose.models as any).ChildCategory;
}

const ChildCategory: Model<IChildCategoryDocument> = mongoose.model<IChildCategoryDocument>('ChildCategory', ChildCategorySchema);

export default ChildCategory;
