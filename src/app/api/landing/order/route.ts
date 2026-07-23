import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import LandingPage from '@/models/LandingPage';
import Settings from '@/models/Settings';
import Fraud from '@/models/Fraud';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { generateOrderId } from '@/lib/utils';
import { getNextSequence } from '@/models/Counter';
import { snapshotUnitProductCost } from '@/lib/orderUnitCost';
import { sendCapiPurchase } from '@/lib/meta-capi';

// POST — Create order from landing page (no auth required)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { landingPageId, productId, quantity = 1, variant, customerInfo } = body;

        // Validate customer info
        if (!customerInfo?.name || !customerInfo?.phone || !customerInfo?.address) {
            return NextResponse.json(
                { success: false, message: 'Name, phone, and address are required' },
                { status: 400 }
            );
        }

        if (!productId) {
            return NextResponse.json(
                { success: false, message: 'Product ID is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Fraud Validation Block
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || '';
        const isFraud = await Fraud.findOne({
            $or: [
                { phone: customerInfo.phone },
                { ip: ipAddress }
            ],
            status: 'blocked'
        });

        if (isFraud) {
            return NextResponse.json(
                { success: false, message: 'You are flagged professionally due to policy violation. If you think you are not guilty then please contact us through the Contact page.' },
                { status: 403 }
            );
        }

        // Verify product
        const product = await Product.findById(productId).lean();
        if (!product || !product.isActive) {
            return NextResponse.json(
                { success: false, message: 'Product not found or unavailable' },
                { status: 400 }
            );
        }

        let actualPrice = 0;
        let itemTax = 0;
        let itemTaxType: 'flat' | 'percentage' = 'percentage';
        let title = product.title;
        let matchedVariantForCost: any = null;

        if (variant && Object.keys(variant).length > 0) {
            // Find matching variant
            const matchedVariant = product.variants.find((v: any) => {
                if (variant._id && v._id && variant._id.toString() === v._id.toString()) {
                    return true;
                }

                const itemVar = variant.attributes || variant;
                if (v.attributes && Object.keys(v.attributes).length > 0) {
                    return Object.entries(itemVar).every(([slug, val]) => {
                        if (['colorCode', 'tax', '_id', 'id', 'price', 'stock', 'image', 'sku'].includes(slug)) return true;
                        if (slug.toLowerCase() === 'model') return !v.attributes['model'] || v.attributes['model'] === val || v.attributes['Model'] === val;
                        return v.attributes[slug] === val || v.attributes[slug.toLowerCase()] === val || v.attributes[slug.charAt(0).toUpperCase() + slug.slice(1)] === val;
                    });
                }
                return false;
            });

            if (!matchedVariant) {
                return NextResponse.json(
                    { success: false, message: 'Selected variant not found' },
                    { status: 400 }
                );
            }

            matchedVariantForCost = matchedVariant;

            if (matchedVariant.stock < quantity) {
                return NextResponse.json(
                    { success: false, message: `Only ${matchedVariant.stock} items available` },
                    { status: 400 }
                );
            }

            // Calculate variant discounted price
            let variantDiscountedPrice = matchedVariant.mrp || matchedVariant.price || 0;
            if (matchedVariant.discountValue && matchedVariant.discountValue > 0 && matchedVariant.mrp) {
                if (matchedVariant.discountType === 'percentage') {
                    variantDiscountedPrice = matchedVariant.mrp - (matchedVariant.mrp * matchedVariant.discountValue) / 100;
                } else {
                    variantDiscountedPrice = Math.max(0, matchedVariant.mrp - matchedVariant.discountValue);
                }
            }

            actualPrice = variantDiscountedPrice;
            itemTax = matchedVariant.tax || 0;
            itemTaxType = matchedVariant.taxType || 'percentage';
            title = `${product.title} (${Object.values(variant).filter(Boolean).join(', ')})`;

            // Deduct variant stock atomically
            await Product.updateOne(
                { _id: product._id, 'variants._id': matchedVariant._id },
                { $inc: { 'variants.$.stock': -quantity, stock: -quantity, soldCount: quantity } }
            );
        } else {
            // Non-variant product
            if (product.stock < quantity) {
                return NextResponse.json(
                    { success: false, message: `Only ${product.stock} items available` },
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

            actualPrice = discountedPrice;
            itemTax = product.tax || 0;
            itemTaxType = product.taxType || 'percentage';

            await Product.findByIdAndUpdate(productId, {
                $inc: { stock: -quantity, soldCount: quantity }
            });
        }

        const unitProductCost = snapshotUnitProductCost(product, matchedVariantForCost);
        const orderProducts = [{
            productId: product._id,
            title,
            price: actualPrice,
            quantity,
            image: product.images?.[0] || '',
            variant: variant || {},
            tax: itemTax,
            taxType: itemTaxType,
            ...(unitProductCost !== undefined ? { unitProductCost } : {}),
        }];

        const subtotal = actualPrice * quantity;
        const totalTax = itemTaxType === 'percentage'
            ? (actualPrice * itemTax / 100) * quantity
            : itemTax * quantity;

        // Fetch shipping charge from settings
        const settings = await Settings.findOne();
        const baseShippingCost = customerInfo?.deliveryLocation === 'outside'
            ? (settings?.shippingChargeOutsideDhaka ?? 120)
            : (settings?.shippingChargeInsideDhaka ?? 60);

        let landingFreeShipping = false;
        if (landingPageId) {
            const landing = await LandingPage.findById(landingPageId).select('freeShipping').lean();
            landingFreeShipping = !!landing?.freeShipping;
        }

        const shippingCost = landingFreeShipping || product.freeShipping ? 0 : baseShippingCost;

        const totalAmount = Math.max(0, subtotal + totalTax + shippingCost);
        const seq = await getNextSequence('orderId');
        const orderId = String(seq).padStart(6, '0');

        const order = await Order.create({
            orderId,
            customerInfo: {
                name: customerInfo.name,
                phone: customerInfo.phone,
                email: customerInfo.email || '',
                address: customerInfo.address,
                city: customerInfo.city || '',
                notes: customerInfo.notes || 'Landing Page Order',
            },
            products: orderProducts,
            subtotal,
            shippingCost,
            taxAmount: totalTax,
            discountAmount: 0,
            totalAmount,
            paymentMethod: 'COD',
            paymentStatus: 'Pending',
            orderStatus: 'Pending',
            source: 'landing',
            ipAddress,
        });

        // Increment landing page orders counter
        if (landingPageId) {
            await LandingPage.findByIdAndUpdate(landingPageId, { $inc: { orders: 1 } });
        }

        // Send Email (async)
        if (order.customerInfo.email) {
            sendOrderConfirmationEmail(order).catch(err => console.error('Landing Email trigger error:', err));
        }

        // Meta CAPI: Send Purchase Event
        sendCapiPurchase({
            eventID: `purchase_${order.orderId}`,
            orderId: order.orderId,
            totalAmount: order.totalAmount,
            customerInfo: order.customerInfo,
            products: order.products.map((p: any) => ({
                productId: String(p.productId),
                quantity: p.quantity,
                price: p.price
            })),
            ipAddress,
            userAgent: request.headers.get('user-agent') || '',
            sourceUrl: request.headers.get('referer') || '',
        }).catch(err => console.error('Meta Landing CAPI trigger error:', err));

        return NextResponse.json({
            success: true,
            message: 'Order placed successfully!',
            order: {
                orderId: order.orderId,
                totalAmount: order.totalAmount,
                _id: order._id,
            },
        });
    } catch (error) {
        console.error('Landing Page Order Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
