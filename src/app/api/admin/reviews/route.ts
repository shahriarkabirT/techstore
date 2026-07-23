import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';
import Product from '@/models/Product';
import { requirePermission } from '@/lib/auth';
import { deleteImages } from '@/lib/imageUtils';

export async function GET(request: NextRequest) {
    const admin = await requirePermission('reviews');
    if (!admin) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }


    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const reviews = await Review.find()
            .populate('productId', 'title slug')
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Review.countDocuments();

        return NextResponse.json({
            success: true,
            reviews,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const admin = await requirePermission('reviews');
    if (!admin) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const body = await request.json();
        const { productId, rating, comment, images, reviewerName, reviewerAvatar } = body;

        if (!productId || !rating || !comment || !reviewerName) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        const newReview = new Review({
            productId,
            reviewerName,
            reviewerAvatar,
            rating,
            comment,
            images: images || [],
            isApproved: true, // Auto-approve admin-created reviews
        });

        await newReview.save();

        // Update product metadata since it's auto-approved
        const allApprovedReviews = await Review.find({ productId, isApproved: true });
        const avgRating = allApprovedReviews.length > 0
            ? allApprovedReviews.reduce((acc, r) => acc + r.rating, 0) / allApprovedReviews.length
            : 0;

        await Product.findByIdAndUpdate(productId, {
            averageRating: avgRating,
            reviewCount: allApprovedReviews.length
        });

        return NextResponse.json({ success: true, review: newReview }, { status: 201 });
    } catch (error) {
        console.error('Error creating admin review:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const admin = await requirePermission('reviews');
    if (!admin) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const body = await request.json();
        const { reviewId, isApproved, rating, comment, images, reviewerName, reviewerAvatar } = body;

        if (!reviewId) {
            return NextResponse.json({ success: false, message: 'Review ID is required' }, { status: 400 });
        }

        const updateData: any = {};
        if (isApproved !== undefined) updateData.isApproved = isApproved;
        if (rating !== undefined) updateData.rating = rating;
        if (comment !== undefined) updateData.comment = comment;
        if (images !== undefined) updateData.images = images;
        if (reviewerName !== undefined) updateData.reviewerName = reviewerName;
        if (reviewerAvatar !== undefined) updateData.reviewerAvatar = reviewerAvatar;

        const review = await Review.findByIdAndUpdate(reviewId, updateData, { new: true });

        if (!review) {
            return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 });
        }

        // Recalculate product metadata if rating or approval status changed
        if (updateData.isApproved !== undefined || updateData.rating !== undefined) {
            const productId = review.productId;
            const allApprovedReviews = await Review.find({ productId, isApproved: true });
            const avgRating = allApprovedReviews.length > 0
                ? allApprovedReviews.reduce((acc, r) => acc + r.rating, 0) / allApprovedReviews.length
                : 0;

            await Product.findByIdAndUpdate(productId, {
                averageRating: avgRating,
                reviewCount: allApprovedReviews.length
            });
        }

        return NextResponse.json({ success: true, review });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const admin = await requirePermission('reviews');
    if (!admin) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
        }

        const review = await Review.findById(id);

        if (!review) {
            return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 });
        }

        // Delete any attached review images from the filesystem
        if (review.images && review.images.length > 0) {
            await deleteImages(review.images);
        }

        await Review.findByIdAndDelete(id);

        if (review && review.isApproved) {
            // Re-calculate product metadata if an approved review was deleted
            const productId = review.productId;
            const allApprovedReviews = await Review.find({ productId, isApproved: true });
            const avgRating = allApprovedReviews.length > 0
                ? allApprovedReviews.reduce((acc, r) => acc + r.rating, 0) / allApprovedReviews.length
                : 0;

            await Product.findByIdAndUpdate(productId, {
                averageRating: avgRating,
                reviewCount: allApprovedReviews.length
            });
        }

        return NextResponse.json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
