import mongoose, { Schema, Model } from 'mongoose';
import { ITestimonialDocument } from '@/types';

const TestimonialSchema = new Schema<ITestimonialDocument>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: 100,
        },
        designation: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        quote: {
            type: String,
            required: [true, 'Quote is required'],
            trim: true,
            maxlength: 500,
        },
        profilePicture: {
            type: String,
            default: '',
            trim: true,
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

// Index for sorting by order
TestimonialSchema.index({ order: 1 });

const Testimonial: Model<ITestimonialDocument> = mongoose.models.Testimonial || mongoose.model<ITestimonialDocument>('Testimonial', TestimonialSchema);

export default Testimonial;
