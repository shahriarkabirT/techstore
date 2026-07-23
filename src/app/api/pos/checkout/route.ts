import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Coupon from '@/models/Coupon';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { requirePermission } from '@/lib/auth';
import { snapshotUnitProductCost } from '@/lib/orderUnitCost';
import { getNextSequence } from '@/models/Counter';

function generatePOSReceiptId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `POS-${timestamp}-${random}`;
}

// POST — Create POS sale
export async function POST(request: Request) {
    try {
        const admin = await requirePermission('pos');
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            items,
            customerInfo,
            paymentMethod,
            amountTendered = 0,
            couponCode,
            note,
        } = body;

        if (!items || items.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Cart is empty' },
                { status: 400 }
            );
        }

        if (!['Cash', 'Card', 'Digital'].includes(paymentMethod)) {
            return NextResponse.json(
                { success: false, message: 'Invalid payment method for POS' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Build order products and validate stock
        const orderProducts = [];
        let subtotal = 0;

        for (const item of items) {
            const product = await Product.findById(item.productId).lean();

            if (!product) {
                return NextResponse.json(
                    { success: false, message: `Product not found: ${item.title || item.productId}` },
                    { status: 400 }
                );
            }

            if (!product.isActive) {
                return NextResponse.json(
                    { success: false, message: `Product is not available: ${product.title}` },
                    { status: 400 }
                );
            }

            let actualPrice = 0;
            let itemTax = 0;
            let itemTaxType = 'percentage';
            let title = product.title;
            let matchedVariantForCost: any = null;

            if (item.variant && Object.keys(item.variant).length > 0) {
                // Find matching variant
                const variant = product.variants.find((v: any) => {
                    if (item.variant._id && v._id && item.variant._id.toString() === v._id.toString()) {
                        return true;
                    }

                    const itemVar = item.variant.attributes || item.variant;
                    if (v.attributes && Object.keys(v.attributes).length > 0) {
                        return Object.entries(itemVar).every(([slug, val]) => {
                            if (['colorCode', 'tax', '_id', 'id', 'price', 'stock', 'image', 'sku'].includes(slug)) return true;
                            if (slug.toLowerCase() === 'model') return !v.attributes['model'] || v.attributes['model'] === val || v.attributes['Model'] === val;
                            return v.attributes[slug] === val || v.attributes[slug.toLowerCase()] === val || v.attributes[slug.charAt(0).toUpperCase() + slug.slice(1)] === val;
                        });
                    }
                    return false;
                });

                if (!variant) {
                    return NextResponse.json(
                        { success: false, message: `Selected variant not found for: ${product.title}` },
                        { status: 400 }
                    );
                }

                matchedVariantForCost = variant;

                if (variant.stock < item.quantity) {
                    return NextResponse.json(
                        { success: false, message: `Insufficient stock for variant of: ${product.title} (Available: ${variant.stock})` },
                        { status: 400 }
                    );
                }

                // Calculate variant discounted price
                let variantDiscountedPrice = variant.mrp || variant.price || 0;
                if (variant.discountValue && variant.discountValue > 0 && variant.mrp) {
                    if (variant.discountType === 'percentage') {
                        variantDiscountedPrice = variant.mrp - (variant.mrp * variant.discountValue) / 100;
                    } else {
                        variantDiscountedPrice = Math.max(0, variant.mrp - variant.discountValue);
                    }
                }

                actualPrice = variantDiscountedPrice;
                itemTax = variant.tax || 0;
                itemTaxType = variant.taxType || 'percentage';
                const displayVariantValues = Object.entries(item.variant || {})
                    .filter(([key, value]) => 
                        !['colorCode', 'tax', 'stock', '_id'].includes(key) && 
                        !/^#([0-9A-F]{3}){1,2}$/i.test(String(value))
                    )
                    .map(([_, value]) => value);
                
                title = displayVariantValues.length > 0 
                    ? `${product.title} (${displayVariantValues.join(', ')})`
                    : product.title;

                // Deduct variant stock atomically
                await Product.updateOne(
                    { _id: product._id, 'variants._id': variant._id },
                    { $inc: { 'variants.$.stock': -item.quantity, stock: -item.quantity, soldCount: item.quantity } }
                );
            } else {
                if (product.stock < item.quantity) {
                    return NextResponse.json(
                        { success: false, message: `Insufficient stock for: ${product.title} (Available: ${product.stock})` },
                        { status: 400 }
                    );
                }

                // Calculate discounted price
                let discountedPrice = product.mrp;
                if (product.discountValue && product.discountValue > 0) {
                    if (product.discountType === 'percentage') {
                        discountedPrice = product.mrp - (product.mrp * product.discountValue) / 100;
                    } else {
                        discountedPrice = Math.max(0, product.mrp - product.discountValue);
                    }
                }
                actualPrice = discountedPrice || product.price || 0;
                itemTax = product.tax || 0;
                itemTaxType = product.taxType || 'percentage';

                // Deduct stock atomically
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { stock: -item.quantity, soldCount: item.quantity }
                });
            }

            const unitProductCost = snapshotUnitProductCost(product, matchedVariantForCost);
            orderProducts.push({
                productId: product._id,
                title,
                price: actualPrice,
                quantity: item.quantity,
                image: product.images?.[0] || '',
                variant: item.variant || {},
                tax: itemTax,
                taxType: itemTaxType,
                ...(unitProductCost !== undefined ? { unitProductCost } : {}),
            });

            subtotal += actualPrice * item.quantity;
        }

        // Calculate tax
        let totalTax = 0;
        for (const op of orderProducts) {
            if (op.tax > 0) {
                if (op.taxType === 'percentage') {
                    totalTax += (op.price * op.quantity * op.tax) / 100;
                } else {
                    totalTax += op.tax * op.quantity;
                }
            }
        }

        // Calculate discount if coupon exists
        let discountAmount = 0;
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });

            if (coupon) {
                const now = new Date();
                const isStarted = !coupon.startDate || coupon.startDate <= now;
                const isNotExpired = !coupon.expiryDate || coupon.expiryDate >= now;
                const underLimit = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit;
                const minMet = subtotal >= coupon.minOrderAmount;

                if (isStarted && isNotExpired && underLimit && minMet) {
                    if (coupon.discountType === 'percentage') {
                        discountAmount = (subtotal * coupon.discountValue) / 100;
                        if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
                            discountAmount = coupon.maxDiscountAmount;
                        }
                    } else {
                        discountAmount = coupon.discountValue;
                    }

                    // Increment coupon usage
                    await Coupon.findOneAndUpdate(
                        { code: couponCode.toUpperCase() },
                        { $inc: { usedCount: 1 } }
                    );
                }
            }
        }

        // POS sales have no shipping cost
        const shippingCost = 0;
        const totalAmount = Math.max(0, subtotal + totalTax - discountAmount);
        const changeAmount = paymentMethod === 'Cash' ? Math.max(0, amountTendered - totalAmount) : 0;

        const seq = await getNextSequence('orderId');
        const orderId = String(seq).padStart(6, '0');

        // Build customer info (walk-in default)
        const finalCustomerInfo = {
            name: customerInfo?.name || 'Walk-in Customer',
            phone: customerInfo?.phone || 'N/A',
            email: customerInfo?.email || '',
            address: 'POS - In Store',
            city: '',
            notes: note || '',
        };

        const order = await Order.create({
            orderId,
            customerInfo: finalCustomerInfo,
            products: orderProducts,
            subtotal,
            shippingCost,
            taxAmount: totalTax,
            discountAmount,
            couponCode: couponCode || '',
            totalAmount,
            paymentMethod,
            paymentStatus: 'Paid', // POS sales are paid immediately
            orderStatus: 'Delivered', // POS sales are delivered on spot
            source: 'pos',
            cashierInfo: {
                name: admin.email,
                id: admin.id,
            },
            changeAmount,
            amountTendered: paymentMethod === 'Cash' ? amountTendered : totalAmount,
        });

        // Send Email (async)
        if (finalCustomerInfo.email) {
            sendOrderConfirmationEmail(order).catch(err => console.error('POS Email trigger error:', err));
        }

        return NextResponse.json({
            success: true,
            message: 'Sale completed successfully',
            order: {
                _id: order._id,
                orderId: order.orderId,
                products: orderProducts,
                subtotal,
                taxAmount: totalTax,
                discountAmount,
                totalAmount,
                paymentMethod,
                amountTendered: paymentMethod === 'Cash' ? amountTendered : totalAmount,
                changeAmount,
                customerInfo: finalCustomerInfo,
                cashierInfo: { name: admin.email, id: admin.id },
                createdAt: order.createdAt,
            },
        });
    } catch (error) {
        console.error('POS Checkout Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
