'use client';

import React from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingBag,
    Users,
    LineChart,
    Clock,
    CheckCircle
} from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    growth?: number;
    icon: React.ReactNode;
    subtitle?: React.ReactNode;
    color: string;
}

const StatCard = ({ title, value, growth, icon, subtitle, color }: StatCardProps) => (
    <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
        <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</p>
                <div className="flex items-baseline gap-2 mt-2">
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 truncate">{value}</h3>
                </div>
            </div>
            <div className="flex-shrink-0 text-gray-400">
                {icon}
            </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            {growth !== undefined && (
                <div className={`flex items-center text-xs font-bold ${growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {growth >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                    {Math.abs(growth).toFixed(1)}%
                    <span className="text-gray-400 font-normal ml-1">vs last period</span>
                </div>
            )}
            {subtitle && <div className="text-[10px] md:text-xs font-medium text-gray-500">{subtitle}</div>}
        </div>
    </div>
);

export const DashboardStats = ({ data }: { data: any }) => {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0,
        }).format(price);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="Total Revenue"
                value={formatPrice(data.revenue.value)}
                growth={data.revenue.growth}
                icon={<DollarSign className="text-green-600" />}
                color="bg-green-600"
            />
            <StatCard
                title="Total Orders"
                value={data.orders.value}
                growth={data.orders.growth}
                icon={<ShoppingBag className="text-blue-600" />}
                color="bg-blue-600"
                subtitle={
                    <div className="flex gap-2">
                        <span className="flex items-center text-green-600"><CheckCircle size={12} className="mr-1" />{data.orders.paid} Paid</span>
                        <span className="flex items-center text-yellow-600"><Clock size={12} className="mr-1" />{data.orders.pending} Pending</span>
                    </div>
                }
            />
            <StatCard
                title="Avg. Order Value"
                value={formatPrice(data.aov.value)}
                growth={data.aov.growth}
                icon={<LineChart className="text-purple-600" />}
                color="bg-purple-600"
            />
            <StatCard
                title="Total Customers"
                value={data.users.value}
                growth={data.users.growth}
                icon={<Users className="text-orange-600" />}
                color="bg-orange-600"
                subtitle={`${data.users.newUsers} new registrations`}
            />
        </div>
    );
};
