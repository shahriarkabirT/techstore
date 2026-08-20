import mongoose, { Schema, Model } from 'mongoose';
import { IOrderDocument, IOrderItem, ICustomerInfo } from '@/types';

const OrderItemSchema = new Schema<IOrderItem>({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    image: {
        type: String,
        default: '',
    },
    variant: {
        type: Schema.Types.Mixed,
        default: {},
    },
    tax: {
        type: Number,
        default: 0,
    },
    taxType: {
        type: String,
        enum: ['flat', 'percentage'],
        default: 'percentage',
    },
    isPreorder: {
        type: Boolean,
        default: false,
    },
    unitProductCost: {
        type: Number,
        min: 0,
        default: undefined,
    },
});

const CustomerInfoSchema = new Schema<ICustomerInfo>({
    name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
    },
    city: {
        type: String,
        trim: true,
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 500,
    },
    deliveryLocation: {
        type: String,
        enum: ['inside', 'outside'],
        default: 'inside'
    }
});

const OrderSchema = new Schema<IOrderDocument>(
    {
        orderId: {
            type: String,
            required: true,
            unique: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        customerInfo: {
            type: CustomerInfoSchema,
            required: true,
        },
        products: {
            type: [OrderItemSchema],
            required: true,
            validate: {
                validator: function (v: IOrderItem[]) {
                    return v && v.length > 0;
                },
                message: 'Order must have at least one product',
            },
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },
        shippingCost: {
            type: Number,
            default: 0,
            min: 0,
        },
        taxAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        discountAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        couponCode: {
            type: String,
            trim: true,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        paymentMethod: {
            type: String,
            enum: ['COD', 'AamarPay', 'Cash', 'Card', 'Digital'],
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ['Pending', 'Paid', 'Failed', 'Refunded', 'Delivery Charge Paid'],
            default: 'Pending',
        },
        orderStatus: {
            type: String,
            enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Partially Delivered', 'Cancelled', 'Returned', 'Blocked'],
            default: 'Pending',
        },
        transactionId: {
            type: String,
            default: '',
        },
        paymentDetails: {
            type: Schema.Types.Mixed,
            default: {},
        },
        refundDetails: {
            reason: { type: String, trim: true },
            restocked: { type: Boolean, default: false },
            refundedAt: { type: Date },
        },
        isArchived: {
            type: Boolean,
            default: false,
        },
        source: {
            type: String,
            enum: ['online', 'pos', 'landing'],
            default: 'online',
        },
        cashierInfo: {
            name: { type: String },
            id: { type: String },
        },
        changeAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        amountTendered: {
            type: Number,
            default: 0,
            min: 0,
        },
        ipAddress: {
            type: String,
            default: '',
        },
        isPreorder: {
            type: Boolean,
            default: false,
        },
        advancePaid: {
            type: Number,
            default: 0,
            min: 0,
        },
        advancePaymentMethod: {
            type: String,
            trim: true,
        },
        advancePaymentRef: {
            type: String,
            trim: true,
        },
        adminNote: {
            type: String,
            trim: true,
            maxlength: 2000,
        },
        affiliateId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        affiliateCommission: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'customerInfo.phone': 1 });
OrderSchema.index({ source: 1 });

const Order: Model<IOrderDocument> = mongoose.models.Order || mongoose.model<IOrderDocument>('Order', OrderSchema);

export default Order;
