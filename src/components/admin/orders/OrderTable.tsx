import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Archive, RotateCcw, Eye, Trash2, Copy, FileText } from 'lucide-react';
import { getOrderStatusDescription } from '@/lib/utils';
import OrderSourceBadge from './OrderSourceBadge';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface OrderTableProps {
    orders: any[];
    isLoading: boolean;
    formatPrice: (price: number) => string;
    formatDate: (date: string) => string;
    getStatusStyle: (status: string) => string;
    onArchive?: (id: string) => void;
    onRestore?: (id: string) => void;
    onHardDelete?: (id: string) => void;
    isArchived?: boolean;
    selectedOrderIds?: string[];
    onSelectOrder?: (id: string, selected: boolean) => void;
    onSelectAll?: (selected: boolean) => void;
    onEditNote?: (id: string, currentNote: string) => void;
}

export default function OrderTable({
    orders,
    isLoading,
    formatPrice,
    formatDate,
    getStatusStyle,
    onArchive,
    onRestore,
    onHardDelete,
    isArchived = false,
    selectedOrderIds = [],
    onSelectOrder,
    onSelectAll,
    onEditNote,
}: OrderTableProps) {
    const router = useRouter();

    return (
        <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                {onSelectAll && (
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 w-10">
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-primary checkbox-sm border-gray-300 rounded cursor-pointer"
                                            checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                                            onChange={(e) => onSelectAll(e.target.checked)}
                                        />
                                    </th>
                                )}
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tracking / Parcel</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                                        Loading orders...
                                    </td>
                                </tr>
                            ) : orders.length > 0 ? (
                                orders.map((order: any) => (
                                    <tr
                                        key={order._id}
                                        onClick={() => router.push(`/admin/orders/${order._id}`)}
                                        className="hover:bg-gray-50 transition-colors bg-white cursor-pointer group"
                                    >
                                        {onSelectOrder && (
                                            <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-primary checkbox-sm border-gray-300 rounded cursor-pointer"
                                                    checked={selectedOrderIds.includes(order._id)}
                                                    onChange={(e) => onSelectOrder(order._id, e.target.checked)}
                                                />
                                            </td>
                                        )}
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                {order.products?.[0]?.image && (
                                                    <Image 
                                                        width={40}
                                                        height={40}
                                                        src={order.products[0].image} 
                                                        alt="Product" 
                                                        className="w-10 h-10 object-cover rounded-lg border border-gray-100 shrink-0" 
                                                    />
                                                )}
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <OrderSourceBadge source={order.source} />
                                                        {order.isPreorder && (
                                                            <span className="bg-orange-100 text-orange-600 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter border border-orange-200">
                                                                Pre-order
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors font-mono">
                                                        #{order.orderId}
                                                    </span>
                                                    {order.products?.length > 1 && (
                                                        <span className="text-[10px] text-gray-500 font-medium">+{order.products.length - 1} more items</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            {order.paymentDetails?.trackingId || order.paymentDetails?.parcelId ? (
                                                <div className="flex flex-col gap-1 items-start">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold font-mono text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 shadow-sm">
                                                            <span className="text-gray-500 font-medium mr-1">
                                                                {order.paymentDetails?.parcelId ? 'P.ID:' : 'TRK:'}
                                                            </span>
                                                            {order.paymentDetails?.parcelId || order.paymentDetails?.trackingId}
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigator.clipboard.writeText(order.paymentDetails?.parcelId || order.paymentDetails?.trackingId || '');
                                                                toast.success('Parcel ID copied');
                                                            }}
                                                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                            title="Copy Parcel ID"
                                                        >
                                                            <Copy size={14} />
                                                        </button>
                                                    </div>
                                                    {order.paymentDetails?.parcelId && order.paymentDetails?.trackingId && (
                                                        <span className="text-[10px] text-gray-400 font-mono pl-1">
                                                            TRK: {order.paymentDetails.trackingId}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs font-mono font-medium px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-gray-400">
                                                    null
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-900 font-medium">{order.customerInfo.name}</span>
                                                <span className="text-xs text-gray-500">{order.customerInfo.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-gray-900">
                                                {formatPrice(order.totalAmount)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1 items-start">
                                                <span 
                                                    className={`group relative px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(order.orderStatus)}`}
                                                >
                                                    {order.orderStatus}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-max max-w-[220px] bg-gray-900 text-white text-[10px] leading-relaxed px-2 py-1 rounded shadow-lg z-50 font-medium normal-case tracking-normal pointer-events-none text-center">
                                                        {getOrderStatusDescription(order.orderStatus)}
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-900"></div>
                                                    </div>
                                                </span>
                                                <div className="flex items-center gap-1.5 px-1">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${order.paymentStatus === 'Paid' ? 'bg-green-500' : order.paymentStatus === 'Delivery Charge Paid' ? 'bg-orange-500' : 'bg-gray-300'}`} />
                                                    <span className="text-xs text-gray-500">{order.paymentStatus}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditNote?.(order._id, order.adminNote || '');
                                                    }}
                                                    className={`transition-colors ${order.adminNote ? 'text-primary hover:text-primary-dark' : 'text-gray-400 hover:text-primary'}`}
                                                    title={order.adminNote ? 'View/Edit Note' : 'Add Note'}
                                                >
                                                    <FileText size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/admin/orders/${order._id}`);
                                                    }}
                                                    className="text-gray-400 hover:text-blue-600 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {order.isArchived ? (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onRestore?.(order._id);
                                                            }}
                                                            className="text-gray-400 hover:text-green-600 transition-colors"
                                                            title="Restore"
                                                        >
                                                            <RotateCcw size={18} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onHardDelete?.(order._id);
                                                            }}
                                                            className="text-gray-400 hover:text-red-600 transition-colors"
                                                            title="Permanently Delete"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onArchive?.(order._id);
                                                        }}
                                                        className="text-gray-400 hover:text-rose-500 transition-colors"
                                                        title="Archive"
                                                    >
                                                        <Archive size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                                        No recent orders found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {isLoading ? (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 text-center text-sm text-gray-500">
                        Loading orders...
                    </div>
                ) : orders.length > 0 ? (
                    orders.map((order: any) => (
                        <div
                            key={order._id}
                            onClick={() => router.push(`/admin/orders/${order._id}`)}
                            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4 cursor-pointer hover:border-gray-300 transition-all group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    {onSelectOrder && (
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                className="checkbox checkbox-primary checkbox-sm border-gray-300 rounded cursor-pointer"
                                                checked={selectedOrderIds.includes(order._id)}
                                                onChange={(e) => onSelectOrder(order._id, e.target.checked)}
                                            />
                                        </div>
                                    )}
                                    {order.products?.[0]?.image && (
                                        <Image 
                                            width={40}
                                            height={40}
                                            src={order.products[0].image} 
                                            alt="Product" 
                                            className="w-10 h-10 object-cover rounded-lg border border-gray-100 shrink-0" 
                                        />
                                    )}
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <OrderSourceBadge source={order.source} />
                                            {order.isPreorder && (
                                                <span className="bg-orange-100 text-orange-600 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter border border-orange-200">
                                                    Pre-order
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors font-mono">
                                            #{order.orderId}
                                        </span>
                                        {order.products?.length > 1 && (
                                            <span className="text-[10px] text-gray-500 font-medium">+{order.products.length - 1} more items</span>
                                        )}
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] text-gray-400 font-medium">Tracking/Parcel:</span>
                                            {order.paymentDetails?.trackingId || order.paymentDetails?.parcelId ? (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] font-mono font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                                        <span className="text-gray-500 font-medium mr-1">
                                                            {order.paymentDetails?.parcelId ? 'P.ID:' : 'TRK:'}
                                                        </span>
                                                        {order.paymentDetails?.parcelId || order.paymentDetails?.trackingId}
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigator.clipboard.writeText(order.paymentDetails?.parcelId || order.paymentDetails?.trackingId || '');
                                                            toast.success('Copied');
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                        title="Copy Parcel ID"
                                                    >
                                                        <Copy size={12} />
                                                    </button>
                                                    {order.paymentDetails?.parcelId && order.paymentDetails?.trackingId && (
                                                        <span className="text-[9px] text-gray-400 font-mono ml-1">
                                                            (TRK: {order.paymentDetails.trackingId})
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-mono font-medium px-1.5 bg-gray-50 border border-gray-200 rounded text-gray-400">
                                                    null
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xs font-bold text-gray-900">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    <span className="text-[10px] text-gray-500 font-medium">{new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Customer</span>
                                    <span className="text-sm font-bold text-gray-800">{order.customerInfo.name}</span>
                                    <span className="text-xs text-gray-500">{order.customerInfo.phone}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Total</span>
                                    <p className="text-sm font-black text-gray-900">{formatPrice(order.totalAmount)}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <div className="flex flex-col gap-1.5">
                                    <span 
                                        className={`group relative px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-widest text-center ${getStatusStyle(order.orderStatus)}`}
                                    >
                                        {order.orderStatus}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-max max-w-[220px] bg-gray-900 text-white text-[10px] leading-relaxed px-2 py-1 rounded shadow-lg z-50 font-medium normal-case tracking-normal pointer-events-none text-center">
                                            {getOrderStatusDescription(order.orderStatus)}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-900"></div>
                                        </div>
                                    </span>
                                    <div className="flex items-center gap-1.5 px-1">
                                        <div className={`w-1.5 h-1.5 rounded-full ${order.paymentStatus === 'Paid' ? 'bg-green-500' : order.paymentStatus === 'Delivery Charge Paid' ? 'bg-orange-500' : 'bg-rose-500'}`} />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{order.paymentStatus}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditNote?.(order._id, order.adminNote || '');
                                        }}
                                        className={`p-2 border rounded-lg transition-all active:scale-95 ${order.adminNote ? 'text-primary border-primary/20 bg-primary/10' : 'text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                                        title={order.adminNote ? 'View/Edit Note' : 'Add Note'}
                                    >
                                        <FileText size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/admin/orders/${order._id}`);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-black text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-all shadow-md active:scale-95"
                                    >
                                        View Details
                                    </button>
                                    {order.isArchived ? (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRestore?.(order._id);
                                                }}
                                                className="p-2 text-gray-400 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all active:scale-95"
                                                title="Restore"
                                            >
                                                <RotateCcw size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onHardDelete?.(order._id);
                                                }}
                                                className="p-2 text-red-400 border border-red-100 rounded-lg hover:bg-red-50 transition-all active:scale-95"
                                                title="Permanently Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onArchive?.(order._id);
                                            }}
                                            className="p-2 text-gray-400 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all active:scale-95"
                                            title="Archive"
                                        >
                                            <Archive size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white p-12 rounded-xl border border-gray-200 text-center text-sm text-gray-500">
                        No orders found.
                    </div>
                )}
            </div>
        </div>
    );
}
