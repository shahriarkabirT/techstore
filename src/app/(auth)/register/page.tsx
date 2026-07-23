'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function RegisterPage() {
    const { signup, verifyOtp } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState('register'); // 'register' or 'verify'
    const [otp, setOtp] = useState('');
    const [otpPreference, setOtpPreference] = useState<'email' | 'sms'>('email');
    const [settings, setSettings] = useState({ emailOtpEnabled: true, smsOtpEnabled: false });

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings/otp');
                const data = await res.json();
                if (data.success) {
                    setSettings({
                        emailOtpEnabled: data.emailOtpEnabled,
                        smsOtpEnabled: data.smsOtpEnabled
                    });
                    // Default to SMS if email is disabled
                    if (!data.emailOtpEnabled && data.smsOtpEnabled) {
                        setOtpPreference('sms');
                    }
                }
            } catch (error) {
                console.error('Failed to fetch OTP settings');
            }
        };
        fetchSettings();
    }, []);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            const result = await signup({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                address: formData.address,
                otpPreference: otpPreference
            });

            if (result.success) {
                toast.success(result.message || 'OTP sent successfully');
                setStep('verify');
            } else {
                toast.error(result.message || 'Something went wrong');
            }
        } catch (error: any) {
            toast.error(error?.data?.message || error?.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await verifyOtp(formData.email, otp);
            if (result.success) {
                toast.success('Account verified and created!');
            } else {
                toast.error(result.message || 'Invalid verification code');
            }
        } catch (error: any) {
            toast.error(error?.data?.message || error?.message || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/resend-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-black text-gray-900 tracking-tight">
                        {step === 'register' ? 'Create Account' : 'Verify Identity'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {step === 'register' ? 'Join us to start shopping' : `Enter the 6-digit code sent to your ${otpPreference === 'sms' ? 'phone' : 'email'}`}
                    </p>
                </div>

                <div className="mt-8">
                    <a
                        href="/api/auth/google"
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Continue with Google
                    </a>

                    <div className="relative mt-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-400 font-bold uppercase tracking-wider text-xs">Or continue with email</span>
                        </div>
                    </div>
                </div>

                {step === 'register' ? (
                    <form className="mt-0 space-y-6" onSubmit={handleSignup}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="sr-only">Full Name</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm font-medium"
                                    placeholder="Full Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label htmlFor="email-address" className="sr-only">Email address</label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm font-medium"
                                    placeholder="Email address"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label htmlFor="phone" className="sr-only">Phone Number</label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        required
                                        className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm font-medium"
                                        placeholder="Phone Number (e.g. 017...)"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="address" className="sr-only">Address</label>
                                    <textarea
                                        id="address"
                                        name="address"
                                        required
                                        rows={2}
                                        className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm font-medium"
                                        placeholder="Full Address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* OTP Preference Selection */}
                            {settings.emailOtpEnabled && settings.smsOtpEnabled && (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">Verification Method</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setOtpPreference('email')}
                                            className={`py-2 px-4 rounded-xl border text-sm font-bold transition-all ${otpPreference === 'email' ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200'}`}
                                        >
                                            Email
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setOtpPreference('sms')}
                                            className={`py-2 px-4 rounded-xl border text-sm font-bold transition-all ${otpPreference === 'sms' ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200'}`}
                                        >
                                            SMS
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label htmlFor="password" className="sr-only">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm font-medium"
                                    placeholder="Password (min. 6 chars)"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
                                <input
                                    id="confirm-password"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm font-medium"
                                    placeholder="Confirm Password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>


                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all shadow-lg shadow-gray-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </span>
                                ) : 'Create Account'}
                            </button>
                        </div>

                        <div className="flex items-center justify-center">
                            <div className="text-sm">
                                <span className="text-gray-500">Already have an account? </span>
                                <Link href="/login" className="font-bold text-primary hover:text-gray-900 transition-colors">
                                    Sign in
                                </Link>
                            </div>
                        </div>
                    </form>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleVerify}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="otp" className="sr-only">Verification Code</label>
                                <input
                                    id="otp"
                                    name="otp"
                                    type="text"
                                    maxLength={6}
                                    required
                                    className="appearance-none rounded-xl relative block w-full px-4 py-4 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-center text-3xl font-bold tracking-widest"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                />
                            </div>
                        </div>


                        <div className="space-y-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all shadow-lg shadow-gray-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Verifying...' : 'Verify & Sign Up'}
                            </button>

                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={isLoading}
                                className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                Didn&apos;t receive code? <span className="text-primary font-bold">Resend</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep('register')}
                                className="w-full text-center text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                Back to Registration
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
