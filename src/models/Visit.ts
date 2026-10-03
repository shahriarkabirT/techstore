import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IVisit extends Document {
    ip: string;
    userAgent: string;
    path: string;
    country: string;
    city: string;
    deviceType: string;
    browser: string;
    os: string;
    sessionId: string;
    visitedAt: Date;
}

const VisitSchema = new Schema<IVisit>({
    ip: { type: String, required: true, index: true },
    userAgent: { type: String, required: true },
    path: { type: String, required: true },
    country: { type: String, default: 'Unknown' },
    city: { type: String, default: 'Unknown' },
    deviceType: { type: String, default: 'desktop' },
    browser: { type: String, default: 'Unknown' },
    os: { type: String, default: 'Unknown' },
    sessionId: { type: String, required: true, index: true },
    visitedAt: { type: Date, default: Date.now, index: true }
}, {
    timestamps: true
});

const Visit: Model<IVisit> = mongoose.models.Visit || mongoose.model<IVisit>('Visit', VisitSchema);
export default Visit;
