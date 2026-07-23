import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import ProductsSliderClient from './ProductsSliderClient';
import { IProduct } from '@/types';

export default async function NewArrivalsSlider() {
    await dbConnect();

    const products = await Product.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(12)
        .lean();

    if (!products || products.length === 0) return null;

    return (
        <section className="w-full bg-transparent py-10 md:py-16">
            <div className="container mx-auto px-4 xl:px-0">
                <ProductsSliderClient 
                    title="New Arrivals" 
                    viewAllLink="/products"
                    products={JSON.parse(JSON.stringify(products))} 
                />
            </div>
        </section>
    );
}
