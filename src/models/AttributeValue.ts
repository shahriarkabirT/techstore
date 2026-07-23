import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export interface IAttributeValueDocument extends Document {
    attributeId: Types.ObjectId;
    label: string;
    colorCode?: string;
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AttributeValueSchema = new Schema<IAttributeValueDocument>(
    {
        attributeId: {
            type: Schema.Types.ObjectId,
            ref: 'Attribute',
            required: [true, 'Attribute reference is required'],
        },
        label: {
            type: String,
            required: [true, 'Label is required'],
            trim: true,
            maxlength: 100,
        },
        colorCode: {
            type: String,
            trim: true,
            maxlength: 20,
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

// Compound index: unique label per attribute
AttributeValueSchema.index({ attributeId: 1, label: 1 }, { unique: true });
AttributeValueSchema.index({ attributeId: 1, isActive: 1, order: 1 });

const AttributeValue: Model<IAttributeValueDocument> =
    mongoose.models.AttributeValue ||
    mongoose.model<IAttributeValueDocument>('AttributeValue', AttributeValueSchema);

export default AttributeValue;
