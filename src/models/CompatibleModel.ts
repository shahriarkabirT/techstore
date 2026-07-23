import mongoose, { Schema, Model } from 'mongoose';
import { ICompatibleModelDocument } from '@/types';

const CompatibleModelSchema = new Schema<ICompatibleModelDocument>(
    {
        name: {
            type: String,
            required: [true, 'Model name is required'],
            trim: true,
            maxlength: 200,
        },
        slug: {
            type: String,
            required: [true, 'Slug is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: 'ModelCategory',
            default: null,
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

CompatibleModelSchema.index({ name: 'text' });
CompatibleModelSchema.index({ slug: 1 });

const CompatibleModel: Model<ICompatibleModelDocument> = mongoose.models.CompatibleModel || mongoose.model<ICompatibleModelDocument>('CompatibleModel', CompatibleModelSchema);

export default CompatibleModel;
