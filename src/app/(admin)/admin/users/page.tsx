'use client';

import { useState } from 'react';
import UserTable from '@/components/admin/users/UserTable';
import { useGetAdminUsersQuery } from '@/redux/features/user/userApi';
import { useDebounce } from '@/hooks/useDebounce';

export default function AdminUsersPage() {
    const [page, setPage] = useState(1);
    const [roleFilter, setRoleFilter] = useState('');
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 400);

    const { data, isLoading } = useGetAdminUsersQuery({
        page,
        role: roleFilter,
        search: debouncedSearch,
    });

    const users = data?.users || [];
    const pagination = data?.pagination || { total: 0, pages: 1 };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Users</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage registered users ({pagination.total})</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <input
                        type="text"
                        placeholder="Search name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all min-w-[200px] shadow-sm"
                    />
                    <select
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                        className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer min-w-[120px] shadow-sm hover:border-gray-400"
                    >
                        <option value="">All Roles</option>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>

            <UserTable
                users={users}
                isLoading={isLoading}
                formatDate={formatDate}
            />

            {pagination.pages > 1 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-6">
                    <div className="px-6 py-4 flex items-center justify-between bg-gray-50">
                        <span className="text-sm text-gray-500">
                            Page {page} of {pagination.pages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(page - 1)}
                                disabled={page <= 1}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(page + 1)}
                                disabled={page >= pagination.pages}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
