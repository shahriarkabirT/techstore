import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import User from '@/models/User';
import VariantOption, { IVariantOptionDocument } from '@/models/VariantOption';
import '@/models/Brand';
import { slugify } from '@/lib/utils';
import { requirePermission } from '@/lib/auth';
import { deleteImages } from '@/lib/imageUtils';

function parseOptionalProductCost(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return undefined;
    return Math.round(n * 100) / 100;
}

// GET single product by ID or slug
export async function GET(request, { params }) {
    try {
        await dbConnect();

        const { id } = await params;

        // Try to find by ID first, then by slug
        let product;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            product = await Product.findById(id).populate('category', 'name slug').populate('brand', 'name slug logo');
        } else {
            product = await Product.findOne({ slug: id }).populate('category', 'name slug').populate('brand', 'name slug logo');
        }

        if (!product) {
            return NextResponse.json(
                { success: false, message: 'Product not found' },
                { status: 404 }
            );
        }

        // Fetch global variant options to sort product variants
        if (product.variants && product.variants.length > 0) {
            const allOptions: IVariantOptionDocument[] = await VariantOption.find({ isActive: true }).lean();

            // Create maps for quick order lookup (default to 999 if not found)
            const getOrder = (type: 'size' | 'color' | 'material' | 'ram' | 'storage', label: string) => {
                if (!label) return 999;
                const option = allOptions.find(o => o.type === type && o.label === label);
                return option ? option.order : 999;
            };

            // Convert Mongoose document to plain object so we can mutate the variants array
            const productObj = product.toObject();

            productObj.variants.sort((a: any, b: any) => {
                // Primary Sort: Size -> Color -> Material -> Model
                const sizeOrderA = getOrder('size', a.size);
                const sizeOrderB = getOrder('size', b.size);
                if (sizeOrderA !== sizeOrderB) return sizeOrderA - sizeOrderB;

                const colorOrderA = getOrder('color', a.colorName);
                const colorOrderB = getOrder('color', b.colorName);
                if (colorOrderA !== colorOrderB) return colorOrderA - colorOrderB;

                const materialOrderA = getOrder('material', a.material);
                const materialOrderB = getOrder('material', b.material);
                if (materialOrderA !== materialOrderB) return materialOrderA - materialOrderB;

                const ramOrderA = getOrder('ram', a.ram);
                const ramOrderB = getOrder('ram', b.ram);
                if (ramOrderA !== ramOrderB) return ramOrderA - ramOrderB;

                const storageOrderA = getOrder('storage', a.storage);
                const storageOrderB = getOrder('storage', b.storage);
                return storageOrderA - storageOrderB;
            });

            return NextResponse.json({
                success: true,
                product: productObj,
            });
        }

        return NextResponse.json({
            success: true,
            product,
        });
    } catch (error) {
        console.error('Get Product Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// PUT update product (admin only)
export async function PUT(request, { params }) {
    try {
        const admin = await requirePermission('products');
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await request.json();

        await dbConnect();

        const product = await Product.findById(id);
        if (!product) {
            return NextResponse.json(
                { success: false, message: 'Product not found' },
                { status: 404 }
            );
        }

        // Capture existing images before applying updates
        const oldImages = new Set<string>([
            ...(product.images || []),
            ...(product.variants || []).flatMap((v: any) => v.images || [])
        ]);
        if (product.sizeGuide) {
            if (typeof product.sizeGuide === 'object' && (product.sizeGuide as any).image) {
                oldImages.add((product.sizeGuide as any).image);
            } else if (typeof product.sizeGuide === 'string') {
                try {
                    const parsed = JSON.parse(product.sizeGuide);
                    if (parsed && parsed.image) oldImages.add(parsed.image);
                } catch (e) {
                    oldImages.add(product.sizeGuide);
                }
            }
        }

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
            sku,
            tags,
            seoMetadata,
            isActive,
            freeShipping,
            preorder,
            productType,
            isFeatured,
            productCost,
            compatibleModels,
        } = body;

        // Validation Logic for Updates
        if (title !== undefined && title.trim().length < 3) {
            return NextResponse.json(
                { success: false, message: 'Product title must be at least 3 characters long' },
                { status: 400 }
            );
        }

        const finalMrp = mrp !== undefined ? Number(mrp) : product.mrp;
        const finalPrice = price !== undefined ? Number(price) : product.price;

        if (finalMrp < 0) {
            return NextResponse.json(
                { success: false, message: 'MRP cannot be negative' },
                { status: 400 }
            );
        }

        if (finalPrice < 1) {
            return NextResponse.json(
                { success: false, message: 'Selling price must be at least 1' },
                { status: 400 }
            );
        }

        if (finalPrice > finalMrp) {
            return NextResponse.json(
                { success: false, message: 'Selling price cannot be greater than MRP' },
                { status: 400 }
            );
        }

        if (category === "") {
            return NextResponse.json(
                { success: false, message: 'Category cannot be empty' },
                { status: 400 }
            );
        }

        if (images !== undefined) {
            const validImages = images.filter((img: string) => img.trim());
            if (validImages.length === 0) {
                return NextResponse.json(
                    { success: false, message: 'At least one product image is required' },
                    { status: 400 }
                );
            }
        }

        // Variant validation
        if (variants !== undefined && Array.isArray(variants)) {
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

        // Update slug if title changed
        if (title && title !== product.title) {
            let slug = slugify(title);
            let existing = await Product.findOne({ slug, _id: { $ne: id } });
            let counter = 1;
            while (existing) {
                slug = `${slugify(title)}-${counter}`;
                existing = await Product.findOne({ slug, _id: { $ne: id } });
                counter++;
            }
            product.slug = slug;
            product.title = title;
        }

        if (mrp !== undefined) product.mrp = Number(mrp);
        if (price !== undefined) product.price = Number(price);
        if (discountType !== undefined) product.discountType = discountType;
        if (discountValue !== undefined) product.discountValue = Number(discountValue);
        if (tax !== undefined) product.tax = Number(tax);
        if (stock !== undefined) product.stock = Number(stock);
        if (weight !== undefined) product.weight = weight !== null && weight !== '' ? Number(weight) : null;
        if (images !== undefined) product.images = images;
        if (category !== undefined) product.category = category;
        if (subCategory !== undefined) product.subCategory = subCategory;
        if (childCategory !== undefined) product.childCategory = childCategory;
        if (subChildCategory !== undefined) product.subChildCategory = subChildCategory;
        if (shortDescription !== undefined) product.shortDescription = shortDescription;
        if (fullDescription !== undefined) product.fullDescription = fullDescription;
        if (sizeGuide !== undefined) product.sizeGuide = sizeGuide;
        if (compatibleModels !== undefined) product.compatibleModels = compatibleModels;
        if (variants !== undefined) {
            // Sanitize variant _ids: remove empty/invalid _id so Mongoose auto-generates them
            product.variants = variants.map((v: any) => {
                const { _id, ...rest } = v;
                const base = _id && typeof _id === 'string' && _id.match(/^[0-9a-fA-F]{24}$/)
                    ? { _id, ...rest }
                    : rest;
                const pc = parseOptionalProductCost(base.productCost);
                const { productCost: _pc, ...withoutCost } = base;
                return pc !== undefined ? { ...withoutCost, productCost: pc } : withoutCost;
            });
        }
        if (sku !== undefined) product.sku = sku;
        if (tags !== undefined) product.tags = tags;
        if (seoMetadata !== undefined) product.seoMetadata = seoMetadata;
        if (isActive !== undefined) product.isActive = isActive;
        if (brand !== undefined) product.brand = brand || undefined;
        if (freeShipping !== undefined) product.freeShipping = !!freeShipping;
        if (preorder !== undefined) product.preorder = !!preorder;
        if (productType !== undefined) product.productType = productType;
        if (isFeatured !== undefined) product.isFeatured = !!isFeatured;

        const parsedProductCost = parseOptionalProductCost(productCost);
        if (productCost !== undefined) {
            if (productCost === null || parsedProductCost === undefined) {
                product.set('productCost', undefined);
            } else {
                product.productCost = parsedProductCost;
            }
        }

        if (product.productType === 'variant' && product.variants && product.variants.length > 0) {
            product.stock = product.variants.reduce((acc: number, v: any) => acc + (Number(v.stock) || 0), 0);
        }

        await product.save();
        await product.populate('category', 'name slug');
        await product.populate('brand', 'name slug logo');

        // Identify and delete orphaned images
        const newImages = new Set<string>([
            ...(product.images || []),
            ...(product.variants || []).flatMap((v: any) => v.images || [])
        ]);
        if (product.sizeGuide) {
            if (typeof product.sizeGuide === 'object' && (product.sizeGuide as any).image) {
                newImages.add((product.sizeGuide as any).image);
            } else if (typeof product.sizeGuide === 'string') {
                try {
                    const parsed = JSON.parse(product.sizeGuide);
                    if (parsed && parsed.image) newImages.add(parsed.image);
                } catch (e) {
                    newImages.add(product.sizeGuide);
                }
            }
        }

        const orphanedImages = [...oldImages].filter(img => !newImages.has(img));
        if (orphanedImages.length > 0) {
            deleteImages(orphanedImages).catch(err => console.error('Failed to delete orphaned images:', err));
        }

        revalidatePath('/');
        revalidatePath(`/products/${product.slug}`);

        return NextResponse.json({
            success: true,
            message: 'Product updated successfully',
            product,
        });
    } catch (error: any) {
        console.error('Update Product Error:', error);
        const message = error.name === 'ValidationError'
            ? error.message
            : 'Server error';
        return NextResponse.json(
            { success: false, message },
            { status: error.name === 'ValidationError' ? 400 : 500 }
        );
    }
}

// DELETE product (admin only)
export async function DELETE(request, { params }) {
    try {
        const admin = await requirePermission('products');
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;

        await dbConnect();

        const product = await Product.findById(id);

        if (!product) {
            return NextResponse.json(
                { success: false, message: 'Product not found' },
                { status: 404 }
            );
        }

        // Collect all image URLs: main images + per-variant images
        const allImages: string[] = [
            ...(product.images || []),
            ...(product.variants || []).flatMap((v: any) => v.images || []),
        ];
        if (product.sizeGuide) {
            let sizeGuideUrl = product.sizeGuide;
            if (typeof product.sizeGuide === 'object' && (product.sizeGuide as any).image) {
                sizeGuideUrl = (product.sizeGuide as any).image;
            } else if (typeof product.sizeGuide === 'string') {
                try {
                    const parsed = JSON.parse(product.sizeGuide);
                    if (parsed && parsed.image) sizeGuideUrl = parsed.image;
                } catch (e) {
                    // It's just a regular string URL, keep sizeGuideUrl as is
                }
            }
            allImages.push(sizeGuideUrl);
        }
        await deleteImages(allImages);

        const productSlug = product.slug;
        await Product.findByIdAndDelete(id);

        // Remove from all users' wishlists
        await User.updateMany(
            { wishlist: id },
            { $pull: { wishlist: id } }
        );

        revalidatePath('/');
        revalidatePath(`/products/${productSlug}`);

        return NextResponse.json({
            success: true,
            message: 'Product deleted successfully',
        });
    } catch (error) {
        console.error('Delete Product Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
