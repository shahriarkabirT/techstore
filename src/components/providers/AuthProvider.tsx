'use client';

import { AuthProvider as CustomAuthProvider } from '@/context/AuthContext';
import { ReactNode } from 'react';

interface AuthProviderProps {
    children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
    return <CustomAuthProvider>{children}</CustomAuthProvider>;
}
