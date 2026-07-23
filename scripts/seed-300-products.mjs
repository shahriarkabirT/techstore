import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse .env.local manually
const envFile = readFileSync(resolve(__dirname, '../.env.local'), 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
        envVars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
    }
});

const MONGODB_URI = envVars.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('MONGODB_URI not found in .env.local');
    process.exit(1);
}

// ─── Schemas (inline for standalone script) ───────────────────────────
const CategorySchema = new mongoose.Schema({
    name: String, slug: String, description: String,
    bannerImage: String, isActive: { type: Boolean, default: true },
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    productType: { type: String, enum: ['single', 'variant'], default: 'single' },
    mrp: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    discountType: { type: String, enum: ['flat', 'percentage'], default: 'percentage' },
    discountValue: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    taxType: { type: String, enum: ['flat', 'percentage'], default: 'percentage' },
    stock: { type: Number, default: 0 },
    images: { type: [String], default: [] },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    shortDescription: { type: String, trim: true },
    fullDescription: { type: String, trim: true },
    variants: [],
    sku: String,
    tags: { type: [String], default: [] },
    seoMetadata: { metaTitle: String, metaDescription: String, keywords: [String] },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// ─── Product Name Pools ───────────────────────────────────────────────
const adjectives = [
    'Premium', 'Classic', 'Modern', 'Elegant', 'Royal', 'Luxury', 'Vintage',
    'Urban', 'Artisan', 'Elite', 'Signature', 'Heritage', 'Bold', 'Sleek',
    'Refined', 'Grand', 'Supreme', 'Prime', 'Noble', 'Opulent', 'Exquisite',
    'Majestic', 'Splendid', 'Pristine', 'Radiant', 'Timeless', 'Handcrafted',
    'Bespoke', 'Curated', 'Minimal', 'Serene', 'Chic', 'Dapper', 'Iconic',
    'Stellar', 'Vivid', 'Lavish', 'Polished', 'Deluxe', 'Imperial',
];

const nouns = [
    'Collection', 'Edition', 'Series', 'Line', 'Set', 'Ensemble', 'Range',
    'Selection', 'Assortment', 'Bundle', 'Choice', 'Piece', 'Item', 'Design',
    'Creation', 'Masterpiece', 'Work', 'Model', 'Style', 'Look',
];

const materials = [
    'Leather', 'Cotton', 'Silk', 'Linen', 'Wool', 'Cashmere', 'Denim',
    'Canvas', 'Suede', 'Velvet', 'Satin', 'Tweed', 'Organic', 'Bamboo',
];

const colorWords = [
    'Midnight', 'Ivory', 'Charcoal', 'Coral', 'Sage', 'Crimson', 'Azure',
    'Pearl', 'Onyx', 'Amber', 'Blush', 'Slate', 'Teal', 'Rust', 'Olive',
];

const descriptions = [
    'Crafted with meticulous attention to detail for the discerning individual.',
    'A perfect blend of form and function, designed for everyday elegance.',
    'Elevate your style with this thoughtfully designed essential.',
    'Where quality meets contemporary design — built to last.',
    'An iconic piece that transcends trends and stands the test of time.',
    'Designed for those who appreciate the finer things in life.',
    'Uncompromising quality meets modern sophistication.',
    'A statement piece that defines understated luxury.',
    'Handpicked materials ensure exceptional comfort and durability.',
    'The perfect addition to your curated lifestyle collection.',
];

const tagPool = [
    'trending', 'bestseller', 'new-arrival', 'limited-edition', 'eco-friendly',
    'handmade', 'premium', 'gift-idea', 'seasonal', 'must-have',
];

function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ─── Main ─────────────────────────────────────────────────────────────
async function main() {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!\n');

    // Fetch existing categories
    const categories = await Category.find({ isActive: true }).lean();
    if (categories.length === 0) {
        console.error('❌ No active categories found. Please create categories first.');
        process.exit(1);
    }
    console.log(`📂 Found ${categories.length} categories: ${categories.map(c => c.name).join(', ')}\n`);

    const products = [];
    const usedSlugs = new Set();

    // Also fetch existing slugs so we don't collide
    const existingSlugs = await Product.find({}, { slug: 1 }).lean();
    existingSlugs.forEach(p => usedSlugs.add(p.slug));

    for (let i = 1; i <= 300; i++) {
        const adj = randomItem(adjectives);
        const color = randomItem(colorWords);
        const material = randomItem(materials);
        const noun = randomItem(nouns);
        const category = categories[i % categories.length];

        const title = `${adj} ${color} ${material} ${noun}`;
        let slug = slugify(title);

        // Ensure unique slug
        let attempt = 0;
        while (usedSlugs.has(slug)) {
            attempt++;
            slug = slugify(`${title}-${attempt}`);
        }
        usedSlugs.add(slug);

        const mrp = randomInt(500, 15000);
        const discountPct = randomInt(0, 35);
        const price = Math.round(mrp * (1 - discountPct / 100));

        products.push({
            title,
            slug,
            productType: 'single',
            mrp,
            price,
            discountType: 'percentage',
            discountValue: discountPct,
            stock: randomInt(5, 200),
            images: [`/uploads/${i}.webp`],
            category: category._id,
            shortDescription: randomItem(descriptions),
            tags: [...new Set([randomItem(tagPool), randomItem(tagPool)])],
            sku: `SKU-${String(i).padStart(4, '0')}`,
            isActive: true,
        });
    }

    console.log(`📦 Inserting ${products.length} products...`);
    const result = await Product.insertMany(products, { ordered: false });
    console.log(`✅ Successfully inserted ${result.length} products!\n`);

    // Quick summary
    const summary = {};
    for (const p of products) {
        const catName = categories.find(c => c._id.toString() === p.category.toString())?.name || 'Unknown';
        summary[catName] = (summary[catName] || 0) + 1;
    }
    console.log('📊 Products per category:');
    Object.entries(summary).forEach(([name, count]) => console.log(`   ${name}: ${count}`));

    await mongoose.disconnect();
    console.log('\n🔒 Disconnected. Done!');
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
