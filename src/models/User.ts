import mongoose, { Schema, Model } from 'mongoose';
import { IUserDocument } from '@/types';

const UserSchema = new Schema<IUserDocument>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: function (this: any) {
                return this.provider === 'local';
            },
        },
        image: {
            type: String,
            default: '',
        },
        role: {
            type: String,
            enum: ['user', 'admin', 'moderator'],
            default: 'user',
        },
        permissions: {
            type: [String],
            default: [],
        },
        phone: {
            type: String,
            required: false,
            unique: true,
            sparse: true,
        },
        address: {
            type: String,
            required: false, // Deprecated in favor of addressBook
        },
        bio: {
            type: String,
            maxlength: [500, 'Bio cannot be more than 500 characters'],
            default: '',
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other', ''],
            default: '',
        },
        dateOfBirth: {
            type: Date,
        },
        provider: {
            type: String,
            enum: ['local', 'google', 'facebook'],
            default: 'local',
        },
        emailVerified: {
            type: Date,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        phoneVerified: {
            type: Date,
        },
        isPhoneVerified: {
            type: Boolean,
            default: false,
        },
        otp: {
            type: String,
        },
        otpExpires: {
            type: Date,
        },
        resetPasswordOTP: {
            type: String,
        },
        resetPasswordExpires: {
            type: Date,
        },
        lastOtpMethod: {
            type: String,
            enum: ['email', 'sms'],
            default: 'email',
        },
        dailyOtpSmsCount: {
            type: Number,
            default: 0,
        },
        lastSmsOtpDate: {
            type: Date,
        },
        addressBook: [
            {
                name: String,
                phone: String,
                address: String,
                city: String,
                isDefault: { type: Boolean, default: false },
            },
        ],
        wishlist: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Product',
            },
        ],
        cart: [
            {
                productId: { type: Schema.Types.ObjectId, ref: 'Product' },
                title: { type: String, required: true },
                price: { type: Number, required: true },
                originalPrice: { type: Number },
                discount: { type: Number, default: 0 },
                image: { type: String },
                quantity: { type: Number, default: 1 },
                stock: { type: Number, default: 0 },
                variant: {
                    type: Map,
                    of: String,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

const User: Model<IUserDocument> = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

export default User;
