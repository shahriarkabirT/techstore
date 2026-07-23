'use client';

import { useState, useEffect } from 'react';
import LogoUploader from '@/components/admin/LogoUploader';
import FaviconUploader from '@/components/admin/FaviconUploader';
import { toast } from 'react-hot-toast';
import { useGetPublicSettingsQuery, useUpdateLogoSettingsMutation } from '@/redux/features/settings/settingsApi';
import { Loader2, Save, Image as ImageIcon, Box, Edit2, X } from 'lucide-react';
import NextImage from 'next/image';

export default function LogoManagementPage() {
    const { data: settingsData, isLoading: loading } = useGetPublicSettingsQuery();
    const [updateLogo, { isLoading: saving }] = useUpdateLogoSettingsMutation();

    const [localSettings, setLocalSettings] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Derived settings: use local edits if available, otherwise fallback to server data
    const settings = {
        logoUrl: localSettings?.logoUrl ?? settingsData?.settings?.logoUrl ?? '',
        logoWidth: localSettings?.logoWidth ?? settingsData?.settings?.logoWidth ?? 120,
        logoHeight: localSettings?.logoHeight ?? settingsData?.settings?.logoHeight ?? 40,
        faviconUrl: localSettings?.faviconUrl ?? settingsData?.settings?.faviconUrl ?? '',
    };

    const handleUploadComplete = (newUrl: string) => {
        setLocalSettings((prev: any) => ({
            ...(prev || settings),
            logoUrl: newUrl
        }));
    };

    const handleDimensionsChange = (width: number, height: number) => {
        setLocalSettings((prev: any) => ({
            ...(prev || settings),
            logoWidth: width,
            logoHeight: height
        }));
    };

    const handleFaviconUpload = (newUrl: string) => {
        setLocalSettings((prev: any) => ({
            ...(prev || settings),
            faviconUrl: newUrl
        }));
    };

    const handleSave = async () => {
        try {
            const data = await updateLogo({
                logoUrl: settings.logoUrl,
                logoWidth: settings.logoWidth,
                logoHeight: settings.logoHeight,
                faviconUrl: settings.faviconUrl
            }).unwrap();

            if (data.success) {
                toast.success('Branding settings saved successfully');
                setLocalSettings(null); // Reset local state to pick up refetched server data
                setIsEditing(false);
            }
        } catch (error: any) {
            console.error('Failed to update settings:', error);
            toast.error(error?.data?.message || 'Failed to save settings');
        }
    };

    const handleCancel = () => {
        setLocalSettings(null);
        setIsEditing(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Store Branding</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your website identity across all platforms.</p>
                </div>
                {!isEditing && (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                        <Edit2 className="w-4 h-4" />
                        Edit Settings
                    </button>
                )}
            </div>

            <div className="space-y-6">
                {/* Header Logo Section */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <ImageIcon className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Header Branding</h2>
                    </div>

                    <div className={!isEditing ? "pointer-events-none opacity-80" : ""}>
                        <LogoUploader
                            currentLogo={settings.logoUrl}
                            width={settings.logoWidth}
                            height={settings.logoHeight}
                            onUploadComplete={handleUploadComplete}
                            onDimensionsChange={handleDimensionsChange}
                        />
                    </div>
                </div>

                {/* Tab Branding Section */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                            <Box className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Browser Identity</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <div className="lg:col-span-5">
                            <div className={!isEditing ? "pointer-events-none opacity-80" : ""}>
                                <FaviconUploader
                                    currentFavicon={settings.faviconUrl}
                                    onUploadComplete={handleFaviconUpload}
                                />
                            </div>

                            <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Setup Guide</h4>
                                <ul className="space-y-2 text-xs text-gray-600">
                                    <li className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-gray-400 mt-1.5" />
                                        <span>Use a PNG with a transparent background.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-gray-400 mt-1.5" />
                                        <span>Ensure the image is exactly square (e.g. 512x512).</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-gray-400 mt-1.5" />
                                        <span>The system will automatically apply it as a favicon and apple-touch-icon.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="lg:col-span-7">
                            <div className="bg-gray-900 rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden group">
                                {/* Simulated Browser Tab */}
                                <div className="absolute top-0 left-0 w-full h-8 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-600" />
                                    <div className="w-2 h-2 rounded-full bg-gray-600" />
                                    <div className="w-2 h-2 rounded-full bg-gray-600" />
                                </div>

                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-8 mt-4">Browser Tab Preview</p>

                                <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-xl shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-700">
                                    <div className="w-5 h-5 flex items-center justify-center overflow-hidden rounded bg-gray-50">
                                        {settings.faviconUrl ? (
                                            <NextImage src={settings.faviconUrl} alt="Favicon Preview" width={20} height={20} className="w-full h-full object-contain" />
                                        ) : settings.logoUrl ? (
                                            <NextImage src={settings.logoUrl} alt="Logo Fallback Preview" width={20} height={20} className="w-full h-full object-contain grayscale opacity-40 brightness-110" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 animate-pulse" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold text-gray-900 leading-none">LuxStore | Premium Shopping</span>
                                        <span className="text-[8px] text-gray-400 font-medium leading-none mt-1">luxstore.com</span>
                                    </div>
                                </div>

                                <div className="mt-8 text-center bg-white/5 px-4 py-2 rounded-full border border-white/5">
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.15em]">
                                        {settings.faviconUrl
                                            ? "✓ Dedicated Favicon"
                                            : "⚠ Logo Fallback Active"}
                                    </p>
                                </div>

                                {/* Aesthetic waves */}
                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-1000" />
                                <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-1000" />
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
                            type="button"
                            onClick={handleSave}
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
            </div>
        </div>
    );
}
