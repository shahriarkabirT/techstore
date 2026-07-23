import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

let MONGO_URI = '';
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envFile = fs.readFileSync(envPath, 'utf8');
    const match = envFile.match(/MONGODB_URI=(.*)/);
    if (match) MONGO_URI = match[1].trim();
} catch (e) {}

if (!MONGO_URI) {
    console.error('MONGODB_URI is missing');
    process.exit(1);
}

async function run() {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    console.log('Connected to MongoDB');

    // Clear existing banners
    await db.collection('banners').deleteMany({});
    console.log('Cleared existing banners');

    const banners = [
        {
            title: 'Summer Collection 2026',
            subtitle: 'New Arrivals — Up to 40% Off',
            image: '/uploads/f6cb0b1d-0390-4749-a035-b4c81a4d3810.jpg',
            link: '/products',
            isActive: true,
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Shop Smart, Look Great',
            subtitle: 'Exclusive Online Deals',
            image: '/uploads/f6cb0b1d-0390-4749-a035-b4c81a4d3810.jpg',
            link: '/products',
            isActive: true,
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Premium Quality Fashion',
            subtitle: 'Free Shipping on Orders Over ৳2,000',
            image: '/uploads/f6cb0b1d-0390-4749-a035-b4c81a4d3810.jpg',
            link: '/products',
            isActive: true,
            order: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];

    const result = await db.collection('banners').insertMany(banners);
    console.log(`Seeded ${result.insertedCount} banners successfully!`);

    await mongoose.disconnect();
    process.exit(0);
}

run();
