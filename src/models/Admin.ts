import mongoose, { Schema, Model, CallbackError } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IAdminDocument } from '@/types';

const AdminSchema = new Schema<IAdminDocument>(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 6,
        },
        role: {
            type: String,
            enum: ['admin', 'superadmin'],
            default: 'admin',
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
AdminSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
AdminSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

const Admin: Model<IAdminDocument> = mongoose.models.Admin || mongoose.model<IAdminDocument>('Admin', AdminSchema);

export default Admin;
