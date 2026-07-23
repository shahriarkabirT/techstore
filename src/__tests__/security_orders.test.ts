import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as createOrder } from '@/app/api/orders/route';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Settings from '@/models/Settings';
import Coupon from '@/models/Coupon';
import * as authLib from '@/lib/auth';
import * as validatorLib from '@/lib/validators';
import * as utilsLib from '@/lib/utils';

// Mock Dependencies
vi.mock('@/lib/db', () => ({ default: vi.fn() }));
vi.mock('@/models/Order');
vi.mock('@/models/Product');
vi.mock('@/models/Settings');
vi.mock('@/models/Coupon');
vi.mock('@/lib/auth');
vi.mock('@/lib/validators');
vi.mock('@/lib/utils');

describe('Order Manipulation Security Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should IGNORE client-side discountAmount manipulation', async () => {
        // Mock valid checkout data
        (validatorLib.validateCheckoutData as any).mockReturnValue({ valid: true });

        // Mock a product with price 100
        (Product.findById as any).mockResolvedValue({
            _id: 'p1',
            title: 'Genuine Product',
            price: 100,
            stock: 10,
            isActive: true,
            images: ['img1.jpg'],
        });

        // Mock settings with default shipping 60
        (Settings.findOne as any).mockResolvedValue({ shippingCharge: 60 });
        // No coupon mock returning null to simulate no valid coupon
        (Coupon.findOne as any).mockResolvedValue(null);

        (utilsLib.generateOrderId as any).mockReturnValue('ORD_SECURE_1');
        (authLib.getUserFromToken as any).mockResolvedValue(null);

        const maliciousPayload = {
            customerInfo: { name: 'Attacker', phone: '01711111111', address: 'Nowhere' },
            items: [{ productId: 'p1', quantity: 1 }],
            paymentMethod: 'COD',
            discountAmount: 90, // <--- MANIPULATION
            shippingCost: 0,
            taxAmount: 0
        };

        let capturedOrderData: any = null;
        (Order.create as any).mockImplementation((data: any) => {
            capturedOrderData = data;
            return { orderId: data.orderId, totalAmount: data.totalAmount };
        });

        const request = new Request('http://localhost/api/orders', {
            method: 'POST',
            body: JSON.stringify(maliciousPayload),
        });

        await createOrder(request as any);

        // SECURE EXPECTATION: subtotal (100) + shipping (60) - discount (0, ignored client input) = 160
        expect(capturedOrderData.totalAmount).toBe(160);
        expect(capturedOrderData.discountAmount).toBe(0);
        console.log('SUCCESS: Server ignored malicious discountAmount.');
    });

    it('should IGNORE client-side shippingCost manipulation', async () => {
        (validatorLib.validateCheckoutData as any).mockReturnValue({ valid: true });
        (Product.findById as any).mockResolvedValue({
            _id: 'p1',
            title: 'Genuine Product',
            price: 100,
            stock: 10,
            isActive: true,
        });

        (Settings.findOne as any).mockResolvedValue({ shippingCharge: 60 });
        (utilsLib.generateOrderId as any).mockReturnValue('ORD_SECURE_2');

        const maliciousPayload = {
            customerInfo: { name: 'Attacker', phone: '01711111111', address: 'Nowhere' },
            items: [{ productId: 'p1', quantity: 1 }],
            paymentMethod: 'COD',
            shippingCost: -50, // <--- MANIPULATION
        };

        let capturedOrderData: any = null;
        (Order.create as any).mockImplementation((data: any) => {
            capturedOrderData = data;
            return { orderId: data.orderId, totalAmount: data.totalAmount };
        });

        const request = new Request('http://localhost/api/orders', {
            method: 'POST',
            body: JSON.stringify(maliciousPayload),
        });

        await createOrder(request as any);

        // SECURE EXPECTATION: subtotal (100) + server shipping (60) = 160
        expect(capturedOrderData.totalAmount).toBe(160);
        expect(capturedOrderData.shippingCost).toBe(60);
        console.log('SUCCESS: Server ignored malicious shippingCost.');
    });
});
