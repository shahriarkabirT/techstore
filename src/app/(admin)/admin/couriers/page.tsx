'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
    Truck,
    Activity,
    CheckCircle2,
    Settings as SettingsIcon,
    Search,
} from 'lucide-react';
import Link from 'next/link';
import {
    useGetCouriersQuery,
    useUpdateCourierMutation,
    useGetCourierBalanceQuery,
    useLazyGetCourierBalanceQuery,
    useGetCourierStatsQuery,
    useGetRecentShipmentsQuery
} from '@/redux/features/courier/courierApi';
import { ICourier } from '@/types';
import CourierSettingsModal from './CourierSettingsModal';
import CourierTrackingModal from './CourierTrackingModal';
import { ExternalLink } from 'lucide-react';

interface CourierSettingsViewProps {
    courier: ICourier | undefined;
    activeTab: string;
    onSave: (isEnabled: boolean, config: Record<string, string>) => Promise<void>;
    isSaving: boolean;
    onOpenSettings: () => void;
    onOpenTracking: () => void;
}

const RecentShipments = ({ courierName }: { courierName: string }) => {
    const [page, setPage] = useState(1);
    const limit = 10;
    const { data: shipmentsData, isLoading, isFetching } = useGetRecentShipmentsQuery({ courierName, page, limit });

    const orders = shipmentsData?.orders || [];
    const pagination = shipmentsData?.pagination;

    if (isLoading) return <div className="mt-8 h-40 bg-gray-50 animate-pulse rounded-xl" />;

    if (orders.length === 0) {
        return (
            <div className="mt-8 p-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                <Truck size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-xs text-gray-400 font-medium">No recent shipments found for this courier.</p>
            </div>
        );
    }

    return (
        <div className="mt-8 space-y-4 relative">
            {isFetching && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
                    <Activity size={24} className="animate-spin text-gray-400" />
                </div>
            )}
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Recent Shipments</h3>
                {pagination && pagination.total > 0 && (
                    <span className="text-xs text-gray-500 font-medium">
                        Total {pagination.total} orders
                    </span>
                )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-widest">Order ID</th>
                            <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-widest">Customer</th>
                            <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-widest">Amount</th>
                            <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-widest">Tracking ID</th>
                            <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-widest">Sent At</th>
                            <th className="px-4 py-3 text-right font-bold text-gray-500 uppercase tracking-widest">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {orders.map((order: any) => (
                            <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 font-bold text-gray-900">#{order.orderId}</td>
                                <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900">{order.customerInfo.name}</div>
                                    <div className="text-[10px] text-gray-400">{order.customerInfo.phone}</div>
                                </td>
                                <td className="px-4 py-3 font-medium">BDT {order.totalAmount.toLocaleString()}</td>
                                <td className="px-4 py-3">
                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-mono text-gray-600 border border-gray-200">
                                        {order.paymentDetails?.trackingId || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                    {order.paymentDetails?.sentToCourierAt ? new Date(order.paymentDetails.sentToCourierAt).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link
                                        href={`/admin/orders/${order._id}`}
                                        className="inline-flex items-center gap-1 text-black font-bold hover:underline"
                                    >
                                        Details <ExternalLink size={10} />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-xs font-medium text-gray-500">
                            Page <span className="font-bold text-gray-900">{page}</span> of <span className="font-bold text-gray-900">{pagination.totalPages}</span>
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                            disabled={page === pagination.totalPages}
                            className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const CourierOperationalStats = ({ courierName }: { courierName: string }) => {
    const { data: statsData, isLoading } = useGetCourierStatsQuery({ courierName });
    const stats = statsData?.stats;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Orders</p>
                <p className="text-xl font-bold text-gray-900">{isLoading ? '...' : stats?.total || 0}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Shipped / In Transit</p>
                <p className="text-xl font-bold text-amber-600">{isLoading ? '...' : stats?.shipped || 0}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Delivered Success</p>
                <p className="text-xl font-bold text-emerald-600">{isLoading ? '...' : stats?.delivered || 0}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cancelled / Failed</p>
                <p className="text-xl font-bold text-rose-600">{isLoading ? '...' : stats?.cancelled || 0}</p>
            </div>
        </div>
    );
};

const CourierSettingsView = ({ courier, activeTab, onSave, isSaving, onOpenSettings, onOpenTracking }: CourierSettingsViewProps) => {
    const isServiceEnabled = courier?.isEnabled || false;
    const formattedName = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
    const { data: balanceData, isLoading: isFetchingBalance, refetch: refetchBalance } = useGetCourierBalanceQuery(
        { courierName: activeTab },
        { skip: !isServiceEnabled || (activeTab !== 'steadfast') }
    );

    const handleToggleEnable = () => {
        onSave(!isServiceEnabled, courier?.config || {});
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                {!isServiceEnabled && (
                    <div className="absolute inset-0 bg-gray-50/10 backdrop-blur-[1px] z-0 pointer-events-none" />
                )}

                <div className={`w-14 h-14 rounded-lg flex items-center justify-center relative z-10 ${isServiceEnabled ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <Truck size={28} />
                </div>

                <div className="flex-grow relative z-10">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-lg font-bold text-gray-900">{formattedName}</h3>
                        {isServiceEnabled && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                Active
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                        {isServiceEnabled ? 'Integration active and ready.' : 'Service disabled.'}
                    </p>
                </div>

                {isServiceEnabled && activeTab === 'steadfast' && (
                    <div className="flex flex-col items-end mr-6 relative z-10">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Current Balance</p>
                        <div className="flex items-center gap-2">
                            <p className="text-lg font-bold text-gray-900">
                                {isFetchingBalance ? '...' : `BDT ${balanceData?.balance?.toLocaleString() || 0}`}
                            </p>
                            <button
                                onClick={() => refetchBalance()}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <Activity size={12} className={`${isFetchingBalance ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 relative z-10">
                    <button
                        onClick={onOpenTracking}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 font-bold rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-xs"
                        title="Track a Parcel"
                    >
                        <Search size={14} />
                        Track Parcel
                    </button>
                    <button
                        onClick={onOpenSettings}
                        className="p-2.5 bg-white text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                        title="Settings"
                    >
                        <SettingsIcon size={18} />
                    </button>
                    <button
                        onClick={handleToggleEnable}
                        disabled={isSaving}
                        className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${isServiceEnabled
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100'
                            : 'bg-gray-900 text-white hover:bg-black'
                            }`}
                    >
                        {isSaving ? <Activity size={16} className="animate-spin mx-auto" /> : (isServiceEnabled ? 'Disable' : 'Enable')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function CouriersPage() {
    const [activeTab, setActiveTab] = useState<'redx' | 'steadfast' | 'pathao'>('redx');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

    const { data, isLoading } = useGetCouriersQuery();
    const [updateCourier, { isLoading: isSaving }] = useUpdateCourierMutation();

    const currentCourier = data?.success ? data.couriers.find(c => c.name === activeTab) : undefined;

    const handleSave = async (isEnabled: boolean, config: Record<string, string>) => {
        try {
            const res = await updateCourier({
                name: activeTab,
                isEnabled,
                config
            }).unwrap();

            if (res.success) {
                toast.success(`${activeTab.toUpperCase()} updated`);
            }
        } catch (error: any) {
            toast.error(error.data?.message || 'Error saving settings');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Courier Management</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Configure delivery integrations.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">System Ready</span>
                </div>
            </div>

            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
                {(['redx', 'steadfast', 'pathao'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === tab
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab}
                        <SettingsIcon
                            size={12}
                            className={`cursor-pointer hover:text-black transition-colors ${activeTab === tab ? 'text-gray-400' : 'text-transparent'}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab(tab);
                                setIsModalOpen(true);
                            }}
                        />
                    </button>
                ))}
            </div>

            <div className="mt-4">
                <CourierSettingsView
                    courier={currentCourier}
                    activeTab={activeTab}
                    onSave={handleSave}
                    isSaving={isSaving}
                    onOpenSettings={() => setIsModalOpen(true)}
                    onOpenTracking={() => setIsTrackingModalOpen(true)}
                />
            </div>

            <CourierOperationalStats courierName={activeTab} />

            <RecentShipments courierName={activeTab} />

            {isModalOpen && (
                <CourierSettingsModal
                    key={currentCourier?._id || activeTab}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    courier={currentCourier}
                    onSave={handleSave}
                    isSaving={isSaving}
                />
            )}

            {isTrackingModalOpen && (
                <CourierTrackingModal
                    courierName={activeTab}
                    onClose={() => setIsTrackingModalOpen(false)}
                />
            )}
        </div>
    );
}
