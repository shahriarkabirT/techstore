import mongoose, { Schema, Model } from 'mongoose';
import { IFraudDocument } from '@/types';

const FraudSchema = new Schema<IFraudDocument>(
    {
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
            index: true,
        },
        ip: {
            type: String,
            trim: true,
            default: '',
            index: true,
        },
        name: {
            type: String,
            trim: true,
            default: '',
        },
        status: {
            type: String,
            enum: ['flagged', 'blocked'],
            default: 'blocked',
        },
        reason: {
            type: String,
            trim: true,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

FraudSchema.index({ phone: 1, ip: 1 });

const Fraud: Model<IFraudDocument> = mongoose.models.Fraud || mongoose.model<IFraudDocument>('Fraud', FraudSchema);

export default Fraud;
