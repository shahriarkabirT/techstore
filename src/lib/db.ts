import mongoose, { Mongoose } from 'mongoose';
import '@/types';
import env from '@/lib/env';

const MONGODB_URI = env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
}

interface MongooseCache {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
    global.mongoose = cached;
}

async function dbConnect(): Promise<Mongoose> {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
