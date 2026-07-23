import mongoose, { Schema, Model } from 'mongoose';
import { IPolicyDocument } from '@/types';

const PolicySchema = new Schema<IPolicyDocument>(
    {
        title: {
            type: String,
            required: [true, 'Policy title is required'],
            trim: true,
            maxlength: 150,
        },
        slug: {
            type: String,
            required: [true, 'Slug is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        content: {
            type: String,
            required: [true, 'Content is required'],
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

if (mongoose.models.Policy) {
    delete (mongoose.models as any).Policy;
}

const Policy: Model<IPolicyDocument> = mongoose.model<IPolicyDocument>('Policy', PolicySchema);

export default Policy;
