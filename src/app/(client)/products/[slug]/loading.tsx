'use client';

import { useEffect } from 'react';

function Skeleton({ className }: { className: string }) {
    return <div className={`bg-gray-100 animate-pulse rounded ${className}`} />;
}

export default function Loading() {
    useEffect(() => { window.scrollTo(0, 0); }, []);

    return (
        <div className="min-h-screen bg-white">
            {/* Breadcrumb */}
            <div className="bg-gray-50 border-b border-gray-100">
                <div className="container mx-auto px-4 py-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-3 w-10" />
                        <span className="text-gray-200 text-xs">/</span>
                        <Skeleton className="h-3 w-10" />
                        <span className="text-gray-200 text-xs">/</span>
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
            </div>

            {/* Main 3-column grid */}
            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Col 1: Image skeleton */}
                    <div className="lg:col-span-4 space-y-3">
                        <Skeleton className="w-full aspect-[4/5]" />
                        <div className="flex gap-2">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="w-16 h-16 flex-shrink-0" />
                            ))}
                        </div>
                    </div>

                    {/* Col 2: Info skeleton */}
                    <div className="lg:col-span-5 space-y-4">
                        {/* Title */}
                        <div className="space-y-2">
                            <Skeleton className="h-7 w-3/4" />
                            <Skeleton className="h-7 w-1/2" />
                        </div>

                        {/* Price */}
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-28" />
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-5 w-20" />
                        </div>

                        {/* Stock badge */}
                        <Skeleton className="h-5 w-24" />

                        {/* Variant selectors */}
                        <div className="space-y-3 pt-2">
                            <div>
                                <Skeleton className="h-3 w-20 mb-2" />
                                <div className="flex gap-2">
                                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-14" />)}
                                </div>
                            </div>
                            <div>
                                <Skeleton className="h-3 w-20 mb-2" />
                                <div className="flex gap-2">
                                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="w-7 h-7 rounded-full" />)}
                                </div>
                            </div>
                        </div>

                        {/* Quantity */}
                        <div>
                            <Skeleton className="h-3 w-16 mb-2" />
                            <Skeleton className="h-9 w-32" />
                        </div>

                        {/* Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                            <Skeleton className="h-12 rounded" />
                            <Skeleton className="h-12 rounded" />
                            <Skeleton className="h-12 rounded" />
                            <Skeleton className="h-12 rounded" />
                        </div>

                        {/* Wishlist */}
                        <Skeleton className="h-4 w-28" />
                    </div>

                    {/* Col 3: Sidebar skeleton (desktop only) */}
                    <div className="lg:col-span-3 hidden lg:block">
                        <div className="border border-gray-100 rounded p-4">
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                                <Skeleton className="h-3 w-24" />
                                <div className="flex gap-1">
                                    <Skeleton className="w-6 h-6 rounded" />
                                    <Skeleton className="w-6 h-6 rounded" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="flex gap-3 pt-3 first:pt-0">
                                        <Skeleton className="w-16 h-16 flex-shrink-0" />
                                        <div className="flex-1 space-y-2 pt-1">
                                            <Skeleton className="h-3 w-full" />
                                            <Skeleton className="h-3 w-2/3" />
                                            <Skeleton className="h-4 w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs skeleton */}
                <div className="mt-8 border-t border-gray-100">
                    <div className="flex gap-4 border-b border-gray-200 pt-1">
                        <Skeleton className="h-10 w-28" />
                        <Skeleton className="h-10 w-36" />
                    </div>
                    <div className="py-8 space-y-3 max-w-2xl">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className={`h-3 ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
