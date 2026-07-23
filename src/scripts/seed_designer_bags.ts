import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import dbConnect from '../lib/db';
import Category from '../models/Category';
import SubCategory from '../models/SubCategory';
import ChildCategory from '../models/ChildCategory';
import Product from '../models/Product';
import { slugify } from '../lib/utils'; // if exists, otherwise I will just use custom
import mongoose from 'mongoose';

// Simple slugify
function toSlug(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function seed() {
    await dbConnect();
    console.log('Connected to DB');

    // 1. Fashion Category
    const catName = 'Fashion';
    let category = await Category.findOne({ name: catName });
    if (!category) {
        category = await Category.create({
            name: catName,
            slug: toSlug(catName),
            bannerImage: '/images/placeholder.jpg',
            isActive: true
        });
        console.log('Created Category:', catName);
    }

    // 2. Designer Bags SubCategory
    const subName = 'Designer Bags';
    let subCategory = await SubCategory.findOne({ name: subName });
    if (!subCategory) {
        subCategory = await SubCategory.create({
            name: subName,
            slug: toSlug(subName),
            categoryId: category._id,
            showOnMid: true,
            isActive: true
        });
        console.log('Created SubCategory:', subName);
    } else {
        // ensure showOnMid is true
        subCategory.showOnMid = true;
        await subCategory.save();
    }

    // 3. Child Category: Tote Bags
    const childName = 'Tote Bags';
    let childCategory = await ChildCategory.findOne({ name: childName });
    if (!childCategory) {
        childCategory = await ChildCategory.create({
            name: childName,
            slug: toSlug(childName),
            subCategoryId: subCategory._id,
            isActive: true
        });
        console.log('Created ChildCategory:', childName);
    }

    // 4. Child Category: Shoulder Bags
    const childName2 = 'Shoulder Bags';
    let childCategory2 = await ChildCategory.findOne({ name: childName2 });
    if (!childCategory2) {
        childCategory2 = await ChildCategory.create({
            name: childName2,
            slug: toSlug(childName2),
            subCategoryId: subCategory._id,
            isActive: true
        });
        console.log('Created ChildCategory:', childName2);
    }

    // 5. Create some products for SubCategory directly
    for (let i = 1; i <= 5; i++) {
        const title = `Luxury Designer Bag Edition ${i}`;
        const slug = toSlug(title) + '-' + Date.now().toString().slice(-4);
        
        await Product.create({
            title,
            slug,
            mrp: 5000 + i * 1000,
            price: 4500 + i * 900,
            stock: 10,
            images: ['https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=600&auto=format&fit=crop'],
            category: category._id,
            subCategory: subCategory._id,
            shortDescription: `A premium designer bag for everyday fashion. Edition ${i}.`,
            isActive: true
        });
        console.log('Created SubCategory Product:', title);
    }

    // 6. Create some products for ChildCategory 1 (Tote Bags)
    for (let i = 1; i <= 8; i++) {
        const title = `Elegant Leather Tote ${i}`;
        const slug = toSlug(title) + '-' + Date.now().toString().slice(-4);
        
        await Product.create({
            title,
            slug,
            mrp: 3000 + i * 500,
            price: 2800 + i * 400,
            stock: 15,
            images: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=600&auto=format&fit=crop'],
            category: category._id,
            subCategory: subCategory._id,
            childCategory: childCategory._id,
            shortDescription: `Spacious and elegant leather tote bag perfectly sized for office and weekends.`,
            isActive: true
        });
        console.log('Created ChildCategory Product:', title);
    }

    // 7. Create some products for ChildCategory 2 (Shoulder Bags)
    for (let i = 1; i <= 6; i++) {
        const title = `Classic Shoulder Bag Classic ${i}`;
        const slug = toSlug(title) + '-' + Date.now().toString().slice(-4);
        
        await Product.create({
            title,
            slug,
            mrp: 2000 + i * 500,
            price: 1800 + i * 450,
            stock: 20,
            images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=600&auto=format&fit=crop'],
            category: category._id,
            subCategory: subCategory._id,
            childCategory: childCategory2._id,
            shortDescription: `A stunning and minimalistic shoulder bag for quick outings.`,
            isActive: true
        });
        console.log('Created ChildCategory 2 Product:', title);
    }

    console.log('Finished seeding Designer Bags!');
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
