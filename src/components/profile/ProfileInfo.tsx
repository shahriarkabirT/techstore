'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUpdateProfileMutation, useResendOtpMutation, useVerifyOtpMutation } from '@/redux/features/auth/authApi';
import { toast } from 'react-hot-toast';

interface FormData {
    name: string;
    phone: string;
    bio?: string;
    gender?: 'male' | 'female' | 'other' | '';
    dateOfBirth?: string;
}

export default function ProfileInfo() {
    const { user } = useAuth();
    const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
    const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();
    const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        name: user?.name || '',
        phone: user?.phone || '',
        bio: user?.bio || '',
        gender: user?.gender || '',
        dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    });

    const [otp, setOtp] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [verifyingMethod, setVerifyingMethod] = useState<'email' | 'sms'>('email');

    useEffect(() => {
        if (user && !isEditing) {
            const formattedDate = user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '';

            // eslint-disable-next-line
            setFormData(prev => {
                if (
                    prev.name === (user.name || '') &&
                    prev.phone === (user.phone || '') &&
                    prev.bio === (user.bio || '') &&
                    prev.gender === (user.gender || '') &&
                    prev.dateOfBirth === formattedDate
                ) {
                    return prev;
                }

                return {
                    name: user.name || '',
                    phone: user.phone || '',
                    bio: user.bio || '',
                    gender: user.gender || '',
                    dateOfBirth: formattedDate,
                };
            });
        }
    }, [user, isEditing]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateProfile(formData).unwrap();
            setIsEditing(false);
            toast.success('Profile updated successfully');
        } catch (error: any) {
            toast.error(error.data?.message || 'Update failed');
        }
    };

    const handleRequestOtp = async (method: 'email' | 'sms') => {
        if (method === 'sms' && formData.phone !== user?.phone) {
            toast.error('Please save your new phone number before verifying.');
            return;
        }

        try {
            await resendOtp({ email: user?.email || '', method }).unwrap();
            setVerifyingMethod(method);
            setShowOtpInput(true);
            toast.success(`Verification code sent to your ${method === 'sms' ? 'phone' : 'email'}`);
        } catch (error: any) {
            toast.error(error.data?.message || 'Failed to send OTP');
        }
    };

    const handleVerifyOtp = async () => {
        try {
            await verifyOtp({
                email: user?.email || '',
                otp,
                method: verifyingMethod
            }).unwrap();

            setShowOtpInput(false);
            setOtp('');
            toast.success('Verified successfully');
        } catch (error: any) {
            toast.error(error.data?.message || 'Invalid code');
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-full">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Account Settings</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your identity and security preferences.</p>
                </div>
                <div className="flex items-center gap-4">
                    {isEditing && (
                        <button
                            type="submit"
                            form="profile-form"
                            disabled={isUpdating}
                            className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-200 disabled:opacity-50"
                        >
                            {isUpdating ? 'Saving...' : 'Save'}
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (isEditing && user) {
                                // Reset changes
                                setFormData({
                                    name: user.name || '',
                                    phone: user.phone || '',
                                    bio: user.bio || '',
                                    gender: user.gender || '',
                                    dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
                                });
                            }
                            setIsEditing(!isEditing);
                        }}
                        className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                    >
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                    </button>
                </div>
            </div>

            <form id="profile-form" onSubmit={handleUpdateProfile} className="space-y-8">
                {/* Basic Information Card */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-2">Basic Information</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:bg-white rounded-xl px-5 py-3 text-sm font-bold text-gray-900 outline-none transition-all"
                                />
                            ) : (
                                <p className="px-5 py-3 text-sm font-bold text-gray-900 bg-gray-50/50 rounded-xl border border-gray-100">{formData.name || 'Not provided'}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mobile Number</label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:bg-white rounded-xl px-5 py-3 text-sm font-bold text-gray-900 outline-none transition-all"
                                    placeholder="Enter phone number"
                                />
                            ) : (
                                <p className="px-5 py-3 text-sm font-bold text-gray-900 bg-gray-50/50 rounded-xl border border-gray-100">{formData.phone || 'Not provided'}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bio</label>
                        {isEditing ? (
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:bg-white rounded-xl px-5 py-3 text-sm font-bold text-gray-900 outline-none transition-all resize-none h-24"
                                placeholder="Tell us a bit about yourself..."
                            />
                        ) : (
                            <p className="px-5 py-3 text-sm font-medium text-gray-700 bg-gray-50/50 rounded-xl border border-gray-100 min-h-[60px] whitespace-pre-wrap">{formData.bio || 'No bio provided.'}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gender</label>
                            {isEditing ? (
                                <div className="relative">
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                                        className="w-full bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:bg-white rounded-xl px-5 py-3 text-sm font-bold text-gray-900 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            ) : (
                                <p className="px-5 py-3 text-sm font-bold text-gray-900 bg-gray-50/50 rounded-xl border border-gray-100 capitalize">{formData.gender || 'Not provided'}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date of Birth</label>
                            {isEditing ? (
                                <input
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:bg-white rounded-xl px-5 py-3 text-sm font-bold text-gray-900 outline-none transition-all"
                                />
                            ) : (
                                <p className="px-5 py-3 text-sm font-bold text-gray-900 bg-gray-50/50 rounded-xl border border-gray-100">
                                    {formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not provided'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Verification Status Card */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                    <h2 className="text-base font-semibold text-gray-900">Verification Status</h2>

                    {/* Email Verification Card */}
                    <div className="space-y-4">
                        <div className={`flex items-center justify-between p-4 rounded-2xl border ${user.isEmailVerified ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${user.isEmailVerified ? 'bg-green-500' : 'bg-amber-500'} text-white`}>
                                    {user.isEmailVerified ? (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{user.email}</p>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${user.isEmailVerified ? 'text-green-600' : 'text-amber-600'}`}>
                                        Email {user.isEmailVerified ? 'Verified' : 'Unverified'}
                                    </p>
                                </div>
                            </div>
                            {!user.isEmailVerified && !showOtpInput && (
                                <button
                                    type="button"
                                    onClick={() => handleRequestOtp('email')}
                                    disabled={isResending}
                                    className="px-4 py-2 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-all"
                                >
                                    {isResending ? 'Sending...' : 'Verify Email'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Phone Verification Card */}
                    {user.phone && (
                        <div className="space-y-4">
                            <div className={`flex items-center justify-between p-4 rounded-2xl border ${user.isPhoneVerified ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${user.isPhoneVerified ? 'bg-green-500' : 'bg-amber-500'} text-white`}>
                                        {user.isPhoneVerified ? (
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 005.454 5.454l.774-1.548a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{user.phone}</p>
                                        <p className={`text-[10px] font-bold uppercase tracking-wider ${user.isPhoneVerified ? 'text-green-600' : 'text-amber-600'}`}>
                                            Phone {user.isPhoneVerified ? 'Verified' : 'Unverified'}
                                        </p>
                                    </div>
                                </div>
                                {!user.isPhoneVerified && !showOtpInput && (
                                    <button
                                        type="button"
                                        onClick={() => handleRequestOtp('sms')}
                                        disabled={isResending}
                                        className="px-4 py-2 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-all"
                                    >
                                        {isResending ? 'Sending...' : 'Verify Phone'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {showOtpInput && (
                        <div className="animate-in slide-in-from-top-2 space-y-3">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                                Enter code sent via {verifyingMethod === 'sms' ? 'SMS' : 'Email'}
                            </p>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="6-digit code"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-5 py-3 text-sm font-bold text-gray-900 outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={handleVerifyOtp}
                                    disabled={isVerifying || otp.length < 6}
                                    className="px-6 py-3 bg-gray-900 text-white text-xs font-bold uppercase rounded-xl disabled:opacity-50"
                                >
                                    {isVerifying ? 'Verifying...' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}
