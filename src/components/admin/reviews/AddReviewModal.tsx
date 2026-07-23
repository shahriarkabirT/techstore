'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAdminCreateReviewMutation } from '@/redux/features/reviews/reviewApi';
import { useGetProductsQuery } from '@/redux/features/product/productApi';
import { X, Upload, Star } from 'lucide-react';
import Image from 'next/image';

interface AddReviewModalProps {
    onClose: () => void;
}

export default function AddReviewModal({ onClose }: AddReviewModalProps) {
    const [search, setSearch] = useState('');
    const { data: productsData, isLoading: isLoadingProducts } = useGetProductsQuery({ search, limit: 10 });
    
    const [createReview, { isLoading: isCreating }] = useAdminCreateReviewMutation();

    const [productId, setProductId] = useState('');
    const [reviewerName, setReviewerName] = useState('');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [reviewerAvatar, setReviewerAvatar] = useState('');
    const [images, setImages] = useState<string[]>([]);
    
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isUploadingImages, setIsUploadingImages] = useState(false);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setIsUploadingAvatar(true);
        const formData = new FormData();
        formData.append('file', e.target.files[0]);
        try {
            const res = await axios.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setReviewerAvatar(res.data.imageUrl);
            toast.success('Avatar uploaded!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to upload avatar');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setIsUploadingImages(true);
        
        try {
            const newImages = [...images];
            for (let i = 0; i < e.target.files.length; i++) {
                const formData = new FormData();
                formData.append('file', e.target.files[i]);
                const res = await axios.post('/api/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                newImages.push(res.data.imageUrl);
            }
            setImages(newImages);
            toast.success('Images uploaded!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to upload images');
        } finally {
            setIsUploadingImages(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productId) return toast.error('Please select a product');
        if (!reviewerName.trim()) return toast.error('Reviewer name is required');
        if (!comment.trim()) return toast.error('Comment is required');

        try {
            await createReview({
                productId,
                reviewerName,
                reviewerAvatar,
                rating,
                comment,
                images,
            }).unwrap();
            
            toast.success('Review created successfully!');
            onClose();
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to create review');
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900">Add Manual Review</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Product Selection */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Select Product *</label>
                        <input
                            type="text"
                            placeholder="Search product..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <div className="mt-2 max-h-40 overflow-y-auto border border-gray-100 rounded-lg">
                            {isLoadingProducts ? (
                                <div className="p-4 text-center text-sm text-gray-500">Loading products...</div>
                            ) : (
                                productsData?.products.map((p) => (
                                    <div
                                        key={p._id}
                                        onClick={() => setProductId(p._id)}
                                        className={`p-3 cursor-pointer hover:bg-indigo-50 text-sm transition-colors ${productId === p._id ? 'bg-indigo-100 border-l-4 border-indigo-500' : ''}`}
                                    >
                                        <div className="font-medium text-gray-900">{p.title}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Reviewer Details */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={reviewerName}
                                    onChange={(e) => setReviewerName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture (Optional)</label>
                                <div className="flex items-center gap-4">
                                    {reviewerAvatar && (
                                        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-200">
                                            <Image src={reviewerAvatar} alt="Avatar" fill className="object-cover" />
                                        </div>
                                    )}
                                    <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                                        <Upload className="w-4 h-4" />
                                        {isUploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Review Details */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rating *</label>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className="p-1 focus:outline-none"
                                        >
                                            <Star className={`w-6 h-6 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Comment *</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Product Images */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Pictures (Optional)</label>
                        <div className="flex flex-wrap items-center gap-4">
                            {images.map((img, i) => (
                                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                                    <Image src={img} alt="Product image" fill className="object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                                        className="absolute top-1 right-1 bg-white/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3 text-red-500" />
                                    </button>
                                </div>
                            ))}
                            <label className="cursor-pointer w-20 h-20 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors">
                                <Upload className="w-5 h-5 text-gray-400" />
                                <span className="text-[10px] text-gray-500 font-medium">Add</span>
                                <input type="file" multiple className="hidden" accept="image/*" onChange={handleImagesUpload} disabled={isUploadingImages} />
                            </label>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isCreating || isUploadingAvatar || isUploadingImages}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            {isCreating ? 'Creating...' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
