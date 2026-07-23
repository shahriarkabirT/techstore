import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage {
    sender: 'user' | 'admin' | 'system';
    text: string;
    timestamp: Date;
    read: boolean;
}

export interface IChatSession extends Document {
    socketId?: string;
    user: {
        name: string;
        phone: string;
        email?: string;
    };
    status: 'active' | 'closed';
    messages: IMessage[];
    adminRead: boolean;
    userRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
    sender: { type: String, enum: ['user', 'admin', 'system'], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
});

const ChatSessionSchema = new Schema<IChatSession>({
    socketId: { type: String }, // Current socket ID of the user
    user: {
        name: { type: String, required: true },
        phone: { type: String, required: true, index: true }, // Verified by phone
        email: { type: String }
    },
    status: { type: String, enum: ['active', 'closed'], default: 'active' },
    messages: [MessageSchema],
    adminRead: { type: Boolean, default: false },
    userRead: { type: Boolean, default: true },
}, { timestamps: true });

// Optimize queries by phone number
ChatSessionSchema.index({ status: 1 });

const ChatSession: Model<IChatSession> = mongoose.models.ChatSession || mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);

export default ChatSession;
