import dbConnect from '@/lib/db';
import SubCategory from '@/models/SubCategory';
import ChildCategory from '@/models/ChildCategory';
import SubChildCategory from '@/models/SubChildCategory';
import Product from '@/models/Product';
import ProductsSliderClient from './ProductsSliderClient';
import { Suspense } from 'react';

export default async function MidProductSliders() {
    await dbConnect();

    const subCategories = await SubCategory.find({
        showOnMid: true,
        isActive: true,
    })
        .select('_id name slug')
        .lean();

    if (!subCategories || subCategories.length === 0) return null;

    const sections = subCategories.map((s: { _id: { toString: () => string }; name: string; slug: string }) => ({
        id: s._id.toString(),
        title: s.name,
        slug: s.slug,
    }));

    return (
        <div className="flex flex-col gap-12 py-10 md:py-16">
            {sections.map((section) => (
                <Suspense
                    key={section.id}
                    fallback={<MidSliderSkeleton title={`Shop ${section.title}`} />}
                >
                    <MidCategorySlider section={section} />
                </Suspense>
            ))}
        </div>
    );
}

async function MidCategorySlider({ section }: { section: { id: string; title: string; slug: string } }) {
    await dbConnect();

    // Collect all child and sub-child IDs that belong to this subcategory
    const childCategories = await ChildCategory.find({ subCategoryId: section.id }).select('_id').lean();
    const childIds = childCategories.map((c: any) => String(c._id));

    const subChildCategories = childIds.length > 0
        ? await SubChildCategory.find({ childCategoryId: { $in: childIds } }).select('_id').lean()
        : [];
    const subChildIds = subChildCategories.map((s: any) => String(s._id));

    // Query products at any level under this subcategory's full hierarchy
    const orConditions: Record<string, unknown>[] = [{ subCategory: section.id, isActive: true }];
    if (childIds.length > 0) orConditions.push({ childCategory: { $in: childIds }, isActive: true });
    if (subChildIds.length > 0) orConditions.push({ subChildCategory: { $in: subChildIds }, isActive: true });

    const products = await Product.find({ $or: orConditions })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

    if (!products || products.length === 0) return null;

    return (
        <section className="w-full bg-white">
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

function MidSliderSkeleton({ title }: { title: string }) {
    return (
        <section className="w-full bg-white">
            <div className="container mx-auto px-4 xl:px-0">
                <div className="flex items-end justify-between mb-6 md:mb-8 animate-pulse">
                    <div>
                        <div className="h-8 md:h-10 w-48 md:w-64 bg-gray-100 rounded mb-2"></div>
                        <div className="h-4 w-24 bg-gray-100 rounded"></div>
                    </div>
                </div>
                <div className="flex gap-3 sm:gap-4 overflow-hidden">
                    {[1, 2, 3, 4, 5].map(i => (
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

