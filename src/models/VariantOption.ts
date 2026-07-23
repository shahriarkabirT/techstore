import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IVariantOptionDocument extends Document {
    type: 'size' | 'color' | 'material' | 'ram' | 'storage';
    label: string;
    order: number;
    colorCode?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const VariantOptionSchema = new Schema<IVariantOptionDocument>(
    {
        type: {
            type: String,
            enum: ['size', 'color', 'material', 'ram', 'storage'],
            required: [true, 'Variant option type is required'],
        },
        label: {
            type: String,
            required: [true, 'Label is required'],
            trim: true,
            maxlength: 100,
        },
        order: {
            type: Number,
            default: 0,
        },
        colorCode: {
            type: String,
            trim: true,
            maxlength: 20,
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

// Compound index: unique label per type
VariantOptionSchema.index({ type: 1, label: 1 }, { unique: true });
VariantOptionSchema.index({ type: 1, isActive: 1 });

const VariantOption: Model<IVariantOptionDocument> =
    mongoose.models.VariantOption ||
    mongoose.model<IVariantOptionDocument>('VariantOption', VariantOptionSchema);

export default VariantOption;
