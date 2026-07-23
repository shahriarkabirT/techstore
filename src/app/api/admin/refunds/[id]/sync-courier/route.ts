import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Refund from '@/models/Refund';
import Order from '@/models/Order';
import { requirePermission } from '@/lib/auth';
import { CourierFactory } from '@/lib/couriers/factory';
import { RedXService } from '@/lib/couriers/redx/service';

/**
 * POST /api/admin/refunds/[id]/sync-courier
 * Re-syncs the courier-side return request status for a given refund.
 * Supports both Steadfast (ID-based) and RedX (tracking-based) approaches.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requirePermission('refunds');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;

        await dbConnect();

        const refund = await Refund.findById(id);
        if (!refund) {
            return NextResponse.json({ success: false, message: 'Refund not found' }, { status: 404 });
        }

        if (!refund.courierReturn?.courierName) {
            return NextResponse.json({
                success: false,
                message: 'No courier return request linked to this refund'
            }, { status: 400 });
        }

        const courierService = await CourierFactory.getService(refund.courierReturn.courierName);
        if (!courierService) {
            return NextResponse.json({
                success: false,
                message: `Courier '${refund.courierReturn.courierName}' is not available`
            }, { status: 400 });
        }

        let result;

        // RedX: use tracking-based status check since it has no return request IDs
        if (refund.courierReturn.courierName === 'redx') {
            const order = await Order.findById(refund.orderId);
            const trackingId = order?.paymentDetails?.trackingId as string | undefined;

            if (!trackingId) {
                return NextResponse.json({
                    success: false,
                    message: 'No tracking ID found on order for RedX sync'
                }, { status: 400 });
            }

            result = await (courierService as RedXService).getReturnStatusByTracking(trackingId);
        } else {
            // Steadfast and others: use numeric return request ID
            if (!refund.courierReturn.returnRequestId || !courierService.getReturnRequest) {
                return NextResponse.json({
                    success: false,
                    message: 'Return request ID missing or courier does not support return status checks'
                }, { status: 400 });
            }
            result = await courierService.getReturnRequest(refund.courierReturn.returnRequestId);
        }

        if (result.success && result.status) {
            refund.courierReturn.courierStatus = result.status;
            refund.courierReturn.lastCheckedAt = new Date();
            await refund.save();

            return NextResponse.json({
                success: true,
                courierStatus: result.status,
                lastCheckedAt: refund.courierReturn.lastCheckedAt,
                message: result.message,
            });
        }

        return NextResponse.json({
            success: false,
            message: result.message || 'Failed to sync courier status'
        }, { status: 400 });

    } catch (error) {
        console.error('[SYNC_COURIER_RETURN_ERROR]', error);
        return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
    }
}

