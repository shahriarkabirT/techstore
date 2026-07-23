import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as posCheckout } from '@/app/api/pos/checkout/route';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Coupon from '@/models/Coupon';
import * as authLib from '@/lib/auth';
import * as utilsLib from '@/lib/utils';

// Mock Dependencies
vi.mock('@/lib/db', () => ({ default: vi.fn() }));
vi.mock('@/models/Order');
vi.mock('@/models/Product');
vi.mock('@/models/Coupon');
vi.mock('@/lib/auth');
vi.mock('@/lib/utils');

describe('POS Checkout API - Variants', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (authLib.getAdminFromToken as any).mockResolvedValue({ id: 'admin1' });
        (utilsLib.generateOrderId as any).mockReturnValue('POS-123');
        (Coupon.findOne as any).mockResolvedValue(null);
    });

    const createRequest = (body: any) => {
        return new Request('http://localhost/api/pos/checkout', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    };

    it('should correctly calculate variant percentage discount', async () => {
        const payload = {
            items: [{
                productId: 'p1',
                title: 'Shirt',
                quantity: 2,
                variant: { Color: 'Red' }
            }],
            customerInfo: { name: '', phone: '' },
            paymentMethod: 'Cash',
            amountTendered: 300
        };

        const mockProduct = {
            _id: 'p1',
            title: 'Shirt',
            isActive: true,
            variants: [{
                _id: 'v1',
                colorName: 'Red',
                stock: 10,
                mrp: 200,
                price: 200,
                discountType: 'percentage',
                discountValue: 25, // 25% off 200 = 150
                tax: 0,
                taxType: 'percentage'
            }]
        };

        (Product.findById as any).mockResolvedValue(mockProduct);
        (Product.updateOne as any).mockResolvedValue({ modifiedCount: 1 });
        (Order.create as any).mockImplementation((data: any) => Promise.resolve({ _id: 'o1', ...data, createdAt: new Date() }));

        const res = await posCheckout(createRequest(payload));
        const data = await res.json();

        expect(data.success).toBe(true);
        expect(Product.updateOne).toHaveBeenCalledWith(
            { _id: 'p1', 'variants._id': 'v1' },
            { $inc: { 'variants.$.stock': -2, stock: -2 } }
        );

        const orderArgs = (Order.create as any).mock.calls[0][0];
        // subtotal = 150 * 2 = 300
        expect(orderArgs.subtotal).toBe(300);
        expect(orderArgs.totalAmount).toBe(300);
    });

    it('should correctly calculate variant flat discount', async () => {
        const payload = {
            items: [{
                productId: 'p1',
                title: 'Shirt',
                quantity: 1,
                variant: { Color: 'Blue' }
            }],
            customerInfo: { name: '', phone: '' },
            paymentMethod: 'Card',
            amountTendered: 150
        };

        const mockProduct = {
            _id: 'p1',
            title: 'Shirt',
            isActive: true,
            variants: [{
                _id: 'v2',
                colorName: 'Blue',
                stock: 5,
                mrp: 200,
                price: 200,
                discountType: 'flat',
                discountValue: 50, // 200 - 50 = 150
                tax: 5, // 5% flat tax? No, flat tax of 5
                taxType: 'flat'
            }]
        };

        (Product.findById as any).mockResolvedValue(mockProduct);
        (Product.updateOne as any).mockResolvedValue({ modifiedCount: 1 });
        (Order.create as any).mockImplementation((data: any) => Promise.resolve({ _id: 'o1', ...data, createdAt: new Date() }));

        const res = await posCheckout(createRequest(payload));
        const data = await res.json();

        expect(data.success).toBe(true);
        
        const orderArgs = (Order.create as any).mock.calls[0][0];
        // subtotal = 150 * 1 = 150
        // flat tax = 5 * 1 = 5
        expect(orderArgs.subtotal).toBe(150);
        expect(orderArgs.taxAmount).toBe(5);
        expect(orderArgs.totalAmount).toBe(155);
    });

    it('should fail if variant is out of stock', async () => {
        const payload = {
            items: [{
                productId: 'p1',
                title: 'Shirt',
                quantity: 3,
                variant: { Color: 'Green' }
            }],
            paymentMethod: 'Cash',
            amountTendered: 100
        };

        const mockProduct = {
            _id: 'p1',
            title: 'Shirt',
            isActive: true,
            variants: [{
                _id: 'v3',
                colorName: 'Green',
                stock: 2, // ordered 3, so should fail
                mrp: 100,
                price: 100
            }]
        };

        (Product.findById as any).mockResolvedValue(mockProduct);

        const res = await posCheckout(createRequest(payload));
        const data = await res.json();

        expect(data.success).toBe(false);
        expect(res.status).toBe(400);
        expect(data.message).toContain('Insufficient stock for variant of: Shirt');
        expect(Product.updateOne).not.toHaveBeenCalled();
    });
});
