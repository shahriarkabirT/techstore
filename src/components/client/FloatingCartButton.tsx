'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';
import CartDrawer from './CartDrawer';

export default function FloatingCartButton() {
    const { getItemCount, getTotal } = useCart();
    const pathname = usePathname();
    const [isCartOpen, setIsCartOpen] = useState(false);

    const itemCount = getItemCount();
    const total = getTotal();

    // Hide on cart/checkout pages and when cart is empty
    const hiddenPaths = ['/cart', '/checkout', '/login', '/register'];
    if (hiddenPaths.some(p => pathname.startsWith(p)) || itemCount === 0) {
        return <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />;
    }

    return (
        <>
            <button
                onClick={() => setIsCartOpen(true)}
                className="flex fixed right-0 top-1/2 -translate-y-1/2 z-40 w-[70px] flex-col items-center rounded-l-md shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden bg-white pt-2"
                aria-label="Open cart"
            >
                {/* Top section — icon + items */}
                <div className="bg-primary rounded group-hover:bg-primary-dark transition-colors px-3 py-2.5 flex flex-col items-center gap-0.5">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5 text-white"
                    >
                        <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 0 0 4.25 22.5h15.5a1.875 1.875 0 0 0 1.865-2.071l-1.263-12a1.875 1.875 0 0 0-1.865-1.679H16.5V6a4.5 4.5 0 1 0-9 0ZM12 3a3 3 0 0 0-3 3v.75h6V6a3 3 0 0 0-3-3Zm-3 8.25a3 3 0 1 0 6 0v-.75a.75.75 0 0 1 1.5 0v.75a4.5 4.5 0 1 1-9 0v-.75a.75.75 0 0 1 1.5 0v.75Z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white text-[10px] font-bold whitespace-nowrap leading-none">
                        {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
                    </span>
                </div>

                {/* Bottom section — price */}
                <div className="bg-white px-2.5 py-1.5 w-full flex items-center justify-center">
                    <span className="text-[11px] font-black text-gray-900 tabular-nums whitespace-nowrap leading-none">
                        {formatCurrency(total)}
                    </span>
                </div>
            </button>

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
    );
}
