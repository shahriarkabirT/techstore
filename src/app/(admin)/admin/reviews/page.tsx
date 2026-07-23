'use client';

import React, { useState } from 'react';
import {
    useAdminGetAllReviewsQuery,
    useAdminUpdateReviewMutation,
    useAdminDeleteReviewMutation,
} from '@/redux/features/reviews/reviewApi';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import AddReviewModal from '@/components/admin/reviews/AddReviewModal';
import EditReviewModal from '@/components/admin/reviews/EditReviewModal';

export default function AdminReviewsPage() {
    const [page, setPage] = useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingReview, setEditingReview] = useState<any>(null);
    const { data: reviewsData, isLoading, refetch } = useAdminGetAllReviewsQuery({ page, limit: 10 });
    const [updateStatus, { isLoading: isUpdating }] = useAdminUpdateReviewMutation();
    const [deleteReview, { isLoading: isDeleting }] = useAdminDeleteReviewMutation();

    const handleApprove = async (reviewId: string) => {
        try {
            await updateStatus({ reviewId, isApproved: true }).unwrap();
            toast.success('Review approved successfully');
        } catch (error) {
            toast.error('Failed to approve review');
        }
    };

    const handleReject = async (reviewId: string) => {
        try {
            await updateStatus({ reviewId, isApproved: false }).unwrap();
            toast.success('Review rejected successfully');
        } catch (error) {
            toast.error('Failed to reject review');
        }
    };

    const handleDelete = async (reviewId: string) => {
        if (!confirm('Are you sure you want to delete this review?')) return;
        try {
            await deleteReview(reviewId).unwrap();
            toast.success('Review deleted successfully');
        } catch (error) {
            toast.error('Failed to delete review');
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading reviews...</div>;

    return (
        <div className="p-4 sm:p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Review Management</h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                        Add Review
                    </button>
                    <button
                        onClick={() => refetch()}
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {isAddModalOpen && (
                <AddReviewModal onClose={() => {
                    setIsAddModalOpen(false);
                    refetch();
                }} />
            )}

            {editingReview && (
                <EditReviewModal
                    review={editingReview}
                    onClose={() => {
                        setEditingReview(null);
                        refetch();
                    }}
                />
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">User</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Product</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Rating & Comment</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Images</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {reviewsData?.reviews.map((review: any) => (
                                <tr key={review._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        {review.reviewerAvatar || review.userId?.image ? (
                                            <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                                                <Image src={review.reviewerAvatar || review.userId?.image} alt="Avatar" fill className="object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                                <span className="text-xs font-bold text-gray-500">
                                                    {(review.reviewerName || review.userId?.name || '?').charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-sm font-bold text-gray-900">{review.reviewerName || review.userId?.name}</div>
                                            <div className="text-[10px] text-gray-500">{review.userId?.email || 'Added by Admin'}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/products/${review.productId?.slug}`}
                                            className="text-sm font-medium text-indigo-600 hover:underline"
                                        >
                                            {review.productId?.title}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs">
                                        <div className="flex items-center gap-1 mb-1">
                                            {[...Array(5)].map((_, i) => (
                                                <svg
                                                    key={i}
                                                    className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`}
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-600 line-clamp-2">{review.comment}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1">
                                            {review.images?.filter(Boolean).map((img: string, idx: number) => (
                                                <div key={idx} className="relative w-8 h-8 rounded border border-gray-100 overflow-hidden">
                                                    <Image src={img} alt="Review" fill className="object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${review.isApproved
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                : 'bg-yellow-50 text-yellow-600 border border-yellow-100'
                                            }`}>
                                            {review.isApproved ? 'Approved' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setEditingReview(review)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit Review"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                                </svg>
                                            </button>
                                            {review.isApproved ? (
                                                <button
                                                    onClick={() => handleReject(review._id)}
                                                    disabled={isUpdating}
                                                    className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                                    title="Reject Review"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                    </svg>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleApprove(review._id)}
                                                    disabled={isUpdating}
                                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Approve Review"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                    </svg>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(review._id)}
                                                disabled={isDeleting}
                                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Delete Review"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {reviewsData?.pagination && reviewsData.pagination.pages > 1 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-xs text-gray-500 font-medium">
                            Showing {reviewsData.reviews.length} of {reviewsData.pagination.total} reviews
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 bg-white border border-gray-200 rounded text-xs font-bold disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(reviewsData.pagination.pages, p + 1))}
                                disabled={page === reviewsData.pagination.pages}
                                className="px-3 py-1 bg-white border border-gray-200 rounded text-xs font-bold disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
