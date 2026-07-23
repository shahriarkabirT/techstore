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
        const user = await User.findOne({ email: userPayload.email }).select('wishlist');
        const wishlist: any[] = user?.wishlist || [];

        if (wishlist.length > 0) {
            // Validate IDs — remove any that point to deleted products
            const existingProducts = await Product.find(
                { _id: { $in: wishlist } },
                { _id: 1 }
            ).lean();
            const existingIds = new Set(existingProducts.map((p: any) => p._id.toString()));
            const validWishlist = wishlist.filter((id: string) => existingIds.has(id.toString()));

            // If stale IDs were found, update the user
            if (validWishlist.length !== wishlist.length && user) {
                user.wishlist = validWishlist;
                await user.save();
            }

            return NextResponse.json({ success: true, wishlist: validWishlist });
        }

        return NextResponse.json({ success: true, wishlist });

    } catch (error) {
        console.error('Wishlist Fetch Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userPayload = await getUserFromRequest();

        if (!userPayload) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { productId } = await request.json();
        await dbConnect();

        const user = await User.findOne({ email: userPayload.email });
        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        const index = user.wishlist.indexOf(productId);
        if (index > -1) {
            // Remove
            user.wishlist.splice(index, 1);
        } else {
            // Add
            user.wishlist.push(productId);
        }

        await user.save();

        return NextResponse.json({
            success: true,
            wishlist: user.wishlist,
            message: index > -1 ? 'Removed from wishlist' : 'Added to wishlist'
        });

    } catch (error) {
        console.error('Wishlist Update Error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
