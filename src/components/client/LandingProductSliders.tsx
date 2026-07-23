import dbConnect from '@/lib/db';
import Category from '@/models/Category';
import SubCategory from '@/models/SubCategory';
import ChildCategory from '@/models/ChildCategory';
import SubChildCategory from '@/models/SubChildCategory';
import Product from '@/models/Product';
import ProductsSliderClient from './ProductsSliderClient';
import { Suspense } from 'react';

export default async function LandingProductSliders() {
    await dbConnect();

    // Fetch ONLY the categories concurrently (fast)
    const [categories, subCategories, childCategories, subChildCategories] = await Promise.all([
        Category.find({ showToLandingPage: true, isActive: true }).select('_id name slug order').sort({ order: 1, name: 1 }).lean(),
        SubCategory.find({ showToLandingPage: true, isActive: true }).select('_id name slug order').sort({ order: 1, name: 1 }).lean(),
        ChildCategory.find({ showToLandingPage: true, isActive: true }).select('_id name slug order').sort({ order: 1, name: 1 }).lean(),
        SubChildCategory.find({ showToLandingPage: true, isActive: true }).select('_id name slug order').sort({ order: 1, name: 1 }).lean()
    ]);

    const activeSections = [
        ...categories.map(c => ({ id: c._id.toString(), title: c.name, slug: c.slug, type: 'category' })),
        ...subCategories.map(c => ({ id: c._id.toString(), title: c.name, slug: c.slug, type: 'subCategory' })),
        ...childCategories.map(c => ({ id: c._id.toString(), title: c.name, slug: c.slug, type: 'childCategory' })),
        ...subChildCategories.map(c => ({ id: c._id.toString(), title: c.name, slug: c.slug, type: 'subChildCategory' }))
    ];

    if (activeSections.length === 0) return null;

    return (
        <div className="flex flex-col gap-12 py-10 md:py-16">
            {activeSections.map((section) => (
                <Suspense 
                    key={section.id} 
                    fallback={<CategorySliderSkeleton title={`Shop ${section.title}`} />}
                >
                    <SingleCategorySlider section={section} />
                </Suspense>
            ))}
        </div>
    );
}

async function SingleCategorySlider({ section }: { section: { id: string, title: string, slug: string, type: string } }) {
    await dbConnect();
    
    // Fetch products JUST for this category section. Each section resolves independently!
    const products = await Product.find({
        [section.type]: section.id,
        isActive: true
    })
    .sort({ createdAt: -1 })
    .limit(12)
    .lean();

    if (!products || products.length === 0) return null;

    return (
        <section className="w-full bg-transparent">
            <div className="container mx-auto px-4 xl:px-0">
                <ProductsSliderClient 
                    title={`Shop ${section.title}`} 
                    categorySlug={section.slug} 
                    products={JSON.parse(JSON.stringify(products))} 
                />
            </div>
        </section>
    );
}

function CategorySliderSkeleton({ title }: { title: string }) {
    return (
        <section className="w-full bg-transparent">
            <div className="container mx-auto px-4 xl:px-0">
                <div className="flex items-end justify-between mb-6 md:mb-8 animate-pulse">
                    <div>
                        <div className="h-8 md:h-10 w-48 md:w-64 bg-gray-100 rounded mb-2"></div>
                        <div className="h-4 w-24 bg-gray-100 rounded"></div>
                    </div>
                </div>
                <div className="flex gap-3 sm:gap-4 overflow-hidden">
                    {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="flex-none w-[calc((100%-12px)/2)] sm:w-[calc((100%-32px)/3)] md:w-[calc((100%-48px)/4)] lg:w-[calc((100%-64px)/5)] 2xl:w-[calc((100%-80px)/6)]">
                            <div className="aspect-square bg-gray-50 rounded-lg w-full mb-3 border border-gray-100 animate-pulse"></div>
                            <div className="h-4 bg-gray-50 rounded w-3/4 mb-2 animate-pulse"></div>
                            <div className="h-4 bg-gray-50 rounded w-1/2 animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
