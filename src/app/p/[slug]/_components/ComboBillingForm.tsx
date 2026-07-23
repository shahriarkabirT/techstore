'use client';

import { useState } from 'react';
import { bdLocations } from '@/lib/locations';
import { formatCurrency } from '@/lib/utils';
import { ShieldCheck, Truck, ShoppingCart, User, Phone, MapPin } from 'lucide-react';

interface BillingFormProps {
    subtotal: number;
    shippingCharge: number;
    total: number;
    totalQty: number;
    isSubmitting: boolean;
    onSubmit: (e: React.FormEvent, formData: any) => void;
    deliveryLocation: "inside" | "outside" | "";
    onDeliveryLocationChange: (loc: "inside" | "outside") => void;
}

export default function ComboBillingForm({
    subtotal,
    shippingCharge,
    total,
    totalQty,
    isSubmitting,
    onSubmit,
    deliveryLocation,
    onDeliveryLocationChange,
}: BillingFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        // division: '',
        // district: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const updatedData = { ...formData, [name]: value };

        // if (name === 'division') {
        //     updatedData.district = '';
        //     if (onDistrictChange) onDistrictChange('');
        // }

        // if (name === 'district') {
        //     if (onDistrictChange) onDistrictChange(value);
        // }

        setFormData(updatedData);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(e, formData);
    };

    return (
        <div className="grid lg:grid-cols-12 gap-8 lg:items-start">
            {/* Left: Input Fields */}
            <div className="lg:col-span-7 space-y-6">
                <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="font-black text-lg sm:text-xl text-gray-900 mb-6 sm:mb-8 flex items-center gap-3">
                        <User className="w-6 h-6 text-red-600" />
                        Billing & Shipping
                    </h3>

                    <form id="billing-form" onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    placeholder="e.g. John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl outline-none focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/5 transition-all text-sm font-bold text-gray-900 placeholder:text-gray-300"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1">
                                Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                required
                                placeholder="01XXXXXXXXX"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl outline-none focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/5 transition-all text-sm font-bold text-gray-900 placeholder:text-gray-300"
                            />
                        </div>

                        {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1">
                                    Division <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="division"
                                    required
                                    value={formData.division}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl outline-none focus:bg-white focus:border-red-500 transition-all text-sm font-bold text-gray-900 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_1.25rem_center] bg-no-repeat"
                                >
                                    <option value="">Select</option>
                                    {Object.keys(bdLocations).map((div) => (
                                        <option key={div} value={div}>{div}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1">
                                    District <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="district"
                                    required
                                    disabled={!formData.division}
                                    value={formData.district}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl outline-none focus:bg-white focus:border-red-500 transition-all text-sm font-bold text-gray-900 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_1.25rem_center] bg-no-repeat disabled:opacity-50"
                                >
                                    <option value="">Select</option>
                                    {formData.division && bdLocations[formData.division as keyof typeof bdLocations].map((dist) => (
                                        <option key={dist} value={dist}>{dist}</option>
                                    ))}
                                </select>
                            </div>
                        </div> */}

                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1">
                                Delivery Area <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => onDeliveryLocationChange("inside")}
                                    className={`relative flex flex-col items-start gap-1 p-3 rounded-2xl border-2 cursor-pointer transition-all text-left ${
                                        deliveryLocation === "inside"
                                            ? "border-red-600 bg-red-50 shadow-sm"
                                            : "border-slate-100 hover:border-slate-200 bg-slate-50"
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                            <MapPin className={`w-4 h-4 ${deliveryLocation === "inside" ? "text-red-600" : "text-gray-400"}`} />
                                            <span className={`text-sm font-bold ${deliveryLocation === "inside" ? "text-red-900" : "text-gray-700"}`}>
                                                Inside Dhaka
                                            </span>
                                        </div>
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                            deliveryLocation === "inside" ? "border-red-600" : "border-gray-300"
                                        }`}>
                                            {deliveryLocation === "inside" && <div className="w-2 h-2 bg-red-600 rounded-full" />}
                                        </div>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDeliveryLocationChange("outside")}
                                    className={`relative flex flex-col items-start gap-1 p-3 rounded-2xl border-2 cursor-pointer transition-all text-left ${
                                        deliveryLocation === "outside"
                                            ? "border-red-600 bg-red-50 shadow-sm"
                                            : "border-slate-100 hover:border-slate-200 bg-slate-50"
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                            <Truck className={`w-4 h-4 ${deliveryLocation === "outside" ? "text-red-600" : "text-gray-400"}`} />
                                            <span className={`text-sm font-bold ${deliveryLocation === "outside" ? "text-red-900" : "text-gray-700"}`}>
                                                Outside Dhaka
                                            </span>
                                        </div>
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                            deliveryLocation === "outside" ? "border-red-600" : "border-gray-300"
                                        }`}>
                                            {deliveryLocation === "outside" && <div className="w-2 h-2 bg-red-600 rounded-full" />}
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1">
                                Full Address <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="address"
                                    required
                                    placeholder="House, Road, Area..."
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl outline-none focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/5 transition-all text-sm font-bold text-gray-900 placeholder:text-gray-300"
                                />
                                <MapPin className="w-5 h-5 text-gray-300 absolute right-5 top-4" />
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-5">
                <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2rem] shadow-xl shadow-red-900/5 border border-red-50 lg:sticky lg:top-24">
                    <h3 className="font-black text-lg text-gray-900 mb-6 flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-red-600" />
                        Order Summary
                    </h3>

                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">Subtotal ({totalQty} items)</span>
                            <span className="font-bold text-gray-900">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">Shipping Charge</span>
                            <span className="font-bold text-gray-900">
                                {subtotal <= 0 ? (
                                    '—'
                                ) : shippingCharge === 0 ? (
                                    <span className="text-green-600 uppercase">Free</span>
                                ) : (
                                    formatCurrency(shippingCharge)
                                )}
                            </span>
                        </div>
                        <div className="h-px bg-dashed bg-gray-100 border-t border-dashed my-2" />
                        <div className="flex justify-between items-center">
                            <span className="font-black text-gray-900">Total Payable</span>
                            <span className="text-2xl font-black text-red-600 ">{formatCurrency(total)}</span>
                        </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-2xl mb-8 flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-black text-green-700 uppercase leading-none mb-1">Cash on Delivery</p>
                            <p className="text-[10px] text-green-600 font-bold">Pay only after receiving your products.</p>
                        </div>
                    </div>

                    <button
                        form="billing-form"
                        type="submit"
                        disabled={isSubmitting || totalQty === 0}
                        className="w-full group bg-red-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-red-200 hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3"
                    >
                        {isSubmitting ? (
                            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                Confirm My Order
                                <ShoppingCart className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                    
                    <p className="text-center text-[10px] text-gray-400 mt-6 font-bold uppercase flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Secure Checkout Guaranteed
                    </p>
                </div>
            </div>
        </div>
    );
}
