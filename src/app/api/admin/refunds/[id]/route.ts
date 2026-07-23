import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Refund from '@/models/Refund';
import Order from '@/models/Order';
import { requirePermission } from '@/lib/auth';
import { CourierFactory } from '@/lib/couriers/factory';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('refunds');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;
        const body = await request.json();
        const { status, adminNotes } = body;

        if (!status) {
            return NextResponse.json({ success: false, message: 'Status is required' }, { status: 400 });
        }

        await dbConnect();

        const refund = await Refund.findById(id);
        if (!refund) {
            return NextResponse.json({ success: false, message: 'Refund not found' }, { status: 404 });
        }

        refund.status = status;
        if (adminNotes !== undefined) {
            refund.adminNotes = adminNotes;
        }

        // ── Auto-trigger courier return request on "approved" ──
        if (status === 'approved') {
            const order = await Order.findById(refund.orderId);
            if (order) {
                const courierName = order.paymentDetails?.courier as string | undefined;
                const trackingId = order.paymentDetails?.trackingId as string | undefined;

                if (courierName && trackingId) {
                    try {
                        const courierService = await CourierFactory.getService(courierName);

                        if (courierService?.createReturnRequest) {
                            const result = await courierService.createReturnRequest({
                                trackingCode: trackingId,
                                invoice: order.orderId,
                                reason: refund.reason,
                            });

                            if (result.success) {
                                refund.courierReturn = {
                                    courierName: courierName,
                                    returnRequestId: result.returnRequestId,
                                    courierStatus: result.status || 'pending',
                                    sentAt: new Date(),
                                    lastCheckedAt: new Date(),
                                };
                            } else {
                                // Log warning but don't block the refund approval
                                console.warn(`[COURIER_RETURN_WARNING] Failed to create return request on ${courierName}: ${result.message}`);
                            }
                        }
                    } catch (courierError) {
                        // Non-blocking: courier return is best-effort
                        console.error('[COURIER_RETURN_ERROR]', courierError);
                    }
                }
            }
        }

        // ── Note: The Order system is intentionally separated from the Refund system. 
        // We do not auto-update orderStatus or paymentStatus here. Admins manage those manually.

        await refund.save();

        return NextResponse.json({ success: true, refund });

    } catch (error) {
        console.error('[ADMIN_REFUND_PUT_ERROR]', error);
        return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('refunds');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;
        await dbConnect();

        const deletedRefund = await Refund.findByIdAndDelete(id);
        if (!deletedRefund) {
            return NextResponse.json({ success: false, message: 'Refund request not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Refund request deleted successfully' });
    } catch (error) {
        console.error('[ADMIN_REFUND_DELETE_ERROR]', error);
        return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
    }
}
