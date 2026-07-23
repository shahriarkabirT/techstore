import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getOrder } from '@/app/api/orders/[id]/route';
import { GET as trackOrder } from '@/app/api/orders/[id]/tracking/route';
import Order from '@/models/Order';
import * as authLib from '@/lib/auth';

// Mock Dependencies
vi.mock('@/lib/db', () => ({ default: vi.fn() }));
vi.mock('@/models/Order');
vi.mock('@/lib/auth');
vi.mock('@/lib/couriers/factory');

const VALID_ID = '65e5a5a5a5a5a5a5a5a5a5a5';

describe('Authorization Security Tests (IDOR)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/orders/[id]', () => {
        it('should allow owner to view their order', async () => {
            const mockOrder = { _id: VALID_ID, user: 'user1', orderId: 'ORD1' };
            (Order.findById as any).mockResolvedValue(mockOrder);
            (authLib.getAdminFromToken as any).mockResolvedValue(null);
            (authLib.getUserFromToken as any).mockResolvedValue({ id: 'user1' });

            const request = new Request(`http://localhost/api/orders/${VALID_ID}`);
            const response = await getOrder(request as any, { params: Promise.resolve({ id: VALID_ID }) } as any);
            const result = await response.json();

            expect(result.success).toBe(true);
        });

        it('should allow admin to view any order', async () => {
            const mockOrder = { _id: VALID_ID, user: 'user2', orderId: 'ORD1' };
            (Order.findById as any).mockResolvedValue(mockOrder);
            (authLib.getAdminFromToken as any).mockResolvedValue({ id: 'admin1', role: 'admin' });
            (authLib.getUserFromToken as any).mockResolvedValue(null);

            const request = new Request(`http://localhost/api/orders/${VALID_ID}`);
            const response = await getOrder(request as any, { params: Promise.resolve({ id: VALID_ID }) } as any);
            const result = await response.json();

            expect(result.success).toBe(true);
        });

        it('should block user from viewing another user\'s order', async () => {
            const mockOrder = { _id: VALID_ID, user: 'user2', orderId: 'ORD1' };
            (Order.findById as any).mockResolvedValue(mockOrder);
            (authLib.getAdminFromToken as any).mockResolvedValue(null);
            (authLib.getUserFromToken as any).mockResolvedValue({ id: 'user1' });

            const request = new Request(`http://localhost/api/orders/${VALID_ID}`);
            const response = await getOrder(request as any, { params: Promise.resolve({ id: VALID_ID }) } as any);
            const result = await response.json();

            expect(response.status).toBe(403);
            expect(result.message).toContain('Unauthorized');
        });

        it('should block guest from viewing any order', async () => {
            const mockOrder = { _id: VALID_ID, user: 'user1', orderId: 'ORD1' };
            (Order.findById as any).mockResolvedValue(mockOrder);
            (authLib.getAdminFromToken as any).mockResolvedValue(null);
            (authLib.getUserFromToken as any).mockResolvedValue(null);

            const request = new Request(`http://localhost/api/orders/${VALID_ID}`);
            const response = await getOrder(request as any, { params: Promise.resolve({ id: VALID_ID }) } as any);

            expect(response.status).toBe(403);
        });

        it('should work with orderId as well', async () => {
            const mockOrder = { _id: VALID_ID, user: 'user1', orderId: 'ORD123' };
            (Order.findOne as any).mockResolvedValue(mockOrder);
            (authLib.getUserFromToken as any).mockResolvedValue({ id: 'user1' });

            const request = new Request('http://localhost/api/orders/ORD123');
            const response = await getOrder(request as any, { params: Promise.resolve({ id: 'ORD123' }) } as any);
            const result = await response.json();

            expect(result.success).toBe(true);
            expect(Order.findOne).toHaveBeenCalledWith({ orderId: 'ORD123' });
        });
    });

    describe('GET /api/orders/[id]/tracking', () => {
        it('should block unauthorized tracking access', async () => {
            const mockOrder = { _id: VALID_ID, user: 'user1', orderId: 'ORD1' };
            (Order.findById as any).mockResolvedValue(mockOrder);
            (authLib.getAdminFromToken as any).mockResolvedValue(null);
            (authLib.getUserFromToken as any).mockResolvedValue({ id: 'user2' }); // Different user

            const request = new Request(`http://localhost/api/orders/${VALID_ID}/tracking`);
            const response = await trackOrder(request as any, { params: Promise.resolve({ id: VALID_ID }) } as any);

            expect(response.status).toBe(403);
        });
    });
});
