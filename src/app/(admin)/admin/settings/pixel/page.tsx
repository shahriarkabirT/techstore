'use client';

import { useState } from 'react';
import { useGetMarketingSettingsQuery, useUpdateMarketingSettingsMutation } from '@/redux/features/settings/settingsApi';
import { toast } from 'react-hot-toast';
import { Save, Info, Facebook, Globe, Edit2, X, Loader2, Music2 } from 'lucide-react';

export default function MarketingSettingsPage() {
    const { data: settingsData, isLoading } = useGetMarketingSettingsQuery();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return settingsData?.settings ? (
        <MarketingForm initialData={settingsData.settings} />
    ) : null;
}

function MarketingForm({ initialData }: { initialData: any }) {
    const [updateMarketingSettings, { isLoading: isUpdating }] = useUpdateMarketingSettingsMutation();
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        facebookPixelId: initialData.facebookPixelId || '',
        googleTagManagerId: initialData.googleTagManagerId || '',
        tiktokPixelId: initialData.tiktokPixelId || '',
        metaAccessToken: initialData.metaAccessToken || '',
    });

    const handleCancel = () => {
        setFormData({
            facebookPixelId: initialData.facebookPixelId || '',
            googleTagManagerId: initialData.googleTagManagerId || '',
            tiktokPixelId: initialData.tiktokPixelId || '',
            metaAccessToken: initialData.metaAccessToken || '',
        });
        setIsEditing(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const result = await updateMarketingSettings(formData).unwrap();
            if (result.success) {
                toast.success('Marketing settings updated successfully');
                setIsEditing(false);
            }
        } catch (error) {
            toast.error('Failed to update marketing settings');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Marketing Settings</h1>
                    <p className="text-gray-500 text-sm mt-1">Configure Facebook Pixel, Google Tag Manager, and TikTok Pixel IDs</p>
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

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Meta Pixel Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Facebook className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Meta Pixel</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Pixel ID</label>
                            <input
                                type="text"
                                value={formData.facebookPixelId}
                                onChange={(e) => setFormData({ ...formData, facebookPixelId: e.target.value })}
                                disabled={!isEditing}
                                placeholder={isEditing ? 'e.g. 123456789012345' : 'Not set'}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all disabled:bg-transparent disabled:border-transparent disabled:shadow-none disabled:text-gray-800 disabled:px-0 disabled:font-medium disabled:cursor-default"
                            />
                            <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                Your Meta Pixel ID from Events Manager.
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Conversions API Access Token</label>
                            <input
                                type="text"
                                value={formData.metaAccessToken}
                                onChange={(e) => setFormData({ ...formData, metaAccessToken: e.target.value })}
                                disabled={!isEditing}
                                placeholder={isEditing ? 'e.g. EAABxyz...' : 'Not set'}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all disabled:bg-transparent disabled:border-transparent disabled:shadow-none disabled:text-gray-800 disabled:px-0 disabled:font-medium disabled:cursor-default"
                            />
                            <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                Your Meta Conversions API Access Token. Required for Server-Side CAPI tracking.
                            </p>
                        </div>
                    </div>
                </div> 

                {/* GTM Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <Globe className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Google Tag Manager</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">GTM Container ID</label>
                            <input
                                type="text"
                                value={formData.googleTagManagerId}
                                onChange={(e) => setFormData({ ...formData, googleTagManagerId: e.target.value })}
                                disabled={!isEditing}
                                placeholder={isEditing ? 'e.g. GTM-XXXXXXX' : 'Not set'}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all disabled:bg-transparent disabled:border-transparent disabled:shadow-none disabled:text-gray-800 disabled:px-0 disabled:font-medium disabled:cursor-default"
                            />
                            <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                Your Google Tag Manager container ID.
                            </p>
                        </div>
                    </div>
                </div>

                {/* TikTok Pixel Card */}
                {/* 
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
                        <div className="p-2 bg-gray-900 rounded-lg text-white">
                            <Music2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">TikTok Pixel</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Pixel ID</label>
                            <input
                                type="text"
                                value={formData.tiktokPixelId}
                                onChange={(e) => setFormData({ ...formData, tiktokPixelId: e.target.value })}
                                disabled={!isEditing}
                                placeholder={isEditing ? 'e.g. CXXXXXXXXXXXXXXXX' : 'Not set'}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all disabled:bg-transparent disabled:border-transparent disabled:shadow-none disabled:text-gray-800 disabled:px-0 disabled:font-medium disabled:cursor-default"
                            />
                            <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                Your TikTok Pixel ID from TikTok Ads Manager → Assets → Events.
                            </p>
                        </div>
                    </div>
                </div>
                */}

                {isEditing && (
                    <div className="flex justify-end pt-2 gap-3">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isUpdating}
                            className="bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <X className="w-4 h-4" />
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isUpdating}
                            className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {isUpdating ? (
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
