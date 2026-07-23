'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Loader2, ArrowLeft, Package, User, MapPin, Truck, AlertCircle, Eye, RefreshCw, Smartphone, Pencil, FileText, X } from 'lucide-react';
import {
    useGetCouriersQuery,
    useSendOrderToCourierMutation,
    useGetCourierAreasQuery,
    useLazyGetCourierAreasQuery,
    useGetCourierPickupStoresQuery
} from '@/redux/features/courier/courierApi';
import PrintableInvoice from '@/components/admin/PrintableInvoice';
import OrderSourceBadge from '@/components/admin/orders/OrderSourceBadge';
import FraudCheckCard from '@/components/admin/orders/FraudCheckCard';
import { getOrderStatusDescription } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function OrderDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [order, setOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [trackingInfo, setTrackingInfo] = useState<any>(null);
    const [isFetchingTracking, setIsFetchingTracking] = useState(false);

    // Customer Edit State
    const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
    const [editCustomerForm, setEditCustomerForm] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
    });

    // Refund State
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundReason, setRefundReason] = useState('');
    const [refundRestock, setRefundRestock] = useState(true);
    const [isRefunding, setIsRefunding] = useState(false);

    // Shipping Edit State
    const [isEditingShipping, setIsEditingShipping] = useState(false);
    const [editShippingCost, setEditShippingCost] = useState<string>('');

    // Advance Payment State
    const [isEditingAdvance, setIsEditingAdvance] = useState(false);
    const [editAdvancePaid, setEditAdvancePaid] = useState<string>('');
    const [editAdvanceMethod, setEditAdvanceMethod] = useState<string>('');
    const [editAdvanceRef, setEditAdvanceRef] = useState<string>('');

    // Admin Note State
    const [noteModal, setNoteModal] = useState({ isOpen: false, note: '', isEditing: false });
    const [isSavingNote, setIsSavingNote] = useState(false);

    // Courier State
    const [selectedCourier, setSelectedCourier] = useState('');

    // Status Confirmation State
    const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ field: 'orderStatus' | 'paymentStatus', value: string } | null>(null);

    const [deliveryAreaId, setDeliveryAreaId] = useState<number | undefined>();
    const [deliveryAreaName, setDeliveryAreaName] = useState('');
    const [pickupStoreId, setPickupStoreId] = useState('');
    const [isClosedBox, setIsClosedBox] = useState(true);
    const [instruction, setInstruction] = useState('');

    // Pathao Hierarchical Selection
    const [pathaoCityId, setPathaoCityId] = useState<number | undefined>();
    const [pathaoZoneId, setPathaoZoneId] = useState<number | undefined>();

    // Redux Hooks
    const { data: courierData } = useGetCouriersQuery();
    const [sendToCourierMutation, { isLoading: isSendingToCourier }] = useSendOrderToCourierMutation();

    // RedX & Steadfast Data
    const { data: redxAreasData, isFetching: isFetchingRedxAreas } = useGetCourierAreasQuery({ courierName: 'redx' }, { skip: selectedCourier !== 'redx' });
    const { data: redxStoresData, isFetching: isFetchingRedxStores } = useGetCourierPickupStoresQuery({ courierName: 'redx' }, { skip: selectedCourier !== 'redx' });
    const { data: steadfastAreasData, isFetching: isFetchingSteadfastAreas } = useGetCourierAreasQuery({ courierName: 'steadfast' }, { skip: selectedCourier !== 'steadfast' });

    // Pathao Data (Hierarchical)
    const { data: pathaoCitiesData, isFetching: isFetchingPathaoCities } = useGetCourierAreasQuery({ courierName: 'pathao' }, { skip: selectedCourier !== 'pathao' });
    const [getZones, { data: pathaoZonesData, isFetching: isFetchingZones }] = useLazyGetCourierAreasQuery();
    const [getAreas, { data: pathaoAreasData, isFetching: isFetchingAreas }] = useLazyGetCourierAreasQuery();

    const activeCouriers = courierData?.couriers?.filter((c: any) => c.isEnabled) || [];

    // Pathao Handlers
    const handlePathaoCityChange = (cityId: number) => {
        setPathaoCityId(cityId);
        setPathaoZoneId(undefined);
        setDeliveryAreaId(undefined);
        if (cityId) {
            getZones({ courierName: 'pathao', city_id: cityId });
        }
    };

    const handlePathaoZoneChange = (zoneId: number) => {
        setPathaoZoneId(zoneId);
        setDeliveryAreaId(undefined);
        if (zoneId) {
            getAreas({ courierName: 'pathao', zone_id: zoneId });
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const cleanTitle = (title: string) => {
        const lastParenIndex = title.lastIndexOf('(');
        if (lastParenIndex === -1) return title;
        return title.substring(0, lastParenIndex).trim();
    };

    const getStatusStyle = (status: string) => {
        const styles: Record<string, string> = {
            Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            Confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
            Processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            Shipped: 'bg-purple-50 text-purple-700 border-purple-200',
            Delivered: 'bg-green-50 text-green-700 border-green-200',
            'Partially Delivered': 'bg-cyan-50 text-cyan-700 border-cyan-200',
            Cancelled: 'bg-red-50 text-red-700 border-red-200',
            Paid: 'bg-green-50 text-green-700 border-green-200',
            Failed: 'bg-red-50 text-red-700 border-red-200',
            Refunded: 'bg-gray-100 text-gray-700 border-gray-300',
            Returned: 'bg-gray-100 text-gray-700 border-gray-300',
            'Delivery Charge Paid': 'bg-orange-50 text-orange-700 border-orange-200',
        };
        return styles[status] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/orders/${id}`);
                const data = await res.json();
                if (data.success) setOrder(data.order);
            } catch (error) {
                console.error('Error fetching order:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    const fetchTracking = useCallback(async () => {
        if (!order?.paymentDetails?.trackingId) return;
        setIsFetchingTracking(true);
        try {
            const res = await fetch(`/api/orders/${id}/tracking`);
            const data = await res.json();
            if (data.success) setTrackingInfo(data);
        } catch (error) {
            console.error('Error fetching tracking:', error);
        } finally {
            setIsFetchingTracking(false);
        }
    }, [id, order?.paymentDetails?.trackingId]);

    useEffect(() => {
        if (order?.orderStatus === 'Shipped' || order?.paymentDetails?.trackingId) {
            fetchTracking();
        }
    }, [order?.orderStatus, order?.paymentDetails?.trackingId, fetchTracking]);

    useEffect(() => {
        if (order) {
            setEditCustomerForm({
                name: order.customerInfo.name || '',
                phone: order.customerInfo.phone || '',
                email: order.customerInfo.email || '',
                address: order.customerInfo.address || '',
                city: order.customerInfo.city || '',
            });
        }
    }, [order]);

    const handleCustomerEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const res = await fetch(`/api/orders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerInfo: editCustomerForm }),
            });
            const data = await res.json();
            if (data.success) {
                setOrder(data.order);
                setShowEditCustomerModal(false);
                toast.success('Customer details updated successfully');
            } else {
                toast.error(data.message || 'Failed to update customer details');
            }
        } catch (error) {
            console.error('Error updating customer details:', error);
            toast.error('Something went wrong');
        } finally {
            setIsUpdating(false);
        }
    };

    const updateStatus = async (field: string, value: string) => {
        setIsUpdating(true);
        try {
            const res = await fetch(`/api/orders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value }),
            });
            const data = await res.json();
            if (data.success) {
                setOrder(data.order);
                toast.success(`Order ${field} updated successfully`);
            } else {
                toast.error(data.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating order:', error);
            toast.error('Something went wrong');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSaveNote = async () => {
        setIsSavingNote(true);
        try {
            const res = await fetch(`/api/orders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminNote: noteModal.note }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Note saved successfully');
                setOrder(data.order);
                setNoteModal({ isOpen: false, note: '', isEditing: false });
            } else {
                toast.error(data.message || 'Failed to save note');
            }
        } catch (error) {
            console.error('Error saving note:', error);
            toast.error('Failed to save note');
        } finally {
            setIsSavingNote(false);
        }
    };

    const handleRefund = async () => {
        setIsRefunding(true);
        try {
            const res = await fetch(`/api/admin/refunds`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: id, reason: refundReason }),
            });
            const data = await res.json();
            if (data.success) {
                setShowRefundModal(false);
                toast.success('Return & Refund request created successfully. You can manage it from the Return & Refunds tab.');
            } else {
                toast.error(data.message || 'Failed to create Return & Refund request');
            }
        } catch (error) {
            console.error('Error creating return request:', error);
            toast.error('Something went wrong during submission.');
        } finally {
            setIsRefunding(false);
        }
    };

    const handleShippingEdit = async () => {
        const cost = parseInt(editShippingCost);
        if (isNaN(cost) || cost < 0) {
            toast.error('Please enter a valid shipping amount');
            return;
        }

        setIsUpdating(true);
        try {
            const res = await fetch(`/api/orders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shippingCost: cost }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Shipping cost updated');
                setOrder(data.order);
                setIsEditingShipping(false);
            } else {
                toast.error(data.message || 'Failed to update shipping cost');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAdvanceEdit = async () => {
        setIsUpdating(true);
        try {
            const res = await fetch(`/api/orders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    advancePaid: Number(editAdvancePaid) || 0,
                    advancePaymentMethod: editAdvanceMethod,
                    advancePaymentRef: editAdvanceRef
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Advance payment updated');
                setOrder(data.order);
                setIsEditingAdvance(false);
            } else {
                toast.error(data.message || 'Failed to update advance payment');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsUpdating(false);
        }
    };

    const sendToCourier = async () => {
        if (!selectedCourier) return;

        // Validation
        if (selectedCourier === 'redx' && !deliveryAreaId) {
            toast.error('Please select a delivery area');
            return;
        }
        if (selectedCourier === 'pathao' && (!pathaoCityId || !pathaoZoneId || !deliveryAreaId)) {
            toast.error('Please complete hierarchical location selection for Pathao');
            return;
        }

        try {
            const res = await sendToCourierMutation({
                orderId: id,
                courierName: selectedCourier,
                deliveryAreaId,
                deliveryAreaName,
                city_id: pathaoCityId,
                zone_id: pathaoZoneId,
                pickupStoreId,
                isClosedBox,
                instruction
            }).unwrap();

            if (res.success) {
                toast.success(`Order successfully sent to ${selectedCourier}! Tracking ID: ${res.trackingId}`);
                // Refresh order
                const orderRes = await fetch(`/api/orders/${id}`);
                const orderData = await orderRes.json();
                if (orderData.success) setOrder(orderData.order);
            } else {
                toast.error(res.message || `Failed to send to ${selectedCourier}`);
            }
        } catch (error: any) {
            toast.error(error.data?.message || 'Something went wrong');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center py-12">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Order not found</h2>
                <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline">
                    Back to Orders
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/orders" className="text-gray-500 hover:text-gray-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderId}</h1>
                            <OrderSourceBadge source={order.source} />
                            {order.isPreorder && (
                                <span className="bg-orange-100 text-orange-600 text-xs font-black px-2 py-1 rounded-full uppercase tracking-tight border border-orange-200 shadow-sm">
                                    Pre-order
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <PrintableInvoice order={order} />
                    {order.paymentStatus !== 'Refunded' && order.orderStatus !== 'Returned' && (
                        <button 
                            onClick={() => setShowRefundModal(true)}
                            className="bg-white text-red-600 hover:bg-red-50 px-3 py-1 rounded-full text-xs font-bold border border-red-200 transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Process Return & Refund
                        </button>
                    )}
                    <span 
                        className={`group relative px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(order.orderStatus)}`}
                    >
                        {order.orderStatus}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-max max-w-[220px] bg-gray-900 text-white text-[10px] leading-relaxed px-2 py-1 rounded shadow-lg z-50 font-medium normal-case tracking-normal pointer-events-none text-center">
                            {getOrderStatusDescription(order.orderStatus)}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-900"></div>
                        </div>
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(order.paymentStatus)}`}>
                        Payment: {order.paymentStatus}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-base font-semibold text-gray-900 mb-4">Order Items</h2>
                        <div className="space-y-4">
                            {order.products.map((item: any, index: number) => (
                                <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="w-16 h-16 bg-white rounded-md border border-gray-200 flex-shrink-0 overflow-hidden relative">
                                        {item.image ? (
                                            <Image
                                                src={item.image}
                                                alt=""
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-gray-900">{cleanTitle(item.title)}</p>
                                            {item.variant?.['Color'] && item.variant?.['colorCode'] && (
                                                <div 
                                                    className="w-3 h-3 rounded-full border border-gray-300 shadow-sm shrink-0" 
                                                    style={{ backgroundColor: item.variant['colorCode'] }}
                                                    title={`${item.variant['Color']} (${item.variant['colorCode']})`}
                                                />
                                            )}
                                            {item.isPreorder && (
                                                <span className="bg-orange-100 text-orange-600 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter border border-orange-200">
                                                    Pre-order
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatPrice(item.price)} × {item.quantity}
                                        </p>
                                        {item.variant && Object.keys(item.variant).length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                {Object.entries(item.variant)
                                                    .filter(([key, val]) => 
                                                        !['colorCode', 'tax', '_id', 'price', 'stock', 'image', 'sku', 'id'].includes(key) && 
                                                        !/^#([0-9A-F]{3}){1,2}$/i.test(String(val))
                                                    )
                                                    .map(([key, val], idx) => (
                                                        <span key={idx} className="bg-gray-100 text-gray-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter border border-gray-200">
                                                            {key}: {String(val)}
                                                        </span>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="font-medium text-gray-900">{formatPrice(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-gray-500">Shipping</span>
                                <div className="flex items-center gap-2">
                                    {isEditingShipping ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                value={editShippingCost}
                                                onChange={(e) => setEditShippingCost(e.target.value)}
                                                className="w-20 border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-gray-900"
                                                placeholder="Amt"
                                            />
                                            <button 
                                                onClick={handleShippingEdit}
                                                disabled={isUpdating}
                                                className="text-xs bg-gray-900 text-white px-2 py-1 rounded disabled:opacity-50"
                                            >
                                                Save
                                            </button>
                                            <button 
                                                onClick={() => setIsEditingShipping(false)}
                                                disabled={isUpdating}
                                                className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setEditShippingCost(order.shippingCost.toString());
                                                    setIsEditingShipping(true);
                                                }}
                                                className="text-gray-400 hover:text-blue-600 transition-colors"
                                                title="Edit Shipping Cost"
                                            >
                                                <Pencil className="w-3 h-3" />
                                            </button>
                                            <span className="font-medium text-gray-900">
                                                {order.shippingCost === 0 ? (
                                                    <span className="text-green-600 font-bold uppercase tracking-wider text-[10px] bg-green-50 px-2 py-0.5 rounded border border-green-100">Free</span>
                                                ) : (
                                                    formatPrice(order.shippingCost)
                                                )}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                            {order.taxAmount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Tax</span>
                                    <span className="font-medium text-gray-900">{formatPrice(order.taxAmount)}</span>
                                </div>
                            )}
                            {order.discountAmount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                                    <span className="font-medium">-{formatPrice(order.discountAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100 mt-2">
                                <span>Total</span>
                                <span>{formatPrice(order.totalAmount)}</span>
                            </div>

                            {/* Advance Payment Section */}
                            <div className="pt-2 border-t border-gray-100 mt-2">
                                {isEditingAdvance ? (
                                    <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-700 block mb-1">Paid Amount (BDT)</label>
                                                <input
                                                    type="number"
                                                    value={editAdvancePaid}
                                                    onChange={(e) => setEditAdvancePaid(e.target.value)}
                                                    className="w-full text-sm border-gray-300 rounded px-2 py-1.5 focus:ring-primary focus:border-primary"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-700 block mb-1">Payment Method <span className="text-gray-400 font-normal">(Optional)</span></label>
                                                <input
                                                    type="text"
                                                    value={editAdvanceMethod}
                                                    onChange={(e) => setEditAdvanceMethod(e.target.value)}
                                                    className="w-full text-sm border-gray-300 rounded px-2 py-1.5 focus:ring-primary focus:border-primary"
                                                    placeholder="bKash, Nagad..."
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-700 block mb-1">Reference (TrxID / Phone) <span className="text-gray-400 font-normal">(Optional)</span></label>
                                            <input
                                                type="text"
                                                value={editAdvanceRef}
                                                onChange={(e) => setEditAdvanceRef(e.target.value)}
                                                className="w-full text-sm border-gray-300 rounded px-2 py-1.5 focus:ring-primary focus:border-primary"
                                                placeholder="TrxID or Phone"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2 pt-1">
                                            <button
                                                onClick={() => setIsEditingAdvance(false)}
                                                className="text-xs px-3 py-1.5 text-gray-600 border border-gray-300 rounded hover:bg-gray-100 font-medium"
                                                disabled={isUpdating}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleAdvanceEdit}
                                                className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded hover:bg-gray-800 font-medium disabled:opacity-50 flex items-center gap-1.5"
                                                disabled={isUpdating}
                                            >
                                                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-sm group">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 font-medium">Advance Paid</span>
                                                <button
                                                    onClick={() => {
                                                        setEditAdvancePaid(order.advancePaid?.toString() || '');
                                                        setEditAdvanceMethod(order.advancePaymentMethod || '');
                                                        setEditAdvanceRef(order.advancePaymentRef || '');
                                                        setIsEditingAdvance(true);
                                                    }}
                                                    className="text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <span className="font-semibold text-green-600">{formatPrice(order.advancePaid || 0)}</span>
                                        </div>
                                        {(order.advancePaymentMethod || order.advancePaymentRef) && (
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>Method/Ref:</span>
                                                <span className="font-medium text-gray-700">
                                                    {order.advancePaymentMethod} {order.advancePaymentRef ? `(${order.advancePaymentRef})` : ''}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-base font-black text-rose-600 pt-2 mt-1 border-t border-gray-100">
                                            <span>Due Amount</span>
                                            <span>{formatPrice(order.totalAmount - (order.advancePaid || 0))}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {order.refundDetails?.refundedAt && order.paymentStatus === 'Refunded' && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h3 className="text-sm font-bold text-red-700 mb-3 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Refund Details
                                </h3>
                                <div className="space-y-2 p-4 bg-red-50 rounded-lg border border-red-100">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-red-800 font-medium">Refunded On</span>
                                        <span className="text-red-900 font-bold">{formatDate(order.refundDetails.refundedAt)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-red-800 font-medium">Restocked Inventory?</span>
                                        <span className="text-red-900 font-bold">{order.refundDetails.restocked ? 'Yes' : 'No'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-red-800 font-medium">Reason</span>
                                        <span className="text-red-900 font-bold max-w-[60%] text-right">{order.refundDetails.reason || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Customer Info */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-gray-900">Customer Details</h2>
                            <button
                                onClick={() => setShowEditCustomerModal(true)}
                                className="text-gray-500 hover:text-blue-600 transition-colors p-1 flex items-center gap-1 text-xs font-bold bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-md px-2"
                                title="Edit Customer Details"
                            >
                                <Pencil className="w-3 h-3" /> Edit
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Contact Info</h3>
                                <p className="text-sm font-medium text-gray-900">{order.customerInfo.name}</p>
                                <p className="text-sm text-gray-600 mt-1">{order.customerInfo.phone}</p>
                                {order.customerInfo.email && (
                                    <p className="text-sm text-gray-600 mt-0.5">{order.customerInfo.email}</p>
                                )}
                                {order.ipAddress && (
                                    <div className="mt-3">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Network IP</p>
                                        <p className="text-xs font-mono text-gray-900 bg-gray-50 border border-gray-200 px-2 py-1 rounded inline-block">{order.ipAddress}</p>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Shipping Address</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{order.customerInfo.address}</p>
                                {order.customerInfo.city && (
                                    <p className="text-sm text-gray-600 mt-0.5">{order.customerInfo.city}</p>
                                )}
                            </div>
                        </div>
                        {order.customerInfo.notes && (
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                                <h3 className="text-xs font-medium text-yellow-700 uppercase tracking-wider mb-1">Notes</h3>
                                <p className="text-sm text-yellow-800 italic">&quot;{order.customerInfo.notes}&quot;</p>
                            </div>
                        )}
                    </div>

                    {/* Fraud Detection / Customer Trust */}
                    <FraudCheckCard phoneNumber={order.customerInfo.phone} />
                </div>

                {/* Sidebar Controls */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-gray-900">Update Status</h2>
                            <button
                                onClick={() => setNoteModal({ isOpen: true, note: order.adminNote || '', isEditing: !order.adminNote })}
                                className={`transition-colors ${order.adminNote ? 'text-primary hover:text-primary-dark' : 'text-gray-400 hover:text-primary'}`}
                                title={order.adminNote ? 'View/Edit Admin Note' : 'Add Admin Note'}
                            >
                                <FileText size={18} />
                            </button>
                        </div>
                        {(order.orderStatus === 'Returned' || order.paymentStatus === 'Refunded') && (
                            <div className="mb-4 text-xs font-medium text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                Status Update Locked for Refunded Orders
                            </div>
                        )}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
                                <select
                                    value={order.orderStatus}
                                    onChange={(e) => setPendingStatusUpdate({ field: 'orderStatus', value: e.target.value })}
                                    disabled={isUpdating || order.orderStatus === 'Returned' || order.paymentStatus === 'Refunded'}
                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all disabled:opacity-60 disabled:bg-gray-50"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Partially Delivered">Partially Delivered</option>
                                    <option value="Cancelled">Cancelled</option>
                                    <option value="Returned">Returned</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                                <select
                                    value={order.paymentStatus}
                                    onChange={(e) => setPendingStatusUpdate({ field: 'paymentStatus', value: e.target.value })}
                                    disabled={isUpdating || order.orderStatus === 'Returned' || order.paymentStatus === 'Refunded'}
                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all disabled:opacity-60 disabled:bg-gray-50"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Failed">Failed</option>
                                    <option value="Delivery Charge Paid">Delivery Charge Paid</option>
                                    {order.paymentStatus === 'Refunded' && (
                                        <option value="Refunded" disabled>Refunded</option>
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Status Confirmation Modal */}
                    {pendingStatusUpdate && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex items-center gap-3 text-gray-900 mb-4">
                                    <AlertCircle className="w-6 h-6 text-yellow-500" />
                                    <h3 className="text-lg font-bold">Confirm Change</h3>
                                </div>
                                <p className="text-sm text-gray-600 mb-6">
                                    Are you sure you want to change the {pendingStatusUpdate.field === 'orderStatus' ? 'Order Status' : 'Payment Status'} to <span className="font-bold text-gray-900">{pendingStatusUpdate.value}</span>?
                                </p>
                                {pendingStatusUpdate.value === 'Returned' && (
                                    <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
                                        <div>
                                            <p className="font-bold mb-0.5">Warning: This action cannot be undone.</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setPendingStatusUpdate(null)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                        disabled={isUpdating}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={async () => {
                                            await updateStatus(pendingStatusUpdate.field, pendingStatusUpdate.value);
                                            setPendingStatusUpdate(null);
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 transition-colors"
                                        disabled={isUpdating}
                                    >
                                        {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-base font-semibold text-gray-900 mb-4">Payment Details</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Method</span>
                                <span className="font-medium text-gray-900">
                                    {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                                </span>
                            </div>
                            {order.transactionId && (
                                <div className="pt-3 border-t border-gray-100">
                                    <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                                    <p className="text-xs font-mono bg-gray-100 p-2 rounded">{order.transactionId}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {!order.paymentDetails?.trackingId && activeCouriers.length > 0 && order.orderStatus !== 'Returned' && order.paymentStatus !== 'Refunded' && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Courier Service</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Courier</label>
                                    <select
                                        value={selectedCourier}
                                        onChange={(e) => {
                                            setSelectedCourier(e.target.value);
                                            setDeliveryAreaId(undefined);
                                            setDeliveryAreaName('');
                                            setPickupStoreId('');
                                            setPathaoCityId(undefined);
                                            setPathaoZoneId(undefined);
                                        }}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all font-medium"
                                    >
                                        <option value="">Choose Service</option>
                                        {activeCouriers.map((c: any) => (
                                            <option key={c.name} value={c.name}>
                                                {c.name.charAt(0).toUpperCase() + c.name.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedCourier === 'redx' && (
                                    <div className="space-y-4 pt-2 border-t border-gray-100 animate-in slide-in-from-top-1 duration-200">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Delivery Area</label>
                                            <div className="relative">
                                                <select
                                                    value={deliveryAreaId || ''}
                                                    onChange={(e) => {
                                                        const id = parseInt(e.target.value);
                                                        setDeliveryAreaId(id);
                                                        const area = redxAreasData?.areas.find((a: any) => a.id === id);
                                                        setDeliveryAreaName(area ? `${area.name} (${area.district_name})` : '');
                                                    }}
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-black transition-all"
                                                >
                                                    <option value="">Select Area</option>
                                                    {redxAreasData?.areas?.map((a: any) => (
                                                        <option key={a.id} value={a.id}>
                                                            {a.name} ({a.district_name})
                                                        </option>
                                                    ))}
                                                </select>
                                                {isFetchingRedxAreas && (
                                                    <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pickup Store</label>
                                            <div className="relative">
                                                <select
                                                    value={pickupStoreId}
                                                    onChange={(e) => setPickupStoreId(e.target.value)}
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-black transition-all"
                                                >
                                                    <option value="">Default Store</option>
                                                    {redxStoresData?.pickup_stores?.map((s: any) => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {isFetchingRedxStores && (
                                                    <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="isClosedBox"
                                                checked={isClosedBox}
                                                onChange={(e) => setIsClosedBox(e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                                            />
                                            <label htmlFor="isClosedBox" className="text-xs font-semibold text-gray-700 cursor-pointer">Closed Box Delivery</label>
                                        </div>
                                    </div>
                                )}

                                {selectedCourier === 'steadfast' && (
                                    <div className="space-y-4 pt-2 border-t border-gray-100 animate-in slide-in-from-top-1 duration-200">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Police Station / Area</label>
                                            <div className="relative">
                                                <select
                                                    value={deliveryAreaId || ''}
                                                    onChange={(e) => {
                                                        const id = parseInt(e.target.value);
                                                        setDeliveryAreaId(id);
                                                        const area = steadfastAreasData?.areas.find((a: any) => a.id === id);
                                                        if (area) {
                                                            setDeliveryAreaName(area.name);
                                                        }
                                                    }}
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-black transition-all"
                                                >
                                                    <option value="">
                                                        {isFetchingSteadfastAreas ? 'Loading Police Stations...' : 'Select Police Station'}
                                                    </option>
                                                    {steadfastAreasData?.areas?.map((a: any) => (
                                                        <option key={a.id} value={a.id}>
                                                            {a.name} {a.district_name ? `(${a.district_name})` : ''}
                                                        </option>
                                                    ))}
                                                    {!isFetchingSteadfastAreas && steadfastAreasData?.areas?.length === 0 && (
                                                        <option disabled>No police stations found. Check API keys.</option>
                                                    )}
                                                </select>
                                                {isFetchingSteadfastAreas && (
                                                    <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedCourier === 'pathao' && (
                                    <div className="space-y-4 pt-2 border-t border-gray-100 animate-in slide-in-from-top-1 duration-200">
                                        {/* Pathao Hierarchy: City -> Zone -> Area */}
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">City</label>
                                            <div className="relative">
                                                <select
                                                    value={pathaoCityId || ''}
                                                    onChange={(e) => handlePathaoCityChange(parseInt(e.target.value))}
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-black transition-all"
                                                >
                                                    <option value="">Select City</option>
                                                    {pathaoCitiesData?.areas?.map((c: any) => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                                {isFetchingPathaoCities && (
                                                    <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {pathaoCityId && (
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Zone</label>
                                                <div className="relative">
                                                    <select
                                                        value={pathaoZoneId || ''}
                                                        disabled={isFetchingZones}
                                                        onChange={(e) => handlePathaoZoneChange(parseInt(e.target.value))}
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-black transition-all"
                                                    >
                                                        <option value="">{isFetchingZones ? 'Loading...' : 'Select Zone'}</option>
                                                        {pathaoZonesData?.areas?.map((z: any) => (
                                                            <option key={z.id} value={z.id}>{z.name}</option>
                                                        ))}
                                                    </select>
                                                    {isFetchingZones && (
                                                        <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {pathaoZoneId && (
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Area</label>
                                                <div className="relative">
                                                    <select
                                                        value={deliveryAreaId || ''}
                                                        disabled={isFetchingAreas}
                                                        onChange={(e) => {
                                                            const id = parseInt(e.target.value);
                                                            setDeliveryAreaId(id);
                                                            const area = pathaoAreasData?.areas.find((a: any) => a.id === id);
                                                            if (area) setDeliveryAreaName(area.name);
                                                        }}
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-black transition-all"
                                                    >
                                                        <option value="">{isFetchingAreas ? 'Loading...' : 'Select Area'}</option>
                                                        {pathaoAreasData?.areas?.map((a: any) => (
                                                            <option key={a.id} value={a.id}>{a.name}</option>
                                                        ))}
                                                    </select>
                                                    {isFetchingAreas && (
                                                        <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {(selectedCourier) && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Instruction</label>
                                            <textarea
                                                value={instruction}
                                                onChange={(e) => setInstruction(e.target.value)}
                                                rows={2}
                                                placeholder="Special notes for delivery..."
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-black transition-all resize-none font-medium"
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={sendToCourier}
                                    disabled={!selectedCourier || isSendingToCourier}
                                    className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition-all active:scale-95 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSendingToCourier ? (
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25m-3.75 0V5.625m0 12.75v-3.375m0 3.375h3.375M14.25 5.625v12.75M14.25 5.625H9M14.25 5.625h3.375" />
                                        </svg>
                                    )}
                                    Send to Courier
                                </button>
                            </div>
                        </div>
                    )}

                    {order.paymentDetails?.trackingId && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-semibold text-gray-900">Courier Tracking</h2>
                                <button
                                    onClick={fetchTracking}
                                    disabled={isFetchingTracking}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    {isFetchingTracking ? 'Refreshing...' : 'Refresh'}
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Courier</p>
                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-black text-white rounded">
                                            {order.paymentDetails.courier}
                                        </span>
                                    </div>
                                    <p className="text-xs font-mono text-gray-900 break-all">{order.paymentDetails.trackingId}</p>
                                    
                                    {order.paymentDetails.parcelId && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Parcel ID / Consignment ID</p>
                                            <p className="text-xs font-mono text-gray-900 break-all">
                                                {order.paymentDetails.parcelId}
                                            </p>
                                        </div>
                                    )}

                                    {order.paymentDetails.area_name && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Area / Police Station</p>
                                            <p className="text-xs font-medium text-gray-900">{order.paymentDetails.area_name}</p>
                                        </div>
                                    )}

                                    <p className="text-[10px] text-gray-500 mt-2 italic">
                                        Sent on: {order.paymentDetails.sentToCourierAt ? formatDate(order.paymentDetails.sentToCourierAt) : 'N/A'}
                                    </p>
                                </div>

                                {trackingInfo?.history ? (
                                    <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                        {trackingInfo.history.map((step: any, idx: number) => (
                                            <div key={idx} className="relative pl-6">
                                                <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${idx === 0 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                                <p className="text-xs font-bold text-gray-900">{step.message_en}</p>
                                                {step.message_bn && (
                                                    <p className="text-[10px] text-gray-600 font-medium my-0.5">{step.message_bn}</p>
                                                )}
                                                <p className="text-[10px] text-gray-500 mt-0.5">{formatDate(step.time)}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-center py-4 text-gray-400">Loading tracking history...</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Refund Modal */}
            {showRefundModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => !isRefunding && setShowRefundModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-black text-gray-900">Process Return & Refund</h3>
                            <p className="text-sm text-gray-500 mt-1">Submit a return & refund request to the management system.</p>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Return (Required)</label>
                                <input
                                    type="text"
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    placeholder="e.g. Customer cancelled, defective item"
                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-black"
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
                            <button
                                onClick={() => setShowRefundModal(false)}
                                disabled={isRefunding}
                                className="px-4 py-2 rounded-lg font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRefund}
                                disabled={isRefunding}
                                className="px-4 py-2 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center min-w-[120px]"
                            >
                                {isRefunding ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Return & Refund'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Customer Details Modal */}
            {showEditCustomerModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => !isUpdating && setShowEditCustomerModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-black text-gray-900">Edit Customer Details</h3>
                            <p className="text-sm text-gray-500 mt-1">Update customer&apos;s contact and shipping information.</p>
                        </div>
                        <form onSubmit={handleCustomerEdit}>
                            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={editCustomerForm.name}
                                        onChange={(e) => setEditCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-black"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                        <input
                                            type="text"
                                            required
                                            value={editCustomerForm.phone}
                                            onChange={(e) => setEditCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-black"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={editCustomerForm.email}
                                            onChange={(e) => setEditCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-black"
                                        />
                                    </div>
                                </div>
                                {/* <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City/District</label>
                                    <input
                                        type="text"
                                        required
                                        value={editCustomerForm.city}
                                        onChange={(e) => setEditCustomerForm(prev => ({ ...prev, city: e.target.value }))}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-black"
                                    />
                                </div> */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={editCustomerForm.address}
                                        onChange={(e) => setEditCustomerForm(prev => ({ ...prev, address: e.target.value }))}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-black"
                                    />
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 flex justify-end gap-3 rounded-b-2xl border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowEditCustomerModal(false)}
                                    disabled={isUpdating}
                                    className="px-4 py-2 rounded-lg font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="px-4 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center min-w-[120px]"
                                >
                                    {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Note Modal */}
            {noteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">Admin Note</h3>
                            <button
                                onClick={() => setNoteModal({ isOpen: false, note: '', isEditing: false })}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <p className="text-sm text-gray-500">Add a private note for this order. This will only be visible to administrators.</p>
                            {noteModal.isEditing ? (
                                <textarea
                                    value={noteModal.note}
                                    onChange={(e) => setNoteModal({ ...noteModal, note: e.target.value })}
                                    placeholder="Enter note here..."
                                    className="w-full h-32 p-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none transition-all"
                                />
                            ) : (
                                <div className="relative w-full min-h-[8rem] p-4 text-sm bg-gray-50 border border-gray-200 rounded-xl whitespace-pre-wrap text-gray-800">
                                    {noteModal.note}
                                    <button
                                        onClick={() => setNoteModal(prev => ({ ...prev, isEditing: true }))}
                                        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-primary bg-white hover:bg-gray-50 rounded-lg border border-gray-200 shadow-sm transition-colors"
                                        title="Edit Note"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                            {noteModal.isEditing ? (
                                <>
                                    <button
                                        onClick={() => {
                                            if (order.adminNote) {
                                                setNoteModal(prev => ({ ...prev, note: order.adminNote || '', isEditing: false }));
                                            } else {
                                                setNoteModal({ isOpen: false, note: '', isEditing: false });
                                            }
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveNote}
                                        disabled={isSavingNote}
                                        className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isSavingNote ? 'Saving...' : 'Save Note'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setNoteModal({ isOpen: false, note: '', isEditing: false })}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                                    >
                                        Close
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
