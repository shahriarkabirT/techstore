import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Settings from '@/models/Settings';
import '@/models/Category';
import '@/models/Brand';

// Utility to escape XML special characters
function escapeXml(unsafe: any): string {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export async function GET(request: Request) {
    try {
        await dbConnect();

        // Fetch products and settings
        const [products, settings] = await Promise.all([
            Product.find({ isActive: true })
                .populate('category', 'name')
                .populate('brand', 'name')
                .lean() as unknown as any[],
            Settings.findOne().lean() as any,
        ]);

        // Get base URL for absolute links
        const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://faisal-ecom.vercel.app';
        const brandName = settings?.brandName || 'Faisal Ecom';

        let xmlItems = '';

        for (const product of products) {
            const id = product._id.toString();
            const title = escapeXml(product.title);
            const description = escapeXml(product.shortDescription || product.title);
            const link = `${siteUrl}/products/${product.slug}`;
            
            // Image link normalization
            let imageLink = '';
            if (product.images && product.images.length > 0) {
                const firstImg = product.images[0];
                imageLink = firstImg.startsWith('http') ? firstImg : `${siteUrl}${firstImg}`;
            } else {
                imageLink = `${siteUrl}/placeholder.png`;
            }
            imageLink = escapeXml(imageLink);

            const brand = escapeXml(product.brand?.name || brandName);
            const category = escapeXml(product.category?.name || 'Shop');
            const availability = product.stock > 0 ? 'in stock' : 'out of stock';
            
            // Price calculation
            const mrp = Number(product.mrp) || Number(product.price) || 0;
            let discountedPrice = mrp;
            if (product.discountValue && product.discountValue > 0) {
                if (product.discountType === 'percentage') {
                    discountedPrice = mrp - (mrp * product.discountValue) / 100;
                } else {
                    discountedPrice = Math.max(0, mrp - product.discountValue);
                }
            }

            // Normal and sale prices formatted for Meta Catalog (e.g. "100.00 BDT")
            const priceStr = `${mrp.toFixed(2)} BDT`;
            const salePriceStr = discountedPrice < mrp ? `${discountedPrice.toFixed(2)} BDT` : '';

            xmlItems += `    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
      <g:brand>${brand}</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${priceStr}</g:price>
      ${salePriceStr ? `<g:sale_price>${salePriceStr}</g:sale_price>` : ''}
      <g:google_product_category>${category}</g:google_product_category>
    </item>\n`;
        }

        const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${escapeXml(brandName)} - Facebook Product Feed</title>
    <link>${siteUrl}</link>
    <description>Dynamic product catalog feed for Facebook pixel matching.</description>
    <language>en-us</language>
\n${xmlItems}  </channel>
</rss>`;

        return new Response(xmlString, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            },
        });
    } catch (error: any) {
        console.error('Meta feed generation error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
