import { MetadataRoute } from 'next';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Blog from '@/models/Blog';
import Category from '@/models/Category';
import Brand from '@/models/Brand';

const BASE_URL = 'https://bdgirls.xyz';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // ─── Static pages ──────────────────────────────────────────────────────────
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/products`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/blogs`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: `${BASE_URL}/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.4,
        },
        {
            url: `${BASE_URL}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.4,
        },
    ];

    // ─── Dynamic pages ─────────────────────────────────────────────────────────
    try {
        await dbConnect();

        // Products — only active, published products
        const products = await Product.find(
            { isActive: true },
            { slug: 1, updatedAt: 1 }
        ).lean();

        const productUrls: MetadataRoute.Sitemap = products.map((p: any) => ({
            url: `${BASE_URL}/products/${p.slug}`,
            lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        }));

        // Blog posts — only active posts
        const blogs = await Blog.find(
            { isActive: true },
            { slug: 1, updatedAt: 1 }
        ).lean();

        const blogUrls: MetadataRoute.Sitemap = blogs.map((b: any) => ({
            url: `${BASE_URL}/blogs/${b.slug}`,
            lastModified: b.updatedAt ? new Date(b.updatedAt) : new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        }));

        // Categories — only active, for filtered product browsing
        const categories = await Category.find(
            { isActive: true },
            { slug: 1, updatedAt: 1 }
        ).lean();

        const categoryUrls: MetadataRoute.Sitemap = categories.map((c: any) => ({
            url: `${BASE_URL}/products?category=${c.slug}`,
            lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        }));

        // Brands — only active brands
        const brands = await Brand.find(
            { isActive: true },
            { slug: 1, updatedAt: 1 }
        ).lean();

        const brandUrls: MetadataRoute.Sitemap = brands.map((br: any) => ({
            url: `${BASE_URL}/products?brand=${br.slug}`,
            lastModified: br.updatedAt ? new Date(br.updatedAt) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
        }));

        return [
            ...staticPages,
            ...productUrls,
            ...blogUrls,
            ...categoryUrls,
            ...brandUrls,
        ];
    } catch (error) {
        // If DB fails, at minimum return static pages — never break the sitemap
        console.error('Sitemap DB error:', error);
        return staticPages;
    }
}
