import mongoose, { Schema, Model } from 'mongoose';
import { ISettingsDocument } from '@/types';

const SettingsSchema = new Schema<ISettingsDocument>(
    {
        emailOtpEnabled: {
            type: Boolean,
            default: true,
        },
        smsOtpEnabled: {
            type: Boolean,
            default: false,
        },
        smsApiKey: {
            type: String,
            trim: true,
        },
        smsSenderId: {
            type: String,
            trim: true,
        },
        logoUrl: {
            type: String,
            trim: true,
        },
        logoWidth: {
            type: Number,
            default: 150,
        },
        logoHeight: {
            type: Number,
            default: 50,
        },
        faviconUrl: {
            type: String,
            trim: true,
        },
        smtpHost: {
            type: String,
            trim: true,
        },
        smtpPort: {
            type: Number,
        },
        smtpUser: {
            type: String,
            trim: true,
        },
        smtpPass: {
            type: String,
        },
        smtpFrom: {
            type: String,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        contactPhone: {
            type: String,
            trim: true,
        },
        contactEmail: {
            type: String,
            trim: true,
        },
        whatsapp: {
            type: String,
            trim: true,
        },
        facebook: {
            type: String,
            trim: true,
        },
        instagram: {
            type: String,
            trim: true,
        },
        youtube: {
            type: String,
            trim: true,
        },
        tiktok: {
            type: String,
            trim: true,
        },
        facebookPixelId: {
            type: String,
            trim: true,
        },
        googleTagManagerId: {
            type: String,
            trim: true,
        },
        tiktokPixelId: {
            type: String,
            trim: true,
        },
        googleClientId: {
            type: String,
            trim: true,
        },
        googleClientSecret: {
            type: String,
            trim: true,
        },
        telegramBotToken: {
            type: String,
            trim: true,
        },
        telegramChatId: {
            type: String,
            trim: true,
        },
        fraudBdApiKey: {
            type: String,
            trim: true,
        },
        brandName: {
            type: String,
            trim: true,
        },
        shippingChargeInsideDhaka: {
            type: Number,
            default: 60,
        },
        shippingChargeOutsideDhaka: {
            type: Number,
            default: 120,
        },
    },
    {
        timestamps: true,
    }
);

if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Settings;
}
const Settings: Model<ISettingsDocument> = mongoose.models.Settings || mongoose.model<ISettingsDocument>('Settings', SettingsSchema);

export default Settings;
