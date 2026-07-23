import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILandingPage {
    product: Types.ObjectId;
    slug: string;
    customTitle?: string;
    headerTitle?: string;
    customDescription?: string;
    bannerImage?: string;
    whyChooseUs?: { title: string; description?: string; icon?: string }[];
    customDetails?: string;
    faqs?: { question: string; answer: string }[];
    templateType?: 'standard' | 'combo';
    comboProducts?: Types.ObjectId[];
    offerEndTime?: Date;
    /** When true, all orders from this landing page get free delivery */
    freeShipping?: boolean;
    isActive: boolean;
    views: number;
    orders: number;
    reviewImages?: string[];
    offer?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ILandingPageDocument extends ILandingPage, Document {}

const LandingPageSchema = new Schema<ILandingPageDocument>(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        customTitle: {
            type: String,
            trim: true,
        },
        headerTitle: {
            type: String,
            trim: true,
        },
        customDescription: {
            type: String,
            trim: true,
        },
        bannerImage: {
            type: String,
        },
        whyChooseUs: [
            {
                title: { type: String, required: true },
                description: { type: String },
                icon: { type: String },
            }
        ],
        customDetails: {
            type: String, // Can store HTML / Rich Text
        },
        faqs: [
            {
                question: { type: String, required: true },
                answer: { type: String, required: true },
            }
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
        templateType: {
            type: String,
            enum: ['standard', 'combo'],
            default: 'standard',
        },
        comboProducts: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Product',
            }
        ],
        offerEndTime: {
            type: Date,
        },
        freeShipping: {
            type: Boolean,
            default: false,
        },
        views: {
            type: Number,
            default: 0,
        },
        orders: {
            type: Number,
            default: 0,
        },
        reviewImages: {
            type: [String],
            default: [],
        },
        offer: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

LandingPageSchema.index({ product: 1 });

const LandingPage = (mongoose.models.LandingPage as mongoose.Model<ILandingPageDocument>) ||
    mongoose.model<ILandingPageDocument>('LandingPage', LandingPageSchema);

export default LandingPage;
