'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Truck, AlertCircle } from 'lucide-react';
import { 
    useGetCouriersQuery, 
    useGetCourierPickupStoresQuery,
    useBulkSendOrderToCourierMutation
} from '@/redux/features/courier/courierApi';
import toast from 'react-hot-toast';

interface BulkCourierModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedOrderIds: string[];
    onSuccess: () => void;
}

export default function BulkCourierModal({ isOpen, onClose, selectedOrderIds, onSuccess }: BulkCourierModalProps) {
    const [selectedCourier, setSelectedCourier] = useState('');
    const [pickupStoreId, setPickupStoreId] = useState('');
    const [instruction, setInstruction] = useState('');
    const [isClosedBox, setIsClosedBox] = useState(false);

    const { data: couriersData, isLoading: isLoadingCouriers } = useGetCouriersQuery(undefined, { skip: !isOpen });
    const { data: storesData, isLoading: isLoadingStores } = useGetCourierPickupStoresQuery(
        { courierName: selectedCourier },
        { skip: !isOpen || !selectedCourier }
    );
    
    const [bulkSend, { isLoading: isSending }] = useBulkSendOrderToCourierMutation();

    const activeCouriers = couriersData?.couriers?.filter((c: any) => c.isEnabled) || [];
    const stores = useMemo(() => storesData?.pickup_stores || [], [storesData?.pickup_stores]);

    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

    if (isOpen !== prevIsOpen) {
        setPrevIsOpen(isOpen);
        if (!isOpen) {
            setSelectedCourier('');
            setPickupStoreId('');
            setInstruction('');
            setIsClosedBox(false);
        }
    }

    if (!isOpen) return null;

    const handleDispatch = async () => {
        if (!selectedCourier) {
            toast.error('Please select a courier service');
            return;
        }

        const finalPickupStoreId = pickupStoreId || (stores.length > 0 ? stores[0].id.toString() : '');

        try {
            const res = await bulkSend({
                orderIds: selectedOrderIds,
                courierName: selectedCourier,
                pickupStoreId: finalPickupStoreId,
                instruction,
                isClosedBox
            }).unwrap();

            if (res.success) {
                toast.success(res.message, { duration: 5000 });
                onSuccess();
            } else {
                toast.error(res.message);
            }
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to dispatch orders');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <Truck className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Bulk Dispatch</h2>
                            <p className="text-sm text-gray-500">{selectedOrderIds.length} orders selected</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-50 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm text-blue-800 leading-relaxed">
                        <AlertCircle className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
                        <p>
                            For RedX and Pathao, the system will try to auto-match the customer&apos;s address to the courier&apos;s areas. Orders with spelling errors in their addresses might fail and require manual dispatch.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Courier Service *</label>
                            <select
                                value={selectedCourier}
                                onChange={(e) => {
                                    setSelectedCourier(e.target.value);
                                    setPickupStoreId('');
                                }}
                                disabled={isLoadingCouriers}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                            >
                                <option value="">Select a courier</option>
                                {activeCouriers.map((c: any) => (
                                    <option key={c._id} value={c.name}>{c.name.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>

                        {selectedCourier && stores.length > 0 && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pickup Store</label>
                                <select
                                    value={pickupStoreId || (stores.length > 0 ? stores[0].id.toString() : '')}
                                    onChange={(e) => setPickupStoreId(e.target.value)}
                                    disabled={isLoadingStores}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                                >
                                    {stores.map((s: any) => (
                                        <option key={s.id} value={s.id}>{s.name} - {s.address}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Delivery Instructions (Optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. Please call before delivery"
                                value={instruction}
                                onChange={(e) => setInstruction(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                            />
                        </div>

                        {selectedCourier === 'pathao' && (
                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors mt-2">
                                <input
                                    type="checkbox"
                                    checked={isClosedBox}
                                    onChange={(e) => setIsClosedBox(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Closed Box Delivery</span>
                            </label>
                        )}
                    </div>
                </div>

                <div className="p-5 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
                    <button
                        onClick={onClose}
                        disabled={isSending}
                        className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDispatch}
                        disabled={isSending || !selectedCourier}
                        className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {isSending ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                Dispatching...
                            </>
                        ) : (
                            'Confirm Dispatch'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
