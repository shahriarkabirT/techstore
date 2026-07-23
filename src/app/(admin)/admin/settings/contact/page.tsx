'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
    MapPin,
    Phone,
    Mail,
    MessageSquare,
    Facebook,
    Instagram,
    Youtube,
    Music,
    Save,
    Loader2,
    Edit2,
    X
} from 'lucide-react';

export default function ContactSettingsPage() {
    const [settings, setSettings] = useState({
        address: '',
        contactPhone: '',
        contactEmail: '',
        whatsapp: '',
        facebook: '',
        instagram: '',
        youtube: '',
        tiktok: ''
    });
    const [initialSettings, setInitialSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await axios.get('/api/admin/settings/contact');
                if (data.success && data.settings) {
                    const fetched = {
                        address: data.settings.address || '',
                        contactPhone: data.settings.contactPhone || '',
                        contactEmail: data.settings.contactEmail || '',
                        whatsapp: data.settings.whatsapp || '',
                        facebook: data.settings.facebook || '',
                        instagram: data.settings.instagram || '',
                        youtube: data.settings.youtube || '',
                        tiktok: data.settings.tiktok || ''
                    };
                    setSettings(fetched);
                    setInitialSettings(fetched);
                }
            } catch (error) {
                toast.error('Failed to load settings');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setSettings(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data } = await axios.post('/api/admin/settings/contact', settings);
            if (data.success) {
                toast.success('Contact settings saved successfully');
                setInitialSettings(settings);
                setIsEditing(false);
            }
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (initialSettings) setSettings(initialSettings);
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
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Contact Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage public contact info and social media links appearing on your Contact Page.</p>
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

            <form onSubmit={handleSave} className="space-y-6">
                {/* Contact Information */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-1">
                            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1.5 focus-within:text-gray-900">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                Office Address
                            </label>
                            <textarea
                                name="address"
                                value={settings.address}
                                onChange={handleChange}
                                disabled={!isEditing}
                                rows={3}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all disabled:bg-transparent disabled:border-transparent disabled:shadow-none disabled:text-gray-800 disabled:cursor-default disabled:font-medium disabled:px-0"
                                placeholder={isEditing ? "Enter your full business address..." : "No address set"}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1.5 focus-within:text-gray-900">
                                <Phone className="w-4 h-4 text-gray-400" />
                                Contact Phone
                            </label>
                            <input
                                type="text"
                                name="contactPhone"
                                value={settings.contactPhone}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all disabled:bg-transparent disabled:border-transparent disabled:shadow-none disabled:text-gray-800 disabled:cursor-default disabled:font-medium disabled:px-0"
                                placeholder={isEditing ? "+880 1234 567890" : "Not set"}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1.5 focus-within:text-gray-900">
                                <Mail className="w-4 h-4 text-gray-400" />
                                Contact Email
                            </label>
                            <input
                                type="email"
                                name="contactEmail"
                                value={settings.contactEmail}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all disabled:bg-transparent disabled:border-transparent disabled:shadow-none disabled:text-gray-800 disabled:cursor-default disabled:font-medium disabled:px-0"
                                placeholder={isEditing ? "support@yourbrand.com" : "Not set"}
                            />
                        </div>
                    </div>
                </div>

                {/* Social Links */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <Facebook className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Social Media Links</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-green-700 flex items-center gap-1.5">
                                WhatsApp (Phone Number)
                            </label>
                            <input
                                type="text"
                                name="whatsapp"
                                value={settings.whatsapp}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all disabled:bg-transparent disabled:border-transparent disabled:shadow-none disabled:text-gray-800 disabled:cursor-default disabled:font-medium disabled:px-0"
                                placeholder={isEditing ? "+880 1..." : "Not set"}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-blue-700 flex items-center gap-1.5">
                                Facebook URL
                            </label>
                            <input
                                type="text"
                                name="facebook"
                                value={settings.facebook}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all disabled:bg-transparent disabled:border-transparent disabled:shadow-none disabled:text-gray-800 disabled:cursor-default disabled:font-medium disabled:px-0"
                                placeholder={isEditing ? "https://facebook.com/..." : "Not set"}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-pink-700 flex items-center gap-1.5">
                                Instagram URL
                            </label>
                            <input
                                type="text"
                                name="instagram"
                                value={settings.instagram}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all disabled:bg-transparent disabled:border-transparent disabled:shadow-none disabled:text-gray-800 disabled:cursor-default disabled:font-medium disabled:px-0"
                                placeholder={isEditing ? "https://instagram.com/..." : "Not set"}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-red-700 flex items-center gap-1.5">
                                <Youtube className="w-4 h-4" />
                                Youtube URL
                            </label>
                            <input
                                type="text"
                                name="youtube"
                                value={settings.youtube}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all disabled:bg-transparent disabled:border-transparent disabled:shadow-none disabled:text-gray-800 disabled:cursor-default disabled:font-medium disabled:px-0"
                                placeholder={isEditing ? "https://youtube.com/..." : "Not set"}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-pink-600 flex items-center gap-1.5">
                                <Music className="w-4 h-4" />
                                TikTok URL
                            </label>
                            <input
                                type="text"
                                name="tiktok"
                                value={settings.tiktok}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all disabled:bg-transparent disabled:border-transparent disabled:shadow-none disabled:text-gray-800 disabled:cursor-default disabled:font-medium disabled:px-0"
                                placeholder={isEditing ? "https://tiktok.com/@..." : "Not set"}
                            />
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
