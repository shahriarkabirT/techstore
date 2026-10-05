'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useGetApprovedReviewsQuery, useSubmitReviewMutation } from '@/redux/features/reviews/reviewApi';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const REVIEWS_PER_PAGE = 2;

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button" onClick={() => onChange(star)} className="cursor-pointer">
                    <svg className={`w-7 h-7 ${star <= value ? 'text-yellow-400 fill-current' : 'text-gray-200 fill-current'}`} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                </button>
            ))}
        </div>
    );
}

function RatingBreakdown({ reviews }: { reviews: any[] }) {
    const total = reviews.length;
    const avg = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
    const recommended = total > 0 ? Math.round((reviews.filter(r => r.rating >= 4).length / total) * 100) : 0;
    const countForStar = (star: number) => reviews.filter(r => r.rating === star).length;

    return (
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 justify-center max-w-4xl mx-auto">
            <div className="text-center md:text-right w-full md:w-auto">
                <div className="text-6xl md:text-8xl font-black text-gray-900 leading-none tracking-tighter">{avg.toFixed(1)}</div>
                <div className="flex justify-center md:justify-end gap-1 my-3">
                    {[1, 2, 3, 4, 5].map(s => (
                        <svg key={s} className={`w-5 h-5 ${s <= Math.round(avg) ? 'text-yellow-400 fill-current' : 'text-gray-200 fill-current'}`} viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    ))}
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{recommended}% Recommend</p>
                <p className="text-[10px] text-gray-400 mt-1">Based on {total} reviews</p>
            </div>
            
            <div className="w-full md:w-80 space-y-3 shrink-0">
                {[5, 4, 3, 2, 1].map(star => {
                    const count = countForStar(star);
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                        <div key={star} className="flex items-center gap-3 text-sm">
                            <span className="w-2 font-bold text-gray-400 text-xs">{star}</span>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function ProductReviewsClient({ productId }: { productId: string }) {
    const router = useRouter();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [reviewImages, setReviewImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [reviewPage, setReviewPage] = useState(0);

    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const { data: reviewsData, isLoading: isReviewsLoading } = useGetApprovedReviewsQuery(productId);
    const [submitReview, { isLoading: isSubmitting }] = useSubmitReviewMutation();

    const reviews = reviewsData?.reviews || [];
    const totalReviewPages = Math.max(1, Math.ceil(reviews.length / REVIEWS_PER_PAGE));
    const paginatedReviews = reviews.slice(reviewPage * REVIEWS_PER_PAGE, reviewPage * REVIEWS_PER_PAGE + REVIEWS_PER_PAGE);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length || reviewImages.length + files.length > 5) {
            toast.error('Max 5 images allowed');
            return;
        }
        setIsUploading(true);
        try {
            const urls = await Promise.all(files.map(async file => {
                const fd = new FormData();
                fd.append('file', file);
                const res = await fetch('/api/upload', { method: 'POST', body: fd });
                const data = await res.json();
                if (!data.success) throw new Error(data.message);
                return data.imageUrl;
            }));
            setReviewImages(prev => [...prev, ...urls]);
            toast.success('Images uploaded');
        } catch (e: any) {
            toast.error(e.message || 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) { toast.error('Please login to review'); router.push('/login'); return; }
        if (!comment.trim()) { toast.error('Please enter a comment'); return; }
        try {
            await submitReview({ productId, rating, comment, images: reviewImages }).unwrap();
            toast.success('Review submitted! It will appear after approval.');
            setRating(5); setComment(''); setReviewImages([]);
        } catch (e: any) {
            toast.error(e.data?.message || 'Submission failed');
        }
    };

    const [isModalOpen, setIsModalOpen] = useState(false);

    // Intersection observer for Trust Sparkle
    const summaryRef = useRef<HTMLDivElement>(null);
    const [hasSeenSummary, setHasSeenSummary] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasSeenSummary) {
                    setHasSeenSummary(true);
                }
            },
            { threshold: 0.6 }
        );
        if (summaryRef.current) observer.observe(summaryRef.current);
        return () => observer.disconnect();
    }, [hasSeenSummary]);

    // Calculate avg rating for the trigger button
    const total = reviews.length;
    const avg = total > 0 ? reviews.reduce((sum: any, r: any) => sum + r.rating, 0) / total : 0;
    const recommended = total > 0 ? Math.round((reviews.filter((r: any) => r.rating >= 4).length / total) * 100) : 0;

    return (
        <div className="w-full">
            {/* Top Section: Compact Breakdown & Write Review */}
            <div className="mb-8" ref={summaryRef}>
                <div className={`relative flex flex-col items-center justify-center p-8 bg-gray-50 rounded-2xl border border-gray-100 text-center transition-all ${hasSeenSummary && total > 0 ? 'trust-sparkle-trigger in-view' : ''}`}>
                    {/* Floating Tooltip (Trust Sparkle) */}
                    {total > 0 && (
                        <div className={`absolute -top-14 bg-white px-4 py-2 rounded-xl shadow-xl text-xs font-bold border border-yellow-200 text-yellow-700 transition-all duration-700 delay-500 pointer-events-none whitespace-nowrap ${hasSeenSummary ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            Loved by our community 💛
                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-yellow-200 rotate-45"></div>
                        </div>
                    )}

                    <div className="text-6xl font-black text-gray-900 leading-none tracking-tighter mb-3">{avg.toFixed(1)}</div>
                    <div className="flex justify-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map(s => (
                            <svg key={s} className={`w-5 h-5 ${s <= Math.round(avg) ? 'text-yellow-400 fill-current' : 'text-gray-200 fill-current'}`} viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        ))}
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{recommended}% Recommend</p>
                    <p className="text-[10px] text-gray-400 mt-1 mb-8">Based on {total} reviews</p>
                    
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full py-3.5 bg-gray-900 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg hover:bg-black transition-all cursor-pointer"
                    >
                        Write a Review
                    </button>
                </div>
            </div>

            {/* List Section */}
            {isReviewsLoading ? (
                <div className="flex flex-col gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                            <div className="h-4 bg-gray-100 rounded w-1/3 mb-4" />
                            <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                            <div className="h-3 bg-gray-100 rounded w-5/6" />
                        </div>
                    ))}
                </div>
            ) : reviews.length > 0 ? (
                <div>
                    <div className="flex flex-col gap-4">
                        {paginatedReviews.map((review: any) => (
                            <div key={review._id} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-black text-sm overflow-hidden">
                                            {review.reviewerAvatar || review.userId?.image ? (
                                                <Image src={review.reviewerAvatar || review.userId?.image} alt="Avatar" fill className="object-cover" sizes="40px" />
                                            ) : (
                                                (review.reviewerName || review.userId?.name)?.charAt(0)?.toUpperCase() || 'U'
                                            )}
                                        </div>
                                        <div>
                                            <span className="block text-sm font-bold text-gray-900 leading-none mb-1">{review.reviewerName || review.userId?.name || 'Anonymous'}</span>
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <svg key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-200 fill-current'}`} viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed font-medium">{review.comment}</p>
                                {review.images?.filter(Boolean).length > 0 && (
                                    <div className="flex gap-2 mt-4 flex-wrap">
                                        {review.images.filter(Boolean).map((img: string, idx: number) => (
                                            <div key={idx} className="relative w-16 h-16 rounded-lg border border-gray-100 overflow-hidden">
                                                <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <p className="text-[10px] font-bold text-gray-400 mt-4 uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                    
                    {/* Pagination */}
                    {reviews.length > REVIEWS_PER_PAGE && (
                        <div className="flex items-center justify-center gap-3 pt-10">
                            <button
                                type="button"
                                disabled={reviewPage <= 0}
                                onClick={() => setReviewPage((p) => Math.max(0, p - 1))}
                                className="inline-flex items-center justify-center w-10 h-10 text-gray-600 border border-gray-200 rounded-full bg-white hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 shadow-sm disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-xs font-bold text-gray-900 tabular-nums px-2 tracking-widest">
                                {reviewPage + 1} <span className="text-gray-300 mx-1">/</span> {totalReviewPages}
                            </span>
                            <button
                                type="button"
                                disabled={reviewPage >= totalReviewPages - 1}
                                onClick={() => setReviewPage((p) => Math.min(totalReviewPages - 1, p + 1))}
                                className="inline-flex items-center justify-center w-10 h-10 text-gray-600 border border-gray-200 rounded-full bg-white hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 shadow-sm disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200 max-w-2xl mx-auto">
                    <p className="text-sm font-medium text-gray-500">No reviews yet. Be the first to review this product!</p>
                </div>
            )}

            {/* Submit Review Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Submit Your Review</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900">✕</button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            {!isAuthenticated ? (
                                <div className="text-center py-6">
                                    <p className="text-sm text-gray-500 mb-3">Please log in to write a review.</p>
                                    <Link href="/login" className="inline-block px-5 py-2 bg-primary text-white font-bold text-sm rounded hover:bg-primary/90 transition-colors">
                                        Log In to Review
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={(e) => { handleSubmit(e); setIsModalOpen(false); }} className="space-y-4">
                                    <p className="text-xs text-gray-500">Your email will not be published. Required fields are marked *</p>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">How do you feel about this product?</label>
                                        <StarRating value={rating} onChange={setRating} />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Write Your Review... *</label>
                                        <textarea
                                            rows={4}
                                            value={comment}
                                            onChange={e => setComment(e.target.value)}
                                            required
                                            placeholder="Share your experience..."
                                            className="w-full px-3 py-2 border border-gray-200 rounded text-sm text-gray-800 resize-none focus:outline-none focus:border-orange-400 bg-white"
                                        />
                                    </div>
                                    
                                    {reviewImages.length > 0 && (
                                        <div className="flex gap-2 flex-wrap">
                                            {reviewImages.map((img, i) => (
                                                <div key={i} className="relative w-14 h-14 rounded border overflow-hidden group">
                                                    <Image src={img} alt="" fill className="object-cover" sizes="56px" />
                                                    <button type="button" onClick={() => setReviewImages(p => p.filter((_, idx) => idx !== i))}
                                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity cursor-pointer">✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {reviewImages.length < 5 && (
                                        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-primary transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                            Add Photos
                                            <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={isUploading} />
                                        </label>
                                    )}
                                    
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || isUploading}
                                        className="w-full mt-4 py-3 bg-primary text-white text-sm font-black uppercase tracking-wider rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
