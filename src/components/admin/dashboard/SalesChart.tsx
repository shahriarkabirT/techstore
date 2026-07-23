'use client';

import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0,
        }).format(price);
    };

    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-lg">
                <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
                <p className="text-sm text-blue-600 font-bold">
                    Revenue: {formatPrice(payload[0].value)}
                </p>
                <p className="text-xs text-gray-500">
                    Orders: {payload[0].payload.count}
                </p>
            </div>
        );
    }
    return null;
};

export const SalesChart = ({ data }: { data: any[] }) => {

    return (
        <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6 md:mb-8">
                <div>
                    <h3 className="text-base md:text-lg font-black text-gray-900 tracking-tight">Revenue Over Time</h3>
                    <p className="text-[10px] md:text-sm text-gray-400 font-medium lowercase tracking-wide">Sales performance and order density</p>
                </div>
            </div>

            <div className="h-[250px] md:h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            minTickGap={30}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            tickFormatter={(value) => `৳${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
