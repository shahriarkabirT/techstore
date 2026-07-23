import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import mongoose from 'mongoose';

interface ProductMoreSidebarProps {
    currentProductId: string;
    categoryId: string;
    subCategoryId?: string;
    childCategoryId?: string;
    subChildCategoryId?: string;
}

export default async function ProductMoreSidebar({
    currentProductId,
    categoryId,
    subCategoryId,
    childCategoryId,
    subChildCategoryId,
}: ProductMoreSidebarProps) {
    if (!categoryId) return null;

    await dbConnect();
    const limit = 6;

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
        { $project: { title: 1, slug: 1, images: 1, mrp: 1, price: 1, discountValue: 1, discountType: 1, discount: 1, stock: 1 } }
    ];

    const relatedProducts = await Product.aggregate(pipeline);
    const products = JSON.parse(JSON.stringify(relatedProducts));

    if (products.length === 0) return null;

    return (
        <div>
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">
                    More Products
                </h3>
            </div>

            <div className="space-y-3 divide-y divide-gray-50">
                {products.map((product: any) => {
                    const currentMrp = product.mrp || product.price;
                    const discountVal = product.discountValue || product.discount || 0;
                    const price = discountVal > 0
                        ? (product.discountType === 'flat' ? currentMrp - discountVal : currentMrp - (currentMrp * discountVal / 100))
                        : currentMrp;

                    return (
                        <Link
                            key={product._id}
                            href={`/products/${product.slug}`}
                            className="flex gap-3 pt-3 first:pt-0 group"
                        >
                            <div className="relative w-16 h-16 flex-shrink-0 bg-gray-50 rounded border border-gray-100 overflow-hidden">
                                {product.images?.[0] && (
                                    <Image
                                        src={product.images[0]}
                                        alt={product.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        sizes="64px"
                                    />
                                )}
                                {discountVal > 0 && (
                                    <span className="absolute top-0 left-0 bg-primary text-white text-[8px] font-black px-1 py-0.5 leading-none">
                                        {product.discountType === 'flat' ? `৳${discountVal} off` : `${discountVal}%`}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                                    {product.title}
                                </p>
                                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                    <span className="text-sm font-black text-primary">{formatCurrency(price)}</span>
                                    {discountVal > 0 && (
                                        <span className="text-[10px] text-gray-400 line-through">{formatCurrency(currentMrp)}</span>
                                    )}
                                </div>
                                {product.stock === 0 && (
                                    <span className="text-[9px] font-bold text-red-500 uppercase">Out of Stock</span>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
