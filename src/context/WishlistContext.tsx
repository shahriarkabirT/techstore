'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface WishlistContextType {
    wishlist: string[];
    addToWishlist: (productId: string) => void;
    removeFromWishlist: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;
    wishlistCount: number;
}
import { RootState } from '@/redux/store';
import { setWishlist, addToWishlist as addToWishlistAction, removeFromWishlist as removeFromWishlistAction } from '@/redux/features/wishlist/wishlistSlice';
import { useGetWishlistQuery, useToggleWishlistMutation } from '@/redux/features/wishlist/wishlistApi';

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

import { useDispatch, useSelector } from 'react-redux';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const dispatch = useDispatch();
    const { user, isLoading: isAuthLoading } = useAuth();
    const wishlist = useSelector((state: RootState) => state.wishlist.items);

    const { data: apiData } = useGetWishlistQuery(undefined, {
        skip: isAuthLoading || !user,
    });

    const [toggleWishlistMutation] = useToggleWishlistMutation();

    // Sync from API (for logged-in users)
    useEffect(() => {
        if (apiData?.success) {
            dispatch(setWishlist(apiData.wishlist));
        }
    }, [apiData, dispatch]);

    const addToWishlist = async (productId: string) => {
        if (!wishlist.includes(productId)) {
            dispatch(addToWishlistAction(productId));
            if (user) {
                try {
                    await toggleWishlistMutation(productId).unwrap();
                } catch (e) {
                    console.error('Failed to add to wishlist api', e);
                }
            }
        }
    };

    const removeFromWishlist = async (productId: string) => {
        if (wishlist.includes(productId)) {
            dispatch(removeFromWishlistAction(productId));
            if (user) {
                try {
                    await toggleWishlistMutation(productId).unwrap();
                } catch (e) {
                    console.error('Failed to remove from wishlist api', e);
                }
            }
        }
    };

    const isInWishlist = (productId: string) => wishlist.includes(productId);

    return (
        <WishlistContext.Provider
            value={{
                wishlist,
                addToWishlist,
                removeFromWishlist,
                isInWishlist,
                wishlistCount: wishlist.length,
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};
