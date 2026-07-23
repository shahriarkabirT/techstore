import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import '@/models/Category';
import '@/models/Brand';

/**
 * GET /api/products/related
 * 
 * Fetches related products sorted by category hierarchy.
 * 
 * Query params:
 *   - productId:        current product ID to exclude
 *   - category:         top-level category ID
 *   - subCategory:      sub-category ID (optional)
 *   - childCategory:    child-category ID (optional)
 *   - subChildCategory: sub-child-category ID (optional)
 *   - direction:        "bottom-up" (most specific first) or "top-down" (broadest first)
 *   - page:             page number (default 1)
 *   - limit:            items per page (default 6)
 */
export async function GET(request: Request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const category = searchParams.get('category');
        const subCategory = searchParams.get('subCategory');
        const childCategory = searchParams.get('childCategory');
        const subChildCategory = searchParams.get('subChildCategory');
        const direction = searchParams.get('direction') || 'bottom-up';
        const page = parseInt(searchParams.get('page') || '1') || 1;
        const limit = parseInt(searchParams.get('limit') || '6') || 6;

        if (!category) {
            return NextResponse.json({ success: true, products: [], pagination: { page, limit, total: 0, pages: 0 } });
        }

        // Build tiers based on direction
        // Each tier is a MongoDB filter for products at that specificity level
        const tiers: { filter: Record<string, unknown>; label: string }[] = [];

        if (direction === 'bottom-up') {
            // Most specific first → broadest last
            if (subChildCategory) {
                tiers.push({ filter: { subChildCategory }, label: 'subChildCategory' });
            }
            if (childCategory) {
                tiers.push({ filter: { childCategory, ...(subChildCategory ? { subChildCategory: { $ne: subChildCategory } } : {}) }, label: 'childCategory' });
            }
            if (subCategory) {
                tiers.push({ filter: { subCategory, ...(childCategory ? { childCategory: { $ne: childCategory } } : {}) }, label: 'subCategory' });
            }
            // Broadest: same category but not in any of the sub-levels already matched
            const broadFilter: Record<string, unknown> = { category };
            if (subCategory) broadFilter.subCategory = { $ne: subCategory };
            tiers.push({ filter: broadFilter, label: 'category' });
        } else {
            // Top-down: broadest first → most specific last
            const broadFilter: Record<string, unknown> = { category };
            if (subCategory) broadFilter.subCategory = { $ne: subCategory };
            tiers.push({ filter: broadFilter, label: 'category' });

            if (subCategory) {
                tiers.push({ filter: { subCategory, ...(childCategory ? { childCategory: { $ne: childCategory } } : {}) }, label: 'subCategory' });
            }
            if (childCategory) {
                tiers.push({ filter: { childCategory, ...(subChildCategory ? { subChildCategory: { $ne: subChildCategory } } : {}) }, label: 'childCategory' });
            }
            if (subChildCategory) {
                tiers.push({ filter: { subChildCategory }, label: 'subChildCategory' });
            }
        }

        // Build a single aggregation using $addFields to assign tier priority
        const excludeFilter: Record<string, unknown> = { isActive: true };
        if (productId) excludeFilter._id = { $ne: productId };

        // Use $or with tier conditions, adding a computed sort priority
        const orConditions = tiers.map((tier, idx) => {
            const combined: Record<string, unknown> = { ...tier.filter };
            return { match: combined, priority: idx };
        });

        // Build MongoDB aggregation for tiered sorting
        const pipeline: any[] = [
            {
                $match: {
                    ...excludeFilter,
                    category: category, // Must be in same top-level category at minimum
                }
            },
            {
                $addFields: {
                    _tierPriority: {
                        $switch: {
                            branches: orConditions.map((cond, idx) => {
                                // Build the condition expression for each tier
                                const condExpr: any[] = [];
                                for (const [key, value] of Object.entries(cond.match)) {
                                    if (value && typeof value === 'object' && '$ne' in (value as any)) {
                                        condExpr.push({ $ne: [`$${key}`, (value as any).$ne] });
                                    } else {
                                        condExpr.push({ $eq: [`$${key}`, value] });
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
            {
                $facet: {
                    products: [
                        { $skip: (page - 1) * limit },
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
                    ],
                    totalCount: [{ $count: 'count' }]
                }
            }
        ];

        // Convert category string to ObjectId for aggregation
        const mongoose = await import('mongoose');
        pipeline[0].$match.category = new mongoose.Types.ObjectId(category);
        if (productId && productId.match(/^[0-9a-fA-F]{24}$/)) {
            pipeline[0].$match._id = { $ne: new mongoose.Types.ObjectId(productId) };
        }

        // Convert all tier filter IDs to ObjectIds
        for (const branch of pipeline[1].$addFields._tierPriority.$switch.branches) {
            if (branch.case.$and) {
                for (const expr of branch.case.$and) {
                    for (const op of ['$eq', '$ne']) {
                        if (expr[op] && expr[op][1] && typeof expr[op][1] === 'string' && expr[op][1].match(/^[0-9a-fA-F]{24}$/)) {
                            expr[op][1] = new mongoose.Types.ObjectId(expr[op][1]);
                        }
                    }
                }
            } else {
                // Single condition
                for (const op of ['$eq', '$ne']) {
                    if (branch.case[op] && branch.case[op][1] && typeof branch.case[op][1] === 'string' && branch.case[op][1].match(/^[0-9a-fA-F]{24}$/)) {
                        branch.case[op][1] = new mongoose.Types.ObjectId(branch.case[op][1]);
                    }
                }
            }
        }

        const [result] = await Product.aggregate(pipeline);
        const products = result?.products || [];
        const total = result?.totalCount?.[0]?.count || 0;

        return NextResponse.json({
            success: true,
            products,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Related Products API Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
