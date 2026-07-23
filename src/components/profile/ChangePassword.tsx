'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

export default function ChangePassword() {
    const { user, refreshUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    if (!user) return null;

    const hasPassword = !!user.hasPassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.newPassword.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();

            if (data.success) {
                toast.success(hasPassword ? 'Password changed successfully' : 'Password set successfully');
                setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setShowForm(false);
                // Refresh user data so hasPassword updates
                await refreshUser();
            } else {
                toast.error(data.message || 'Failed to change password');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowForm(false);
    };

    const EyeIcon = ({ show }: { show: boolean }) => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {show ? (
                <>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </>
            ) : (
                <>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </>
            )}
        </svg>
    );

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-semibold text-gray-900">Password & Security</h2>
                    <p className="text-xs text-gray-500 mt-1">
                        {hasPassword
                            ? 'Update your password to keep your account secure.'
                            : 'Set a password to secure your account and enable email login.'}
                    </p>
                </div>
                {!showForm && (
                    <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-200"
                    >
                        {hasPassword ? 'Change Password' : 'Set Password'}
                    </button>
                )}
            </div>

            {!showForm && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className={`p-2 rounded-lg text-white ${hasPassword ? 'bg-gray-900' : 'bg-amber-500'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">
                            {hasPassword ? 'Password Protected' : 'No Password Set'}
                        </p>
                        <p className="text-xs text-gray-500">
                            {hasPassword
                                ? 'Your account is secured with a password'
                                : `You signed in with ${user.provider === 'google' ? 'Google' : 'Facebook'}. Set a password to also login with email.`}
                        </p>
                    </div>
                </div>
            )}

            {showForm && (
                <form onSubmit={handleSubmit} className="space-y-5 animate-in slide-in-from-top-2">
                    {/* Current Password — only if user already has one */}
                    {hasPassword && (
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Current Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.current ? 'text' : 'password'}
                                    value={formData.currentPassword}
                                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                    required
                                    placeholder="Enter your current password"
                                    className="w-full bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:bg-white rounded-xl px-5 py-3 pr-12 text-sm font-bold text-gray-900 outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <EyeIcon show={showPasswords.current} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* New Password */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords.new ? 'text' : 'password'}
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                required
                                minLength={6}
                                placeholder="Min. 6 characters"
                                className="w-full bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:bg-white rounded-xl px-5 py-3 pr-12 text-sm font-bold text-gray-900 outline-none transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <EyeIcon show={showPasswords.new} />
                            </button>
                        </div>
                    </div>

                    {/* Confirm New Password */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords.confirm ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                                minLength={6}
                                placeholder="Re-enter new password"
                                className="w-full bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:bg-white rounded-xl px-5 py-3 pr-12 text-sm font-bold text-gray-900 outline-none transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <EyeIcon show={showPasswords.confirm} />
                            </button>
                        </div>
                    </div>

                    {/* Mismatch warning */}
                    {formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                        <p className="text-xs text-rose-500 font-bold flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Passwords do not match
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={isLoading || (hasPassword && !formData.currentPassword) || !formData.newPassword || !formData.confirmPassword}
                            className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Updating...' : (hasPassword ? 'Update Password' : 'Set Password')}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isLoading}
                            className="px-6 py-2.5 text-gray-500 text-[10px] font-bold uppercase tracking-widest hover:text-gray-900 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
