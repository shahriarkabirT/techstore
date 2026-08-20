import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Fraud from '@/models/Fraud';
import { requirePermission, getUserFromToken } from '@/lib/auth';
import Product from '@/models/Product';
import AffiliateTransaction from '@/models/AffiliateTransaction';
import User from '@/models/User';

// GET single order
export async function GET(request, { params }) {
    try {
        await dbConnect();

        const { id } = await params;

        // Find by _id or orderId
        let order;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            order = await Order.findById(id);
        } else {
            order = await Order.findOne({ orderId: id });
        }

        if (!order) {
            return NextResponse.json(
                { success: false, message: 'Order not found' },
                { status: 404 }
            );
        }

        // Authorization check
        const admin = await requirePermission('orders');
        const user = await getUserFromToken();

        const isOwner = user && order.user && order.user.toString() === user.id;
        const isAdmin = !!admin;

        if (!isOwner && !isAdmin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized access to order details' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            order,
        });
    } catch (error) {
        console.error('Get Order Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// PUT update order status (admin only)
export async function PUT(request, { params }) {
    try {
        const admin = await requirePermission('orders');
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        const { 
            orderStatus, paymentStatus, isArchived, customerInfo, shippingCost,
            advancePaid, advancePaymentMethod, advancePaymentRef, adminNote
        } = body;

        await dbConnect();

        const order = await Order.findById(id);
        if (!order) {
            return NextResponse.json(
                { success: false, message: 'Order not found' },
                { status: 404 }
            );
        }

        if (orderStatus) {
            const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Partially Delivered', 'Cancelled', 'Returned', 'Blocked'];
            if (!validStatuses.includes(orderStatus)) {
                return NextResponse.json(
                    { success: false, message: 'Invalid order status' },
                    { status: 400 }
                );
            }
            if ((orderStatus === 'Returned' || orderStatus === 'Cancelled') && 
                !['Returned', 'Cancelled'].includes(order.orderStatus) && 
                order.paymentStatus !== 'Refunded' &&
                !order.refundDetails?.restocked
            ) {
                for (const item of order.products) {
                    const product = await Product.findById(item.productId);
                    if (product) {
                        product.stock += item.quantity;
                        product.soldCount = Math.max(0, product.soldCount - item.quantity);

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
                
                if (orderStatus === 'Returned' || (order.paymentStatus !== 'Pending' && order.paymentStatus !== 'Failed')) {
                    order.paymentStatus = 'Refunded';
                }
                order.refundDetails = {
                    reason: `Manual Status Change to ${orderStatus}`,
                    restocked: true,
                    refundedAt: new Date()
                };
            }

            order.orderStatus = orderStatus;

            // --- Affiliate Logic ---
            if (order.affiliateId) {
                if (orderStatus === 'Delivered') {
                    const transaction = await AffiliateTransaction.findOne({ orderId: order._id, status: 'pending' });
                    if (transaction) {
                        transaction.status = 'cleared';
                        await transaction.save();
                        
                        await User.findByIdAndUpdate(order.affiliateId, {
                            $inc: { affiliateBalance: transaction.amount, totalAffiliateEarnings: transaction.amount }
                        });
                    }
                } else if (orderStatus === 'Returned' || orderStatus === 'Cancelled') {
                    await AffiliateTransaction.findOneAndUpdate(
                        { orderId: order._id, status: 'pending' },
                        { status: 'cancelled' }
                    );
                }
            }
            // -----------------------

            if (orderStatus === 'Blocked') {
                // Automated Fraud Propagation
                const existing = await Fraud.findOne({ phone: order.customerInfo.phone });
                if (!existing) {
                    await Fraud.create({
                        phone: order.customerInfo.phone,
                        ip: order.ipAddress || '',
                        name: order.customerInfo.name || 'Unknown User',
                        status: 'blocked',
                        reason: `Automatically Blocked via Order #${order.orderId}`
                    });
                }
            }
        }

        if (paymentStatus) {
            const validPaymentStatuses = ['Pending', 'Paid', 'Failed', 'Refunded', 'Delivery Charge Paid'];
            if (!validPaymentStatuses.includes(paymentStatus)) {
                return NextResponse.json(
                    { success: false, message: 'Invalid payment status' },
                    { status: 400 }
                );
            }
            order.paymentStatus = paymentStatus;
        }

        if (typeof isArchived === 'boolean') {
            order.isArchived = isArchived;
        }

        if (customerInfo) {
            order.customerInfo = {
                ...order.customerInfo,
                ...customerInfo,
            };
        }

        if (typeof shippingCost === 'number') {
            order.shippingCost = shippingCost;
            order.totalAmount = order.subtotal + order.shippingCost + (order.taxAmount || 0) - (order.discountAmount || 0);
        }

        if (advancePaid !== undefined) {
            order.advancePaid = advancePaid;
        }
        if (advancePaymentMethod !== undefined) {
            order.advancePaymentMethod = advancePaymentMethod;
        }
        if (advancePaymentRef !== undefined) {
            order.advancePaymentRef = advancePaymentRef;
        }
        
        if (adminNote !== undefined) {
            order.adminNote = adminNote;
        }

        await order.save();

        return NextResponse.json({
            success: true,
            message: 'Order updated successfully',
            order,
        });
    } catch (error) {
        console.error('Update Order Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

// DELETE permanently delete an order (admin only, archived orders only)
export async function DELETE(request, { params }) {
    try {
        const admin = await requirePermission('orders');
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;
        await dbConnect();

        const order = await Order.findById(id);
        if (!order) {
            return NextResponse.json(
                { success: false, message: 'Order not found' },
                { status: 404 }
            );
        }

        // Safety guard: only allow permanent delete if the order is archived
        if (!order.isArchived) {
            return NextResponse.json(
                { success: false, message: 'Only archived orders can be permanently deleted. Archive the order first.' },
                { status: 400 }
            );
        }

        await Order.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: `Order #${order.orderId} permanently deleted`,
        });
    } catch (error) {
        console.error('Delete Order Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
