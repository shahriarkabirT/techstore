import mongoose, { Schema, Model } from 'mongoose';
import { IProductDocument } from '@/types';

const ProductSchema = new Schema<IProductDocument>(
    {
        title: {
            type: String,
            required: [true, 'Product title is required'],
            trim: true,
            maxlength: 200,
        },
        slug: {
            type: String,
            required: [true, 'Slug is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        productType: {
            type: String,
            enum: ['single', 'variant'],
            default: 'single',
        },
        mrp: {
            type: Number,
            required: [true, 'MRP is required'],
            min: 0,
        },
        price: {
            type: Number,
            required: [true, 'Selling price is required'],
            min: 0,
        },
        productCost: {
            type: Number,
            min: 0,
            default: undefined,
        },
        discountType: {
            type: String,
            enum: ['flat', 'percentage'],
            default: 'percentage',
        },
        discountValue: {
            type: Number,
            default: 0,
            min: 0,
        },
        tax: {
            type: Number,
            default: 0,
            min: 0,
        },
        taxType: {
            type: String,
            enum: ['flat', 'percentage'],
            default: 'percentage',
        },
        weight: {
            type: Number,
            default: null,
        },
        stock: {
            type: Number,
            required: [true, 'Total stock is required'],
            min: 0,
            default: 0,
        },
        images: {
            type: [String],
            default: [],
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Category is required'],
        },
        subCategory: {
            type: Schema.Types.ObjectId,
            ref: 'SubCategory',
        },
        childCategory: {
            type: Schema.Types.ObjectId,
            ref: 'ChildCategory',
        },
        subChildCategory: {
            type: Schema.Types.ObjectId,
            ref: 'SubChildCategory',
        },
        brand: {
            type: Schema.Types.ObjectId,
            ref: 'Brand',
        },
        shortDescription: {
            type: String,
            trim: true,
            maxlength: 300,
        },
        fullDescription: {
            type: String,
            trim: true,
        },
        sizeGuide: {
            type: String,
            default: '',
        },
        variants: [
            {
                // Dynamic attribute system: { "size": "M", "color": "Red", "screen-size": "6.5 inch" }
                attributes: {
                    type: Map,
                    of: String,
                    default: {},
                },
                // Quick-access color code for storefront swatch rendering
                colorCode: String,
                // Legacy named fields (kept for backward compatibility with existing products)
                size: String,
                colorName: String,
                material: String,
                ram: String,
                storage: String,
                mrp: { type: Number, default: 0 },
                price: { type: Number, default: 0 },
                discountType: { type: String, enum: ['flat', 'percentage'], default: 'percentage' },
                discountValue: { type: Number, default: 0 },
                tax: { type: Number, default: 0 },
                taxType: { type: String, enum: ['flat', 'percentage'], default: 'percentage' },
                images: { type: [String], default: [] },
                sku: String,
                stock: { type: Number, default: 0 },
                weight: { type: Number, default: null },
                productCost: { type: Number, min: 0, default: undefined },
                inventoryRef: String,
                order: { type: Number, default: 0 },
            },
        ],
        sku: {
            type: String,
            trim: true,
        },
        tags: {
            type: [String],
            default: [],
        },
        compatibleModels: {
            type: [String],
            default: [],
        },
        seoMetadata: {
            metaTitle: String,
            metaDescription: String,
            keywords: [String],
        },
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        reviewCount: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        soldCount: {
            type: Number,
            default: 0,
        },
        freeShipping: {
            type: Boolean,
            default: false,
        },
        preorder: {
            type: Boolean,
            default: false,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual for discounted price calculation
ProductSchema.virtual('discountedPrice').get(function (this: IProductDocument) {
    if (this.discountValue && this.discountValue > 0) {
        if (this.discountType === 'percentage') {
            return this.mrp - (this.mrp * this.discountValue) / 100;
        } else {
            return Math.max(0, this.mrp - this.discountValue);
        }
    }
    return this.mrp;
});

// Indexes
ProductSchema.index({ title: 'text', shortDescription: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ subCategory: 1 });
ProductSchema.index({ childCategory: 1 });
ProductSchema.index({ subChildCategory: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.set('toJSON', { virtuals: true, flattenMaps: true });
ProductSchema.set('toObject', { virtuals: true, flattenMaps: true });

const Product: Model<IProductDocument> = mongoose.models.Product || mongoose.model<IProductDocument>('Product', ProductSchema);

export default Product;
