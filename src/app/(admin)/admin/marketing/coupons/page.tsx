'use client';

import { useState } from 'react';
import { useGetCouponsQuery, useCreateCouponMutation, useDeleteCouponMutation, useUpdateCouponMutation } from '@/redux/features/coupon/couponApi';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Edit, Ticket, Calendar, Search, Loader2 } from 'lucide-react';

const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatToInputDateTime = (date: Date | string) => {
    const d = new Date(date);
    const offset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - offset).toISOString().slice(0, 16);
    return localISOTime;
};

export default function CouponsPage() {
    const { data: couponsData, isLoading } = useGetCouponsQuery();
    const [createCoupon, { isLoading: isCreating }] = useCreateCouponMutation();
    const [updateCoupon, { isLoading: isUpdating }] = useUpdateCouponMutation();
    const [deleteCoupon] = useDeleteCouponMutation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCoupon, setCurrentCoupon] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [togglingId, setTogglingId] = useState<string | null>(null);

    interface CouponFormState {
        code: string;
        description: string;
        discountType: 'percentage' | 'flat';
        discountValue: number;
        minOrderAmount: number;
        maxDiscountAmount: string;
        startDate: string;
        expiryDate: string;
        isActive: boolean;
    }

    const [formData, setFormData] = useState<CouponFormState>({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: 0,
        minOrderAmount: 0,
        maxDiscountAmount: '',
        startDate: formatToInputDateTime(new Date()),
        expiryDate: '',
        isActive: true,
    });

    const filteredCoupons = couponsData?.data?.coupons?.filter(coupon =>
        coupon.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleOpenModal = (coupon: any = null) => {
        if (coupon) {
            setCurrentCoupon(coupon);
            setFormData({
                code: coupon.code,
                description: coupon.description || '',
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                minOrderAmount: coupon.minOrderAmount,
                maxDiscountAmount: coupon.maxDiscountAmount || '',
                startDate: coupon.startDate ? formatToInputDateTime(coupon.startDate) : formatToInputDateTime(new Date()),
                expiryDate: coupon.expiryDate ? formatToInputDateTime(coupon.expiryDate) : '',
                isActive: coupon.isActive,
            });
        } else {
            setCurrentCoupon(null);
            setFormData({
                code: '',
                description: '',
                discountType: 'percentage',
                discountValue: 0,
                minOrderAmount: 0,
                maxDiscountAmount: '',
                startDate: formatToInputDateTime(new Date()),
                expiryDate: '',
                isActive: true,
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (formData.discountType === 'flat' && formData.minOrderAmount < formData.discountValue) {
                toast.error('Minimum order amount cannot be less than the flat discount value!', { icon: '⚠️' });
                return;
            }

            const data = {
                ...formData,
                maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : undefined,
                startDate: new Date(formData.startDate),
                expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
            };

            if (currentCoupon) {
                await updateCoupon({ id: currentCoupon._id, body: data }).unwrap();
                toast.success('Coupon updated successfully');
            } else {
                await createCoupon(data).unwrap();
                toast.success('Coupon created successfully');
            }
            setIsModalOpen(false);
        } catch (error: any) {
            toast.error(error.data?.message || 'Action failed');
        }
    };

    const handleToggleStatus = async (coupon: any) => {
        setTogglingId(coupon._id);
        try {
            await updateCoupon({
                id: coupon._id,
                body: { isActive: !coupon.isActive }
            }).unwrap();
            toast.success(`Coupon ${!coupon.isActive ? 'activated' : 'deactivated'}`);
        } catch (error) {
            toast.error('Failed to update status');
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this coupon?')) {
            try {
                await deleteCoupon(id).unwrap();
                toast.success('Coupon deleted successfully');
            } catch (error) {
                toast.error('Failed to delete coupon');
            }
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500 italic">Loading coupons...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Manage Coupons</h1>
                    <p className="text-gray-500 text-sm">Create and manage discount codes for your customers</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-black/5"
                >
                    <Plus className="w-5 h-5" />
                    Add New Coupon
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search coupons by code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm italic"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Code</th>
                                <th className="px-6 py-4">Discount</th>
                                <th className="px-6 py-4">Min Order</th>
                                <th className="px-6 py-4">Usage</th>
                                <th className="px-6 py-4">Valid Period</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 italic">
                            {filteredCoupons?.map((coupon) => (
                                <tr key={coupon._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-black/5 rounded-lg text-black">
                                                <Ticket className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold text-gray-900">{coupon.code}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium">
                                            {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `৳${coupon.discountValue}`}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 font-bold">৳{coupon.minOrderAmount}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            <span className="font-bold text-gray-900">{coupon.usedCount}</span>
                                            {coupon.usageLimit ? <span className="text-gray-400"> / {coupon.usageLimit}</span> : null}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-[10px] text-gray-600">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3 h-3 text-green-500" />
                                                <span className="font-bold">From:</span> {formatDate(coupon.startDate)}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3 h-3 text-rose-500" />
                                                <span className="font-bold">To:</span> {coupon.expiryDate ? formatDate(coupon.expiryDate) : 'No Expiry'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            disabled={togglingId === coupon._id}
                                            onClick={() => handleToggleStatus(coupon)}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${togglingId === coupon._id
                                                ? 'opacity-50 cursor-wait'
                                                : 'cursor-pointer hover:border-black/10'
                                                } ${coupon.isActive
                                                    ? 'bg-green-50 text-green-700 border-green-100'
                                                    : 'bg-red-50 text-red-700 border-red-100'
                                                }`}
                                        >
                                            {togglingId === coupon._id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <span className={`w-1.5 h-1.5 rounded-full ${coupon.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                                            )}
                                            {coupon.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => handleOpenModal(coupon)}
                                                className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(coupon._id)}
                                                className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-xl font-bold">{currentCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h2>
                            <p className="text-xs text-gray-500 mt-1 italic">Fill out the details below to save your coupon</p>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Coupon Code</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black/5 outline-none font-bold placeholder:font-normal placeholder:text-gray-300 uppercase italic"
                                        placeholder="E.g., FESTIVE20"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Description (Optional)</label>
                                    <textarea
                                        value={formData.description}
                                        placeholder="Describe what this coupon offers..."
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black/5 outline-none resize-none h-20 text-sm italic"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Discount Type</label>
                                    <select
                                        value={formData.discountType}
                                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value as CouponFormState['discountType'] })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black/5 outline-none font-bold text-sm bg-white"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="flat">Flat Amount (৳)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-green-600/70 mb-1.5 uppercase tracking-wider">Discount Value</label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        value={formData.discountValue}
                                        onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/5 outline-none font-bold text-green-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Min Order (৳)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.minOrderAmount}
                                        onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black/5 outline-none font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Start Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black/5 outline-none font-bold text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Expiry Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.expiryDate}
                                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black/5 outline-none font-bold text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-5 h-5 rounded-lg border-gray-300 text-black focus:ring-black transition-all"
                                />
                                <label htmlFor="isActive" className="text-sm font-bold text-gray-700 cursor-pointer italic">Coupon is active and ready for use</label>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    disabled={isCreating || isUpdating}
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating || isUpdating}
                                    className="flex-[2] px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 flex items-center justify-center gap-2 disabled:bg-gray-400"
                                >
                                    {isCreating || isUpdating ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        currentCoupon ? 'Update Coupon' : 'Create Coupon'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
