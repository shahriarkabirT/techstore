import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/techstore";
mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  const policy = await db.collection('policies').findOne({ slug: 'terms-of-service' });
  if (policy) {
    console.log(policy.content.substring(0, 1500)); // Print first 1500 chars to see full style
  }
  process.exit(0);
});
