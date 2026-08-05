import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import SubCategory from '@/models/SubCategory';
import ChildCategory from '@/models/ChildCategory';
import SubChildCategory from '@/models/SubChildCategory';
import '@/models/Brand';

export async function getProductsList(params: {
    category?: string | null;
    search?: string | null;
    ids?: string | null;
    active?: string | null;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 1 | -1;
    featured?: string | null;
    minPrice?: string | null;
    maxPrice?: string | null;
    brand?: string | null;
}) {
    await dbConnect();

    const {
        category,
        search,
        ids,
        active: activeQuery,
        page = 1,
        limit = 12,
        sortBy = 'createdAt',
        sortOrder = -1,
        featured,
        minPrice,
        maxPrice,
        brand
    } = params;

    const activeOnly = activeQuery !== 'false' && activeQuery !== 'all';
    const query: Record<string, unknown> = {};

    if (activeOnly) {
        query.isActive = true;
    } else if (activeQuery === 'false') {
        query.isActive = false;
    }

    if (ids) {
        query._id = { $in: ids.split(',') };
    }

    if (featured === 'true') {
        query.isFeatured = true;
    } else if (featured === 'false') {
        query.isFeatured = false;
    }

    if (category) {
        // Check if it's an ID or a slug
        let targetCategory: any = null;
        let level = 0; // 0: Category, 1: Sub, 2: Child, 3: SubChild

        if (category.match(/^[0-9a-fA-F]{24}$/)) {
            // Try Category ID
            targetCategory = await Category.findById(category);
            if (!targetCategory) {
                targetCategory = await SubCategory.findById(category);
                level = 1;
            }
            if (!targetCategory) {
                targetCategory = await ChildCategory.findById(category);
                level = 2;
            }
            if (!targetCategory) {
                targetCategory = await SubChildCategory.findById(category);
                level = 3;
            }
        } else {
            // Try slugs across all levels
            targetCategory = await Category.findOne({ slug: category });
            if (!targetCategory) {
                targetCategory = await SubCategory.findOne({ slug: category });
                level = 1;
            }
            if (!targetCategory) {
                targetCategory = await ChildCategory.findOne({ slug: category });
                level = 2;
            }
            if (!targetCategory) {
                targetCategory = await SubChildCategory.findOne({ slug: category });
                level = 3;
            }
        }

        if (targetCategory) {
            const targetId = targetCategory._id;

            if (level === 0) {
                query.category = targetId;
            } else if (level === 1) {
                query.subCategory = targetId;
            } else if (level === 2) {
                query.childCategory = targetId;
            } else if (level === 3) {
                query.subChildCategory = targetId;
            }
        } else {
            query.category = null;
        }
    }

    if (search) {
        const terms = search.trim().split(/\s+/);

        // Build a fuzzy regex for each word: each character can be surrounded by optional chars
        // e.g. "iphon" → matches "iphone", "iphoone", etc.
        const fuzzyPattern = (word: string) => {
            // Allow 0-1 extra/wrong characters using lookahead-free simple approach:
            // Match the word with each character optionally substituted/skipped
            // We use a simple "allow one char difference" approach via alternation
            const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Strategy: search for the word OR any version missing/swapping one character
            const variations: string[] = [escaped];
            for (let i = 0; i < word.length; i++) {
                // Delete one character
                variations.push(escaped.slice(0, i) + escaped.slice(i + 1));
                // Replace one character with any char
                variations.push(escaped.slice(0, i) + '.' + escaped.slice(i + 1));
            }
            // Insert a wildcard at any position (transposition/insertion)
            for (let i = 0; i <= word.length; i++) {
                variations.push(escaped.slice(0, i) + '.?' + escaped.slice(i));
            }
            return variations.filter(Boolean).join('|');
        };

        // Each word must match at least one field (AND between words, OR across fields)
        const termConditions = terms.map(term => {
            const pattern = fuzzyPattern(term);
            const re = { $regex: pattern, $options: 'i' };
            return {
                $or: [
                    { title: re },
                    { shortDescription: re },
                    { tags: re },
                    { compatibleModels: re },
                    { sku: re },
                    { 'seoMetadata.keywords': re },
                    // attributes is a Map — search both keys and values via $elemMatch on the map entries
                    { 'variants.attributes': re },
                    { 'variants.sku': re },
                ],
            };
        });

        query.$and = [...(query.$and as any[] || []), ...termConditions];
    }

    if (brand) query.brand = brand;

    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) (query.price as any).$gte = Number(minPrice);
        if (maxPrice) (query.price as any).$lte = Number(maxPrice);
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
        Product.find(query)
            .populate('category', 'name slug')
            .populate('brand', 'name slug logo')
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit)
            .lean(),
        Product.countDocuments(query),
    ]);

    return {
        products: JSON.parse(JSON.stringify(products)),
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
}
