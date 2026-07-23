'use client';

import Link from 'next/link';
import Image from 'next/image';

interface UserTableProps {
    users: any[];
    isLoading: boolean;
    formatDate: (date: string) => string;
}

export default function UserTable({
    users,
    isLoading,
    formatDate
}: UserTableProps) {
    return (
        <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User Info</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Join Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : users.length > 0 ? (
                                users.map((user: any) => (
                                    <tr key={user._id} className="hover:bg-gray-50 transition-colors bg-white group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0">
                                                    {user.image ? (
                                                        <Image className="h-10 w-10 rounded-full object-cover shadow-sm" src={user.image} alt="" width={40} height={40} />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shadow-sm">
                                                            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                                                    <div className="text-sm text-gray-500">{user.provider || 'local'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-700 font-medium">{user.email}</span>
                                                {user.phone && <span className="text-xs text-gray-500">{user.phone}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-600">
                                                {formatDate(user.createdAt)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <Link
                                                href={`/admin/users/${user._id}`}
                                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                                            >
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {isLoading ? (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 text-center text-sm text-gray-500">
                        Loading users...
                    </div>
                ) : users.length > 0 ? (
                    users.map((user: any) => (
                        <div key={user._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 flex-shrink-0">
                                    {user.image ? (
                                        <Image className="h-12 w-12 rounded-full object-cover shadow-sm border border-gray-100" src={user.image} alt="" width={48} height={48} />
                                    ) : (
                                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shadow-sm border border-gray-100">
                                            <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-gray-900 truncate">{user.name}</div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{user.provider || 'local'} login</div>
                                </div>
                                <span className={`px-3 py-1 text-[10px] font-bold rounded-full border uppercase tracking-widest ${user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                    {user.role}
                                </span>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] uppercase font-bold text-gray-400">Email</span>
                                    <span className="text-xs text-gray-700 font-medium">{user.email}</span>
                                </div>
                                {user.phone && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] uppercase font-bold text-gray-400">Phone</span>
                                        <span className="text-xs text-gray-700 font-medium">{user.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] uppercase font-bold text-gray-400">Joined</span>
                                    <span className="text-xs text-gray-500">{formatDate(user.createdAt)}</span>
                                </div>
                            </div>

                            <div className="pt-2">
                                <Link
                                    href={`/admin/users/${user._id}`}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-black text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-sm transition-all"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                    </svg>
                                    Edit Profile
                                </Link>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white p-12 rounded-xl border border-gray-200 text-center text-sm text-gray-500">
                        No users found.
                    </div>
                )}
            </div>
        </div>
    );
}
