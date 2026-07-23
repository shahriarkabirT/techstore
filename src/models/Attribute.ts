import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IAttributeDocument extends Document {
    name: string;
    slug: string;
    type: 'text' | 'color';
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AttributeSchema = new Schema<IAttributeDocument>(
    {
        name: {
            type: String,
            required: [true, 'Attribute name is required'],
            trim: true,
            maxlength: 100,
            unique: true,
        },
        slug: {
            type: String,
            required: [true, 'Slug is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ['text', 'color'],
            default: 'text',
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

AttributeSchema.index({ isActive: 1, order: 1 });

const Attribute: Model<IAttributeDocument> =
    mongoose.models.Attribute ||
    mongoose.model<IAttributeDocument>('Attribute', AttributeSchema);

export default Attribute;
