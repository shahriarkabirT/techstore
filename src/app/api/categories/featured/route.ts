import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';
import SubCategory from '@/models/SubCategory';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        await dbConnect();

        // Fetch featured (showToLandingPage) + active categories
        const categories = await Category.find({
            isActive: true,
            showToLandingPage: true,
        })
            .select('name slug order')
            .sort({ order: 1, name: 1 })
            .lean();

        if (!categories.length) {
            return NextResponse.json({ success: true, categories: [] });
        }

        // Fetch all active subcategories for these categories in one query
        const categoryIds = categories.map((c: any) => c._id);
        const subCategories = await SubCategory.find({
            categoryId: { $in: categoryIds },
            isActive: true,
        })
            .select('name slug categoryId')
            .sort({ name: 1 })
            .lean();

        // Group subcategories by categoryId for O(1) lookup
        const subMap = new Map<string, any[]>();
        subCategories.forEach((sub: any) => {
            const pId = sub.categoryId.toString();
            if (!subMap.has(pId)) subMap.set(pId, []);
            subMap.get(pId)!.push({ _id: sub._id, name: sub.name, slug: sub.slug });
        });

        // Assemble response
        const result = categories.map((cat: any) => ({
            _id: cat._id,
            name: cat.name,
            slug: cat.slug,
            order: cat.order ?? 0,
            subCategories: subMap.get(cat._id.toString()) || [],
        }));

        return NextResponse.json({ success: true, categories: result });
    } catch (error) {
        console.error('Get Featured Categories Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error', categories: [] },
            { status: 500 }
        );
    }
}
