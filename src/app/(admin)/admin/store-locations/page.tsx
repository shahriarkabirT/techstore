'use client';

import { useState } from 'react';
import {
    useGetAdminStoreLocationsQuery,
    useCreateStoreLocationMutation,
    useUpdateStoreLocationMutation,
    useDeleteStoreLocationMutation
} from '@/redux/features/storeLocation/storeLocationApi';
import { IStoreLocation } from '@/types';
import { showError, showSuccess } from '@/lib/toast';
import StoreLocationModal from '@/components/admin/store-locations/StoreLocationModal';
import Image from 'next/image';
import { MapPin, Globe, ExternalLink, Trash2, Edit3 } from 'lucide-react';

export default function StoreLocationsPage() {
    const { data: locations, isLoading } = useGetAdminStoreLocationsQuery();
    const [createLocation, { isLoading: isCreating }] = useCreateStoreLocationMutation();
    const [updateLocation, { isLoading: isUpdating }] = useUpdateStoreLocationMutation();
    const [deleteLocation] = useDeleteStoreLocationMutation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<IStoreLocation | null>(null);

    const handleAdd = () => {
        setSelectedLocation(null);
        setIsModalOpen(true);
    };

    const handleEdit = (location: IStoreLocation) => {
        setSelectedLocation(location);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this store location?')) {
            try {
                await deleteLocation(id).unwrap();
                showSuccess('Deleted', 'Store location deleted successfully');
            } catch (err: any) {
                showError('Error', err.data?.message || 'Failed to delete');
            }
        }
    };

    const handleToggleStatus = async (location: IStoreLocation) => {
        try {
            await updateLocation({
                id: location._id,
                body: { isActive: !location.isActive }
            }).unwrap();
            showSuccess('Updated', `Location is now ${!location.isActive ? 'active' : 'inactive'}`);
        } catch (err: any) {
            showError('Error', err.data?.message || 'Failed to update status');
        }
    };

    const handleSubmit = async (data: Partial<IStoreLocation>) => {
        try {
            if (selectedLocation) {
                await updateLocation({ id: selectedLocation._id, body: data }).unwrap();
                showSuccess('Updated', 'Store location updated successfully');
            } else {
                await createLocation(data).unwrap();
                showSuccess('Created', 'Store location created successfully');
            }
            setIsModalOpen(false);
        } catch (err: any) {
            showError('Error', err.data?.message || 'Failed to save');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Store Locations</h1>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Manage brick & mortar stores</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="btn bg-gray-900 text-white hover:bg-gray-800 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                >
                    Add New Location
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4 animate-pulse">
                            <div className="aspect-video bg-gray-100 rounded-xl" />
                            <div className="h-4 bg-gray-100 rounded w-2/3" />
                            <div className="h-4 bg-gray-100 rounded w-1/2" />
                        </div>
                    ))
                ) : locations?.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                        <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">No locations added yet</p>
                    </div>
                ) : (
                    locations?.map((location) => (
                        <div key={location._id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                            {/* Image Preview */}
                            <div className="relative aspect-video bg-gray-50 flex items-center justify-center overflow-hidden">
                                {location.image ? (
                                    <Image
                                        src={location.image}
                                        alt={location.title}
                                        fill
                                        className="object-cover transition-transform group-hover:scale-105"
                                    />
                                ) : (
                                    <Globe className="w-8 h-8 text-gray-200" strokeWidth={1.5} />
                                )}
                                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleEdit(location)}
                                        className="p-2 bg-white/90 backdrop-blur-sm text-gray-800 rounded-lg hover:bg-white shadow-sm"
                                        title="Edit"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(location._id)}
                                        className="p-2 bg-rose-500/90 backdrop-blur-sm text-white rounded-lg hover:bg-rose-500 shadow-sm"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="absolute top-3 left-3">
                                    <button
                                        onClick={() => handleToggleStatus(location)}
                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-sm shadow-sm ${location.isActive
                                                ? 'bg-emerald-500/90 text-white'
                                                : 'bg-rose-500/90 text-white'
                                            }`}
                                    >
                                        {location.isActive ? 'Active' : 'Hidden'}
                                    </button>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight line-clamp-1">{location.title}</h3>
                                        <div className="flex items-start gap-2 mt-2">
                                            <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                            <p className="text-[11px] leading-relaxed text-gray-600 line-clamp-2">{location.address}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-50">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Order</p>
                                            <p className="text-xs font-bold text-gray-900">{location.order}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Contact</p>
                                            <p className="text-xs font-bold text-gray-900">{location.contact}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    {location.mapLink ? (
                                        <a 
                                            href={location.mapLink} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest py-1 transition-colors"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            Map Link
                                        </a>
                                    ) : (
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest py-1">No Map Link</span>
                                    )}
                                    
                                    <button 
                                        onClick={() => handleEdit(location)}
                                        className="text-[11px] font-black text-gray-900 hover:underline uppercase tracking-widest"
                                    >
                                        Full Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <StoreLocationModal
                key={selectedLocation?._id || (isModalOpen ? 'new' : 'none')}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                location={selectedLocation}
                onSubmit={handleSubmit}
                isLoading={isCreating || isUpdating}
            />
        </div>
    );
}
