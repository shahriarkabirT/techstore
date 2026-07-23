import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { IOrderDocument, IOrderItem } from '@/types';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const admin = await requirePermission('orders');
        if (!admin || !['admin', 'superadmin'].includes(admin.role)) {
            return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 401 });
        }

        const { reason, restock } = await req.json();

        await dbConnect();

        const order = await Order.findById(id).populate('products.productId');
        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        // Check if already refunded
        if (order.paymentStatus === 'Refunded' || order.orderStatus === 'Returned') {
            return NextResponse.json({ success: false, message: 'Order is already refunded or returned' }, { status: 400 });
        }

        // Restocking logic
        if (restock) {
            // we will go through each product in the order and increment its stock
            for (const item of order.products) {
                // If the product still exists in db
                const product = await Product.findById(item.productId);
                if (product) {
                    // Update total stock
                    product.stock += item.quantity;
                    // Update sold count
                    product.soldCount = Math.max(0, product.soldCount - item.quantity);

                    // Update variant stock if the item has variant specifically chosen
                    if (item.variant && Object.keys(item.variant).length > 0) {
                        const variant = product.variants.find((v: any) => {
                            if (item.variant._id && v._id && item.variant._id.toString() === v._id.toString()) return true;
                            if (item.variant.id && v._id && item.variant.id.toString() === v._id.toString()) return true;
                            
                            const itemVar = item.variant.attributes || item.variant;
                            const hasAttributes = v.attributes && (typeof v.attributes.get === 'function' ? v.attributes.size > 0 : Object.keys(v.attributes).length > 0);
                            if (hasAttributes) {
                                return Object.entries(itemVar).every(([slug, val]) => {
                                    if (['colorCode', 'tax', 'taxType', 'isPreorder', 'unitProductCost', '_id', 'id', 'price', 'stock', 'image', 'sku'].includes(slug)) return true;
                                    const getAttr = (k: string) => typeof v.attributes.get === 'function' ? v.attributes.get(k) : v.attributes[k];
                                    
                                    if (slug.toLowerCase() === 'model') {
                                        return !getAttr('model') || getAttr('model') === val || getAttr('Model') === val;
                                    }
                                    return getAttr(slug) === val || getAttr(slug.toLowerCase()) === val || getAttr(slug.charAt(0).toUpperCase() + slug.slice(1)) === val;
                                });
                            }
                            return false;
                        });

                        if (variant) {
                            variant.stock += item.quantity;
                        }
                    }

                    await product.save();
                }
            }
        }

        // Update the order itself
        order.paymentStatus = 'Refunded';
        order.orderStatus = 'Returned';
        order.refundDetails = {
            reason: reason || 'N/A',
            restocked: Boolean(restock),
            refundedAt: new Date()
        };

        await order.save();

        return NextResponse.json({ success: true, order });

    } catch (error: any) {
        console.error('Error processing refund:', error);
        return NextResponse.json({ success: false, message: error?.message || 'Error processing refund' }, { status: 500 });
    }
}
