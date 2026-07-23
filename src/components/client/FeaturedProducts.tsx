import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import ProductCard from '@/components/client/ProductCard';
import { IProduct } from '@/types';
import Link from 'next/link';

async function getFeaturedProducts(): Promise<IProduct[]> {
    await dbConnect();
    const products = await Product.find({ isActive: true, isFeatured: true })
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .limit(12)
        .lean();
    return JSON.parse(JSON.stringify(products));
}

export default async function FeaturedProducts() {
    const products = await getFeaturedProducts();

    if (products.length === 0) {
        return null;
    }

    return (
        <section className="py-6 md:py-8 bg-transparent">
            <div className="container mx-auto">
                <div className="text-center mb-6 md:mb-10">
                    <h2 className="text-lg sm:text-2xl md:text-3xl font-bold md:font-black text-gray-900 tracking-tight truncate">Featured Collection</h2>
                    <div className="w-12 h-1 bg-gray-900 mx-auto mt-6" />
                </div>

                {products.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 responsive-grid-rows-2">
                        {products.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <p className="text-gray-400 font-bold uppercase tracking-widest">Inventory updating soon...</p>
                    </div>
                )}

                <div className="mt-4 md:mt-10 flex justify-center">
                    <Link
                        href="/products"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-full group hover:bg-black transition-all shadow-xl shadow-gray-900/10 active:scale-95"
                    >
                        <span className="text-[13px]">Show More</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    );
}
