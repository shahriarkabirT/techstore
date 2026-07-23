import mongoose, { Schema, Model } from 'mongoose';
import { IStoreLocationDocument } from '@/types';

const StoreLocationSchema = new Schema<IStoreLocationDocument>(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
        },
        address: {
            type: String,
            required: [true, 'Address is required'],
            trim: true,
        },
        businessHours: {
            type: String,
            required: [true, 'Business hours are required'],
            trim: true,
        },
        contact: {
            type: String,
            required: [true, 'Contact information is required'],
            trim: true,
        },
        mapLink: {
            type: String,
            trim: true,
        },
        image: {
            type: String,
            required: [true, 'Image is required'],
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

// Prevent model recompilation during development
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.StoreLocation;
}

const StoreLocation: Model<IStoreLocationDocument> = 
    mongoose.models.StoreLocation || mongoose.model<IStoreLocationDocument>('StoreLocation', StoreLocationSchema);

export default StoreLocation;
