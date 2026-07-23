import mongoose, { Schema, Model } from 'mongoose';
import { ISubscriberDocument } from '@/types';

const SubscriberSchema = new Schema<ISubscriberDocument>(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        subscribedAt: {
            type: Date,
            default: Date.now,
        }
    },
    {
        timestamps: true,
    }
);

const Subscriber: Model<ISubscriberDocument> = mongoose.models.Subscriber || mongoose.model<ISubscriberDocument>('Subscriber', SubscriberSchema);

export default Subscriber;
