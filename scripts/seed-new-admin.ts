import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

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

    const email = 'ccloude@gmail.com';
    const password = '123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const existingAdmin = await db?.collection('users').findOne({ email: email.toLowerCase() });

    if (existingAdmin) {
        console.log(`User ${email} already exists. Updating credentials and role...`);
        await db?.collection('users').updateOne(
            { email: email.toLowerCase() },
            { 
                $set: { 
                    password: hashedPassword,
                    role: 'admin',
                    provider: 'local',
                    updatedAt: new Date()
                } 
            }
        );
        console.log('Admin user updated successfully.');
    } else {
        const adminUser = {
            name: 'Cloud Admin',
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'admin',
            provider: 'local',
            isEmailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db?.collection('users').insertOne(adminUser);
        console.log(`Admin user created successfully! ID: ${result?.insertedId}`);
    }

    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

    await mongoose.disconnect();
    process.exit(0);
}

run();
