import dbConnect from '@/lib/db';
import Brand from '@/models/Brand';
import BrandsGridClient from './BrandsGridClient';

async function getBrands() {
    await dbConnect();
    const brands = await Brand.find({ isActive: true })
        .select('name slug logo')
        .sort({ order: 1, name: 1 })
        .lean();
    return JSON.parse(JSON.stringify(brands));
}

export default async function BrandsPreview() {
    const brands = await getBrands();

    if (brands.length === 0) return null;

    return (
        <section className="py-6 md:py-10 bg-transparent">
            <div className="container mx-auto px-4 xl:px-0">
                <BrandsGridClient brands={brands} />
            </div>
        </section>
    );
}
