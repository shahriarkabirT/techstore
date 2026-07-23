import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

// Read MONGODB_URI from .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const MONGODB_URI = envContent.match(/MONGODB_URI=(.+)/)?.[1]?.trim();

if (!MONGODB_URI) {
    console.error('MONGODB_URI not found in .env.local');
    process.exit(1);
}

const UPLOADS_DIR = path.join(__dirname, '../public/uploads');

console.log('Connecting to MongoDB...');
await mongoose.connect(MONGODB_URI);
console.log('Connected.\n');

const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false, timestamps: true }), 'products');

// Get all products sorted by createdAt ascending (oldest first)
const allProducts = await Product.find({}).sort({ createdAt: 1 }).select('_id title images createdAt').lean();

console.log(`Total products in DB: ${allProducts.length}`);

if (allProducts.length <= 10) {
    console.log('Already 10 or fewer products. Nothing to delete.');
    process.exit(0);
}

// Keep the 10 oldest
const toKeep = allProducts.slice(0, 10);
const toDelete = allProducts.slice(10);

console.log('\n✅ Keeping these 10 oldest products:');
toKeep.forEach((p, i) => console.log(`  ${i + 1}. [${p.createdAt?.toISOString?.() || 'N/A'}] ${p.title}`));

console.log(`\n🗑  Deleting ${toDelete.length} products...`);

// Collect image paths used by products to keep (don't delete those)
const keepImages = new Set(toKeep.flatMap(p => (p.images || [])));

// Delete products from DB
const deleteIds = toDelete.map(p => p._id);
const result = await Product.deleteMany({ _id: { $in: deleteIds } });
console.log(`✅ Deleted ${result.deletedCount} products from DB`);

// Delete numbered images (1.webp to 300.webp) from uploads
let deletedFiles = 0;
for (let i = 1; i <= 300; i++) {
    const filename = `${i}.webp`;
    const filepath = path.join(UPLOADS_DIR, filename);
    const publicUrl = `/uploads/${filename}`;

    // Skip if this image is used by a product we're keeping
    if (keepImages.has(publicUrl)) {
        console.log(`  Skipping ${filename} (used by kept product)`);
        continue;
    }

    if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        deletedFiles++;
    }
}
console.log(`✅ Deleted ${deletedFiles} numbered image files (1.webp–300.webp)\n`);

console.log('Done! Products remaining in DB:', await Product.countDocuments());
await mongoose.disconnect();
