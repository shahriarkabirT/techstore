import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as paymentSuccessPost } from '@/app/api/payment/success/route';
import Order from '@/models/Order';
import * as aamarpayLib from '@/lib/aamarpay';

// Mock Dependencies
vi.mock('@/lib/db', () => ({ default: vi.fn() }));
vi.mock('@/models/Order');
vi.mock('@/lib/aamarpay');
vi.mock('@/lib/env', () => ({
    default: {
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    },
}));

describe('Payment Callback API Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/payment/success', () => {
        it('should redirect to order confirmation on successful payment', async () => {
            const formData = new FormData();
            formData.append('mer_txnid', 'ORD123');
            formData.append('pay_status', 'Successful');

            const mockOrder = {
                orderId: 'ORD123',
                save: vi.fn().mockResolvedValue({}),
            };
            (Order.findOne as any).mockResolvedValue(mockOrder);
            (aamarpayLib.verifyAamarPayPayment as any).mockResolvedValue({
                success: true,
                status: 'Paid',
                transactionId: 'TXN123',
            });

            const request = new Request('http://localhost/api/payment/success', {
                method: 'POST',
                body: formData,
            });

            const response = await paymentSuccessPost(request as any);

            expect(response.status).toBe(307); // Redirect
            expect(response.headers.get('location')).toContain('/order-confirmation/ORD123?status=success');
            expect(mockOrder.save).toHaveBeenCalled();
        });

        it('should redirect to fail page if verification fails', async () => {
            const formData = new FormData();
            formData.append('mer_txnid', 'ORD123');

            (Order.findOne as any).mockResolvedValue({ orderId: 'ORD123', save: vi.fn() });
            (aamarpayLib.verifyAamarPayPayment as any).mockResolvedValue({
                success: false,
            });

            const request = new Request('http://localhost/api/payment/success', {
                method: 'POST',
                body: formData,
            });

            const response = await paymentSuccessPost(request as any);

            expect(response.headers.get('location')).toContain('/payment/fail');
        });
    });
});
