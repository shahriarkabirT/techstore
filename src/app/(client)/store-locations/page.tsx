'use client';

import { useGetPublicStoreLocationsQuery } from '@/redux/features/storeLocation/storeLocationApi';
import Image from 'next/image';
import { ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function StoreLocationsPublicPage() {
    const { data: locations, isLoading } = useGetPublicStoreLocationsQuery();

    return (
        <div className="min-h-screen bg-background py-12 md:py-20">
            <div className="container mx-auto px-4 xl:px-0">
                {/* Page Title */}
                <h1 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16 md:mb-20">
                    Store Locations
                </h1>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                ) : locations && locations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
                        {locations.map((location) => (
                            <div key={location._id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-md">
                                {/* Image with Centered Title Overlay */}
                                <div className="relative aspect-[4/3] w-full group">
                                    <Image
                                        src={location.image}
                                        alt={location.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    {/* Dark Overlay with centered text */}
                                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center p-8 text-center transition-colors group-hover:bg-black/50">
                                        <h2 className="text-white text-xl md:text-2xl 2xl:text-3xl font-bold leading-tight uppercase tracking-tight">
                                            {location.title}
                                        </h2>
                                    </div>
                                </div>

                                {/* Details Section */}
                                <div className="p-8 xl:p-10 flex flex-col flex-grow text-[14px] 2xl:text-base leading-relaxed text-gray-900">
                                    <div className="space-y-4 xl:space-y-5 flex-grow">
                                        <p>
                                            <span className="font-bold">Address:</span> {location.address}
                                        </p>

                                        <p>
                                            <span className="font-bold">Business Hours:</span> {location.businessHours}
                                        </p>

                                        <p>
                                            <span className="font-bold">Contact:</span> {location.contact}
                                        </p>
                                    </div>

                                    {/* Get Direction Link */}
                                    {location.mapLink && (
                                        <div className="mt-8 xl:mt-10">
                                            <a 
                                                href={location.mapLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 font-bold text-gray-900 hover:gap-3 transition-all"
                                            >
                                                Get Direction
                                                <ArrowRight className="w-4 h-4 ml-0.5" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-gray-500">No store locations found.</p>
                        <Link href="/" className="mt-4 text-primary font-bold hover:underline inline-block">Back to Home</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
