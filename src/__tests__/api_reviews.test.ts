import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getReviews, POST as createReview } from '@/app/api/reviews/route';
import Review from '@/models/Review';
import * as jwtLib from '@/lib/jwt';

// Mock Dependencies
vi.mock('@/lib/db', () => ({ default: vi.fn() }));
vi.mock('@/models/Review');
vi.mock('@/lib/jwt');

describe('Reviews API Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/reviews', () => {
        it('should return approved reviews for a product', async () => {
            (Review.find as any).mockReturnValue({
                sort: vi.fn().mockReturnThis(),
                lean: vi.fn().mockResolvedValue([{ comment: 'Great!' }]),
            });

            const request = new Request('http://localhost/api/reviews?productId=p1');
            const response = await getReviews(request);
            const result = await response.json();

            expect(result.success).toBe(true);
            expect(result.reviews).toHaveLength(1);
            expect(Review.find).toHaveBeenCalledWith(expect.objectContaining({ productId: 'p1', isApproved: true }));
        });
    });

    describe('POST /api/reviews', () => {
        it('should create an unapproved review for authenticated user', async () => {
            (jwtLib.getUserFromRequest as any).mockResolvedValue({ id: 'user1' });
            (Review.create as any).mockResolvedValue({ _id: 'r1', isApproved: false });

            const request = new Request('http://localhost/api/reviews', {
                method: 'POST',
                body: JSON.stringify({ productId: 'p1', rating: 5, comment: 'Nice' }),
            });

            const response = await createReview(request);
            const result = await response.json();

            expect(result.success).toBe(true);
            expect(result.review.isApproved).toBe(false);
            expect(Review.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user1' }));
        });

        it('should return 401 if unauthorized', async () => {
            (jwtLib.getUserFromRequest as any).mockResolvedValue(null);

            const request = new Request('http://localhost/api/reviews', {
                method: 'POST',
                body: JSON.stringify({ productId: 'p1' }),
            });

            const response = await createReview(request);
            expect(response.status).toBe(401);
        });
    });
});
