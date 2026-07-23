'use client';

import React, { createContext, useContext } from 'react';
import { IProduct } from '@/types';

interface ComparisonContextType {
    comparisonList: IProduct[];
    addToComparison: (product: IProduct) => void;
    removeFromComparison: (productId: string) => void;
    isInComparison: (productId: string) => boolean;
    clearComparison: () => void;
}
import { RootState } from '@/redux/store';
import {
    addToComparison as addToComparisonAction,
    removeFromComparison as removeFromComparisonAction,
    clearComparison as clearComparisonAction
} from '@/redux/features/comparison/comparisonSlice';

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

import { useDispatch, useSelector } from 'react-redux';

export const ComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const dispatch = useDispatch();
    const comparisonList = useSelector((state: RootState) => state.comparison.items);

    const addToComparison = (product: IProduct) => {
        if (comparisonList.length >= 4) {
            alert('You can only compare up to 4 products at a time.');
            return;
        }
        dispatch(addToComparisonAction(product));
    };

    const removeFromComparison = (productId: string) => {
        dispatch(removeFromComparisonAction(productId));
    };

    const isInComparison = (productId: string) => comparisonList.some(p => p._id === productId);

    const clearComparison = () => dispatch(clearComparisonAction());

    return (
        <ComparisonContext.Provider value={{ comparisonList, addToComparison, removeFromComparison, isInComparison, clearComparison }}>
            {children}
        </ComparisonContext.Provider>
    );
};

export const useComparison = () => {
    const context = useContext(ComparisonContext);
    if (context === undefined) {
        throw new Error('useComparison must be used within a ComparisonProvider');
    }
    return context;
};
