import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';
import SubCategory from '@/models/SubCategory';
import ChildCategory from '@/models/ChildCategory';
import SubChildCategory from '@/models/SubChildCategory';

// Sort helper: sort by `order` asc, then `name` asc as tiebreaker
const byOrder = (a: any, b: any) => {
    const orderA = a.order ?? 0;
    const orderB = b.order ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return (a.name || '').localeCompare(b.name || '');
};

export async function GET() {
    try {
        await dbConnect();

        // Fetch all levels in parallel — DB sort by order then name
        const [categories, subCategories, childCategories, subChildCategories] = await Promise.all([
            Category.find({ isActive: true }).sort({ order: 1, name: 1 }).lean(),
            SubCategory.find({ isActive: true }).sort({ order: 1, name: 1 }).lean(),
            ChildCategory.find({ isActive: true }).sort({ order: 1, name: 1 }).lean(),
            SubChildCategory.find({ isActive: true }).sort({ order: 1, name: 1 }).lean(),
        ]);

        // Group children by their parent ID for O(1) lookup
        const createGroupMap = (items: any[], parentKey: string) => {
            const map = new Map<string, any[]>();
            items.forEach(item => {
                const pId = item[parentKey]?.toString();
                if (pId) {
                    if (!map.has(pId)) map.set(pId, []);
                    map.get(pId)?.push(item);
                }
            });
            return map;
        };

        const subMap = createGroupMap(subCategories, 'categoryId');
        const childMap = createGroupMap(childCategories, 'subCategoryId');
        const subChildMap = createGroupMap(subChildCategories, 'childCategoryId');

        // Assemble the tree, preserving order at each level
        const tree = categories.map(cat => {
            const catId = cat._id.toString();
            const subs = (subMap.get(catId) || []).sort(byOrder);

            const subsWithChildren = subs.map(sub => {
                const subId = sub._id.toString();
                const children = (childMap.get(subId) || []).sort(byOrder);

                const childrenWithSubChildren = children.map(child => {
                    const childId = child._id.toString();
                    const subChildren = (subChildMap.get(childId) || []).sort(byOrder);
                    return { ...child, subChildCategories: subChildren };
                });

                return { ...sub, childCategories: childrenWithSubChildren };
            });

            return { ...cat, subCategories: subsWithChildren };
        });

        return NextResponse.json({
            success: true,
            tree,
        });
    } catch (error) {
        console.error('Get Category Tree Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error', tree: [] },
            { status: 500 }
        );
    }
}
