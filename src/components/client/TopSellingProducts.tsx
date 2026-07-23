import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { IProduct } from '@/types';
import TopSellingProductCard from './TopSellingProductCard';
import ProductCard from './ProductCard';
import Link from 'next/link';

export default async function TopSellingProducts() {
    await dbConnect();

    const topSellingProducts = await Product.find({ isActive: true })
        .sort({ soldCount: -1 })
        .limit(6)
        .lean() as unknown as IProduct[];

    if (!topSellingProducts || topSellingProducts.length === 0) return null;

    return (
        <section className="py-2 md:py-4 bg-gray-50/50 relative overflow-hidden">
            <div className="container mx-auto px-4 xl:px-0 relative z-10">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                    <h2 className="text-lg sm:text-2xl md:text-3xl font-bold md:font-black text-gray-900 tracking-tight truncate">Top Selling Products</h2>
                    <Link href="/products" className="text-[11px] sm:text-xs font-bold text-primary hover:bg-primary/10 transition-colors flex items-center gap-1 group bg-primary/5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full">
                        Explore more
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                    </Link>
                </div>
                
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    {topSellingProducts.map((product, idx) => {
                        const pData = JSON.parse(JSON.stringify(product));
                        // On screens below xl: show only first 4 (hide items 5 & 6)
                        const hiddenOnSmall = idx >= 4 ? 'hidden xl:block' : '';
                        return (
                            <div key={product._id} className={`h-full ${hiddenOnSmall}`}>
                                <div className="block lg:hidden h-full">
                                    <ProductCard product={pData} />
                                </div>
                                <div className="hidden lg:block h-full">
                                    <TopSellingProductCard product={pData} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
