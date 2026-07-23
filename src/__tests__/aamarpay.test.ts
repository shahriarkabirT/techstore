import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initAamarPayPayment, verifyAamarPayPayment } from '@/lib/aamarpay';

// Mock env
vi.mock('@/lib/env', () => ({
    default: {
        AAMARPAY_STORE_ID: 'test_store',
        AAMARPAY_SIGNATURE_KEY: 'test_signature',
        AAMARPAY_API_URL: 'https://sandbox.aamarpay.com/jsonpost.php',
        AAMARPAY_VERIFY_URL: 'https://sandbox.aamarpay.com/verify.php',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    },
}));

// Mock fetch
global.fetch = vi.fn();

describe('AamarPay Integration (src/lib/aamarpay.ts)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('initAamarPayPayment', () => {
        const orderData = {
            orderId: 'ORD123',
            amount: 1000,
            customerName: 'John Doe',
            customerEmail: 'john@example.com',
            customerPhone: '01700000000',
            customerAddress: 'Dhaka, Bangladesh',
        };

        it('should return paymentUrl on successful initialization', async () => {
            (fetch as any).mockResolvedValue({
                json: vi.fn().mockResolvedValue({
                    result: 'true',
                    payment_url: 'https://payment.aamarpay.com/pay/123',
                }),
            });

            const result = await initAamarPayPayment(orderData);

            expect(result.success).toBe(true);
            expect(result.paymentUrl).toBe('https://payment.aamarpay.com/pay/123');
            expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('ORD123'),
            }));
        });

        it('should return error when AamarPay returns result=false', async () => {
            (fetch as any).mockResolvedValue({
                json: vi.fn().mockResolvedValue({
                    result: 'false',
                    message: 'Invalid signature',
                }),
            });

            const result = await initAamarPayPayment(orderData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid signature');
        });

        it('should handle fetch errors', async () => {
            (fetch as any).mockRejectedValue(new Error('Network error'));

            const result = await initAamarPayPayment(orderData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Payment gateway error');
        });
    });

    describe('verifyAamarPayPayment', () => {
        it('should return success set to true on successful verification', async () => {
            (fetch as any).mockResolvedValue({
                json: vi.fn().mockResolvedValue({
                    pay_status: 'Successful',
                    mer_txnid: 'ORD123',
                    amount: '1000.00',
                }),
            });

            const result = await verifyAamarPayPayment('TXN123');

            expect(result.success).toBe(true);
            expect(result.status).toBe('Paid');
            expect(result.transactionId).toBe('ORD123');
            expect(result.amount).toBe(1000);
        });

        it('should return success set to false on failed verification', async () => {
            (fetch as any).mockResolvedValue({
                json: vi.fn().mockResolvedValue({
                    pay_status: 'Failed',
                }),
            });

            const result = await verifyAamarPayPayment('TXN123');

            expect(result.success).toBe(false);
            expect(result.status).toBe('Failed');
        });

        it('should handle fetch errors during verification', async () => {
            (fetch as any).mockRejectedValue(new Error('Network error'));

            const result = await verifyAamarPayPayment('TXN123');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Verification failed');
        });
    });
});
