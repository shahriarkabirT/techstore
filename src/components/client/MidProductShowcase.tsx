import dbConnect from '@/lib/db';
import SubCategory from '@/models/SubCategory';
import { Suspense } from 'react';
import MidProductShowcaseClient from './MidProductShowcaseClient';
import { getShowcaseProducts } from '@/actions/showcase';

export default async function MidProductShowcase() {
    await dbConnect();

    const subCategories = await SubCategory.find({
        showOnMid: true,
        isActive: true,
    })
        .select('_id name slug order')
        .sort({ order: 1, name: 1 })
        .lean();

    if (!subCategories || subCategories.length === 0) return null;

    const sections = subCategories.map((s: any) => ({
        id: s._id.toString(),
        title: s.name,
        slug: s.slug,
    }));

    return (
        <div className="flex flex-col gap-12 py-10 md:py-16">
            {sections.map((section) => (
                <Suspense
                    key={section.id}
                    fallback={<MidShowcaseSkeleton title={`Shop ${section.title}`} />}
                >
                    <MidCategoryShowcase section={section} />
                </Suspense>
            ))}
        </div>
    );
}

async function MidCategoryShowcase({ section }: { section: { id: string; title: string; slug: string } }) {
    // Initial fetch using server logic
    const res = await getShowcaseProducts(section.id, 1, 12);
    
    if (!res.success || !res.products || res.products.length === 0) return null;

    return (
        <section className="w-full bg-white">
            <div className="container mx-auto px-4 xl:px-0">
                <MidProductShowcaseClient
                    title={`Shop ${section.title}`}
                    categorySlug={section.slug}
                    sectionId={section.id}
                    initialProducts={res.products}
                    initialHasMore={res.hasMore}
                />
            </div>
        </section>
    );
}

function MidShowcaseSkeleton({ title }: { title: string }) {
    return (
        <section className="w-full bg-white">
            <div className="container mx-auto px-4 xl:px-0">
                <div className="flex items-end justify-between mb-6 md:mb-8 animate-pulse">
                    <div>
                        <div className="h-8 md:h-10 w-48 md:w-64 bg-gray-100 rounded mb-2"></div>
                        <div className="h-4 w-24 bg-gray-100 rounded"></div>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
                        <div key={i} className="flex flex-col">
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
