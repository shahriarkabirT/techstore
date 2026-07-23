'use client';

import { createContext, useContext, useEffect, useRef, ReactNode } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@/context/AuthContext';
import { CartItem, CartContextType, IProduct } from '@/types';
import { RootState } from '@/redux/store';
import {
    setCart,
    addItem,
    removeItem,
    updateQuantity as updateQuantityAction,
    clearCart as clearCartAction,
    initGuestCart
} from '@/redux/features/cart/cartSlice';
import { formatCurrency, calculateDiscountedPrice, isSameVariant } from '@/lib/utils';
import { useGetCartQuery, useSyncCartMutation } from '@/redux/features/cart/cartApi';

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
    children: ReactNode;
}


export function CartProvider({ children }: CartProviderProps) {
    const dispatch = useDispatch();
    const { user, isLoading: isAuthLoading } = useAuth();

    const items = useSelector((state: RootState) => state.cart.items);
    const isLoadingLocal = useSelector((state: RootState) => state.cart.isLoading);

    const { data: apiCartData, isLoading: isApiLoading } = useGetCartQuery(undefined, {
        skip: isAuthLoading || !user,
    });

    const [syncCart] = useSyncCartMutation();
    const initializedForUser = useRef<string | null | undefined>('__uninitialized__');

    // Init cart from localStorage (guest) or API (auth)
    useEffect(() => {
        if (!isAuthLoading) {
            const currentUserKey = user ? user.email : null;
            if (initializedForUser.current !== currentUserKey) {
                if (user) {
                    if (apiCartData?.success && apiCartData.cart) {
                        dispatch(setCart(apiCartData.cart));
                        initializedForUser.current = currentUserKey;
                    }
                } else {
                    dispatch(initGuestCart());
                    initializedForUser.current = currentUserKey;
                }
            }
        }
    }, [user, isAuthLoading, apiCartData, dispatch]);

    // Save cart to API on change (auth)
    useEffect(() => {
        if (!isAuthLoading && user && !isLoadingLocal) {
            // Debounce or just sync
            syncCart({ cart: items });
        }
    }, [items, user, isAuthLoading, isLoadingLocal, syncCart]);

    const addToCart = (product: Partial<IProduct> & { _id?: string; productId?: string }, quantity: number = 1, variant?: Record<string, string>) => {
        // Find variant if provided to get its tax
        const currentVariant = variant && (product as IProduct).variants?.find(v => {
            const sizeMatch = !v.size || variant['Size'] === v.size;
            const colorMatch = !v.colorName || variant['Color'] === v.colorName;
            const materialMatch = !v.material || variant['Material'] === v.material;
            const ramMatch = !v.ram || variant['RAM'] === v.ram;
            const storageMatch = !v.storage || variant['Storage'] === v.storage;
            return sizeMatch && colorMatch && materialMatch && ramMatch && storageMatch;
        });

        const cartItem: CartItem = {
            productId: product._id || product.productId || '',
            title: product.title || '',
            price: product.discountedPrice || (product.mrp && product.discountValue ? calculateDiscountedPrice(product.mrp, product.discountValue, product.discountType) : product.price) || 0,
            originalPrice: product.mrp || product.price || 0,
            discount: product.discountValue || 0,
            discountType: product.discountType,
            tax: (currentVariant && currentVariant.tax !== undefined) ? currentVariant.tax : (product.tax || 0),
            taxType: (currentVariant && currentVariant.taxType) ? currentVariant.taxType : (product.taxType || 'percentage'),
            image: product.images?.[0] || '',
            quantity,
            stock: product.stock || 0,
            variant,
            freeShipping: product.freeShipping || false,
            isPreorder: (product as any).isPreorder || false,
        };
        console.log(cartItem);
        dispatch(addItem(cartItem));
    };

    const removeFromCart = (productId: string, variant?: Record<string, string>) => {
        dispatch(removeItem({ productId, variant }));
    };

    const updateQuantity = (productId: string, quantity: number, variant?: Record<string, string>) => {
        if (quantity <= 0) {
            removeFromCart(productId, variant);
        } else {
            dispatch(updateQuantityAction({ productId, quantity, variant }));
        }
    };

    const clearCart = () => {
        dispatch(clearCartAction());
    };

    const getTotal = (): number => {
        return items.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );
    };

    const getItemCount = (): number => {
        return items.reduce((count, item) => count + item.quantity, 0);
    };

    const isInCart = (productId: string, variant?: Record<string, string>): boolean => {
        return items.some((item) =>
            item.productId === productId &&
            isSameVariant(item.variant, variant)
        );
    };

    return (
        <CartContext.Provider
            value={{
                items,
                isLoading: isLoadingLocal || (user ? isApiLoading : false),
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                getTotal,
                getItemCount,
                isInCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}


export function useCart(): CartContextType {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
