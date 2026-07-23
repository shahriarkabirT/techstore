import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IBlogDocument extends Document {
    title: string;
    slug: string;
    thumbnail: string;
    content: string;
    isActive: boolean;
    seoMetadata?: {
        title?: string;
        description?: string;
        keywords?: string;
    };
    author?: string;
    createdAt: Date;
    updatedAt: Date;
}

const BlogSchema = new Schema<IBlogDocument>(
    {
        title: {
            type: String,
            required: [true, 'Blog title is required'],
            trim: true,
            maxlength: 200,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        thumbnail: {
            type: String,
            required: [true, 'Blog thumbnail is required'],
        },
        content: {
            type: String,
            required: [true, 'Blog content is required'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        seoMetadata: {
            title: { type: String, trim: true, maxlength: 100 },
            description: { type: String, trim: true, maxlength: 300 },
            keywords: { type: String, trim: true },
        },
        author: {
            type: String,
            default: 'Admin',
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

BlogSchema.index({ isActive: 1 });

const Blog: Model<IBlogDocument> =
    mongoose.models.Blog || mongoose.model<IBlogDocument>('Blog', BlogSchema);

export default Blog;
