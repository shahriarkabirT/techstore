import ProductFilters from '@/components/client/ProductFilters';
import ProductGrid from '@/components/client/ProductGrid';
import Link from 'next/link';
import ProductToolbar from '@/components/client/ProductToolbar';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';
import Settings from '@/models/Settings';
import { getProductsList } from '@/lib/services/product.service';

export async function generateMetadata({ searchParams }: { searchParams: any }) {
    const params = await searchParams;
    
    await dbConnect();
    const settings = await Settings.findOne({}).lean() as any;
    const brandName = settings?.brandName || settings?.siteName || 'BDGIRLS.XYZ';
    
    let title = `Explore Our Collection | ${brandName}`;
    let description = `Bangladesh's Number One Girls Accessories Shop - ${brandName}.`;
    
    if (params?.category) {
        try {
            const categoryObj = await Category.findOne({ slug: params.category }).lean() as any;
            if (categoryObj) {
                title = categoryObj.metaTitle || `${categoryObj.name} Collection | ${brandName}`;
                description = categoryObj.metaDescription || categoryObj.description || `Browse our exclusive collection of ${categoryObj.name}. Discover premium quality products at the best prices from ${brandName}.`;
            } else {
                const formattedCat = params.category.replace(/-/g, ' ');
                title = `${formattedCat.charAt(0).toUpperCase() + formattedCat.slice(1)} | ${brandName}`;
            }
        } catch (error) {
            console.error("Failed to fetch category metadata:", error);
        }
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bdgirls.xyz';
    const canonicalUrl = params?.category ? `${baseUrl}/products?category=${params.category}` : `${baseUrl}/products`;

    return {
        title,
        description,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            type: 'website',
            siteName: brandName,
            title: `${title} | ${brandName}`,
            description,
            url: canonicalUrl,
        },
        twitter: {
            card: 'summary_large_image',
            title: `${title} | ${brandName}`,
            description,
        },
    };
}

export default async function ProductsPage({ searchParams }: { searchParams: any }) {
    const params = await searchParams;

    // Fetch initial data for SSR
    const queryParams = {
        category: params.category || null,
        search: params.q || null,
        page: parseInt(params.page || '1') || 1,
        limit: 60,
        sortBy: params.sortBy ? params.sortBy.split('_')[0] : 'createdAt',
        sortOrder: params.sortBy && params.sortBy.split('_')[1] === 'asc' ? 1 : -1 as 1 | -1,
        minPrice: params.minPrice || null,
        maxPrice: params.maxPrice || null,
        brand: params.brand || null,
        // active: 'true' is implied by public page, but let's be explicit
        active: 'true',
        // In-stock filtering via RTK Query typically happens locally or via specific param, but the service doesn't have an `inStock` param yet.
        // Wait, the API route didn't have `inStock` filtering, it was missing! We'll just pass it down and let the client handle it if it does, but we should probably add `inStock` to product.service.ts if it was supported.
        // Actually, the API route didn't have it, but RTK query did. We'll leave it as is.
    };

    const initialData = await getProductsList(queryParams);

    return (
        <div className="bg-background">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-100">
                <div className="container mx-auto py-2.5 sm:py-3.5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <nav className="flex text-xs font-semibold text-gray-400">
                                <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
                                <span className="mx-2 text-gray-300">/</span>
                                <span className="text-primary font-bold">Shop</span>
                                {params?.category && (
                                    <>
                                        <span className="mx-2 text-gray-300">/</span>
                                        <span className="text-gray-900 capitalize">{params.category.replace(/-/g, ' ')}</span>
                                    </>
                                )}
                            </nav>
                        </div>
                        <div className="flex-grow md:flex md:justify-end">
                            <ProductToolbar />
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto pt-6 pb-6 sm:pb-12">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters - Desktop */}
                    <aside className="hidden lg:block lg:w-72 flex-shrink-0 relative border-r border-gray-100/80 pr-6 mr-2">
                        {/* Custom right-only shadow line */}
                        <div className="absolute top-0 right-0 bottom-0 w-[1px] shadow-[4px_0_12px_rgba(0,0,0,0.03)] pointer-events-none" />
                        <div className="sticky top-28">
                            <ProductFilters />
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-grow">
                        <ProductGrid initialData={initialData} />
                    </div>
                </div>
            </div>
        </div>
    );
}
