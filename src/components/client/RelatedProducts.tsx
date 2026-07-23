import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import mongoose from 'mongoose';
import ProductCard from './ProductCard';

interface RelatedProductsProps {
    currentProductId: string;
    categoryId: string;
    categoryName: string;
    subCategoryId?: string;
    childCategoryId?: string;
    subChildCategoryId?: string;
}

export default async function RelatedProducts({
    currentProductId,
    categoryId,
    categoryName,
    subCategoryId,
    childCategoryId,
    subChildCategoryId,
}: RelatedProductsProps) {
    if (!categoryId) return null;

    await dbConnect();

    const limit = 5;
    const direction = 'top-down';
    
    // Build tiers
    const tiers: { filter: Record<string, unknown>; label: string }[] = [];
    const broadFilter: Record<string, unknown> = { category: categoryId };
    if (subCategoryId) broadFilter.subCategory = { $ne: subCategoryId };
    tiers.push({ filter: broadFilter, label: 'category' });

    if (subCategoryId) {
        tiers.push({ filter: { subCategory: subCategoryId, ...(childCategoryId ? { childCategory: { $ne: childCategoryId } } : {}) }, label: 'subCategory' });
    }
    if (childCategoryId) {
        tiers.push({ filter: { childCategory: childCategoryId, ...(subChildCategoryId ? { subChildCategory: { $ne: subChildCategoryId } } : {}) }, label: 'childCategory' });
    }
    if (subChildCategoryId) {
        tiers.push({ filter: { subChildCategory: subChildCategoryId }, label: 'subChildCategory' });
    }

    const excludeFilter: Record<string, unknown> = { isActive: true };
    if (currentProductId) excludeFilter._id = { $ne: new mongoose.Types.ObjectId(currentProductId) };

    const orConditions = tiers.map((tier, idx) => ({ match: tier.filter, priority: idx }));

    const pipeline: any[] = [
        {
            $match: {
                ...excludeFilter,
                category: new mongoose.Types.ObjectId(categoryId),
            }
        },
        {
            $addFields: {
                _tierPriority: {
                    $switch: {
                        branches: orConditions.map((cond, idx) => {
                            const condExpr: any[] = [];
                            for (const [key, value] of Object.entries(cond.match)) {
                                if (value && typeof value === 'object' && '$ne' in (value as any)) {
                                    condExpr.push({ $ne: [`$${key}`, new mongoose.Types.ObjectId((value as any).$ne as string)] });
                                } else {
                                    condExpr.push({ $eq: [`$${key}`, new mongoose.Types.ObjectId(value as string)] });
                                }
                            }
                            return {
                                case: condExpr.length === 1 ? condExpr[0] : { $and: condExpr },
                                then: idx,
                            };
                        }),
                        default: 999,
                    }
                }
            }
        },
        { $sort: { _tierPriority: 1, createdAt: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: '_categoryDoc',
                pipeline: [{ $project: { name: 1, slug: 1 } }]
            }
        },
        {
            $lookup: {
                from: 'brands',
                localField: 'brand',
                foreignField: '_id',
                as: '_brandDoc',
                pipeline: [{ $project: { name: 1, slug: 1, logo: 1 } }]
            }
        },
        {
            $addFields: {
                category: { $arrayElemAt: ['$_categoryDoc', 0] },
                brand: { $arrayElemAt: ['$_brandDoc', 0] },
            }
        },
        { $project: { _categoryDoc: 0, _brandDoc: 0, _tierPriority: 0 } }
    ];

    const relatedProducts = await Product.aggregate(pipeline);

    if (relatedProducts.length === 0) return null;

    // Convert ObjectIds to strings to pass to Client Components if needed
    const serializedProducts = JSON.parse(JSON.stringify(relatedProducts));

    return (
        <section className="mt-16 pt-12 border-t border-gray-100 space-y-8 container mx-auto w-full px-2 sm:px-4 lg:px-6">
            <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto px-2">
                <span className="text-[10px] md:text-xs font-bold tracking-widest text-primary uppercase mb-2">Recommendations</span>
                <h2 className="text-xl md:text-3xl font-bold text-gray-900 tracking-tight">
                    More from <span className="text-primary">{categoryName}</span>
                </h2>
                <p className="mt-2 text-xs md:text-sm text-gray-500">Discover similar styles curated just for you based on this item.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 md:gap-5 lg:gap-6 auto-rows-fr">
                {serializedProducts.slice(0, 5).map((product: any, index: number) => (
                    <div key={product._id} className={index === 4 ? 'hidden lg:block' : ''}>
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>
        </section>
    );
}
