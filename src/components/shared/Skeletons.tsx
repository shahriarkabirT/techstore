'use client';

import Skeleton from './Skeleton';

export function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-sm overflow-hidden border border-gray-100 flex flex-col h-full">
            <Skeleton className="aspect-square w-full" borderRadius="0" />
            <div className="p-3.5 sm:p-6 space-y-3 flex-grow">
                <div className="flex justify-between items-center">
                    <Skeleton width="40%" height="12px" />
                    <Skeleton width="20%" height="12px" />
                </div>
                <Skeleton width="90%" height="20px" />
                <Skeleton width="70%" height="20px" />
                <div className="mt-4 flex gap-2">
                    <Skeleton width="30%" height="24px" />
                    <Skeleton width="20%" height="16px" />
                </div>
            </div>
        </div>
    );
}

export function ProductCardListSkeleton() {
    return (
        <div className="bg-white rounded-sm overflow-hidden border border-gray-100 flex h-52 sm:h-64">
            <Skeleton className="w-48 sm:w-64 flex-shrink-0" height="100%" borderRadius="0" />
            <div className="flex-grow p-6 sm:p-8 flex flex-col justify-between">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <Skeleton width="100px" height="12px" />
                        <Skeleton width="60px" height="12px" />
                    </div>
                    <Skeleton width="80%" height="28px" />
                    <Skeleton width="100%" height="40px" />
                    <div className="flex gap-3">
                        <Skeleton width="80px" height="24px" />
                        <Skeleton width="60px" height="18px" />
                    </div>
                </div>
                <div className="flex gap-4">
                    <Skeleton className="flex-grow" height="48px" borderRadius="0.5rem" />
                    <Skeleton width="48px" height="48px" borderRadius="1rem" />
                </div>
            </div>
        </div>
    );
}

export function CategoryCardSkeleton() {
    return (
        <div className="aspect-[4/3] bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
            <Skeleton className="w-full h-full" borderRadius="0" />
        </div>
    );
}

export function ProductDetailSkeleton() {
    return (
        <div className="min-h-screen bg-white">
            <div className="bg-gray-50/50 border-b border-gray-100">
                <div className="container mx-auto px-4 py-4">
                    <Skeleton width="200px" height="12px" />
                </div>
            </div>
            <div className="container mx-auto mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16">
                    <div className="lg:col-span-5 space-y-6">
                        <Skeleton className="aspect-square w-full" borderRadius="0.5rem" />
                        <div className="flex gap-4 overflow-hidden">
                            {[1, 2, 3, 4].map(i => (
                                <Skeleton key={i} width="96px" height="96px" borderRadius="0.5rem" />
                            ))}
                        </div>
                    </div>
                    <div className="lg:col-span-7 space-y-10">
                        <div className="space-y-4">
                            <Skeleton width="120px" height="14px" />
                            <Skeleton width="80%" height="40px" />
                            <div className="flex gap-4">
                                <Skeleton width="120px" height="32px" />
                                <Skeleton width="80px" height="24px" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Skeleton width="100%" height="20px" />
                            <Skeleton width="100%" height="20px" />
                            <Skeleton width="60%" height="20px" />
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Skeleton width="100px" height="12px" />
                                <div className="flex gap-3">
                                    {[1, 2, 3, 4].map(i => <Skeleton key={i} width="60px" height="40px" borderRadius="0.5rem" />)}
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <Skeleton width="128px" height="48px" borderRadius="0.5rem" />
                                <Skeleton className="flex-grow" height="48px" borderRadius="0.5rem" />
                                <Skeleton className="flex-grow" height="48px" borderRadius="0.5rem" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function CartItemSkeleton() {
    return (
        <div className="p-4 flex gap-4">
            <Skeleton width="80px" height="80px" borderRadius="0.75rem" />
            <div className="flex-grow space-y-2">
                <Skeleton width="60%" height="20px" />
                <Skeleton width="40%" height="16px" />
                <div className="flex gap-4 pt-2">
                    <Skeleton width="100px" height="32px" borderRadius="0.5rem" />
                    <Skeleton width="60px" height="16px" />
                </div>
            </div>
            <Skeleton width="80px" height="20px" />
        </div>
    );
}

export function OrderSummarySkeleton() {
    return (
        <div className="card p-5 space-y-6 rounded-lg shadow-sm">
            <Skeleton width="100px" height="24px" />
            <div className="space-y-3 border-t border-gray-100 pt-4">
                <div className="flex justify-between">
                    <Skeleton width="80px" height="16px" />
                    <Skeleton width="60px" height="16px" />
                </div>
                <div className="flex justify-between">
                    <Skeleton width="80px" height="16px" />
                    <Skeleton width="60px" height="16px" />
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between">
                    <Skeleton width="60px" height="20px" />
                    <Skeleton width="100px" height="28px" />
                </div>
            </div>
            <Skeleton className="w-full" height="48px" borderRadius="0.75rem" />
        </div>
    );
}
