'use client';

import { useState } from 'react';
import { useGetCustomersQuery } from '@/redux/features/user/userApi';
import { Mail, Calendar, Download, ChevronLeft, ChevronRight, Send, User, Phone, MapPin, Search, History } from 'lucide-react';
import BulkEmailModal from '@/components/admin/BulkEmailModal';
import CustomerOrderModal from '@/components/admin/CustomerOrderModal';

const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency: 'BDT',
        minimumFractionDigits: 0
    }).format(price);
};

export default function CustomersPage() {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const { data, isLoading } = useGetCustomersQuery({ page, limit: 20, search: searchQuery });

    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailTargets, setEmailTargets] = useState<string[] | 'all'>([]);
    
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<{ name: string; phone: string } | null>(null);

    const handleExport = () => {
        const customers = data?.customers || [];
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Name,Phone,Email,Total Orders,Total Spent,Last Order\n"
            + customers.map(c => `${c.name},${c.phone},${c.email || '-'},${c.totalOrders},${c.totalSpent},${c.lastOrderDate}`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "customer_database.csv");
        document.body.appendChild(link);
        link.click();
    };

    const openHistory = (customer: any) => {
        setSelectedCustomer({ name: customer.name, phone: customer.phone });
        setIsHistoryModalOpen(true);
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500 italic">Loading customer database...</div>;

    const customers = data?.customers || [];
    const pagination = data?.pagination;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Customer Database</h1>
                    <p className="text-gray-500 text-sm italic">Aggregate customer data from order history</p>
                </div>
                <div className="hidden items-center gap-3">
                    <button
                        onClick={() => {
                            setEmailTargets('all');
                            setIsEmailModalOpen(true);
                        }}
                        className="flex items-center gap-2 bg-primary text-white border border-transparent px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        <Send className="w-5 h-5" />
                        Send Bulk Email
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <Download className="w-5 h-5" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by name, phone or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all italic shadow-sm"
                />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Orders</th>
                                <th className="px-6 py-4">Total Spent</th>
                                <th className="px-6 py-4">Last Order</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 italic">
                            {customers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                                        No customers found matching your criteria
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer) => (
                                    <tr 
                                        key={customer._id} 
                                        className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                                        onClick={() => openHistory(customer)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-100 rounded-lg text-gray-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <span className="font-bold text-gray-900 text-sm">{customer.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs text-gray-900 font-medium">
                                                    <Phone className="w-3 h-3 text-gray-400" />
                                                    {customer.phone}
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                                    <Mail className="w-3 h-3 text-gray-400" />
                                                    {customer.email || '-'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                                                {customer.totalOrders} Orders
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-gray-900">{formatPrice(customer.totalSpent)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3 h-3 text-gray-400" />
                                                {formatDate(customer.lastOrderDate)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openHistory(customer)}
                                                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                                    title="View Order History"
                                                >
                                                    <History className="w-4 h-4" />
                                                </button>
                                                {customer.email && (
                                                    <button
                                                        onClick={() => {
                                                            setEmailTargets([customer.email]);
                                                            setIsEmailModalOpen(true);
                                                        }}
                                                        className="hidden p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                                        title="Send Marketing Email"
                                                    >
                                                        <Send className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination && pagination.pages > 1 && (
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-sm text-gray-500 italic">
                            Showing <span className="font-bold">{customers.length}</span> of <span className="font-bold">{pagination.total}</span> unique customers
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="p-2 border border-gray-100 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-bold w-10 text-center py-2 bg-gray-50 rounded-lg">{page}</span>
                            <button
                                disabled={page === pagination.pages}
                                onClick={() => setPage(page + 1)}
                                className="p-2 border border-gray-100 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <BulkEmailModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                targetEmails={emailTargets}
            />

            <CustomerOrderModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                customer={selectedCustomer}
            />
        </div>
    );
}
