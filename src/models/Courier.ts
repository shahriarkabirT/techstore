import mongoose, { Schema, Model } from 'mongoose';
import { ICourierDocument } from '@/types';

const CourierSchema = new Schema<ICourierDocument>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            enum: ['redx', 'steadfast', 'pathao'],
        },
        isEnabled: {
            type: Boolean,
            default: false,
        },
        config: {
            type: Schema.Types.Mixed,
            default: {},
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

const Courier: Model<ICourierDocument> = mongoose.models.Courier || mongoose.model<ICourierDocument>('Courier', CourierSchema);

export default Courier;
