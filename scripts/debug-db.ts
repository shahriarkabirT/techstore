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

async function run() {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    
    // Direct collection query to bypass any model issues
    const count = await db.collection('products').countDocuments();
    console.log(`products collection count: ${count}`);
    
    const sample = await db.collection('products').find().limit(2).toArray();
    sample.forEach((p: any) => {
        console.log(`- ${p.title} | isActive: ${p.isActive} | images: ${JSON.stringify(p.images?.slice(0,1))}`);
    });
    
    process.exit(0);
}

run();
