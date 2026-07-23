'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Edit2, X, Loader2, Save, Mail, MessageSquare } from 'lucide-react';

export default function OTPSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [initialSettings, setInitialSettings] = useState<any>(null);
    const [settings, setSettings] = useState({
        emailOtpEnabled: true,
        smsOtpEnabled: false,
        smsApiKey: '',
        smsSenderId: '',
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPass: '',
        smtpFrom: '',
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings/otp');
            const data = await res.json();
            if (data.success) {
                const fetched = {
                    emailOtpEnabled: data.settings.emailOtpEnabled ?? true,
                    smsOtpEnabled: data.settings.smsOtpEnabled ?? false,
                    smsApiKey: data.settings.smsApiKey || '',
                    smsSenderId: data.settings.smsSenderId || '',
                    smtpHost: data.settings.smtpHost || '',
                    smtpPort: data.settings.smtpPort || 587,
                    smtpUser: data.settings.smtpUser || '',
                    smtpPass: data.settings.smtpPass || '',
                    smtpFrom: data.settings.smtpFrom || '',
                };
                setSettings(fetched);
                setInitialSettings(fetched);
            }
        } catch (error) {
            toast.error('Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/settings/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Settings updated successfully');
                setInitialSettings(settings);
                setIsEditing(false);
            } else {
                toast.error(data.message || 'Failed to update settings');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (initialSettings) setSettings(initialSettings);
        setIsEditing(false);
    };

    if (isLoading) {
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
                    <h1 className="text-2xl font-bold text-gray-900">Email & SMS Configuration</h1>
                    <p className="text-sm text-gray-500 mt-1">Configure delivery channels for emails and SMS notifications.</p>
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

            <form onSubmit={handleSave} className="space-y-8">

                {/* Delivery Methods Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Email Configuration Card */}
                    <div className={`relative bg-gray-200 p-6 rounded-2xl border-2 transition-all duration-200 ${settings.emailOtpEnabled ? 'border-gray-900 bg-gray-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${settings.emailOtpEnabled ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">Email OTP</h3>
                                    <p className="text-sm text-gray-500">Send via Nodemailer</p>
                                </div>
                            </div>
                            <label className={`relative inline-flex items-center cursor-pointer ${!isEditing ? "pointer-events-none" : ""}`}>
                                <input
                                    type="checkbox"
                                    checked={settings.emailOtpEnabled}
                                    disabled={!isEditing}
                                    onChange={(e) => setSettings({ ...settings, emailOtpEnabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-black hover:bg-gray-300 peer-checked:hover:bg-gray-800 transition-colors"></div>
                            </label>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed mb-4">
                            Sends verification codes and system emails via Nodemailer. Fallbacks to .env if empty.
                        </p>

                        {settings.emailOtpEnabled && (
                            <div className="space-y-4 pt-4 border-t border-gray-200/50 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">SMTP Host</label>
                                    <input
                                        type="text"
                                        value={settings.smtpHost}
                                        onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                                        disabled={!isEditing}
                                        placeholder={isEditing ? "e.g. smtp.gmail.com" : "Not set"}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all font-mono text-sm disabled:bg-transparent disabled:border-transparent disabled:shadow-none disabled:text-gray-800 disabled:px-0 disabled:font-medium disabled:cursor-default"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">SMTP Port</label>
                                        <input
                                            type="number"
                                            value={settings.smtpPort}
                                            onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || 587 })}
                                            disabled={!isEditing}
                                            placeholder={isEditing ? "e.g. 587" : ""}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all font-mono text-sm disabled:bg-transparent disabled:border-transparent disabled:shadow-none disabled:text-gray-800 disabled:px-0 disabled:font-medium disabled:cursor-default"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">From Name/Email</label>
                                        <input
                                            type="text"
                                            value={settings.smtpFrom}
                                            onChange={(e) => setSettings({ ...settings, smtpFrom: e.target.value })}
                                            disabled={!isEditing}
                                            placeholder={isEditing ? '"Store" <no-reply@store.com>' : 'Not set'}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all font-mono text-sm disabled:bg-transparent disabled:border-transparent disabled:shadow-none disabled:text-gray-800 disabled:px-0 disabled:font-medium disabled:cursor-default"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">SMTP User</label>
                                    <input
                                        type="text"
                                        value={settings.smtpUser}
                                        onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                                        disabled={!isEditing}
                                        placeholder={isEditing ? "Username or Email" : "Not set"}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all font-mono text-sm disabled:bg-transparent disabled:border-transparent disabled:shadow-none disabled:text-gray-800 disabled:px-0 disabled:font-medium disabled:cursor-default"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">SMTP Password</label>
                                    <input
                                        type="password"
                                        value={settings.smtpPass}
                                        onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                                        disabled={!isEditing}
                                        placeholder={isEditing ? "App Password or API Key" : "Not set"}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all font-mono text-sm disabled:bg-transparent disabled:border-transparent disabled:shadow-none disabled:text-gray-800 disabled:px-0 disabled:font-medium disabled:cursor-default"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SMS Configuration Card */}
                    <div className={`relative bg-gray-200 p-6 rounded-2xl border-2 transition-all duration-200 ${settings.smsOtpEnabled ? 'border-gray-900 bg-gray-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${settings.smsOtpEnabled ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">SMS OTP</h3>
                                    <p className="text-sm text-gray-500">Send via SMS.net.bd</p>
                                </div>
                            </div>
                            <label className={`relative inline-flex items-center cursor-pointer ${!isEditing ? "pointer-events-none" : ""}`}>
                                <input
                                    type="checkbox"
                                    checked={settings.smsOtpEnabled}
                                    disabled={!isEditing}
                                    onChange={(e) => setSettings({ ...settings, smsOtpEnabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-black hover:bg-gray-300 peer-checked:hover:bg-gray-800 transition-colors"></div>
                            </label>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed mb-4">
                            Sends verification codes to the user&apos;s mobile phone via SMS network.
                        </p>

                        {settings.smsOtpEnabled && (
                            <div className="space-y-4 pt-4 border-t border-gray-200/50 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">API Key</label>
                                    <input
                                        type={isEditing ? "password" : "text"}
                                        value={settings.smsApiKey}
                                        onChange={(e) => setSettings({ ...settings, smsApiKey: e.target.value })}
                                        disabled={!isEditing}
                                        placeholder={isEditing ? "Enter SMS.net.bd API Key" : "Not set"}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all font-mono text-sm disabled:bg-transparent disabled:border-transparent disabled:shadow-none disabled:text-gray-800 disabled:px-0 disabled:font-medium disabled:cursor-default"
                                        required={settings.smsOtpEnabled && isEditing}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex justify-between">
                                        Sender ID
                                        {isEditing && <span className="text-gray-400 font-normal normal-case">Optional</span>}
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.smsSenderId}
                                        onChange={(e) => setSettings({ ...settings, smsSenderId: e.target.value })}
                                        disabled={!isEditing}
                                        placeholder={isEditing ? "e.g. 88018xxxx" : "Not set"}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-sm disabled:bg-transparent disabled:border-transparent disabled:shadow-none disabled:text-gray-800 disabled:px-0 disabled:font-medium disabled:cursor-default"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {isEditing && (
                    <div className="flex justify-end pt-2 gap-3">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isSaving}
                            className="bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <X className="w-4 h-4" />
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? (
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
