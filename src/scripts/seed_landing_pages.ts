import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';
import dbConnect from '../lib/db';
import Product from '../models/Product';
import LandingPage from '../models/LandingPage';

// Simple slugify
function toSlug(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function seedLandingPages() {
    await dbConnect();
    console.log('Connected to DB');

    const products = await Product.find({ isActive: true }).limit(5);

    if (products.length === 0) {
        console.log('No active products found in the database. Please seed products first.');
        process.exit(1);
    }

    console.log(`Found ${products.length} products to create landing pages for.`);

    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        
        // Generate a random slug just in case
        const baseSlug = toSlug(product.title) + '-bd-offer-' + Math.floor(Math.random() * 1000);

        // Check if landing page for this product already exists
        const existingLandingPage = await LandingPage.findOne({ product: product._id });
        if (existingLandingPage) {
            console.log(`Landing page already exists for product: ${product.title}`);
            continue;
        }

        const landingPageData = {
            product: product._id,
            slug: baseSlug,
            customTitle: `Exclusive Offer on ${product.title} in Bangladesh!`,
            customDescription: `Get the best price for ${product.title} in Bangladesh. 100% Authentic, Cash on Delivery available across BD.`,
            bannerImage: product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=800&auto=format&fit=crop',
            whyChooseUs: [
                {
                    title: 'Cash on Delivery',
                    description: 'We offer hassle-free cash on delivery anywhere in Bangladesh.',
                    icon: '🚚'
                },
                {
                    title: '100% Authentic Products',
                    description: 'All our products are guaranteed genuine and sourced from official distributors.',
                    icon: '✅'
                },
                {
                    title: 'Fast Shipping',
                    description: 'Next day delivery inside Dhaka, and 2-3 days outside Dhaka.',
                    icon: '⚡'
                }
            ],
            customDetails: `<p>Don't miss out on this incredible opportunity to own the <strong>${product.title}</strong> at a discounted price. Whether you reside in Dhaka, Chittagong, Sylhet, or anywhere else in Bangladesh, we deliver directly to your doorstep.</p>`,
            faqs: [
                {
                    question: 'Do you deliver outside Dhaka?',
                    answer: 'Yes, we provide home delivery via Steadfast Courier and other reliable services all over Bangladesh.'
                },
                {
                    question: 'Can I check the product before paying?',
                    answer: 'Yes, you can inspect the product in front of the delivery agent before making the payment.'
                },
                {
                    question: 'What is the return policy?',
                    answer: 'We have a 3-day easy return policy if you receive a damaged or incorrect item.'
                }
            ],
            isActive: true,
            views: 0,
            orders: 0
        };

        await LandingPage.create(landingPageData);
        console.log(`Created Landing Page for product: ${product.title}`);
    }

    console.log('Finished seeding landing pages for Bangladesh context!');
    process.exit(0);
}

seedLandingPages().catch(err => {
    console.error(err);
    process.exit(1);
});
