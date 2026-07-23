import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/jwt';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Product from '@/models/Product';

export async function GET() {
    try {
        const userPayload = await getUserFromRequest();

        if (!userPayload) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const user = await User.findOne({ email: userPayload.email })
            .select('cart')
            .populate({
                path: 'cart.productId',
                model: Product,
                select: 'title price mrp images stock discountValue discountType'
            });

        const cart = user?.cart?.map((item: any) => {
            const product = item.productId;
            if (!product || typeof product === 'string') return item;

            return {
                productId: product._id,
                title: item.title || product.title,
                price: item.price || product.price, // Using snapshot price if available, else latest
                originalPrice: item.originalPrice || product.mrp || product.price,
                discount: item.discount || product.discountValue || 0,
                image: item.image || product.images?.[0] || '',
                quantity: item.quantity,
                stock: item.stock || product.stock || 0,
                variant: item.variant
            };
        }) || [];

        return NextResponse.json({
            success: true,
            cart
        });

    } catch (error) {
        console.error('Cart Fetch Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userPayload = await getUserFromRequest();

        if (!userPayload) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { cart } = await request.json();
        await dbConnect();

        await User.findOneAndUpdate(
            { email: userPayload.email },
            { $set: { cart } }
        );

        return NextResponse.json({
            success: true,
            message: 'Cart synced successfully'
        });

    } catch (error) {
        console.error('Cart Sync Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
