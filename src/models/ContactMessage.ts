import mongoose, { Schema, Model } from 'mongoose';
import { IContactMessageDocument } from '@/types';

const ContactMessageSchema = new Schema<IContactMessageDocument>(
    {
        name: {
            type: String,
            required: [true, 'Please provide your name'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Please provide your email'],
            trim: true,
            lowercase: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        subject: {
            type: String,
            required: [true, 'Please provide a subject'],
            trim: true,
        },
        message: {
            type: String,
            required: [true, 'Please provide a message'],
            trim: true,
        },
        status: {
            type: String,
            enum: ['pending', 'read', 'replied'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    }
);

const ContactMessage: Model<IContactMessageDocument> = mongoose.models.ContactMessage || mongoose.model<IContactMessageDocument>('ContactMessage', ContactMessageSchema);

export default ContactMessage;
