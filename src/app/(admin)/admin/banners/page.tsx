'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
    useGetBannersQuery,
    useCreateBannerMutation,
    useUpdateBannerMutation,
    useDeleteBannerMutation
} from '@/redux/features/banner/bannerApi';
import BannerModal from '@/components/admin/banners/BannerModal';
import { IBanner } from '@/types';

export default function AdminBannersPage() {
    // State for local form handling
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<IBanner | null>(null);

    const searchParams = useSearchParams();
    const positionQuery = searchParams.get('position');
    const position = (['primary', 'secondary', 'secondary-top', 'secondary-bottom', 'promotional-left', 'promotional-right'].includes(positionQuery || '')
        ? positionQuery
        : 'primary') as 'primary' | 'secondary' | 'secondary-top' | 'secondary-bottom' | 'promotional-left' | 'promotional-right';

    // API Hooks
    const { data: banners = [], isLoading } = useGetBannersQuery({ position });
    const [createBanner, { isLoading: isCreating }] = useCreateBannerMutation();
    const [updateBanner, { isLoading: isUpdating }] = useUpdateBannerMutation();
    const [deleteBanner] = useDeleteBannerMutation();

    const handleSubmit = async (formData: Partial<IBanner>) => {
        try {
            if (editingBanner) {
                await updateBanner({ id: editingBanner._id, body: formData }).unwrap();
            } else {
                await createBanner(formData).unwrap();
            }
            setIsFormOpen(false);
            setEditingBanner(null);
        } catch {
            alert('Failed to save banner');
        }
    };

    const handleEdit = (banner: IBanner) => {
        setEditingBanner(banner);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this banner?')) {
            try {
                await deleteBanner(id).unwrap();
            } catch {
                alert('Failed to delete banner');
            }
        }
    };

    const handleToggleActive = async (banner: IBanner) => {
        try {
            await updateBanner({
                id: banner._id,
                body: { isActive: !banner.isActive }
            }).unwrap();
        } catch {
            // Error handling tailored to user needs
        }
    };

    const handleCloseModal = () => {
        setIsFormOpen(false);
        setEditingBanner(null);
    };

    // Determine if this is a promotional slot that's already filled (max 1)
    const isPromoPosition = position === 'promotional-left' || position === 'promotional-right';
    const isPromoSlotFull = isPromoPosition && !isLoading && banners.length >= 1;

    // Determine if this is a secondary position that is already full (max 4)
    const isSecondaryPosition = position === 'secondary-top' || position === 'secondary-bottom';
    const isSecondaryFull = isSecondaryPosition && !isLoading && banners.length >= 4;

    const canAddBanner = !isPromoSlotFull && !isSecondaryFull;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 capitalize">
                        {position === 'promotional-left' ? 'Promotional Left' :
                         position === 'promotional-right' ? 'Promotional Right' :
                         position === 'secondary-top' ? 'Secondary Top' :
                         position === 'secondary-bottom' ? 'Secondary Bottom' :
                         position} Banners
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {position === 'secondary-top' || position === 'secondary-bottom'
                            ? `Manage ${position === 'secondary-top' ? 'secondary top' : 'secondary bottom'} banners (maximum 4 banners allowed. Current: ${banners.length}/4)`
                            : `Manage ${position} homepage banners and sliders`
                        }
                    </p>
                </div>
                {canAddBanner && (
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="btn bg-gray-900 text-white hover:bg-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        Add New Banner
                    </button>
                )}
            </div>

            <BannerModal
                key={isFormOpen ? (editingBanner?._id || 'new') : 'closed'}
                isOpen={isFormOpen}
                onClose={handleCloseModal}
                banner={editingBanner}
                onSubmit={handleSubmit}
                isLoading={isCreating || isUpdating}
                defaultPosition={position}
            />

            {isLoading ? (
                <div className="py-12 text-center text-sm text-gray-500 bg-white rounded-xl border border-gray-200">
                    Loading banners...
                </div>
            ) : banners.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {banners.map((banner) => (
                        <div key={banner._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col group hover:shadow-md transition-all">
                            {/* Image Section */}
                            <div className="relative w-full aspect-video bg-gray-100 border-b border-gray-100">
                                <Image
                                    src={banner.image}
                                    alt={banner.title || 'Banner image'}
                                    fill
                                    className="object-cover"
                                />
                                {/* Status Badge */}
                                <div className="absolute top-3 right-3 z-10">
                                    <button
                                        onClick={() => handleToggleActive(banner)}
                                        className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-sm backdrop-blur-md ${banner.isActive
                                            ? 'bg-green-500 text-white hover:bg-green-600'
                                            : 'bg-white/90 text-gray-700 hover:bg-white'
                                            } transition-colors`}
                                    >
                                        {banner.isActive ? 'Active' : 'Inactive'}
                                    </button>
                                </div>
                                {/* Type Badge */}
                                <div className="absolute top-3 left-3 z-10">
                                    <span className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded-full shadow-sm backdrop-blur-md ${
                                        banner.position === 'secondary' || banner.position === 'secondary-top' || banner.position === 'secondary-bottom'
                                        ? 'bg-purple-600 text-white'
                                        : banner.position === 'promotional-left'
                                        ? 'bg-orange-500 text-white'
                                        : banner.position === 'promotional-right'
                                        ? 'bg-teal-600 text-white'
                                        : 'bg-blue-600 text-white'
                                    }`}>
                                        {banner.position === 'secondary-top' ? 'Secondary Top'
                                        : banner.position === 'secondary-bottom' ? 'Secondary Bottom'
                                        : banner.position === 'secondary' ? 'Secondary'
                                        : banner.position === 'promotional-left' ? 'Promo Left'
                                        : banner.position === 'promotional-right' ? 'Promo Right'
                                        : 'Primary'}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Card Content Section */}
                            <div className="p-4 md:p-5 flex flex-col flex-1">
                                <div className="mb-4">
                                    <h3 className="text-base font-bold text-gray-900 line-clamp-1">{banner.title || 'No Title Provided'}</h3>
                                    {banner.subtitle && (
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{banner.subtitle}</p>
                                    )}
                                    {banner.link && (
                                        <p className="text-[11px] text-accent font-mono mt-3 truncate max-w-full bg-accent/5 px-2 py-1 rounded-md">
                                            {banner.link}
                                        </p>
                                    )}
                                </div>
                                
                                {/* Footer Action Row */}
                                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                                            Order: {banner.order}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEdit(banner)}
                                            className="p-2 text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-900 hover:bg-gray-50 rounded-lg transition-all"
                                            title="Edit"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(banner._id)}
                                            className="p-2 text-rose-500 hover:text-white border border-rose-200 hover:border-rose-600 hover:bg-rose-500 rounded-lg transition-all bg-rose-50"
                                            title="Delete"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-12 text-center text-sm text-gray-500 bg-white rounded-xl border border-gray-200">
                    No banners found. Click &quot;Add New Banner&quot; to create one.
                </div>
            )}
        </div>
    );
}
