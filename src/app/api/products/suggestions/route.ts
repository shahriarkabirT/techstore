import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';

/**
 * Builds a fuzzy regex pattern that tolerates one character mistake (insertion, deletion, substitution).
 * e.g. "iphon" will match "iphone", "ipohn", etc.
 */
function fuzzyPattern(word: string): string {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const variations: string[] = [escaped];
    for (let i = 0; i < word.length; i++) {
        variations.push(escaped.slice(0, i) + escaped.slice(i + 1));      // deletion
        variations.push(escaped.slice(0, i) + '.' + escaped.slice(i + 1)); // substitution
    }
    for (let i = 0; i <= word.length; i++) {
        variations.push(escaped.slice(0, i) + '.?' + escaped.slice(i));    // insertion
    }
    return variations.filter(Boolean).join('|');
}

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        if (!query || query.trim().length < 2) {
            return NextResponse.json({ success: true, products: [] });
        }

        const terms = query.trim().split(/\s+/);

        // Each term must match at least one searchable field (AND across terms)
        const termConditions = terms.map(term => {
            const pattern = fuzzyPattern(term);
            const re = { $regex: pattern, $options: 'i' };
            return {
                $or: [
                    { title: re },
                    { tags: re },
                    { shortDescription: re },
                    { sku: re },
                ],
            };
        });

        const products = await Product.find({
            $and: termConditions,
            isActive: true,
        })
            .select('title slug price mrp discountValue discountType images category tags')
            .populate('category', 'name')
            .limit(8)
            .lean();

        return NextResponse.json({
            success: true,
            products,
        });
    } catch (error) {
        console.error('Search Suggestions Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error', products: [] },
            { status: 500 }
        );
    }
}
