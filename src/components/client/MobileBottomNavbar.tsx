'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Heart, ShoppingCart, LayoutGrid, Search, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import CartDrawer from './CartDrawer';
import MobileFilters from './MobileFilters';
import MobileSearchModal from './MobileSearchModal';
import { useAuth } from '@/context/AuthContext';
import { LogIn, UserPlus, LogOut, Shield, Settings, UserCircle, X } from 'lucide-react';
import Image from 'next/image';

export default function MobileBottomNavbar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    useEffect(() => {
        const handleOpenMenu = () => setIsCategoriesOpen(true);
        document.addEventListener('open-mobile-menu', handleOpenMenu);
        return () => document.removeEventListener('open-mobile-menu', handleOpenMenu);
    }, []);

    // Close menus on route change (Syncing state during render)
    const [prevPathname, setPrevPathname] = useState(pathname);
    if (pathname !== prevPathname) {
        setPrevPathname(pathname);
        if (isUserMenuOpen) setIsUserMenuOpen(false);
        if (isCategoriesOpen) setIsCategoriesOpen(false);
        if (isSearchOpen) setIsSearchOpen(false);
    }

    const navItems: Array<{
        label: string;
        icon: any;
        href: string;
        isCategories?: boolean;
        isCart?: boolean;
        isSearch?: boolean;
        isAccount?: boolean;
        count?: number;
    }> = [
        { label: 'HOME', icon: Home, href: '/' },
        { label: 'MENU', icon: LayoutGrid, href: '#', isCategories: true },
        { label: 'SHOP', icon: ShoppingBag, href: '/products' },
        { label: 'SEARCH', icon: Search, href: '#', isSearch: true },
        { label: 'ACCOUNT', icon: User, href: '#', isAccount: true },
    ];

    return (
        <>
            {/* User Menu Backdrop */}
            {isUserMenuOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[10001] animate-in fade-in duration-300"
                    onClick={() => setIsUserMenuOpen(false)}
                />
            )}

            {/* User Menu Content */}
            <div 
                className={`md:hidden fixed left-4 right-4 bottom-20 bg-white rounded-2xl shadow-[0_-8px_30px_rgb(0,0,0,0.12)] border border-gray-100 p-4 z-[10002] transition-all duration-300 transform ${isUserMenuOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}`}
            >
                {/* Close Button */}
                <button 
                    onClick={() => setIsUserMenuOpen(false)}
                    className="absolute top-3 right-3 w-8 h-8 bg-gray-50/50 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all active:scale-90"
                >
                    <X className="w-4 h-4" strokeWidth={2.5} />
                </button>
                {user ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 pb-3 border-b border-gray-50">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
                                {user.image ? (
                                    <Image src={user.image} alt={user.name || ''} width={40} height={40} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-primary font-bold text-sm">{(user.name?.[0] || user.email?.[0] || 'U').toUpperCase()}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-gray-900 truncate">{user.name}</p>
                                <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                            </div>
                        </div>

                        <div className="grid gap-1">
                            <Link href="/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                                <UserCircle className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                                <span className="text-sm font-bold text-gray-700">My Profile</span>
                            </Link>

                            {(user.role === 'admin' || user.role === 'moderator') && (
                                <Link 
                                    href={user.role === 'moderator' ? '/admin/moderator-dashboard' : '/admin/dashboard'} 
                                    className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors group"
                                >
                                    <Shield className="w-5 h-5 text-primary" />
                                    <span className="text-sm font-bold text-primary">Admin Panel</span>
                                </Link>
                            )}

                            <button 
                                onClick={() => {
                                    logout();
                                    setIsUserMenuOpen(false);
                                }}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 transition-colors group w-full text-left"
                            >
                                <LogOut className="w-5 h-5 text-rose-400 group-hover:text-rose-500 transition-colors" />
                                <span className="text-sm font-bold text-rose-500">Sign Out</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="text-center pb-2">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Account</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mt-1">Sign in to manage your orders</p>
                        </div>
                        <div className="grid gap-2">
                            <Link 
                                href="/login" 
                                className="flex items-center justify-center gap-2 p-3.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                            >
                                <LogIn className="w-4 h-4" />
                                Sign In
                            </Link>
                            <Link 
                                href="/register" 
                                className="flex items-center justify-center gap-2 p-3.5 bg-gray-50 text-gray-700 border border-gray-100 rounded-xl text-xs font-black uppercase tracking-widest"
                            >
                                <UserPlus className="w-4 h-4" />
                                Create Account
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-primary border-t border-primary/20 z-[70] px-2 pb-safe-area-inset-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
                <div className="flex items-center justify-around h-16 max-w-md mx-auto">
                    {navItems.map((item) => {
                        const isActive = !item.isAccount && !item.isCart && !item.isCategories && pathname === item.href;
                        const Icon = item.icon;

                        if (item.isCart) {
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => setIsCartOpen(true)}
                                    className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-2 transition-all duration-200 text-white hover:text-white/80 cursor-pointer`}
                                >
                                    <div className="relative p-1">
                                        <Icon className="w-6 h-6" strokeWidth={1.5} />
                                        {item.count !== undefined && item.count > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-white text-primary text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-primary shadow-sm">
                                                {item.count}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[9px] tracking-widest font-bold">
                                        {item.label}
                                    </span>
                                </button>
                            );
                        }

                        if (item.isSearch) {
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => setIsSearchOpen(true)}
                                    className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-2 transition-all duration-200 text-white hover:text-white/80 cursor-pointer`}
                                >
                                    <div className="relative p-1">
                                        <Icon className="w-6 h-6" strokeWidth={1.5} />
                                    </div>
                                    <span className="text-[9px] tracking-widest font-bold">
                                        {item.label}
                                    </span>
                                </button>
                            );
                        }

                        if (item.isCategories) {
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => setIsCategoriesOpen(true)}
                                    className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-2 transition-all duration-200 text-white hover:text-white/80 cursor-pointer`}
                                >
                                    <div className="relative p-1">
                                        <Icon className="w-6 h-6" strokeWidth={1.5} />
                                    </div>
                                    <span className="text-[9px] tracking-widest font-bold">
                                        {item.label}
                                    </span>
                                </button>
                            );
                        }

                        if (item.isAccount) {
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-2 transition-all duration-200 ${isUserMenuOpen ? 'text-white scale-110' : 'text-white/80 hover:text-white'} cursor-pointer`}
                                >
                                    <div className="relative p-1">
                                        <Icon className="w-6 h-6" strokeWidth={isUserMenuOpen ? 2.5 : 1.5} />
                                    </div>
                                    <span className="text-[9px] tracking-widest font-bold">
                                        {item.label}
                                    </span>
                                </button>
                            );
                        }

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-2 transition-all duration-200 ${isActive ? 'text-white' : 'text-white/80 hover:text-white'
                                    }`}
                            >
                                <div className="relative p-1">
                                    <Icon className={`w-6 h-6 transition-all duration-200`} strokeWidth={isActive ? 2.5 : 1.5} />
                                </div>
                                <span className={`text-[9px] tracking-widest font-bold`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <MobileFilters isOpen={isCategoriesOpen} onClose={() => setIsCategoriesOpen(false)} />
            <MobileSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
}
