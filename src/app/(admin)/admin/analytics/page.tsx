'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function AnalyticsPage() {
    const [range, setRange] = useState('7d');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/admin/analytics?range=${range}`);
                const json = await res.json();
                if (json.success) {
                    setData(json);
                } else {
                    setError('Failed to fetch data');
                }
            } catch (err) {
                setError('Error fetching analytics');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [range]);

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Traffic Analytics</h1>
                    <p className="text-gray-500 text-sm mt-1">Monitor your website visitors and traffic sources</p>
                </div>
                
                <div className="bg-white p-1 rounded-lg border border-gray-200 inline-flex shadow-sm">
                    {['today', 'yesterday', '7d', '30d', 'all'].map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                range === r 
                                    ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : r.charAt(0).toUpperCase() + r.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
            ) : data && (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Visits</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{data.totalVisits.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Unique Visitors</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{data.uniqueVisitors.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Avg. Views/Visitor</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {data.uniqueVisitors > 0 ? (data.totalVisits / data.uniqueVisitors).toFixed(2) : '0'}
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Top Device</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2 capitalize">
                                {data.topDevices?.[0]?._id || 'N/A'}
                            </p>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Traffic Overview</h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.visitsByDate} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <RechartsTooltip 
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="visits" name="Total Visits" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorVisits)" />
                                    <Area type="monotone" dataKey="uniqueVisitors" name="Unique Visitors" stroke="#10b981" strokeWidth={2} fill="transparent" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Detailed Breakdowns */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Top Pages */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Top Pages</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                                        <tr>
                                            <th className="px-4 py-3 font-medium rounded-l-lg">Path</th>
                                            <th className="px-4 py-3 font-medium text-right rounded-r-lg">Views</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.topPages.map((page: any, i: number) => (
                                            <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-[200px]">{page._id}</td>
                                                <td className="px-4 py-3 text-right text-gray-600 font-medium">{page.count.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Top Countries & Devices */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Top Countries</h3>
                                <div className="space-y-4">
                                    {data.topCountries.map((country: any, i: number) => {
                                        const percentage = Math.round((country.count / data.totalVisits) * 100);
                                        return (
                                            <div key={i}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-medium text-gray-700">{country._id}</span>
                                                    <span className="text-gray-500">{country.count} ({percentage}%)</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Devices</h3>
                                <div className="space-y-4">
                                    {data.topDevices.map((device: any, i: number) => {
                                        const percentage = Math.round((device.count / data.totalVisits) * 100);
                                        return (
                                            <div key={i}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-medium text-gray-700 capitalize">{device._id}</span>
                                                    <span className="text-gray-500">{device.count}</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
