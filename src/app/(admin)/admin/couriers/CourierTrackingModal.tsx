import React, { useState } from 'react';
import { X, Search, Package, Clock, Activity, AlertCircle } from 'lucide-react';
import { useTrackCourierParcelQuery } from '@/redux/features/courier/courierApi';

interface CourierTrackingModalProps {
    courierName: string;
    onClose: () => void;
}

const formatDate = (dateString: string) => {
    try {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateString;
    }
};

export default function CourierTrackingModal({ courierName, onClose }: CourierTrackingModalProps) {
    const [trackingIdInput, setTrackingIdInput] = useState('');
    const [activeSearchQuery, setActiveSearchQuery] = useState('');

    const { data: trackingData, isFetching, isError, error } = useTrackCourierParcelQuery(
        { courierName, trackingId: activeSearchQuery },
        { skip: !activeSearchQuery }
    );

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (trackingIdInput.trim()) {
            setActiveSearchQuery(trackingIdInput.trim());
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center">
                            <Package size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Track Parcel</h2>
                            <p className="text-xs text-gray-500 font-medium capitalize">via {courierName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-900 hover:bg-white rounded-full transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            value={trackingIdInput}
                            onChange={(e) => setTrackingIdInput(e.target.value)}
                            placeholder={`Enter ${courierName} Tracking ID...`}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-11 text-sm font-medium focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        />
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <button
                            type="submit"
                            disabled={!trackingIdInput.trim() || isFetching}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-black text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-opacity"
                        >
                            {isFetching ? 'Searching...' : 'Track'}
                        </button>
                    </form>

                    {/* Loading State */}
                    {isFetching && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Activity className="animate-spin text-gray-400" size={32} />
                            <p className="text-sm font-medium text-gray-500">Locating parcel data...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {isError && activeSearchQuery && !isFetching && (
                        <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3">
                            <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-red-800">Tracking Failed</p>
                                <p className="text-xs text-red-600 mt-1">
                                    {(error as any)?.data?.message || 'Could not find tracking info. Please check the ID and try again.'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Results State */}
                    {trackingData?.success && !isFetching && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Status Card */}
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Current Status</p>
                                </div>
                                <p className="text-lg font-bold text-gray-900">{trackingData.status}</p>
                            </div>

                            {/* Timeline */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Clock size={14} className="text-gray-400" />
                                    Tracking History
                                </h3>

                                {trackingData.history && trackingData.history.length > 0 ? (
                                    <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 ml-2">
                                        {trackingData.history.map((step: any, idx: number) => (
                                            <div key={idx} className="relative pl-6">
                                                <div
                                                    className={`absolute left-[-5px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm transition-colors ${idx === 0 ? 'bg-black' : 'bg-gray-300'
                                                        }`}
                                                />
                                                <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                                    <p className={`text-sm font-bold ${idx === 0 ? 'text-gray-900' : 'text-gray-600'}`}>
                                                        {step.message_en || step.message}
                                                    </p>
                                                    {(step.message_bn || step.details) && (
                                                        <p className="text-xs text-gray-500 font-medium my-1">
                                                            {step.message_bn || step.details}
                                                        </p>
                                                    )}
                                                    <p className="text-[10px] text-gray-400 mt-1 font-medium">
                                                        {formatDate(step.time || step.created_at || step.updated_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                                        <p className="text-sm font-medium text-gray-500">No timeline history available yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
