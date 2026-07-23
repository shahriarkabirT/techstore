'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useGetVariantOptionsQuery } from '@/redux/features/variantOption/variantOptionApi';

interface GlobalOptions {
    sizes: any[];
    colors: any[];
    materials: any[];
}

interface OptionsContextType {
    globalOptions: GlobalOptions | undefined;
    isLoading: boolean;
}

const OptionsContext = createContext<OptionsContextType>({
    globalOptions: undefined,
    isLoading: true,
});

export function OptionsProvider({ children }: { children: ReactNode }) {
    const { data: reduxOptions, isLoading } = useGetVariantOptionsQuery();

    const globalOptions = reduxOptions ? {
        sizes: (reduxOptions as any).sizes || [],
        colors: (reduxOptions as any).colors || [],
        materials: (reduxOptions as any).materials || []
    } : undefined;

    return (
        <OptionsContext.Provider value={{ globalOptions, isLoading }}>
            {children}
        </OptionsContext.Provider>
    );
}

export function useGlobalOptions() {
    return useContext(OptionsContext);
}
