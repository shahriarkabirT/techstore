import mongoose, { Schema, Model } from 'mongoose';
import { IMetaAdsConfigDocument } from '@/types';

const MetaAdsConfigSchema = new Schema<IMetaAdsConfigDocument>(
    {
        accessToken: {
            type: String,
            trim: true,
            default: '',
        },
        adAccountId: {
            type: String,
            trim: true,
            default: '',
        },
        isEnabled: {
            type: Boolean,
            default: false,
        },
        lastSyncedAt: {
            type: Date,
            default: null,
        },
        cachedInsights: {
            type: Schema.Types.Mixed,
            default: null,
        },
        cachedCampaigns: {
            type: Schema.Types.Mixed,
            default: null,
        },
        cacheKey: {
            type: String,
            default: '',
        },
        cacheExpiry: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.MetaAdsConfig;
}

const MetaAdsConfig: Model<IMetaAdsConfigDocument> =
    mongoose.models.MetaAdsConfig ||
    mongoose.model<IMetaAdsConfigDocument>('MetaAdsConfig', MetaAdsConfigSchema);

export default MetaAdsConfig;
