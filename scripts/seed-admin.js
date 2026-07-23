/**
 * Admin Seeding Script
 * Run with: node scripts/seed-admin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;

const AdminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
}, { timestamps: true });

async function seedAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

        const existingAdmin = await Admin.findOne({ email: 'admin@store.com' });

        if (existingAdmin) {
            console.log('Admin already exists:', existingAdmin.email);
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            const admin = await Admin.create({
                email: 'admin@store.com',
                password: hashedPassword,
                role: 'superadmin',
            });

            console.log('Admin created successfully!');
            console.log('Email:', admin.email);
            console.log('Password: admin123');
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
}

seedAdmin();
