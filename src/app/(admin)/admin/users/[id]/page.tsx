'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { PERMISSIONS } from '@/constants/permissions';

export default function AdminUserDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params); // Unwrap params
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [role, setRole] = useState('');
    const [permissions, setPermissions] = useState<string[]>([]);

    // Use centralized permissions config
    const availablePermissions = PERMISSIONS.map(p => ({ key: p.key, label: p.label }));

    // Normalize legacy path-based permissions ('/admin/products') to new key format ('products')
    const normalizePermissions = (perms: string[]): string[] => {
        return perms.map(p => {
            if (p.startsWith('/admin/')) {
                return p.replace('/admin/', '');
            }
            return p;
        }).filter(p => availablePermissions.some(ap => ap.key === p));
    };

    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteUser = async () => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/admin/users/${params.id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            
            if (data.success) {
                toast.success('User deleted successfully');
                router.push('/admin/users');
            } else {
                toast.error(data.message || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('An error occurred');
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        const fetchUser = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/admin/users/${params.id}`);
                const data = await res.json();
                if (data.success) {
                    setUser(data.user);
                    setRole(data.user.role);
                    setPermissions(normalizePermissions(data.user.permissions || []));
                } else {
                    toast.error(data.message || 'Failed to fetch user');
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                toast.error('An error occurred');
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, [params.id]);

    const handleUpdateRole = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/users/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role, permissions }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('User updated successfully');
                setUser({ ...user, role, permissions });
                setIsEditing(false); // Switch back to view mode
                router.refresh();
            } else {
                toast.error(data.message || 'Failed to update role');
            }
        } catch (error) {
            console.error('Error updating role:', error);
            toast.error('An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="text-gray-500">User not found</div>
                <Link href="/admin/users" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    Back to Users
                </Link>
            </div>
        );
    }

    const getRoleBadge = (userRole: string) => {
        switch (userRole) {
            case 'admin':
                return <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-700 rounded-full border border-amber-200">Administrator</span>;
            case 'moderator':
                return <span className="px-2.5 py-1 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">Moderator</span>;
            default:
                return <span className="px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-700 rounded-full border border-slate-200">Customer</span>;
        }
    };

    return (
        <div className="max-w-full mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2.5 bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-xl transition-all shadow-sm group cursor-pointer"
                    >
                        <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                        <p className="text-sm text-gray-500">Manage user profiles, permissions, and account status</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {getRoleBadge(user.role)}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column - Main Info */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Primary Info Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-8">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                            <div className="relative group">
                                <div className="h-32 w-32 rounded-3xl overflow-hidden ring-4 ring-gray-50 shadow-inner bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 duration-300">
                                    {user.image ? (
                                        <Image className="h-full w-full object-cover" src={user.image} alt={user.name} width={128} height={128} />
                                    ) : (
                                        <div className="text-gray-400 font-bold text-4xl uppercase">
                                            {user.name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-green-500 border-4 border-white h-6 w-6 rounded-full shadow-sm"></div>
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h2>
                                    <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap text-gray-500">
                                        <span className="text-sm font-medium">{user.email}</span>
                                        {user.isEmailVerified && (
                                            <div className="group relative flex items-center">
                                                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                    Verified: {user.emailVerified ? new Date(user.emailVerified).toLocaleDateString() : 'N/A'}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4 pt-6 border-t border-gray-50">
                                    <div className="space-y-1">
                                        <span className="block text-[10px] uppercase font-semibold tracking-wider text-gray-400">Phone Number</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-gray-700">{user.phone || '—'}</span>
                                            {user.isPhoneVerified && (
                                                <div className="group relative flex items-center">
                                                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                        Verified: {user.phoneVerified ? new Date(user.phoneVerified).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="block text-[10px] uppercase font-semibold tracking-wider text-gray-400">Auth Method</span>
                                        <span className="text-sm font-bold text-gray-700 capitalize flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            {user.provider || 'local'}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="block text-[10px] uppercase font-semibold tracking-wider text-gray-400">Member Since</span>
                                        <span className="text-sm font-bold text-gray-700">{new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                    <div className="space-y-1 col-span-2 md:col-span-1">
                                        <span className="block text-[10px] uppercase font-semibold tracking-wider text-gray-400">Internal ID</span>
                                        <span className="text-[10px] font-mono p-1 bg-gray-50 text-gray-400 rounded border border-gray-100 block truncate">{user._id}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Addresses Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Address Book</h3>
                        </div>

                        {user.addressBook && user.addressBook.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {user.addressBook.map((addr: any, idx: number) => (
                                    <div key={idx} className={`relative p-5 rounded-2xl border transition-all duration-300 ${addr.isDefault ? 'border-blue-200 bg-blue-50/50 shadow-blue-50 shadow-lg' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-sm font-bold text-gray-900">{addr.name}</span>
                                            {addr.isDefault && (
                                                <span className="text-[10px] uppercase font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full ring-4 ring-blue-100">Primary</span>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-gray-400 flex items-center gap-2">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                {addr.phone}
                                            </p>
                                            <p className="text-sm font-medium text-gray-600 leading-relaxed">
                                                {addr.address}, {addr.city}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <p className="text-sm text-gray-400 font-medium">No registered addresses found for this account.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Actions */}
                <div className="lg:col-span-4 space-y-8">
                    <div className={`bg-white rounded-2xl border transition-all duration-500 shadow-sm overflow-hidden ${isEditing ? 'border-blue-200 ring-4 ring-blue-50' : 'border-gray-100'}`}>
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-lg font-bold text-gray-900">Access Control</h3>
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-[10px] uppercase font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                    >
                                        Modify
                                    </button>
                                )}
                            </div>

                            {!isEditing ? (
                                <div className="space-y-8">
                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                        <span className="block text-[10px] uppercase font-semibold tracking-wider text-gray-400 mb-3">Current Role</span>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl border ${user.role === 'admin' ? 'bg-amber-100 text-amber-600 border-amber-200' : user.role === 'moderator' ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                {user.role === 'admin' ? (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                )}
                                            </div>
                                            <span className="font-bold text-gray-800 capitalize">{user.role}</span>
                                        </div>
                                    </div>

                                    {user.role === 'moderator' && (
                                        <div>
                                            <span className="block text-[10px] uppercase font-semibold tracking-wider text-gray-400 mb-4">Active Permissions</span>
                                            <div className="flex flex-wrap gap-2">
                                                {user.permissions && user.permissions.length > 0 ? (
                                                    user.permissions.map((p: string) => (
                                                        <span key={p} className="text-[10px] font-bold px-2.5 py-1 bg-white border border-gray-200 text-gray-600 rounded-lg shadow-sm">
                                                            {availablePermissions.find(ap => ap.key === p)?.label || p}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-gray-400 italic">No permissions assigned</span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 text-center">
                                        <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                                            {user.role === 'admin'
                                                ? 'Administrator access grants full control over products, orders, users, and system settings.'
                                                : user.role === 'moderator'
                                                    ? 'Moderators can only access the specific dashboard features highlighted above.'
                                                    : 'General customer account with standard shopping capabilities and profile management.'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in duration-500">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Role</label>
                                        <div className="relative">
                                            <select
                                                value={role}
                                                onChange={(e) => setRole(e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="user">Standard User</option>
                                                <option value="moderator">Moderator</option>
                                                <option value="admin">Administrator</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {role === 'moderator' && (
                                        <div className="space-y-4">
                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Grant Permissions</label>
                                            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                                {availablePermissions.map((perm) => (
                                                    <label
                                                        key={perm.key}
                                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${permissions.includes(perm.key)
                                                            ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                                                            : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={permissions.includes(perm.key)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setPermissions([...permissions, perm.key]);
                                                                } else {
                                                                    setPermissions(permissions.filter((p) => p !== perm.key));
                                                                }
                                                            }}
                                                            className="hidden"
                                                        />
                                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${permissions.includes(perm.key) ? 'bg-blue-600 border-blue-600' : 'border-gray-200 bg-white'
                                                            }`}>
                                                            {permissions.includes(perm.key) && (
                                                                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-bold">{perm.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-3 pt-4">
                                        <button
                                            onClick={handleUpdateRole}
                                            disabled={isSaving}
                                            className="w-full h-12 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-gray-200 cursor-pointer"
                                        >
                                            {isSaving ? 'Processing...' : 'Apply Changes'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setRole(user.role);
                                                setPermissions(normalizePermissions(user.permissions || []));
                                            }}
                                            className="w-full py-3 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors cursor-pointer hover:bg-gray-50 rounded-2xl"
                                        >
                                            Discard
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-rose-50 rounded-2xl border border-rose-100 p-8">
                        <h4 className="text-sm font-bold text-rose-700 uppercase tracking-wider mb-4">Danger Zone</h4>
                        <p className="text-xs font-medium text-rose-600 mb-6 leading-relaxed">
                            Deleting this account is permanent. This will remove all associated addresses, orders, and profile data.
                        </p>
                        <button 
                            onClick={handleDeleteUser}
                            disabled={isDeleting}
                            className="w-full py-3 bg-white border border-rose-200 text-rose-600 text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-rose-600 hover:text-white hover:border-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
                        >
                            {isDeleting ? 'Terminating...' : 'Terminate Account'}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e5e7eb;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #d1d5db;
                }
            `}</style>
        </div>
    );
}
