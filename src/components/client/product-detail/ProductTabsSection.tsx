'use client';

import ProductReviewsClient from './ProductReviewsClient';

interface ProductTabsSectionProps {
    product: any;
}

export default function ProductTabsSection({ product }: ProductTabsSectionProps) {
    return (
        <div className="mt-12 border-t border-gray-100 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
                {/* Description Section (Left) */}
                <div className="lg:col-span-2">
                    <h2 className="text-sm font-black uppercase tracking-widest mb-6 text-gray-900">Description</h2>
                    <div
                        className="prose prose-slate max-w-none rich-text-content text-sm"
                        dangerouslySetInnerHTML={{ __html: product.fullDescription || product.shortDescription || '' }}
                    />
                    {product.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-100">
                            {product.tags.map((tag: string) => (
                                <span key={tag} className="px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold rounded border border-gray-100">#{tag}</span>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Reviews Section (Right) */}
                <div className="lg:col-span-1 lg:pl-10 lg:border-l lg:border-gray-100">
                    <h2 className="text-sm font-black uppercase tracking-widest mb-6 text-gray-900">Customer Reviews</h2>
                    <ProductReviewsClient productId={product._id} />
                </div>
            </div>
        </div>
    );
}
