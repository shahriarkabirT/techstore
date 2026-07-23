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

    // 1. Create categories and subcategories
    await db.collection('categories').deleteMany({});
    await db.collection('subcategories').deleteMany({});

    const categoriesData = [
        { name: 'Luxury Collection', slug: 'luxury-collection', bannerImage: '/images/generated/premium_bag.png', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { name: 'Electronics', slug: 'electronics', bannerImage: '/images/generated/electronics.png', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { name: 'Clothing & Apparel', slug: 'clothing', bannerImage: '/images/generated/clothing.png', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { name: 'Home & Living', slug: 'home-living', bannerImage: '/images/generated/home_living.png', isActive: true, createdAt: new Date(), updatedAt: new Date() }
    ];

    const categoriesResult = await db.collection('categories').insertMany(categoriesData);
    const categoryIds = Object.values(categoriesResult.insertedIds);

    const subCategoriesData = [
        // Luxury Collection Subcategories
        { name: 'Watches', slug: 'luxury-watches', categoryId: categoryIds[0], isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { name: 'Designer Bags', slug: 'designer-bags', categoryId: categoryIds[0], isActive: true, createdAt: new Date(), updatedAt: new Date() },
        // Electronics
        { name: 'Smartphones', slug: 'smartphones', categoryId: categoryIds[1], isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { name: 'Audio & Headphones', slug: 'audio', categoryId: categoryIds[1], isActive: true, createdAt: new Date(), updatedAt: new Date() },
        // Clothing
        { name: 'Men Fashion', slug: 'men-fashion', categoryId: categoryIds[2], isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { name: 'Women Fashion', slug: 'women-fashion', categoryId: categoryIds[2], isActive: true, createdAt: new Date(), updatedAt: new Date() },
        // Home & Living
        { name: 'Decor', slug: 'decor', categoryId: categoryIds[3], isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { name: 'Lighting', slug: 'lighting', categoryId: categoryIds[3], isActive: true, createdAt: new Date(), updatedAt: new Date() }
    ];

    await db.collection('subcategories').insertMany(subCategoriesData);
    console.log(`Created ${categoryIds.length} categories and ${subCategoriesData.length} subcategories`);

    const categoryId = categoryIds[0]; // Reference for initial seeded products

    // 2. Clear existing products before seeding
    await db.collection('products').deleteMany({});
    
    // Seed 8 products with generated images
    const products = [
        {
            title: 'Classic Heritage Timepiece',
            slug: 'classic-heritage-timepiece',
            productType: 'single',
            mrp: 12500,
            price: 9999,
            discountType: 'flat',
            discountValue: 2501,
            tax: 0,
            taxType: 'percentage',
            stock: 15,
            images: ['/images/generated/luxury_watch.png'],
            category: categoryId,
            shortDescription: 'A refined wristwatch blending Swiss craftsmanship with timeless design. Brown leather strap, sapphire crystal face.',
            tags: ['watch', 'luxury', 'classic'],
            averageRating: 4.8,
            reviewCount: 24,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: 'Artisan Leather Satchel',
            slug: 'artisan-leather-satchel',
            productType: 'single',
            mrp: 8500,
            price: 6999,
            discountType: 'flat',
            discountValue: 1501,
            tax: 0,
            taxType: 'percentage',
            stock: 22,
            images: ['/images/generated/premium_bag.png'],
            category: categoryId,
            shortDescription: 'Hand-stitched Italian leather bag with gold-tone hardware. Spacious interior with multiple compartments.',
            tags: ['bag', 'leather', 'fashion'],
            averageRating: 4.6,
            reviewCount: 18,
            isActive: true,
            createdAt: new Date(Date.now() - 1000),
            updatedAt: new Date(),
        },
        {
            title: 'Eau de Lumière Parfum',
            slug: 'eau-de-lumiere-parfum',
            productType: 'single',
            mrp: 4500,
            price: 3799,
            discountType: 'percentage',
            discountValue: 15,
            tax: 0,
            taxType: 'percentage',
            stock: 40,
            images: ['/images/generated/elegant_perfume.png'],
            category: categoryId,
            shortDescription: 'A captivating fragrance with notes of jasmine, amber, and sandalwood. 100ml bottle with gold-finished cap.',
            tags: ['perfume', 'fragrance', 'beauty'],
            averageRating: 4.9,
            reviewCount: 31,
            isActive: true,
            createdAt: new Date(Date.now() - 2000),
            updatedAt: new Date(),
        },
        {
            title: 'Noir Stiletto Pumps',
            slug: 'noir-stiletto-pumps',
            productType: 'single',
            mrp: 6200,
            price: 4999,
            discountType: 'flat',
            discountValue: 1201,
            tax: 0,
            taxType: 'percentage',
            stock: 12,
            images: ['/images/generated/designer_shoe.png'],
            category: categoryId,
            shortDescription: 'Sculpted 4-inch stiletto in premium Italian calfskin. Red leather sole, pointed toe silhouette.',
            tags: ['shoes', 'heels', 'designer'],
            averageRating: 4.7,
            reviewCount: 15,
            isActive: true,
            createdAt: new Date(Date.now() - 3000),
            updatedAt: new Date(),
        },
        {
            title: 'Executive Chronograph',
            slug: 'executive-chronograph',
            productType: 'single',
            mrp: 18000,
            price: 14500,
            discountType: 'percentage',
            discountValue: 20,
            tax: 0,
            taxType: 'percentage',
            stock: 8,
            images: ['/images/generated/luxury_watch.png'],
            category: categoryId,
            shortDescription: 'Premium multi-dial chronograph with stainless steel case. Water-resistant to 100m, automatic movement.',
            tags: ['watch', 'chronograph', 'premium'],
            averageRating: 4.5,
            reviewCount: 9,
            isActive: true,
            createdAt: new Date(Date.now() - 4000),
            updatedAt: new Date(),
        },
        {
            title: 'Milano Tote Collection',
            slug: 'milano-tote-collection',
            productType: 'single',
            mrp: 7200,
            price: 5999,
            discountType: 'flat',
            discountValue: 1201,
            tax: 0,
            taxType: 'percentage',
            stock: 18,
            images: ['/images/generated/premium_bag.png'],
            category: categoryId,
            shortDescription: 'Structured tote in vegetable-tanned leather. Magnetic snap closure, interior zip pocket, detachable strap.',
            tags: ['bag', 'tote', 'leather'],
            averageRating: 4.4,
            reviewCount: 22,
            isActive: true,
            createdAt: new Date(Date.now() - 5000),
            updatedAt: new Date(),
        },
        {
            title: 'Midnight Rose Elixir',
            slug: 'midnight-rose-elixir',
            productType: 'single',
            mrp: 5800,
            price: 4699,
            discountType: 'percentage',
            discountValue: 18,
            tax: 0,
            taxType: 'percentage',
            stock: 35,
            images: ['/images/generated/elegant_perfume.png'],
            category: categoryId,
            shortDescription: 'An intoxicating blend of Bulgarian rose, dark berries, and oud. Long-lasting 12hr formula, 75ml presentation.',
            tags: ['perfume', 'rose', 'luxury'],
            averageRating: 4.8,
            reviewCount: 27,
            isActive: true,
            createdAt: new Date(Date.now() - 6000),
            updatedAt: new Date(),
        },
        {
            title: 'Velvet Court Heels',
            slug: 'velvet-court-heels',
            productType: 'single',
            mrp: 5500,
            price: 4299,
            discountType: 'flat',
            discountValue: 1201,
            tax: 0,
            taxType: 'percentage',
            stock: 10,
            images: ['/images/generated/designer_shoe.png'],
            category: categoryId,
            shortDescription: 'Luxurious velvet court shoes with block heel. Cushioned insole, leather lining, 3-inch architectural heel.',
            tags: ['shoes', 'velvet', 'court'],
            averageRating: 4.6,
            reviewCount: 13,
            isActive: true,
            createdAt: new Date(Date.now() - 7000),
            updatedAt: new Date(),
        },
    ];

    const result = await db.collection('products').insertMany(products);
    console.log(`Seeded ${result.insertedCount} products successfully!`);

    await mongoose.disconnect();
    process.exit(0);
}

run();
