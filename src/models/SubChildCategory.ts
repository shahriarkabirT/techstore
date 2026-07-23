import mongoose, { Schema, Model } from 'mongoose';
import { ISubChildCategoryDocument } from '@/types';

const SubChildCategorySchema = new Schema<ISubChildCategoryDocument>(
    {
        name: {
            type: String,
            required: [true, 'SubChildCategory name is required'],
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
        childCategoryId: {
            type: Schema.Types.ObjectId,
            ref: 'ChildCategory',
            required: [true, 'Parent ChildCategory is required'],
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

SubChildCategorySchema.index({ name: 'text' });
SubChildCategorySchema.index({ childCategoryId: 1 });

if (mongoose.models.SubChildCategory) {
    delete (mongoose.models as any).SubChildCategory;
}

const SubChildCategory: Model<ISubChildCategoryDocument> = mongoose.model<ISubChildCategoryDocument>('SubChildCategory', SubChildCategorySchema);

export default SubChildCategory;
