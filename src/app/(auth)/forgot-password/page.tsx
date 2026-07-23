'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [step, setStep] = useState('request'); // 'request', 'verify'
    const [identifier, setIdentifier] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otpPreference, setOtpPreference] = useState<'email' | 'sms'>('email');
    const [settings, setSettings] = useState({ emailOtpEnabled: true, smsOtpEnabled: false });

    const [resendTimer, setResendTimer] = useState(0);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (resendTimer > 0) {
            timer = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [resendTimer]);

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

    const handleResendCode = async () => {
        if (isLoading || resendTimer > 0) return;

        // Use the same request event logic explicitly
        // Create a synthetic event or just call the logic
        // Easier to just duplicate the fetch part or extract it.
        // Extracting common logic is better, but for now I will inline the fetch to avoid refactoring the event handler heavily.

        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, otpPreference }),
            });
            const data = await res.json();
            if (data.success) {
                setMessage('A new code has been sent!');
                setResendTimer(60); // Start 60s cooldown
            } else {
                setError(data.message || 'Something went wrong');
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, otpPreference }),
            });
            const data = await res.json();
            if (data.success) {
                setStep('verify');
                setMessage(data.message);
                setResendTimer(60); // Start timer on first success
            } else {
                setError(data.message || 'Something went wrong');
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, otp, newPassword }),
            });
            const data = await res.json();
            if (data.success) {
                setMessage(data.message);
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } else {
                setError(data.message || 'Invalid or expired code');
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-black text-gray-900 tracking-tight">
                        {step === 'request' ? 'Reset Password' : 'Enter Reset Code'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {step === 'request'
                            ? 'Enter your email to receive a password reset code'
                            : `Enter the code sent to your ${otpPreference === 'sms' ? 'phone' : 'email'}`}
                    </p>
                </div>

                {message && !error && (
                    <div className="text-green-600 text-sm text-center font-bold bg-green-50 py-3 px-4 rounded-lg border border-green-100 animate-pulse">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="text-red-500 text-sm text-center font-bold bg-red-50 py-3 px-4 rounded-lg border border-red-100">
                        {error}
                    </div>
                )}

                {step === 'request' ? (
                    <form className="mt-8 space-y-6" onSubmit={handleRequestReset}>
                        <div className="space-y-6">

                            {/* OTP Preference Selection - Moved to Top */}
                            {settings.emailOtpEnabled && settings.smsOtpEnabled && (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">Send recovery code via</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setOtpPreference('email')}
                                            className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${otpPreference === 'email' ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200'}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                            </svg>
                                            Email
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setOtpPreference('sms')}
                                            className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${otpPreference === 'sms' ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200'}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                                            </svg>
                                            SMS
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label htmlFor="identifier" className="block text-sm font-bold text-gray-700 mb-2">
                                    {otpPreference === 'email' ? 'Email Address' : 'Phone Number'}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        {otpPreference === 'email' ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                                            </svg>
                                        )}
                                    </div>
                                    <input
                                        id="identifier"
                                        name="identifier"
                                        type={otpPreference === 'email' ? 'email' : 'tel'}
                                        required
                                        className="appearance-none rounded-xl block w-full pl-10 pr-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm font-medium"
                                        placeholder={otpPreference === 'email' ? 'name@example.com' : '+1 (555) 000-0000'}
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all shadow-lg shadow-gray-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Sending...' : 'Send Reset Code'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
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
                            <div>
                                <label htmlFor="new-password" className="sr-only">New Password</label>
                                <input
                                    id="new-password"
                                    name="newPassword"
                                    type="password"
                                    required
                                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm font-medium"
                                    placeholder="New Password (min. 6 chars)"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="confirm-password" className="sr-only">Confirm New Password</label>
                                <input
                                    id="confirm-password"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm font-medium"
                                    placeholder="Confirm New Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all shadow-lg shadow-gray-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Updating...' : 'Reset Password'}
                            </button>

                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={isLoading || resendTimer > 0}
                                className="w-full py-3 px-4 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Code'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="flex items-center justify-center">
                    <div className="text-sm">
                        <Link href="/login" className="font-bold text-gray-400 hover:text-gray-900 transition-colors">
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
