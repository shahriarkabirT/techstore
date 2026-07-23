'use client';

import { useState } from 'react';
import { useGetSocialAuthSettingsQuery, useUpdateSocialAuthSettingsMutation } from '@/redux/features/settings/settingsApi';
import { toast } from 'react-hot-toast';
import { Save, Info, Edit2, X, Loader2, Key } from 'lucide-react';

export default function SocialAuthSettingsPage() {
    const { data: settingsData, isLoading } = useGetSocialAuthSettingsQuery();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return settingsData?.settings ? (
        <SocialAuthForm initialData={settingsData.settings} />
    ) : null;
}

function SocialAuthForm({ initialData }: { initialData: any }) {
    const [updateSocialAuthSettings, { isLoading: isUpdating }] = useUpdateSocialAuthSettingsMutation();
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        googleClientId: initialData.googleClientId || '',
        googleClientSecret: initialData.googleClientSecret || '',
    });

    const handleCancel = () => {
        setFormData({
            googleClientId: initialData.googleClientId || '',
            googleClientSecret: initialData.googleClientSecret || '',
        });
        setIsEditing(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const result = await updateSocialAuthSettings(formData).unwrap();
            if (result.success) {
                toast.success('Social Auth settings updated successfully');
                setIsEditing(false);
            }
        } catch (error) {
            toast.error('Failed to update Social Auth settings');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Social Auth Settings</h1>
                    <p className="text-gray-500 text-sm mt-1">Configure Google OAuth API credentials</p>
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
                {/* Google Auth Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Key className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Google Authentication</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Google Client ID</label>
                            <input
                                type="text"
                                value={formData.googleClientId}
                                onChange={(e) => setFormData({ ...formData, googleClientId: e.target.value })}
                                disabled={!isEditing}
                                placeholder={isEditing ? 'e.g. 123456789-xxxxxx.apps.googleusercontent.com' : 'Not set'}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all disabled:bg-transparent disabled:border-transparent disabled:shadow-none disabled:text-gray-800 disabled:px-0 disabled:font-medium disabled:cursor-default"
                            />
                            <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                Your OAuth 2.0 Client ID from Google Cloud Console.
                            </p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Google Client Secret</label>
                            <input
                                type="password"
                                value={formData.googleClientSecret}
                                onChange={(e) => setFormData({ ...formData, googleClientSecret: e.target.value })}
                                disabled={!isEditing}
                                placeholder={isEditing ? 'e.g. GOCSPX-xxxxxxxxxxxxx' : 'Not set'}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all disabled:bg-transparent disabled:border-transparent disabled:shadow-none disabled:text-gray-800 disabled:px-0 disabled:font-medium disabled:cursor-default"
                            />
                            <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                Your OAuth 2.0 Client Secret from Google Cloud Console.
                            </p>
                        </div>
                    </div>
                </div>

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
