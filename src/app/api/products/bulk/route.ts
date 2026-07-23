import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import User from '@/models/User';
import { deleteImages } from '@/lib/imageUtils';

export async function DELETE(req: NextRequest) {
    try {
        await dbConnect();

        const body = await req.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Invalid or empty IDs provided' },
                { status: 400 }
            );
        }

        // Fetch all products to collect their image URLs before deleting
        const products = await Product.find({ _id: { $in: ids } }).select('images variants').lean();
        const allImages: string[] = products.flatMap((p: any) => [
            ...(p.images || []),
            ...(p.variants || []).flatMap((v: any) => v.images || []),
        ]);
        await deleteImages(allImages);

        const result = await Product.deleteMany({ _id: { $in: ids } });

        // Remove deleted product IDs from all users' wishlists
        await User.updateMany(
            { wishlist: { $in: ids } },
            { $pull: { wishlist: { $in: ids } } }
        );

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { success: false, message: 'No products found to delete' },
                { status: 404 }
            );
        }

        revalidatePath('/');

        return NextResponse.json({
            success: true,
            message: `Successfully deleted ${result.deletedCount} products`,
        });
    } catch (error: any) {
        console.error('Error deleting products:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
