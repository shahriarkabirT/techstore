'use client';

import { useState } from 'react';
import { useGetIntegrationsSettingsQuery, useUpdateIntegrationsSettingsMutation } from '@/redux/features/settings/settingsApi';
import { toast } from 'react-hot-toast';
import { Edit2, Shield, X, Save, Loader2 } from 'lucide-react';

export default function IntegrationsSettingsPage() {
    const { data: settingsData, isLoading } = useGetIntegrationsSettingsQuery();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return settingsData?.settings ? (
        <IntegrationsForm initialData={settingsData.settings} />
    ) : null;
}

function IntegrationsForm({ initialData }: { initialData: any }) {
    const [updateIntegrationsSettings, { isLoading: isUpdating }] = useUpdateIntegrationsSettingsMutation();
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        fraudBdApiKey: initialData.fraudBdApiKey || '',
    });

    const handleCancel = () => {
        setFormData({
            fraudBdApiKey: initialData.fraudBdApiKey || '',
        });
        setIsEditing(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const result = await updateIntegrationsSettings(formData).unwrap();
            if (result.success) {
                toast.success('Integrations settings updated successfully');
                setIsEditing(false);
            }
        } catch (error) {
            toast.error('Failed to update integrations settings');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Integrations Settings</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage third-party API keys and integrations</p>
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
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Fraud BD Integration</h2>
                    </div>

                    <div className="mb-6 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                        <h3 className="text-sm font-bold text-blue-800 mb-2">About Fraud BD</h3>
                        <p className="text-sm text-blue-900 mb-2">
                            Fraud BD helps verify customers by checking their past order delivery and cancellation rates across multiple couriers in Bangladesh.
                        </p>
                        <p className="text-sm text-blue-900">
                            <strong>Sandbox Test Key:</strong> <code className="bg-white px-1 py-0.5 rounded font-mono text-xs">1302e523911213bc507c3c6dd35ebdb908044b42982345012452ac8f86406cc9</code>
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Fraud BD API Key</label>
                            <input
                                type="text"
                                value={formData.fraudBdApiKey}
                                onChange={(e) => setFormData({ ...formData, fraudBdApiKey: e.target.value })}
                                disabled={!isEditing}
                                placeholder={isEditing ? 'Enter your API Key' : 'Not set'}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {isEditing && (
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isUpdating}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                            <X className="w-4 h-4" />
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isUpdating}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isUpdating ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}
