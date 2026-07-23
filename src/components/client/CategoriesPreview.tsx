import dbConnect from '@/lib/db';
import Category from '@/models/Category';
import { ICategory } from '@/types';
import Link from 'next/link';
import CategoriesSliderClient from './CategoriesSliderClient';

async function getCategories(): Promise<ICategory[]> {
    await dbConnect();
    const categories = await Category.find({ isActive: true })
        .sort({ order: 1, name: 1 })
        // Removed limit(4) so the carousel can loop through all active categories
        .lean();
    return JSON.parse(JSON.stringify(categories));
}

export default async function CategoriesPreview() {
    const categories = await getCategories();

    if (categories.length === 0) return null;

    return (
        <section className="py-6 md:py-10 bg-transparent">
            <div className="container mx-auto px-4 xl:px-0">
                <CategoriesSliderClient categories={categories} />
            </div>
        </section>
    );
}
