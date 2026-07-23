import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import LandingPage from '@/models/LandingPage';
import Product from '@/models/Product';
import Fraud from '@/models/Fraud';
import { generateOrderId } from '@/lib/utils';
import { getNextSequence } from '@/models/Counter';
import { snapshotUnitProductCost } from '@/lib/orderUnitCost';
import { validateCheckoutData } from '@/lib/validators';
import { requirePermission, getUserFromToken } from '@/lib/auth';
import Coupon from '@/models/Coupon';
import Settings from '@/models/Settings';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { sendCapiPurchase } from '@/lib/meta-capi';
import { sendTelegramNotification } from '@/lib/telegram';

// GET all orders (admin only)
export async function GET(request: { url: string | URL; }) {
    try {
        const admin = await requirePermission('orders');
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const paymentStatus = searchParams.get('paymentStatus');
        const archived = searchParams.get('archived') === 'true';
        const search = searchParams.get('search')?.trim();
        const isPreorder = searchParams.get('isPreorder') === 'true';
        const source = searchParams.get('source');
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 20;

        const query: Record<string, unknown> = {
            isArchived: archived
        };

        if (isPreorder) {
            query.isPreorder = true;
        }

        if (search) {
            const regex = new RegExp(search, 'i');
            query.$or = [
                { orderId: regex },
                { 'customerInfo.name': regex },
                { 'customerInfo.phone': regex }
            ];
        }

        if (status) {
            query.orderStatus = status;
        }

        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }

        if (source && ['online', 'pos', 'landing'].includes(source)) {
            query.source = source;
        }

        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get Orders Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// POST create order (guest checkout)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { customerInfo, items, paymentMethod, shippingCost = 0, taxAmount = 0, discountAmount = 0, couponCode, landingPageId } = body;

        // Validate checkout data
        const validation = validateCheckoutData({
            ...customerInfo,
            paymentMethod,
        });

        if (!validation.valid) {
            return NextResponse.json(
                { success: false, message: 'Validation failed', errors: validation.errors },
                { status: 400 }
            );
        }

        if (!items || items.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Cart is empty' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Fraud check IP and Phone
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

        // Build order products and validate stock/preorder status
        const orderProducts = [];
        let subtotal = 0;

        let hasFreeShippingItem = false;

        console.log('Order Items Received:', JSON.stringify(items, null, 2));

        for (const item of items) {
            const rawPid = item.productId || item._id || item.id;
            const pid = typeof rawPid === 'string' ? rawPid.trim() : rawPid;
            const itemTitle = item.title || item.name || 'Unknown Item';
            
            console.log(`Processing item: ${itemTitle}, PID: ${pid} (${typeof pid})`);

            if (!pid) {
                return NextResponse.json(
                    { success: false, message: `Product ID is missing for item: ${itemTitle}` },
                    { status: 400 }
                );
            }

            let product = await Product.findById(pid).lean();
            
            if (!product) {
                console.log(`Product not found by ID. Checking variant ID...`);
                product = await Product.findOne({ "variants._id": pid }).lean();
            }

            if (!product) {
                const totalProds = await Product.countDocuments();
                console.log(`Product NOT found. Total products in DB: ${totalProds}`);
                return NextResponse.json(
                    { success: false, message: `Product not found: ${pid} (Total Products in DB: ${totalProds})` },
                    { status: 400 }
                );
            }
            
            console.log(`Product found: ${product.title}`);

            if (product.freeShipping) {
                hasFreeShippingItem = true;
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

            let isItemPreorder = false;
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
                    if (product.preorder) {
                        isItemPreorder = true;
                    } else {
                        return NextResponse.json(
                            { success: false, message: `Insufficient stock for variant: ${product.title}` },
                            { status: 400 }
                        );
                    }
                }

                actualPrice = variant.price;
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

                // Update variant stock atomically (if enough stock exists)
                if (variant.stock >= item.quantity) {
                    await Product.updateOne(
                        { _id: product._id, 'variants._id': variant._id },
                        { $inc: { 'variants.$.stock': -item.quantity, stock: -item.quantity, soldCount: item.quantity } }
                    );
                } else if (isItemPreorder) {
                    // Preorder case: update soldCount and possibly main stock but not specific variant if it's already 0
                    await Product.updateOne(
                        { _id: product._id },
                        { $inc: { soldCount: item.quantity } }
                    );
                }
            } else {
                if (product.stock < item.quantity) {
                    if (product.preorder) {
                        isItemPreorder = true;
                    } else {
                        return NextResponse.json(
                            { success: false, message: `Insufficient stock for: ${product.title}` },
                            { status: 400 }
                        );
                    }
                }

                actualPrice = product.discountedPrice || product.price || 0;
                itemTax = product.tax || 0;
                itemTaxType = product.taxType || 'percentage';

                // Update product stock atomically
                if (product.stock >= item.quantity) {
                    await Product.findByIdAndUpdate(item.productId, {
                        $inc: { stock: -item.quantity, soldCount: item.quantity }
                    });
                } else if (isItemPreorder) {
                    await Product.findByIdAndUpdate(item.productId, {
                        $inc: { soldCount: item.quantity }
                    });
                }
            }

            const unitProductCost = snapshotUnitProductCost(product, matchedVariantForCost);
            orderProducts.push({
                productId: product._id,
                title: title,
                price: actualPrice,
                quantity: item.quantity,
                image: product.images?.[0] || '',
                variant: item.variant || {},
                tax: itemTax,
                taxType: itemTaxType,
                isPreorder: isItemPreorder,
                ...(unitProductCost !== undefined ? { unitProductCost } : {}),
            });

            subtotal += actualPrice * item.quantity;
        }

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

        const serverShippingCost = landingFreeShipping || hasFreeShippingItem ? 0 : baseShippingCost;

        // Calculate discount server-side if coupon code exists
        let serverDiscountAmount = 0;
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });

            if (coupon) {
                // Validate coupon validity
                const now = new Date();
                const isStarted = !coupon.startDate || coupon.startDate <= now;
                const isNotExpired = !coupon.expiryDate || coupon.expiryDate >= now;
                const underLimit = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit;
                const minMet = subtotal >= coupon.minOrderAmount;

                if (isStarted && isNotExpired && underLimit && minMet) {
                    if (coupon.discountType === 'percentage') {
                        serverDiscountAmount = (subtotal * coupon.discountValue) / 100;
                        if (coupon.maxDiscountAmount && serverDiscountAmount > coupon.maxDiscountAmount) {
                            serverDiscountAmount = coupon.maxDiscountAmount;
                        }
                    } else {
                        serverDiscountAmount = coupon.discountValue;
                    }
                }
            }
        }

        const totalAmount = Math.max(0, subtotal + serverShippingCost + taxAmount - serverDiscountAmount);
        const seq = await getNextSequence('orderId');
        const orderId = String(seq).padStart(6, '0');
        const user = await getUserFromToken();

        const orderCustomerInfo = landingPageId
            ? {
                  ...customerInfo,
                  notes: customerInfo.notes?.trim()
                      ? `${customerInfo.notes.trim()} (Landing Page Order)`
                      : 'Landing Page Order',
              }
            : customerInfo;

        const order = await Order.create({
            orderId,
            user: user?.id,
            customerInfo: orderCustomerInfo,
            products: orderProducts,
            subtotal,
            shippingCost: serverShippingCost,
            taxAmount,
            discountAmount: serverDiscountAmount,
            couponCode,
            totalAmount,
            paymentMethod,
            paymentStatus: 'Pending',
            orderStatus: 'Pending',
            isPreorder: orderProducts.some(p => p.isPreorder),
            source: landingPageId ? 'landing' : 'online',
            ipAddress,
        });

        if (landingPageId) {
            await LandingPage.findByIdAndUpdate(landingPageId, { $inc: { orders: 1 } });
        }

        // Increment coupon usage if coupon code was valid
        if (couponCode && serverDiscountAmount > 0) {
            await Coupon.findOneAndUpdate(
                { code: couponCode.toUpperCase() },
                { $inc: { usedCount: 1 } }
            );
        }

        // Send Email (async)
        if (customerInfo.email) {
            sendOrderConfirmationEmail(order).catch(err => console.error('Email trigger error:', err));
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
        }).catch(err => console.error('Meta CAPI trigger error:', err));

        // Send Telegram Notification (async)
        const telegramMessage = `🛒 <b>New Order Received!</b>\n\n<b>Order ID:</b> #${order.orderId}\n<b>Customer:</b> ${order.customerInfo.name}\n<b>Phone:</b> ${order.customerInfo.phone}\n<b>Amount:</b> ৳${order.totalAmount}\n<b>Method:</b> ${order.paymentMethod}\n<b>Source:</b> ${landingPageId ? 'Landing Page' : 'Website'}`;
        sendTelegramNotification(telegramMessage).catch(err => console.error('Telegram trigger error:', err));

        return NextResponse.json({
            success: true,
            message: 'Order created successfully',
            order: {
                orderId: order.orderId,
                totalAmount: order.totalAmount,
                paymentMethod: order.paymentMethod,
                _id: order._id,
            },
        });
    } catch (error) {
        console.error('Create Order Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
