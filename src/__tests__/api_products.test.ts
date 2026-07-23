import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getProducts, POST as createProduct } from '@/app/api/products/route';
import Product from '@/models/Product';
import Category from '@/models/Category';
import * as authLib from '@/lib/auth';

// Mock Dependencies
vi.mock('@/lib/db', () => ({ default: vi.fn() }));
vi.mock('@/models/Product');
vi.mock('@/models/Category');
vi.mock('@/models/SubCategory');
vi.mock('@/models/ChildCategory');
vi.mock('@/models/SubChildCategory');
vi.mock('@/lib/auth');
vi.mock('@/lib/utils', () => ({
    slugify: vi.fn((val) => val.toLowerCase().replace(/ /g, '-')),
}));

describe('Products API Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/products', () => {
        it('should return products with pagination', async () => {
            const mockProducts = [{ title: 'P1' }, { title: 'P2' }];
            (Product.find as any).mockReturnValue({
                populate: vi.fn().mockReturnThis(),
                sort: vi.fn().mockReturnThis(),
                skip: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                lean: vi.fn().mockResolvedValue(mockProducts),
            });
            (Product.countDocuments as any).mockResolvedValue(2);

            const request = new Request('http://localhost/api/products?page=1&limit=10');
            const response = await getProducts(request);
            const result = await response.json();

            expect(result.success).toBe(true);
            expect(result.products).toHaveLength(2);
            expect(result.pagination.total).toBe(2);
        });

        it('should filter by category slug', async () => {
            (Category.findOne as any).mockResolvedValue({ _id: 'cat123' });
            (Product.find as any).mockReturnValue({
                populate: vi.fn().mockReturnThis(),
                sort: vi.fn().mockReturnThis(),
                skip: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                lean: vi.fn().mockResolvedValue([]),
            });
            (Product.countDocuments as any).mockResolvedValue(0);

            const request = new Request('http://localhost/api/products?category=test-cat');
            await getProducts(request);

            expect(Category.findOne).toHaveBeenCalledWith({ slug: 'test-cat' });
            expect(Product.find).toHaveBeenCalledWith(expect.objectContaining({ category: 'cat123' }));
        });
    });

    describe('POST /api/products', () => {
        const productData = {
            title: 'New Product',
            mrp: 1000,
            price: 800,
            category: 'cat123',
            images: ['img1.jpg'],
        };

        it('should create a product if admin is authenticated', async () => {
            (authLib.getAdminFromToken as any).mockResolvedValue({ id: 'admin1' });
            (Product.findOne as any).mockResolvedValue(null); // No slug conflict
            (Product.create as any).mockResolvedValue({
                ...productData,
                populate: vi.fn().mockResolvedValue({ ...productData }),
            });

            const request = new Request('http://localhost/api/products', {
                method: 'POST',
                body: JSON.stringify(productData),
            });

            const response = await createProduct(request);
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.success).toBe(true);
            expect(result.message).toBe('Product created successfully');
        });

        it('should return 401 if not an admin', async () => {
            (authLib.getAdminFromToken as any).mockResolvedValue(null);

            const request = new Request('http://localhost/api/products', {
                method: 'POST',
                body: JSON.stringify(productData),
            });

            const response = await createProduct(request);
            const result = await response.json();

            expect(response.status).toBe(401);
            expect(result.success).toBe(false);
        });

        it('should validate selling price against MRP', async () => {
            (authLib.getAdminFromToken as any).mockResolvedValue({ id: 'admin1' });

            const invalidData = { ...productData, price: 1200 }; // price > mrp

            const request = new Request('http://localhost/api/products', {
                method: 'POST',
                body: JSON.stringify(invalidData),
            });

            const response = await createProduct(request);
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.message).toBe('Selling price cannot be greater than MRP');
        });
    });
});
