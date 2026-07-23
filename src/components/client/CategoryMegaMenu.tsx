'use client';

import React from 'react';
import Link from 'next/link';
import { useGetCategoryTreeQuery } from '@/redux/features/categories/categoryApi';
import { ChevronRight } from 'lucide-react';

export default function CategoryMegaMenu() {
    const { data: tree = [], isLoading } = useGetCategoryTreeQuery();

    if (isLoading) {
        return (
            <div className="bg-white text-left overflow-y-auto max-h-[calc(100vh-150px)]">
                <div className="p-8">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-10 items-start">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="space-y-4 animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-24"></div>
                                <div className="space-y-3">
                                    <div className="h-3 bg-gray-100 rounded w-32"></div>
                                    <div className="h-3 bg-gray-100 rounded w-28"></div>
                                    <div className="h-3 bg-gray-100 rounded w-36"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white text-left overflow-y-auto max-h-[calc(100vh-150px)]">
            <div className="p-8">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-10 items-start">
                    {tree.map((cat: any) => (
                        <div key={cat._id} className="space-y-4">
                             <Link 
                                href={`/products?category=${cat.slug}`}
                                className="block text-[14px] 2xl:text-[15px] font-bold text-gray-900 uppercase tracking-wider hover:text-primary hover:bg-gray-50/80 px-3 py-2 -mx-3 rounded-lg transition-all duration-200 border-b border-gray-100 hover:border-primary/10 pb-2"
                            >
                                {cat.name}
                            </Link>
                            
                            <div className="flex flex-col space-y-3">
                                {cat.subCategories?.map((sub: any) => {
                                    const hasChildren = sub.childCategories && sub.childCategories.length > 0;

                                    return (
                                        <div key={sub._id} className="group/sub">
                                            <div className="flex items-center justify-between hover:bg-gray-50/80 px-3 py-1.5 -mx-3 rounded-lg transition-all duration-200 group-hover/sub:translate-x-0.5">
                                                <Link
                                                    href={`/products?category=${sub.slug}`}
                                                    className="block text-[13px] 2xl:text-[14px] font-bold text-gray-800 hover:text-primary transition-colors flex-grow"
                                                >
                                                    {sub.name}
                                                </Link>
                                                {hasChildren && (
                                                    <div className="p-0.5">
                                                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover/sub:rotate-90 group-hover/sub:text-primary transition-all duration-200" />
                                                    </div>
                                                )}
                                            </div>

                                            {hasChildren && (
                                                <div className="hidden group-hover/sub:block pl-3 border-l border-gray-100 ml-1 mt-2 space-y-3 fade-in duration-200">
                                                    {sub.childCategories.map((child: any) => (
                                                        <div key={child._id} className="space-y-1.5">
                                                            <Link
                                                                href={`/products?category=${child.slug}`}
                                                                className="group/child flex items-center justify-between text-[12px] 2xl:text-[13px] font-semibold text-gray-600 hover:text-primary hover:bg-gray-50/80 px-2.5 py-1 -mx-2.5 rounded-md transition-all duration-200"
                                                            >
                                                                <span>{child.name}</span>
                                                                <ChevronRight className="w-3 h-3 text-gray-400 group-hover/child:text-primary group-hover/child:translate-x-0.5 opacity-0 group-hover/child:opacity-100 transition-all duration-200" />
                                                            </Link>
                                                            <div className="flex flex-col space-y-1 pl-2 border-l border-gray-100 ml-1">
                                                                {child.subChildCategories?.map((sc: any) => (
                                                                    <Link
                                                                        key={sc._id}
                                                                        href={`/products?category=${sc.slug}`}
                                                                        className="block text-[11px] 2xl:text-[12px] text-gray-400 hover:text-primary hover:bg-gray-50/50 px-2 py-0.5 -mx-2 rounded transition-all duration-150 font-medium"
                                                                    >
                                                                        {sc.name}
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Promo Section */}
            <div className="bg-gray-50 p-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                    <p className="text-[12px] font-medium text-gray-500">
                        Explore all categories and find your best deals
                    </p>
                    <Link href="/products" className="text-[12px] font-bold text-primary hover:underline">
                        Shop all categories →
                    </Link>
                </div>
            </div>
        </div>
    );
}
