import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import '@/models/Brand';
import VariantOption, { IVariantOptionDocument } from '@/models/VariantOption';
import '@/models/Category';
import Settings from '@/models/Settings';
import ProductDetailInteractive from './ProductDetailInteractive';
import RelatedProducts from '@/components/client/RelatedProducts';
import ProductTabsSection from '@/components/client/product-detail/ProductTabsSection';
import ProductMoreSidebar from '@/components/client/product-detail/ProductMoreSidebar';
import CompatibleModelsSelector from '@/components/client/product-detail/CompatibleModelsSelector';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';

async function getProductData(slug: string) {
    await dbConnect();

    const [product, allOptions, settings] = await Promise.all([
        Product.findOne({ slug, isActive: true })
            .populate('category', 'name slug')
            .populate('brand', 'name slug logo')
            .lean(),
        VariantOption.find({ isActive: true }).lean() as Promise<IVariantOptionDocument[]>,
        Settings.findOne({}).lean()
    ]);

    if (!product) return null;

    const globalOptions = {
        sizes: allOptions.filter(o => o.type === 'size').sort((a, b) => a.order - b.order),
        colors: allOptions.filter(o => o.type === 'color').sort((a, b) => a.order - b.order),
        materials: allOptions.filter(o => o.type === 'material').sort((a, b) => a.order - b.order),
    };

    return {
        product: JSON.parse(JSON.stringify(product)),
        globalOptions: JSON.parse(JSON.stringify(globalOptions)),
        settings: JSON.parse(JSON.stringify(settings || {})),
    };
}

export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
    const { slug } = await params;
    const data = await getProductData(slug);

    if (!data) {
        return { title: 'Product Not Found' };
    }

    const brandName = data.settings?.brandName || data.settings?.siteName || 'BDGIRLS.XYZ';
    const title = data.product.seoMetadata?.metaTitle || `${data.product.title} - ${brandName}`;
    const rawDescription = data.product.seoMetadata?.metaDescription || data.product.shortDescription || data.product.title || '';
    const description = typeof rawDescription === 'string' ? rawDescription.replace(/<[^>]*>?/gm, '').trim() : rawDescription;
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bdgirls.xyz';
    const imageUrl = data.product.images?.[0];
    const absoluteImageUrl = imageUrl 
        ? (imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`)
        : undefined;

    const images = absoluteImageUrl ? [{ url: absoluteImageUrl, width: 1200, height: 630 }] : [];

    return {
        title,
        description,
        keywords: data.product.seoMetadata?.keywords || data.product.tags || [],
        openGraph: {
            title,
            description,
            images,
            type: 'website',
            siteName: brandName,
            url: `${baseUrl}/products/${slug}`,
        },
        alternates: {
            canonical: `${baseUrl}/products/${slug}`,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: absoluteImageUrl ? [absoluteImageUrl] : [],
        }
    };
}

export default async function ProductPage({ params }: { params: any }) {
    const { slug } = await params;
    const data = await getProductData(slug);

    if (!data || !data.product) {
        notFound();
    }

    const { product, globalOptions, settings } = data;
    const categoryId = product.category?._id || product.category;
    const subCategoryId = product.subCategory?._id || product.subCategory;
    const childCategoryId = product.childCategory?._id || product.childCategory;
    const subChildCategoryId = product.subChildCategory?._id || product.subChildCategory;
    const hasModels = (product.compatibleModels?.length ?? 0) > 0;

    // We fetch all global attributes needed for the UI.
    const allAttributes = [...globalOptions.sizes, ...globalOptions.colors, ...globalOptions.materials];

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bdgirls.xyz';
    const brandName = settings?.brandName || settings?.siteName || 'BDGIRLS.XYZ';

    // Product JSON-LD structured data (schema.org/Product) — helps Google index product pages for rich results
    const productJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        description: product.shortDescription || product.title,
        image: product.images || [],
        url: `${baseUrl}/products/${product.slug}`,
        sku: product.sku || product._id,
        ...(product.brand?.name ? { brand: { '@type': 'Brand', name: product.brand.name } } : {}),
        offers: {
            '@type': 'Offer',
            url: `${baseUrl}/products/${product.slug}`,
            priceCurrency: 'BDT',
            price: product.discountedPrice || product.price,
            availability: product.stock > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            seller: {
                '@type': 'Organization',
                name: brandName,
            },
        },
        ...(product.reviewCount > 0 ? {
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: product.averageRating,
                reviewCount: product.reviewCount,
            },
        } : {}),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
            />
            <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
                <div className="container mx-auto px-4 pt-4 pb-0">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
                        {/* Breadcrumbs */}
                        <div className="col-span-1 lg:col-span-12">
                            <div className="flex items-center gap-2 text-[10px] lg:text-xs font-bold uppercase tracking-widest text-gray-400 overflow-x-auto whitespace-nowrap hide-scrollbar">
                                <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                                <span>/</span>
                                <Link href="/products" className="hover:text-primary transition-colors">Products</Link>
                                {product.category && (
                                    <>
                                        <span>/</span>
                                        <Link href={`/products?category=${product.category.slug}`} className="hover:text-primary transition-colors">
                                            {product.category.name}
                                        </Link>
                                    </>
                                )}
                                <span>/</span>
                                <span className="text-gray-900 truncate max-w-[200px] lg:max-w-none">{product.title}</span>
                            </div>
                        </div>

                        {/* Interactive Section: Images & Product Info (Col 1 to 9) */}
                        <ProductDetailInteractive 
                            initialProduct={product} 
                            globalAttributes={allAttributes} 
                            contactPhone={settings?.contactPhone || ''}
                            whatsappNumber={settings?.whatsapp || settings?.contactPhone || ''}
                        />

                        {/* Col 3: More Products Sidebar */}
                        <div className="lg:col-span-3 hidden lg:block lg:pl-6 xl:pl-10">
                            <div className="border border-gray-100 rounded-xl p-4 sticky top-6 lg:-mt-4 bg-white">
                                <ProductMoreSidebar
                                    currentProductId={product._id}
                                    categoryId={categoryId}
                                    subCategoryId={subCategoryId}
                                    childCategoryId={childCategoryId}
                                    subChildCategoryId={subChildCategoryId}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tabs Section */}
                    <div className="mt-6 lg:mt-8">
                        <ProductTabsSection product={product} />
                    </div>

                    {/* Related Products */}
                    <div className="mt-8">
                        <RelatedProducts
                            currentProductId={product._id}
                            categoryId={categoryId}
                            categoryName={product.category?.name || ''}
                            subCategoryId={subCategoryId}
                            childCategoryId={childCategoryId}
                            subChildCategoryId={subChildCategoryId}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
