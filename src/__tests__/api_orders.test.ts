import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getOrders, POST as createOrder } from '@/app/api/orders/route';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Coupon from '@/models/Coupon';
import Settings from '@/models/Settings';
import * as authLib from '@/lib/auth';
import * as validatorLib from '@/lib/validators';
import * as utilsLib from '@/lib/utils';

// Mock Dependencies
vi.mock('@/lib/db', () => ({ default: vi.fn() }));
vi.mock('@/models/Order');
vi.mock('@/models/Product');
vi.mock('@/models/Coupon');
vi.mock('@/models/Settings');
vi.mock('@/lib/auth');
vi.mock('@/lib/validators');
vi.mock('@/lib/utils');

describe('Orders API Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (Settings.findOne as any).mockResolvedValue({ shippingCharge: 60 });
        (Coupon.findOne as any).mockResolvedValue(null);
    });

    describe('GET /api/orders', () => {
        it('should return orders for admin', async () => {
            (authLib.getAdminFromToken as any).mockResolvedValue({ id: 'admin1' });
            (Order.find as any).mockReturnValue({
                sort: vi.fn().mockReturnThis(),
                skip: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                lean: vi.fn().mockResolvedValue([{ orderId: 'ORD1' }]),
            });
            (Order.countDocuments as any).mockResolvedValue(1);

            const request = new Request('http://localhost/api/orders');
            const response = await getOrders(request as any);
            const result = await response.json();

            expect(result.success).toBe(true);
            expect(result.orders).toHaveLength(1);
        });

        it('should return 401 if not an admin', async () => {
            (authLib.getAdminFromToken as any).mockResolvedValue(null);

            const request = new Request('http://localhost/api/orders');
            const response = await getOrders(request as any);

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/orders', () => {
        const checkoutData = {
            customerInfo: { name: 'John', phone: '017', address: 'Dhaka' },
            items: [{ productId: 'p1', quantity: 2 }],
            paymentMethod: 'COD',
        };

        it('should create an order successfully', async () => {
            (validatorLib.validateCheckoutData as any).mockReturnValue({ valid: true });
            const mockProduct = {
                _id: 'p1',
                title: 'Product 1',
                price: 100,
                stock: 10,
                isActive: true,
                images: ['img1.jpg'],
            };
            (Product.findById as any).mockResolvedValue(mockProduct);
            (utilsLib.generateOrderId as any).mockReturnValue('ORD123');
            (authLib.getUserFromToken as any).mockResolvedValue({ id: 'user1' });
            (Order.create as any).mockResolvedValue({
                _id: 'o123',
                orderId: 'ORD123',
                totalAmount: 260, // 2*100 + 60 shipping
                paymentMethod: 'COD',
            });

            const request = new Request('http://localhost/api/orders', {
                method: 'POST',
                body: JSON.stringify(checkoutData),
            });

            const response = await createOrder(request as any);
            const result = await response.json();

            expect(result.success).toBe(true);
            expect(result.order.orderId).toBe('ORD123');
        });

        it('should return 400 if cart is empty', async () => {
            const request = new Request('http://localhost/api/orders', {
                method: 'POST',
                body: JSON.stringify({ ...checkoutData, items: [] }),
            });

            const response = await createOrder(request as any);
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.message).toBe('Cart is empty');
        });

        it('should return 400 if product is out of stock', async () => {
            (validatorLib.validateCheckoutData as any).mockReturnValue({ valid: true });
            (Product.findById as any).mockResolvedValue({
                _id: 'p1',
                title: 'Product 1',
                stock: 1, // Stock is 1, but order is for 2
                isActive: true,
            });

            const request = new Request('http://localhost/api/orders', {
                method: 'POST',
                body: JSON.stringify(checkoutData),
            });

            const response = await createOrder(request as any);
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.message).toContain('Insufficient stock');
        });
    });
});
