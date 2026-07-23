import mongoose, { Schema, Model } from 'mongoose';
import { IModelCategoryDocument } from '@/types';

const ModelCategorySchema = new Schema<IModelCategoryDocument>(
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
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

ModelCategorySchema.index({ name: 'text' });

const ModelCategory: Model<IModelCategoryDocument> = mongoose.models.ModelCategory || mongoose.model<IModelCategoryDocument>('ModelCategory', ModelCategorySchema);

export default ModelCategory;
