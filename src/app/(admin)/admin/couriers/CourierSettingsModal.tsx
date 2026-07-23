'use client';

import { useState, useEffect } from 'react';
import {
    X,
    Key,
    Save,
    Activity,
    Eye,
    EyeOff,
    Search,
    ChevronDown,
} from 'lucide-react';
import { ICourier } from '@/types';
import { useGetCourierAreasQuery } from '@/redux/features/courier/courierApi';

interface CourierSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    courier: ICourier | undefined;
    onSave: (isEnabled: boolean, config: Record<string, string>) => Promise<void>;
    isSaving: boolean;
}

export default function CourierSettingsModal({
    isOpen,
    onClose,
    courier,
    onSave,
    isSaving
}: CourierSettingsModalProps) {
    const [formConfig, setFormConfig] = useState<Record<string, any>>(courier?.config || {});
    const [showApiKey, setShowApiKey] = useState(false);
    const [showSecretKey, setShowSecretKey] = useState(false);

    // Fetch RedX Areas only if api key exists and redx is selected (moved to Order page)


    const handleConfigChange = (key: string, value: any) => {
        setFormConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(courier?.isEnabled || false, formConfig);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">API Configuration</h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{courier?.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-5">
                        {(courier?.name === 'redx' || courier?.name === 'pathao') && (
                            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                                <div>
                                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Sandbox Mode</p>
                                    <p className="text-[11px] text-amber-600">Enable for testing without real data.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleConfigChange('isSandbox', !formConfig.isSandbox)}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${formConfig.isSandbox ? 'bg-amber-500' : 'bg-gray-200'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formConfig.isSandbox ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>
                        )}

                        {courier?.name === 'pathao' ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">Client ID</label>
                                        <input
                                            type="text"
                                            value={formConfig.clientId || ''}
                                            onChange={(e) => handleConfigChange('clientId', e.target.value)}
                                            placeholder="Pathao Client ID"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-black focus:bg-white outline-none transition-all font-medium"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">Client Secret</label>
                                        <div className="relative">
                                            <input
                                                type={showSecretKey ? "text" : "password"}
                                                value={formConfig.clientSecret || ''}
                                                onChange={(e) => handleConfigChange('clientSecret', e.target.value)}
                                                placeholder="Client Secret"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-black focus:bg-white outline-none transition-all pr-10 font-medium"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowSecretKey(!showSecretKey)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900"
                                            >
                                                {showSecretKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">Username</label>
                                        <input
                                            type="text"
                                            value={formConfig.username || ''}
                                            onChange={(e) => handleConfigChange('username', e.target.value)}
                                            placeholder="Pathao Email/User"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-black focus:bg-white outline-none transition-all font-medium"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">Password</label>
                                        <div className="relative">
                                            <input
                                                type={showApiKey ? "text" : "password"}
                                                value={formConfig.password || ''}
                                                onChange={(e) => handleConfigChange('password', e.target.value)}
                                                placeholder="Pathao Password"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-black focus:bg-white outline-none transition-all pr-10 font-medium"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowApiKey(!showApiKey)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900"
                                            >
                                                {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* API Key Field */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">API Key</label>
                                    <div className="relative">
                                        <input
                                            type={showApiKey ? "text" : "password"}
                                            value={formConfig.apiKey || ''}
                                            onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                                            placeholder="Enter API Key"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-black focus:bg-white outline-none transition-all pr-12 font-medium"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowApiKey(!showApiKey)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900"
                                        >
                                            {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>



                                {/* Secret Key Field (for Steadfast) */}
                                {courier?.name === 'steadfast' && (
                                    <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">Secret Key</label>
                                        <div className="relative">
                                            <input
                                                type={showSecretKey ? "text" : "password"}
                                                value={formConfig.secretKey || ''}
                                                onChange={(e) => handleConfigChange('secretKey', e.target.value)}
                                                placeholder="Enter Secret Key"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-black focus:bg-white outline-none transition-all pr-12 font-medium"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowSecretKey(!showSecretKey)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900"
                                            >
                                                {showSecretKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">Branch ID</label>
                                <input
                                    type="text"
                                    value={formConfig.branchId || ''}
                                    onChange={(e) => handleConfigChange('branchId', e.target.value)}
                                    placeholder="Optional"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-black focus:bg-white outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">Pickup Area</label>
                                <input
                                    type="text"
                                    value={formConfig.pickupArea || ''}
                                    onChange={(e) => handleConfigChange('pickupArea', e.target.value)}
                                    placeholder="e.g. Dhaka"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-black focus:bg-white outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-900"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? <Activity size={14} className="animate-spin" /> : <Save size={14} />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
