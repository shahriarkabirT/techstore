'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
    useGetGeneralSettingsQuery,
    useUpdateGeneralSettingsMutation
} from '@/redux/features/settings/settingsApi';
import {
    Loader2,
    Save,
    Truck,
    Store,
    Edit2,
    X
} from 'lucide-react';
import { ISettings } from '@/types';

interface GeneralSettingsFormProps {
    initialData: ISettings | undefined;
    onSave: (data: any) => Promise<any>;
    saving: boolean;
}

function GeneralSettingsForm({ initialData, onSave, saving }: GeneralSettingsFormProps) {
    const [formData, setFormData] = useState({
        brandName: initialData?.brandName || '',
        shippingChargeInsideDhaka: String(initialData?.shippingChargeInsideDhaka ?? 60),
        shippingChargeOutsideDhaka: String(initialData?.shippingChargeOutsideDhaka ?? 120)
    });
    const [isEditing, setIsEditing] = useState(false);

    const handleCancel = () => {
        setFormData({
            brandName: initialData?.brandName || '',
            shippingChargeInsideDhaka: String(initialData?.shippingChargeInsideDhaka ?? 60),
            shippingChargeOutsideDhaka: String(initialData?.shippingChargeOutsideDhaka ?? 120)
        });
        setIsEditing(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('shippingCharge') && (value === '' || isNaN(Number(value)))) {
            setFormData(prev => ({ ...prev, [name]: '0' }));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                brandName: formData.brandName,
                shippingChargeInsideDhaka: Number(formData.shippingChargeInsideDhaka) || 0,
                shippingChargeOutsideDhaka: Number(formData.shippingChargeOutsideDhaka) || 0
            };
            const data = await onSave(payload);
            if (data.success) {
                toast.success('General settings saved successfully');
                setIsEditing(false);
            }
        } catch (error: any) {
            console.error('Failed to update settings:', error);
            toast.error(error?.data?.message || 'Failed to save settings');
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">General Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Configure your store&apos;s basic identity and logistics.</p>
                </div>
                {!isEditing && (
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                        <Edit2 className="w-4 h-4" />
                        Edit Settings
                    </button>
                )}
            </div>

            <form id="general-settings-form" onSubmit={handleSave} className="space-y-6">
                {/* Store Identity */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Store className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Store Identity</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Brand Name</label>
                            <input
                                type="text"
                                name="brandName"
                                value={formData.brandName}
                                onChange={handleChange}
                                disabled={!isEditing}
                                placeholder={isEditing ? "Your Store Name" : "Not set"}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all disabled:bg-transparent disabled:border-transparent disabled:shadow-none disabled:text-gray-800 disabled:cursor-default disabled:font-medium disabled:px-0"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Logistics & Shipping */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <Truck className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Logistics</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Inside Dhaka Charge (৳)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="shippingChargeInsideDhaka"
                                    value={formData.shippingChargeInsideDhaka}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    disabled={!isEditing}
                                    placeholder={!isEditing ? "" : "60"}
                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all pl-8 disabled:bg-transparent disabled:border-transparent disabled:shadow-none disabled:text-gray-800 disabled:cursor-default disabled:font-medium disabled:px-6"
                                    required
                                />
                                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold ${!isEditing ? 'text-gray-800 left-0' : 'text-gray-400'}`}>৳</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Outside Dhaka Charge (৳)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="shippingChargeOutsideDhaka"
                                    value={formData.shippingChargeOutsideDhaka}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    disabled={!isEditing}
                                    placeholder={!isEditing ? "" : "120"}
                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all pl-8 disabled:bg-transparent disabled:border-transparent disabled:shadow-none disabled:text-gray-800 disabled:cursor-default disabled:font-medium disabled:px-6"
                                    required
                                />
                                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold ${!isEditing ? 'text-gray-800 left-0' : 'text-gray-400'}`}>৳</span>
                            </div>
                        </div>
                    </div>
                </div>

                {isEditing && (
                    <div className="flex justify-end pt-2 gap-3">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={saving}
                            className="bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <X className="w-4 h-4" />
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}

export default function GeneralSettingsPage() {
    const { data: settingsData, isLoading: loading } = useGetGeneralSettingsQuery();
    const [updateGeneral, { isLoading: saving }] = useUpdateGeneralSettingsMutation();

    const handleSave = async (formData: any) => {
        return await updateGeneral(formData).unwrap();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        );
    }

    return (
        <GeneralSettingsForm
            key={settingsData?.settings?._id || 'initial'}
            initialData={settingsData?.settings}
            onSave={handleSave}
            saving={saving}
        />
    );
}

