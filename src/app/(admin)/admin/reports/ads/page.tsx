'use client';

import { useState } from 'react';
import {
    useGetMetaAdsConfigQuery,
    useUpdateMetaAdsConfigMutation,
    useTestMetaAdsConnectionMutation,
    useGetMetaAdsInsightsQuery,
} from '@/redux/features/metaAds/metaAdsApi';
import toast from 'react-hot-toast';

const DATE_PRESETS = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last_7d', label: 'Last 7 Days' },
    { value: 'last_30d', label: 'Last 30 Days' },
];

function formatCurrency(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

function formatNumber(n: number) {
    return new Intl.NumberFormat('en-US').format(n);
}

function formatPercent(n: number) {
    return `${n.toFixed(2)}%`;
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Config Modal ──────────────────────────────────────────────
function ConfigModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { data: configData, isLoading } = useGetMetaAdsConfigQuery();
    const [updateConfig, { isLoading: isSaving }] = useUpdateMetaAdsConfigMutation();
    const [testConnection, { isLoading: isTesting }] = useTestMetaAdsConnectionMutation();

    const [accessToken, setAccessToken] = useState('');
    const [adAccountId, setAdAccountId] = useState('');
    const [isEnabled, setIsEnabled] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);

    if (configData?.config && !initialized) {
        setAdAccountId(configData.config.adAccountId || '');
        setIsEnabled(configData.config.isEnabled || false);
        setInitialized(true);
    }

    const handleSave = async () => {
        try {
            const res = await updateConfig({ accessToken: accessToken || undefined, adAccountId, isEnabled }).unwrap();
            if (res.success) { toast.success('Meta Ads config saved'); setAccessToken(''); setTestResult(null); onClose(); }
        } catch { toast.error('Failed to save config'); }
    };

    const handleTest = async () => {
        setTestResult(null);
        try {
            const res = await testConnection().unwrap();
            setTestResult(res);
            if (res.success) toast.success(`Connected: ${res.account?.name}`);
            else toast.error(res.message || 'Connection failed');
        } catch { toast.error('Connection test failed'); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                        <h3 className="text-sm font-semibold text-gray-900">Meta Ads Configuration</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-5">
                    {isLoading ? (
                        <div className="flex items-center gap-3 py-6 justify-center"><div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" /><span className="text-sm text-gray-400">Loading...</span></div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Access Token</label>
                                    <input type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder={configData?.config?.hasToken ? '••••••••(unchanged)' : 'Paste your Meta access token'} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900/20 focus:border-gray-400 transition-colors" />
                                    <p className="text-[10px] text-gray-400 mt-1">System user token with <code className="bg-gray-100 px-1 rounded text-[10px]">ads_read</code> permission</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Ad Account ID</label>
                                    <input type="text" value={adAccountId} onChange={(e) => setAdAccountId(e.target.value)} placeholder="act_XXXXXXXXXX" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900/20 focus:border-gray-400 transition-colors" />
                                    <p className="text-[10px] text-gray-400 mt-1">Found in Meta Business Suite → Ad Account Settings</p>
                                </div>
                            </div>
                            <label className="flex items-center gap-2.5 cursor-pointer w-fit">
                                <div className="relative"><input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} className="sr-only peer" /><div className="w-9 h-5 bg-gray-200 rounded-full peer-checked:bg-gray-900 transition-colors" /><div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" /></div>
                                <span className="text-sm font-medium text-gray-700">Enable reporting</span>
                            </label>
                            {testResult && (
                                <div className={`text-sm px-4 py-3 rounded-lg border ${testResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                    {testResult.success ? (
                                        <div className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg><span className="font-medium">{testResult.account?.name}</span><span className="text-green-600 text-xs">· {testResult.account?.currency} · {testResult.account?.timezone}</span></div>
                                    ) : (
                                        <div className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg><span>{testResult.message}</span></div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-5 border-t border-gray-100 bg-gray-50/50">
                    <button onClick={handleTest} disabled={isTesting || isLoading || !configData?.config?.hasToken} className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40 cursor-pointer">{isTesting ? 'Testing...' : 'Test Connection'}</button>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving || isLoading} className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black transition-colors disabled:opacity-50 cursor-pointer">{isSaving ? 'Saving...' : 'Save'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Insights Dashboard ─────────────────────────────────────────
function InsightsDashboard() {
    const { data: configData } = useGetMetaAdsConfigQuery();
    const [activePreset, setActivePreset] = useState('today');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [useCustom, setUseCustom] = useState(false);

    const queryParams = useCustom && customStart && customEnd
        ? { startDate: customStart, endDate: customEnd }
        : { preset: activePreset };

    const { data, isLoading, isFetching, refetch } = useGetMetaAdsInsightsQuery(queryParams, {
        skip: !configData?.config?.isEnabled || !configData?.config?.hasToken,
        pollingInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    });

    if (!configData?.config?.isEnabled || !configData?.config?.hasToken) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-8 h-8 text-gray-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Set up Meta Ads reporting</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    Configure your Meta access token and ad account ID above, then enable reporting to see live ad performance data.
                </p>
            </div>
        );
    }

    if (!data?.success && data?.message) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700">
                <div className="flex items-center gap-2 font-medium mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" />
                    </svg>
                    API Error
                </div>
                <p>{data.message}</p>
            </div>
        );
    }

    const ins = data?.insights;
    const campaigns = data?.campaigns || [];

    return (
        <div className="space-y-5">
            {/* Date Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    {DATE_PRESETS.map(p => (
                        <button
                            key={p.value}
                            onClick={() => { setActivePreset(p.value); setUseCustom(false); }}
                            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${!useCustom && activePreset === p.value
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                    <div className="flex items-center gap-1.5 ml-1">
                        <input
                            type="date"
                            value={customStart}
                            onChange={e => setCustomStart(e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-gray-300"
                        />
                        <span className="text-gray-400 text-xs">to</span>
                        <input
                            type="date"
                            value={customEnd}
                            onChange={e => setCustomEnd(e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-gray-300"
                        />
                        <button
                            onClick={() => { if (customStart && customEnd) setUseCustom(true); }}
                            className="px-2.5 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                        >
                            Go
                        </button>
                    </div>
                </div>

                {/* Sync indicator */}
                <div className="flex items-center gap-2">
                    {(isLoading || isFetching) && (
                        <div className="w-3.5 h-3.5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                    )}
                    {data?.lastSyncedAt && (
                        <span className="text-[10px] text-gray-400">
                            {data.cached ? 'Cached' : 'Live'} · synced {timeAgo(data.lastSyncedAt)}
                        </span>
                    )}
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                        title="Refresh"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                        </svg>
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 h-[88px] animate-pulse">
                            <div className="h-2.5 w-16 bg-gray-100 rounded mb-3" />
                            <div className="h-6 w-24 bg-gray-100 rounded" />
                        </div>
                    ))}
                </div>
            ) : ins ? (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                            { label: 'Total Spend', value: formatCurrency(ins.spend), accent: true },
                            { label: 'Impressions', value: formatNumber(ins.impressions) },
                            { label: 'Reach', value: formatNumber(ins.reach) },
                            { label: 'Link Clicks', value: formatNumber(ins.linkClicks) },
                            { label: 'CTR', value: formatPercent(ins.ctr) },
                            { label: 'CPC', value: formatCurrency(ins.cpc) },
                            { label: 'Purchases', value: formatNumber(ins.purchases), highlight: ins.purchases > 0 },
                            { label: 'ROAS', value: ins.roas > 0 ? `${ins.roas.toFixed(2)}x` : '—', highlight: ins.roas > 1 },
                        ].map((card, i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{card.label}</p>
                                <p className={`text-xl font-bold mt-1 tabular-nums ${card.highlight ? 'text-green-700' : card.accent ? 'text-blue-700' : 'text-gray-900'}`}>
                                    {card.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Secondary metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {[
                            { label: 'CPM', value: formatCurrency(ins.cpm) },
                            { label: 'Frequency', value: ins.frequency.toFixed(2) },
                            { label: 'Add to Cart', value: formatNumber(ins.addToCart) },
                            { label: 'Cost / Purchase', value: ins.costPerPurchase > 0 ? formatCurrency(ins.costPerPurchase) : '—' },
                            { label: 'Checkout Initiated', value: formatNumber(ins.initiateCheckout) },
                            { label: 'Page Views', value: formatNumber(ins.pageViews) },
                        ].map((card, i) => (
                            <div key={i} className="bg-gray-50/80 border border-gray-100 rounded-lg px-3.5 py-3">
                                <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">{card.label}</p>
                                <p className="text-sm font-semibold text-gray-900 mt-0.5 tabular-nums">{card.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Campaign Table */}
                    {campaigns.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-900">Campaign Breakdown</h3>
                                <p className="text-[10px] text-gray-400 mt-0.5">{campaigns.length} active campaign{campaigns.length !== 1 ? 's' : ''}</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 text-left">
                                            <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Campaign</th>
                                            <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">Spend</th>
                                            <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">Impr.</th>
                                            <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">Clicks</th>
                                            <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">CTR</th>
                                            <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">CPC</th>
                                            <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">Conv.</th>
                                            <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">Cost/Conv.</th>
                                            <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">ROAS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {campaigns.map((c) => (
                                            <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-gray-900 truncate max-w-[240px]">{c.name}</p>
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">{formatCurrency(c.spend)}</td>
                                                <td className="px-4 py-3 text-right tabular-nums text-gray-600">{formatNumber(c.impressions)}</td>
                                                <td className="px-4 py-3 text-right tabular-nums text-gray-600">{formatNumber(c.clicks)}</td>
                                                <td className="px-4 py-3 text-right tabular-nums text-gray-600">{formatPercent(c.ctr)}</td>
                                                <td className="px-4 py-3 text-right tabular-nums text-gray-600">{formatCurrency(c.cpc)}</td>
                                                <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">{c.purchases || '—'}</td>
                                                <td className="px-4 py-3 text-right tabular-nums text-gray-600">{c.costPerPurchase > 0 ? formatCurrency(c.costPerPurchase) : '—'}</td>
                                                <td className={`px-4 py-3 text-right tabular-nums font-medium ${c.roas > 1 ? 'text-green-700' : c.roas > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                                                    {c.roas > 0 ? `${c.roas.toFixed(2)}x` : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            ) : null}
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────
export default function AdReportPage() {
    const [showConfig, setShowConfig] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ad Performance</h1>
                    <p className="text-sm text-gray-500 mt-1">Monitor your Meta (Facebook) ad campaigns in real-time.</p>
                </div>
                <button
                    onClick={() => setShowConfig(true)}
                    className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                    Settings
                </button>
            </div>

            <ConfigModal isOpen={showConfig} onClose={() => setShowConfig(false)} />
            <InsightsDashboard />
        </div>
    );
}
