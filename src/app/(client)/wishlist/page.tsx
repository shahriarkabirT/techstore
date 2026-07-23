'use client';

import { useWishlist } from '@/context/WishlistContext';
import { useGetProductsQuery } from '@/redux/features/product/productApi';
import ProductCard from '@/components/client/ProductCard';
import Link from 'next/link';

export default function WishlistPage() {
    const { wishlist } = useWishlist();

    // Use RTK Query to fetch products by IDs — all caching/loading handled automatically
    const idsString = wishlist.length > 0 ? wishlist.join(',') : '';
    const { data, isLoading, isFetching } = useGetProductsQuery(
        { ids: idsString, limit: 100 },
        { skip: !idsString }
    );

    const products = data?.products || [];
    const loading = isLoading || isFetching;

    if (loading && wishlist.length > 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-12 sm:py-16">
            <div className="container mx-auto">
                <div className="mb-8">
                    <nav className="flex mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                        <span className="mx-2">/</span>
                        <span className="text-primary">Wishlist</span>
                    </nav>
                    <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">Your Favorites</h1>
                    <p className="text-base text-gray-500 mt-2">You have {products.length} items saved in your wishlist.</p>
                </div>

                {products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product: any) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-rose-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
                        <p className="text-gray-500 max-w-sm mx-auto mb-8 text-base">
                            Looks like you haven&apos;t added anything to your wishlist yet. Explore our collection and find something you love.
                        </p>
                        <Link href="/products" className="inline-flex items-center justify-center px-8 py-4 bg-gray-900 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-black transition-all shadow-lg active:scale-95">
                            Start Shopping
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
