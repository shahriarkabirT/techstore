'use client';

import Image from 'next/image';
import Link from 'next/link';

interface Category {
    _id: string;
    name: string;
    slug: string;
    bannerImage: string;
}

export default function CategoriesSliderClient({ categories }: { categories: Category[] }) {
    if (!categories || categories.length === 0) return null;

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-end justify-between mb-6 md:mb-10">
                <div>
                    <Link href="/products" className="text-[10px] font-black text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest flex items-center gap-1.5 mb-1.5 group">
                        VIEW ALL PRODUCTS
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                    </Link>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold md:font-black text-gray-900 tracking-tight truncate">Shop by Categories</h2>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {categories.map((category) => (
                    <Link
                        key={category._id}
                        href={`/products?category=${category.slug}`}
                        className="group flex flex-col items-center gap-3"
                    >
                        <div className="relative w-full aspect-[4/3] sm:aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-100 transition-all duration-300 group-hover:border-primary/20 group-hover:shadow-lg group-hover:-translate-y-1">
                            <Image
                                src={category.bannerImage}
                                alt={category.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                            />
                            {/* Subtle overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-gray-800 text-center leading-tight line-clamp-2 group-hover:text-primary transition-colors px-1">
                            {category.name}
                        </h3>
                    </Link>
                ))}
            </div>
        </div>
    );
}
