import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as validateCoupon } from '@/app/api/coupons/validate/route';
import Coupon from '@/models/Coupon';

// Mock Dependencies
vi.mock('@/lib/db', () => ({ default: vi.fn() }));
vi.mock('@/models/Coupon');

describe('Coupons API Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/coupons/validate', () => {
        it('should validate a valid percentage coupon', async () => {
            (Coupon.findOne as any).mockResolvedValue({
                code: 'SAVE10',
                isActive: true,
                discountType: 'percentage',
                discountValue: 10,
                minOrderAmount: 100,
            });

            const request = new Request('http://localhost/api/coupons/validate', {
                method: 'POST',
                body: JSON.stringify({ code: 'SAVE10', cartTotal: 200 }),
            });

            const response = await validateCoupon(request);
            const result = await response.json();

            expect(result.success).toBe(true);
            expect(result.data.discount).toBe(20);
        });

        it('should return 400 if cart total is below minOrderAmount', async () => {
            (Coupon.findOne as any).mockResolvedValue({
                code: 'SAVE10',
                isActive: true,
                minOrderAmount: 500,
            });

            const request = new Request('http://localhost/api/coupons/validate', {
                method: 'POST',
                body: JSON.stringify({ code: 'SAVE10', cartTotal: 200 }),
            });

            const response = await validateCoupon(request);
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.message).toContain('Minimum order amount');
        });

        it('should return 400 if coupon is expired', async () => {
            (Coupon.findOne as any).mockResolvedValue({
                code: 'EXPIRED',
                isActive: true,
                expiryDate: new Date(Date.now() - 100000), // In the past
            });

            const request = new Request('http://localhost/api/coupons/validate', {
                method: 'POST',
                body: JSON.stringify({ code: 'EXPIRED', cartTotal: 1000 }),
            });

            const response = await validateCoupon(request);
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.message).toBe('Coupon has expired');
        });
    });
});
