'use server';

import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import ChildCategory from '@/models/ChildCategory';
import SubChildCategory from '@/models/SubChildCategory';

export async function getShowcaseProducts(sectionId: string, page: number = 1, limit: number = 12) {
    try {
        await dbConnect();

        // Collect all child and sub-child IDs that belong to this subcategory
        const childCategories = await ChildCategory.find({ subCategoryId: sectionId }).select('_id').lean();
        const childIds = childCategories.map((c: any) => String(c._id));

        const subChildCategories = childIds.length > 0
            ? await SubChildCategory.find({ childCategoryId: { $in: childIds } }).select('_id').lean()
            : [];
        const subChildIds = subChildCategories.map((s: any) => String(s._id));

        // Query products at any level under this subcategory's full hierarchy
        const orConditions: any[] = [{ subCategory: sectionId, isActive: true }];
        if (childIds.length > 0) orConditions.push({ childCategory: { $in: childIds }, isActive: true });
        if (subChildIds.length > 0) orConditions.push({ subChildCategory: { $in: subChildIds }, isActive: true });

        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            Product.find({ $or: orConditions })
                .skip(skip)
                .limit(limit)
                .lean(),
            Product.countDocuments({ $or: orConditions })
        ]);

        return {
            success: true,
            products: JSON.parse(JSON.stringify(products)),
            hasMore: skip + products.length < total
        };
    } catch (error) {
        console.error("Failed to load showcase products", error);
        return { success: false, products: [], hasMore: false };
    }
}
