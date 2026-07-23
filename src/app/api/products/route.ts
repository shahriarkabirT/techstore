import { NextResponse, NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import SubCategory from '@/models/SubCategory';
import ChildCategory from '@/models/ChildCategory';
import SubChildCategory from '@/models/SubChildCategory';
import '@/models/Brand';
import { slugify } from '@/lib/utils';
import { requirePermission } from '@/lib/auth';
import { getProductsList } from '@/lib/services/product.service';
import rateLimit from '@/lib/rate-limit';

function parseOptionalProductCost(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return undefined;
    return Math.round(n * 100) / 100;
}

const limiter = rateLimit({
    uniqueTokenPerInterval: 500,
    interval: 10000, // 10 seconds
});

// GET all products
export async function GET(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';
        try {
            await limiter.check(100, ip); // Limit to 100 requests per 10s per IP
        } catch {
            return NextResponse.json({ success: false, message: 'Too many requests. Please try again later.' }, { status: 429 });
        }

        await dbConnect();

        const searchParams = request.nextUrl.searchParams;
        const params = {
            category: searchParams.get('category'),
            search: searchParams.get('search'),
            ids: searchParams.get('ids'),
            active: searchParams.get('active'),
            page: parseInt(searchParams.get('page') || '1') || 1,
            limit: parseInt(searchParams.get('limit') || '12') || 12,
            sortBy: searchParams.get('sortBy') || 'createdAt',
            sortOrder: (searchParams.get('sortOrder') === 'asc' ? 1 : -1) as 1 | -1,
            featured: searchParams.get('featured'),
            size: searchParams.get('size'),
            color: searchParams.get('color'),
            material: searchParams.get('material'),
            ram: searchParams.get('ram'),
            storage: searchParams.get('storage'),
            minPrice: searchParams.get('minPrice'),
            maxPrice: searchParams.get('maxPrice'),
            brand: searchParams.get('brand'),
        };

        const result = await getProductsList(params);

        return NextResponse.json({
            success: true,
            products: result.products,
            pagination: result.pagination,
        });
    } catch (error) {
        console.error('Get Products Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// POST create product (admin only)
export async function POST(request: NextRequest) {
    try {
        const admin = await requirePermission('products');
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            title,
            mrp,
            price,
            discountType,
            discountValue,
            tax,
            stock,
            weight,
            images,
            category,
            subCategory,
            childCategory,
            subChildCategory,
            brand,
            shortDescription,
            fullDescription,
            sizeGuide,
            variants,
            tags,
            seoMetadata,
            freeShipping,
            preorder,
            sku,
            productType,
            isFeatured,
            productCost,
            compatibleModels,
        } = body;

        // Validation Logic
        if (!title || title.trim().length < 3) {
            return NextResponse.json(
                { success: false, message: 'Product title must be at least 3 characters long' },
                { status: 400 }
            );
        }

        if (mrp === undefined || Number(mrp) < 0) {
            return NextResponse.json(
                { success: false, message: 'Valid MRP is required' },
                { status: 400 }
            );
        }

        if (price === undefined || Number(price) < 1) {
            return NextResponse.json(
                { success: false, message: 'Selling price must be at least 1' },
                { status: 400 }
            );
        }

        if (Number(price) > Number(mrp)) {
            return NextResponse.json(
                { success: false, message: 'Selling price cannot be greater than MRP' },
                { status: 400 }
            );
        }

        if (!category) {
            return NextResponse.json(
                { success: false, message: 'Product category is required' },
                { status: 400 }
            );
        }

        const validImages = (images || []).filter((img: string) => img.trim());
        if (validImages.length === 0) {
            return NextResponse.json(
                { success: false, message: 'At least one product image is required' },
                { status: 400 }
            );
        }

        // Variant validation
        if (variants && Array.isArray(variants)) {
            for (const v of variants) {
                if (Number(v.stock) < 0) {
                    return NextResponse.json(
                        { success: false, message: 'Variant stock cannot be negative' },
                        { status: 400 }
                    );
                }
                if (v.price !== undefined && Number(v.price) < 1) {
                    return NextResponse.json(
                        { success: false, message: 'Variant selling price must be at least 1' },
                        { status: 400 }
                    );
                }
                const vpc = v.productCost;
                if (vpc !== undefined && vpc !== null && vpc !== '' && Number(vpc) < 0) {
                    return NextResponse.json(
                        { success: false, message: 'Variant product cost cannot be negative' },
                        { status: 400 }
                    );
                }
            }
        }

        await dbConnect();

        // Generate unique slug
        let slug = slugify(title);
        let existing = await Product.findOne({ slug });
        let counter = 1;
        while (existing) {
            slug = `${slugify(title)}-${counter}`;
            existing = await Product.findOne({ slug });
            counter++;
        }

        // Sanitize variant _ids: remove empty/invalid _id so Mongoose auto-generates them
        const sanitizedVariants = (variants || []).map((v: any) => {
            const { _id, ...rest } = v;
            const raw = _id && typeof _id === 'string' && _id.match(/^[0-9a-fA-F]{24}$/) ? { _id, ...rest } : { ...rest };
            const pc = parseOptionalProductCost(raw.productCost);
            const { productCost: _drop, ...noPc } = raw;
            return pc !== undefined ? { ...noPc, productCost: pc } : noPc;
        });

        const parsedProductCost = parseOptionalProductCost(productCost);

        const product = await Product.create({
            title,
            slug,
            mrp: Number(mrp),
            price: Number(price),
            discountType,
            discountValue: Number(discountValue) || 0,
            tax: Number(tax) || 0,
            stock: Number(stock) || 0,
            weight: weight !== undefined && weight !== null && weight !== '' ? Number(weight) : null,
            images: images || [],
            category,
            subCategory,
            childCategory,
            subChildCategory,
            brand: brand || undefined,
            shortDescription,
            fullDescription,
            sizeGuide: sizeGuide || undefined,
            compatibleModels: compatibleModels || [],
            variants: sanitizedVariants,
            sku,
            tags: tags || [],
            seoMetadata: seoMetadata || {},
            freeShipping: !!freeShipping,
            preorder: !!preorder,
            productType,
            isFeatured: !!isFeatured,
            ...(parsedProductCost !== undefined ? { productCost: parsedProductCost } : {}),
        });

        await product.populate('category', 'name slug');
        await product.populate('brand', 'name slug logo');

        revalidatePath('/');

        return NextResponse.json({
            success: true,
            message: 'Product created successfully',
            product,
        });
    } catch (error: any) {
        console.error('Create Product Error:', error);
        const message = error.name === 'ValidationError'
            ? error.message
            : 'Server error';
        return NextResponse.json(
            { success: false, message },
            { status: error.name === 'ValidationError' ? 400 : 500 }
        );
    }
}
