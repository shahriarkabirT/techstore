import { describe, it, expect, beforeEach, vi } from 'vitest';
import cartReducer, {
    setCart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    initGuestCart
} from '@/redux/features/cart/cartSlice';
import { CartItem, CartState } from '@/types';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });
Object.defineProperty(global, 'window', { value: { localStorage: localStorageMock } });

describe('Cart Slice (src/redux/features/cart/cartSlice.ts)', () => {
    const initialState: CartState = {
        items: [],
        isLoading: true,
    };

    const item1: CartItem = {
        productId: 'p1',
        title: 'Product 1',
        price: 100,
        originalPrice: 120,
        discount: 20,
        tax: 5,
        stock: 10,
        quantity: 1,
        image: 'img1.jpg',
    };

    const item1Variant: CartItem = {
        ...item1,
        variant: { size: 'M' },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
    });

    it('should return the initial state', () => {
        expect(cartReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle setCart', () => {
        const items = [item1];
        const actual = cartReducer(initialState, setCart(items));
        expect(actual.items).toEqual(items);
        expect(actual.isLoading).toBe(false);
    });

    describe('addItem', () => {
        it('should add a new item to an empty cart', () => {
            const actual = cartReducer(initialState, addItem(item1));
            expect(actual.items).toHaveLength(1);
            expect(actual.items[0]).toEqual(item1);
            expect(localStorageMock.setItem).toHaveBeenCalled();
        });

        it('should increment quantity if same product and no variant exists', () => {
            const stateWithItem = { ...initialState, items: [item1] };
            const actual = cartReducer(stateWithItem, addItem(item1));
            expect(actual.items).toHaveLength(1);
            expect(actual.items[0].quantity).toBe(2);
        });

        it('should add a new item if same product but different variant', () => {
            const stateWithItem = { ...initialState, items: [item1] };
            const actual = cartReducer(stateWithItem, addItem(item1Variant));
            expect(actual.items).toHaveLength(2);
        });

        it('should increment quantity if same product and same variant exists', () => {
            const stateWithVariant = { ...initialState, items: [item1Variant] };
            const actual = cartReducer(stateWithVariant, addItem(item1Variant));
            expect(actual.items).toHaveLength(1);
            expect(actual.items[0].quantity).toBe(2);
        });
    });

    describe('removeItem', () => {
        it('should remove item by productId and variant', () => {
            const state = { ...initialState, items: [item1, item1Variant] };

            // Remove the one with variant
            const actual1 = cartReducer(state, removeItem({ productId: 'p1', variant: { size: 'M' } }));
            expect(actual1.items).toHaveLength(1);
            expect(actual1.items[0].variant).toBeUndefined();

            // Remove the one without variant
            const actual2 = cartReducer(state, removeItem({ productId: 'p1' }));
            expect(actual2.items).toHaveLength(1);
            expect(actual2.items[0].variant).toEqual({ size: 'M' });
        });
    });

    describe('updateQuantity', () => {
        it('should update quantity of an existing item', () => {
            const state = { ...initialState, items: [item1] };
            const actual = cartReducer(state, updateQuantity({ productId: 'p1', quantity: 5 }));
            expect(actual.items[0].quantity).toBe(5);
            expect(localStorageMock.setItem).toHaveBeenCalled();
        });

        it('should update quantity of an item with variant', () => {
            const state = { ...initialState, items: [item1Variant] };
            const actual = cartReducer(state, updateQuantity({ productId: 'p1', variant: { size: 'M' }, quantity: 10 }));
            expect(actual.items[0].quantity).toBe(10);
        });
    });

    describe('clearCart', () => {
        it('should remove all items and clear localStorage', () => {
            const state = { ...initialState, items: [item1, item1Variant] };
            const actual = cartReducer(state, clearCart());
            expect(actual.items).toHaveLength(0);
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('cart');
        });
    });

    describe('initGuestCart', () => {
        it('should load cart from localStorage if it exists', () => {
            const savedCart = [item1];
            localStorageMock.setItem('cart', JSON.stringify(savedCart));

            const actual = cartReducer(initialState, initGuestCart());
            expect(actual.items).toEqual(savedCart);
            expect(actual.isLoading).toBe(false);
        });

        it('should set items to empty and isLoading to false if localStorage is empty', () => {
            const actual = cartReducer(initialState, initGuestCart());
            expect(actual.items).toHaveLength(0);
            expect(actual.isLoading).toBe(false);
        });

        it('should handle corrupted JSON in localStorage', () => {
            localStorageMock.setItem('cart', 'invalid-json');
            const actual = cartReducer(initialState, initGuestCart());
            expect(actual.items).toEqual([]);
            expect(actual.isLoading).toBe(false);
        });
    });
});
