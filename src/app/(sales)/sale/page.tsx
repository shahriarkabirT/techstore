import ProductGrid from '@/components/client/ProductGrid';
import dbConnect from '@/lib/db';
import { getProductsList } from '@/lib/services/product.service';
import Settings from '@/models/Settings';
import Link from 'next/link';

export async function generateMetadata({ searchParams }: { searchParams: any }) {
    await dbConnect();
    const settings = await Settings.findOne({}).lean() as any;
    const brandName = settings?.brandName || settings?.siteName || 'techstore.bd';
    
    let title = `Sale Products | ${brandName}`;
    let description = `Shop the best gadgets & tech accessories on sale at ${brandName}.`;
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://techstore.bd';
    const canonicalUrl = `${baseUrl}/sale`;

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

export default async function SalePage({ searchParams }: { searchParams: any }) {
    const params = await searchParams;

    // Fetch initial data for SSR
    const queryParams = {
        category: null,
        search: null,
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: -1 as 1 | -1,
        active: 'true',
        onSale: 'true', // specifically for Sale page
    };

    const initialData = await getProductsList(queryParams);

    return (
        <div className="bg-background min-h-screen">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-100">
                <div className="container mx-auto py-4 sm:py-6 text-center">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Sale Items</h1>
                    <nav className="flex flex-wrap items-center justify-center text-sm font-semibold text-gray-500 gap-y-1">
                        <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
                        <span className="mx-2 text-gray-300">/</span>
                        <span className="text-rose-600 font-bold">Sale</span>
                    </nav>
                </div>
            </div>

            <div className="container mx-auto pt-8 pb-12">
                <div className="max-w-6xl mx-auto">
                    <ProductGrid initialData={initialData} forceOnSale={true} />
                </div>
            </div>
        </div>
    );
}
