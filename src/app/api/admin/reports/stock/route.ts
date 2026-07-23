import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import { requirePermission } from '@/lib/auth';

export async function GET() {
    try {
        const admin = await requirePermission('reports');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const LOW_STOCK_THRESHOLD = 5;

        const [
            totalProducts,
            outOfStockProducts,
            lowStockProducts,
            stockValue,
            categoryStock,
            allProducts,
        ] = await Promise.all([
            Product.countDocuments({ isActive: true }),

            // Out of stock (stock = 0)
            Product.find({ isActive: true, stock: 0 })
                .select('title slug stock soldCount price images category')
                .populate('category', 'name')
                .sort({ soldCount: -1 })
                .lean(),

            // Low stock (0 < stock <= threshold)
            Product.find({ isActive: true, stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } })
                .select('title slug stock soldCount price images category')
                .populate('category', 'name')
                .sort({ stock: 1 })
                .lean(),

            // Total stock value
            Product.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: null,
                        totalValue: { $sum: { $multiply: ['$stock', '$price'] } },
                        totalStock: { $sum: '$stock' },
                        totalSold: { $sum: '$soldCount' },
                    }
                }
            ]),

            // Category-wise stock
            Product.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: '$category',
                        totalStock: { $sum: '$stock' },
                        totalProducts: { $sum: 1 },
                        outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
                        stockValue: { $sum: { $multiply: ['$stock', '$price'] } },
                    }
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'categoryInfo'
                    }
                },
                { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        categoryName: { $ifNull: ['$categoryInfo.name', 'Uncategorized'] },
                        totalStock: 1,
                        totalProducts: 1,
                        outOfStock: 1,
                        stockValue: 1,
                    }
                },
                { $sort: { totalStock: -1 } }
            ]),

            // All products for table
            Product.find({ isActive: true })
                .select('title slug stock soldCount price images category variants productType')
                .populate('category', 'name')
                .sort({ stock: 1 })
                .lean(),
        ]);

        const sv = stockValue[0] || { totalValue: 0, totalStock: 0, totalSold: 0 };

        return NextResponse.json({
            success: true,
            summary: {
                totalProducts,
                outOfStockCount: outOfStockProducts.length,
                lowStockCount: lowStockProducts.length,
                totalStockValue: Math.round(sv.totalValue),
                totalStock: sv.totalStock,
                totalSold: sv.totalSold,
                lowStockThreshold: LOW_STOCK_THRESHOLD,
            },
            outOfStockProducts: outOfStockProducts.map(p => ({
                _id: p._id,
                title: p.title,
                slug: p.slug,
                stock: p.stock,
                soldCount: p.soldCount || 0,
                price: p.price,
                image: p.images?.[0] || '',
                category: (p.category as any)?.name || 'Uncategorized',
            })),
            lowStockProducts: lowStockProducts.map(p => ({
                _id: p._id,
                title: p.title,
                slug: p.slug,
                stock: p.stock,
                soldCount: p.soldCount || 0,
                price: p.price,
                image: p.images?.[0] || '',
                category: (p.category as any)?.name || 'Uncategorized',
            })),
            categoryStock,
            allProducts: allProducts.map(p => ({
                _id: p._id,
                title: p.title,
                slug: p.slug,
                stock: p.stock,
                soldCount: p.soldCount || 0,
                price: p.price,
                image: p.images?.[0] || '',
                category: (p.category as any)?.name || 'Uncategorized',
                productType: p.productType,
                variantCount: p.variants?.length || 0,
                variantStock: p.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0,
            })),
        });

    } catch (error: any) {
        console.error('Stock Report API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
