import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { requirePermission } from '@/lib/auth';

// GET — Search products for POS terminal
export async function GET(request: NextRequest) {
    try {
        const admin = await requirePermission('pos');
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const barcode = searchParams.get('barcode');
        const search = searchParams.get('search');
        const category = searchParams.get('category');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '24');

        // Base query: only active products with stock
        const query: Record<string, any> = {
            isActive: true,
        };

        // Barcode/SKU exact match (scanner input)
        if (barcode) {
            const trimmedBarcode = barcode.trim();
            query.$or = [
                { sku: trimmedBarcode },
                { 'variants.sku': trimmedBarcode },
            ];
        }
        // Text search (manual input)
        else if (search) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query.$or = [
                { title: searchRegex },
                { sku: searchRegex },
                { 'variants.sku': searchRegex },
            ];
        }

        // Category filter
        if (category && category !== 'all') {
            query.category = category;
        }

        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            Product.find(query)
                .select('title slug productType mrp price discountType discountValue tax taxType stock images sku variants category')
                .sort({ title: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Product.countDocuments(query),
        ]);

        // Calculate discounted price for each product and its variants
        const productsWithPrice = products.map((p: any) => {
            let discountedPrice = p.mrp;
            if (p.discountValue && p.discountValue > 0) {
                if (p.discountType === 'percentage') {
                    discountedPrice = p.mrp - (p.mrp * p.discountValue) / 100;
                } else {
                    discountedPrice = Math.max(0, p.mrp - p.discountValue);
                }
            }

            // Also compute discountedPrice per variant
            const variants = (p.variants || []).map((v: any) => {
                let variantDiscountedPrice = v.mrp || v.price || 0;
                if (v.discountValue && v.discountValue > 0 && v.mrp) {
                    if (v.discountType === 'percentage') {
                        variantDiscountedPrice = v.mrp - (v.mrp * v.discountValue) / 100;
                    } else {
                        variantDiscountedPrice = Math.max(0, v.mrp - v.discountValue);
                    }
                }
                return {
                    ...v,
                    discountedPrice: variantDiscountedPrice,
                };
            });

            return {
                ...p,
                discountedPrice,
                variants,
            };
        });

        return NextResponse.json({
            success: true,
            products: productsWithPrice,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('POS Product Search Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
