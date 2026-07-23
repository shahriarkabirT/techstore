'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { setUser, clearAuth } from '@/redux/features/auth/authSlice';
import {
    useGetMeQuery,
    useLoginMutation,
    useSignupMutation,
    useVerifyOtpMutation,
    useLogoutMutation
} from '@/redux/features/auth/authApi';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string;
    permissions?: string[];
    phone?: string;
    bio?: string;
    gender?: 'male' | 'female' | 'other' | '';
    dateOfBirth?: string | Date;
    provider?: 'local' | 'google' | 'facebook';
    hasPassword?: boolean;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    addressBook?: {
        name: string;
        phone: string;
        address: string;
        city: string;
        isDefault: boolean;
    }[];
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (credentials: any) => Promise<any>;
    signup: (data: any) => Promise<any>;
    verifyOtp: (email: string, otp: string, method?: 'email' | 'sms') => Promise<any>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const dispatch = useDispatch();
    const router = useRouter();
    const pathname = usePathname();

    const reduxUser = useSelector((state: RootState) => state.auth.user);
    const { data: meData, isLoading: isQueryLoading, refetch: refreshUser } = useGetMeQuery();

    // Derive user from query response directly to avoid the gap
    // between query completing and Redux dispatch in useEffect
    const queryUser = meData?.success ? meData.user : null;
    const user = reduxUser || queryUser;
    const isLoading = isQueryLoading;

    const [loginMutation] = useLoginMutation();
    const [signupMutation] = useSignupMutation();
    const [verifyOtpMutation] = useVerifyOtpMutation();
    const [logoutMutation] = useLogoutMutation();

    useEffect(() => {
        if (meData?.success) {
            dispatch(setUser(meData.user));
        } else if (meData && !meData.success) {
            // Session is dead (refresh token expired or invalid).
            // Clear Redux state and cookies, then redirect to login.
            dispatch(clearAuth());
            // Only redirect if not already on a public/auth page
            const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-otp'];
            const isPublicPath = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
            if (!isPublicPath) {
                // Clear server-side cookies via logout endpoint (fire & forget)
                fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
                router.push('/login');
            }
        }
    }, [meData, dispatch, router, pathname]);

    const login = async (credentials: any) => {
        const res = await loginMutation(credentials).unwrap();
        if (res.success) {
            dispatch(setUser(res.user));
            if (res.user.role === 'admin' || res.user.role === 'moderator') {
                router.push('/admin/dashboard');
            } else {
                router.push('/');
            }
        }
        return res;
    };

    const signup = async (userData: any) => {
        return await signupMutation(userData).unwrap();
    };

    const verifyOtp = async (email: string, otp: string, method: 'email' | 'sms' = 'email') => {
        const res = await verifyOtpMutation({ email, otp, method }).unwrap();
        if (res.success) {
            dispatch(setUser(res.user));
            if (res.user.role === 'admin' || res.user.role === 'moderator') {
                router.push('/admin/dashboard');
            } else {
                router.push('/');
            }
        }
        return res;
    };

    const logout = async () => {
        await logoutMutation().unwrap();
        dispatch(clearAuth());
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            login,
            signup,
            verifyOtp,
            logout,
            refreshUser: async () => { await refreshUser(); }
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
