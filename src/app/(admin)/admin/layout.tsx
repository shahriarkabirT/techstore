'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AdminSocketProvider, useAdminSocket } from '@/context/AdminSocketContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-gray-50 text-gray-400">Loading admin...</div>}>
            <AdminLayoutInner>{children}</AdminLayoutInner>
        </Suspense>
    );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { logout, user } = useAuth();
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isMarketingOpen, setIsMarketingOpen] = useState(false);
    const [isBannersOpen, setIsBannersOpen] = useState(false);
    const [isOrdersOpen, setIsOrdersOpen] = useState(false);
    const [isProductsOpen, setIsProductsOpen] = useState(false);
    const [isReportsOpen, setIsReportsOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const navItems = [
        user?.role === 'moderator'
            ? { href: '/admin/moderator-dashboard', label: 'Moderator Dashboard', icon: 'dashboard', permKey: '_moderator_dashboard' }
            : { href: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard', permKey: 'dashboard' },
        { href: '/admin/pos', label: 'POS Terminal', icon: 'pos', permKey: 'pos' },
        {
            label: 'Products',
            icon: 'products',
            isDropdown: true,
            permKey: 'products',
            children: [
                { href: '/admin/products', label: 'All Products' },
                { href: '/admin/products?status=published', label: 'Published' },
                { href: '/admin/products?status=draft', label: 'Drafts' },
                { href: '/admin/variant-management', label: 'Attributes', icon: 'variants' },
                { href: '/admin/brands', label: 'Brands', icon: 'brands' },
                { href: '/admin/compatible-models', label: 'Models', icon: 'categories' },
            ]
        },
        {
            label: 'Categories',
            icon: 'categories',
            isDropdown: true,
            permKey: 'categories',
            children: [
                { href: '/admin/categories?level=0', label: 'Manage Categories' },
                { href: '/admin/categories?level=1', label: 'Sub Categories' },
                { href: '/admin/categories?level=2', label: 'Child Categories' },
                { href: '/admin/categories?level=3', label: 'Sub-Child Categories' },
            ]
        },
        {
            label: 'Orders',
            icon: 'orders',
            isDropdown: true,
            permKey: 'orders',
            children: [
                { href: '/admin/orders', label: 'All Orders' },
                { href: '/admin/orders?status=Pending', label: 'Pending' },
                { href: '/admin/orders?status=Confirmed', label: 'Confirmed' },
                { href: '/admin/orders?status=Processing', label: 'Processing' },
                { href: '/admin/orders?status=Shipped', label: 'Shipped' },
                { href: '/admin/orders?status=Delivered', label: 'Delivered' },
                { href: '/admin/orders?status=Cancelled', label: 'Cancelled' },
                { href: '/admin/orders?status=Returned', label: 'Returned' },
                { href: '/admin/orders/pre-orders', label: 'Pre-orders', icon: 'preorder' },
                { href: '/admin/abandoned-checkouts', label: 'Incomplete' },
            ]
        },
        {
            label: 'Settings',
            icon: 'general',
            isDropdown: true,
            permKey: 'settings',
            children: [
                { href: '/admin/settings/general', label: 'General Settings' },
                { href: '/admin/settings/otp', label: 'OTP Settings' },
                { href: '/admin/settings/pixel', label: 'Pixel Setup' },
                { href: '/admin/settings/logo', label: 'Logo Settings' },
                { href: '/admin/settings/contact', label: 'Contact Settings' },
                { href: '/admin/settings/social-auth', label: 'Social Auth Settings' },
                { href: '/admin/settings/notifications', label: 'Notification Settings' },
                { href: '/admin/settings/integrations', label: 'Integrations (Fraud BD)' },
                { href: '/admin/couriers', label: 'Courier Settings'},
            ]
        },
        {
            label: 'Marketing',
            icon: 'marketing',
            isDropdown: true,
            permKey: 'marketing',
            children: [
                { href: '/admin/marketing/coupons', label: 'Coupons' },
                { href: '/admin/marketing/customers', label: 'Customers' },
                { href: '/admin/marketing/subscribers', label: 'Subscribers' },
            ]
        },
        {
            label: 'Banners',
            icon: 'banners',
            isDropdown: true,
            permKey: 'banners',
            children: [
                { href: '/admin/banners?position=primary', label: 'Primary Banners' },
                { href: '/admin/banners?position=secondary-top', label: 'Secondary Top' },
                { href: '/admin/banners?position=secondary-bottom', label: 'Secondary Bottom' },
                { href: '/admin/banners?position=promotional-left', label: 'Promo Left Banner' },
                { href: '/admin/banners?position=promotional-right', label: 'Promo Right Banner' },
            ]
        },
        {
            label: 'Reports',
            icon: 'reports',
            isDropdown: true,
            permKey: 'reports',
            children: [
                { href: '/admin/reports/orders', label: 'Order Report' },
                { href: '/admin/reports/profit', label: 'Profit & cost' },
                { href: '/admin/reports/stock', label: 'Stock Report' },
                { href: '/admin/reports/ads', label: 'Ad Performance' },
            ]
        },
        { href: '/admin/users', label: 'User Management', icon: 'users', permKey: 'users' },
        { href: '/admin/frauds', label: 'Fraud Protection', icon: 'shield', permKey: 'frauds' },
        { href: '/admin/refunds', label: 'Returns & Refunds', icon: 'refunds', permKey: 'refunds' },
        
        { href: '/admin/messages', label: 'Messages', icon: 'messages', permKey: 'messages' },
        // { href: '/admin/chat', label: 'Live Chat', icon: 'chat', permKey: 'chat' },
        { href: '/admin/reviews', label: 'Reviews', icon: 'reviews', permKey: 'reviews' },
        { href: '/admin/landing-pages', label: 'Landing Pages', icon: 'landing', permKey: 'landing-pages' },
        { href: '/admin/blogs', label: 'Blogs', icon: 'blog', permKey: 'blogs' },
        { href: '/admin/testimonials', label: 'Testimonial', icon: 'testimonials', permKey: 'testimonials' },
        { href: '/admin/policies', label: 'Consumer Policy', icon: 'content', permKey: 'policies' },
        { href: '/admin/store-locations', label: 'Store Locations', icon: 'location', permKey: 'store-locations' },
    ];

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const getIcon = (name: string) => {
        const icons: any = {
            dashboard: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
            ),
            products: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
            ),
            categories: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
            ),
            subcategory: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
                </svg>
            ),
            childcategory: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                </svg>
            ),
            subchildcategory: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 0 1-1.125-1.125v-3.75ZM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-8.25ZM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-2.25Z" />
                </svg>
            ),
            orders: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                </svg>
            ),
            banners: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
            ),
            otp: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7.5h6M9 10.5h6m-6 3h6" />
                </svg>
            ),
            users: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
            ),
            chat: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
            ),
            content: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
            ),
            messages: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L4.32 8.909A2.25 2.25 0 0 1 3.25 6.993V6.75" />
                </svg>
            ),
            marketing: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
                </svg>
            ),
            variants: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
            ),
            reviews: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>
            ),
            testimonials: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379L10.306 21l3.892-3.892a.901.901 0 0 1 .612-.257c1.442 0 2.87-.094 4.276-.276 1.584-.205 2.707-1.596 2.707-3.22V6.741c0-1.625-1.123-3.016-2.707-3.221A48.303 48.303 0 0 0 12 3c-2.474 0-4.9.183-7.279.542C3.138 3.742 2.015 5.133 2.015 6.759V12.76Z" />
                </svg>
            ),
            courier: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25m-3.75 0V5.625m0 12.75v-3.375m0 3.375h3.375M14.25 5.625v12.75M14.25 5.625H9M14.25 5.625h3.375" />
                </svg>
            ),
            general: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
            ),
            pos: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                </svg>
            ),
            landing: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                </svg>
            ),
            brands: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                </svg>
            ),
            blog: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
            ),
            shield: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                </svg>
            ),
            refunds: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l-3-3m0 0l3-3m-3 3h10.5c1.243 0 2.25.503 2.25 1.125v2.25c0 .622-.103.957-.25 1.125M15 9.75l3 3m0 0l-3 3m3-3H4.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
                </svg>
            ),
            reports: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
            ),
            location: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
            ),
        };
        return icons[name];
    };

    return (
        <AdminSocketProvider>
            <AdminLayoutContent
                user={user}
                logout={logout}
                pathname={pathname}
                router={router}
                isCategoriesOpen={isCategoriesOpen}
                setIsCategoriesOpen={setIsCategoriesOpen}
                isSettingsOpen={isSettingsOpen}
                setIsSettingsOpen={setIsSettingsOpen}
                isMarketingOpen={isMarketingOpen}
                setIsMarketingOpen={setIsMarketingOpen}
                isBannersOpen={isBannersOpen}
                setIsBannersOpen={setIsBannersOpen}
                isOrdersOpen={isOrdersOpen}
                setIsOrdersOpen={setIsOrdersOpen}
                isProductsOpen={isProductsOpen}
                setIsProductsOpen={setIsProductsOpen}
                isReportsOpen={isReportsOpen}
                setIsReportsOpen={setIsReportsOpen}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                navItems={navItems}
                getIcon={getIcon}
                handleLogout={handleLogout}
                searchParams={searchParams}
            >
                {children}
            </AdminLayoutContent>
        </AdminSocketProvider>
    );
}

function AdminLayoutContent({
    user, logout, pathname, router, isCategoriesOpen, setIsCategoriesOpen, isSettingsOpen, setIsSettingsOpen, isMarketingOpen, setIsMarketingOpen, isBannersOpen, setIsBannersOpen, isOrdersOpen, setIsOrdersOpen, isProductsOpen, setIsProductsOpen, isReportsOpen, setIsReportsOpen, isSidebarOpen, setIsSidebarOpen, navItems, getIcon, handleLogout, searchParams, children
}: any) {
    const { unreadCount } = useAdminSocket();

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans antialiased text-gray-900 relative">
            {/* Mobile Header / Hamburger */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>
                    <Link href="/admin/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                            A
                        </div>
                        <span className="font-bold text-lg tracking-tight">Admin<span className="text-gray-400 font-normal">Panel</span></span>
                    </Link>
                </div>
            </div>

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                w-64 bg-white border-r border-gray-200 fixed top-0 bottom-0 left-0 z-50 
                transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                md:translate-x-0
            `}>
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <Link href="/admin/dashboard" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                                A
                            </div>
                            <span className="font-bold text-lg tracking-tight">Admin<span className="text-gray-400 font-normal">Panel</span></span>
                        </Link>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="md:hidden p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <nav className="space-y-1">
                            {navItems.filter((item: any) => {
                                if (!user) return false;
                                if (user.role === 'admin') return true;
                                if (user.role === 'moderator') {
                                    // Moderator dashboard is always visible
                                    if (item.permKey === '_moderator_dashboard') return true;
                                    const permissions = user.permissions || [];
                                    // Support both new format ('products') and legacy ('/admin/products')
                                    const legacyPath = `/admin/${item.permKey}`;
                                    return permissions.includes(item.permKey) || permissions.includes(legacyPath);
                                }
                                return false;
                            }).map((item: any) => (
                                item.isDropdown ? (
                                    <div key={item.label}>
                                        <button
                                            onClick={() => {
                                                if (item.label === 'Categories') setIsCategoriesOpen(!isCategoriesOpen);
                                                if (item.label === 'Settings') setIsSettingsOpen(!isSettingsOpen);
                                                if (item.label === 'Marketing') setIsMarketingOpen(!isMarketingOpen);
                                                if (item.label === 'Banners') setIsBannersOpen(!isBannersOpen);
                                                if (item.label === 'Orders') setIsOrdersOpen(!isOrdersOpen);
                                                if (item.label === 'Products') setIsProductsOpen(!isProductsOpen);
                                                if (item.label === 'Reports') setIsReportsOpen(!isReportsOpen);
                                            }}
                                            className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${(item.label === 'Categories' && pathname.startsWith('/admin/categories')) ||
                                                (item.label === 'Settings' && pathname.startsWith('/admin/settings')) ||
                                                (item.label === 'Marketing' && pathname.startsWith('/admin/marketing')) ||
                                                (item.label === 'Banners' && pathname.startsWith('/admin/banners')) || 
                                                (item.label === 'Orders' && (pathname.startsWith('/admin/orders') || pathname.startsWith('/admin/abandoned-checkouts'))) ||
                                                (item.label === 'Products' && pathname.startsWith('/admin/products')) ||
                                                (item.label === 'Reports' && pathname.startsWith('/admin/reports'))
                                                ? 'bg-gray-100 text-gray-900'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                        >
                                            <span className="flex items-center gap-3">
                                                <span className={
                                                    (item.label === 'Categories' && pathname.startsWith('/admin/categories')) ||
                                                        (item.label === 'Settings' && pathname.startsWith('/admin/settings')) ||
                                                        (item.label === 'Marketing' && pathname.startsWith('/admin/marketing')) ||
                                                        (item.label === 'Banners' && pathname.startsWith('/admin/banners')) ||
                                                        (item.label === 'Orders' && (pathname.startsWith('/admin/orders') || pathname.startsWith('/admin/abandoned-checkouts'))) ||
                                                        (item.label === 'Products' && pathname.startsWith('/admin/products')) ||
                                                        (item.label === 'Reports' && pathname.startsWith('/admin/reports'))
                                                        ? 'text-gray-900' : 'text-gray-400'
                                                }>
                                                    {getIcon(item.icon)}
                                                </span>
                                                {item.label}
                                            </span>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={2}
                                                stroke="currentColor"
                                                className={`w-4 h-4 transition-transform ${(item.label === 'Categories' && isCategoriesOpen) ||
                                                    (item.label === 'Settings' && isSettingsOpen) ||
                                                    (item.label === 'Marketing' && isMarketingOpen) ||
                                                    (item.label === 'Banners' && isBannersOpen) ||
                                                    (item.label === 'Orders' && isOrdersOpen) ||
                                                    (item.label === 'Products' && isProductsOpen) ||
                                                    (item.label === 'Reports' && isReportsOpen)
                                                    ? 'rotate-180' : ''}`}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                            </svg>
                                        </button>
                                        {((item.label === 'Categories' && isCategoriesOpen) || (item.label === 'Settings' && isSettingsOpen) || (item.label === 'Marketing' && isMarketingOpen) || (item.label === 'Banners' && isBannersOpen) || (item.label === 'Orders' && isOrdersOpen) || (item.label === 'Products' && isProductsOpen) || (item.label === 'Reports' && isReportsOpen)) && (
                                            <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-100 pl-3">
                                                {item.children.map((child: any) => (
                                                    <Link
                                                        key={child.href}
                                                        href={child.href}
                                                        onClick={() => setIsSidebarOpen(false)}
                                                        className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                                                            (pathname === child.href && (pathname !== '/admin/orders' || !searchParams?.get('status')) && (pathname !== '/admin/products' || !searchParams?.get('status'))) || 
                                                            (child.href.startsWith('/admin/categories') && pathname.startsWith('/admin/categories') && new URLSearchParams(child.href.split('?')[1]).get('level') === searchParams?.get('level')) || 
                                                            (child.href.startsWith('/admin/banners') && pathname.startsWith('/admin/banners') && new URLSearchParams(child.href.split('?')[1]).get('position') === searchParams?.get('position')) ||
                                                            (child.href.startsWith('/admin/orders') && pathname.startsWith('/admin/orders') && new URLSearchParams(child.href.split('?')[1]).get('status') === searchParams?.get('status')) ||
                                                            (child.href === '/admin/orders' && pathname.startsWith('/admin/orders') && !searchParams?.get('status')) ||
                                                            (child.href.startsWith('/admin/abandoned-checkouts') && pathname.startsWith('/admin/abandoned-checkouts') && new URLSearchParams(child.href.split('?')[1]).get('status') === searchParams?.get('status')) ||
                                                            (child.href === '/admin/abandoned-checkouts' && pathname.startsWith('/admin/abandoned-checkouts') && !searchParams?.get('status')) ||
                                                            (child.href.startsWith('/admin/products') && pathname.startsWith('/admin/products') && new URLSearchParams(child.href.split('?')[1]).get('status') === searchParams?.get('status')) ||
                                                            (child.href === '/admin/products' && pathname.startsWith('/admin/products') && !searchParams?.get('status'))
                                                            ? 'bg-gray-100 text-gray-900 font-medium'
                                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                                            }`}
                                                    >
                                                        {child.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname === item.href || pathname.startsWith(item.href + '/')
                                            ? 'bg-gray-100 text-gray-900'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <span className={pathname === item.href || pathname.startsWith(item.href + '/') ? 'text-gray-900' : 'text-gray-400'}>
                                            {getIcon(item.icon)}
                                        </span>
                                        <span className="flex-1">{item.label}</span>
                                        {item.label === 'Live Chat' && unreadCount > 0 && (
                                            <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </Link>
                                )
                            ))}
                        </nav>
                    </div>

                    <div className="p-4 border-t border-gray-200 space-y-1 bg-white">
                        <Link
                            href="/"
                            className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                            Public Store
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                            </svg>
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 pt-16 md:pt-0 md:pl-64">
                <div className="max-w-7xl mx-auto px-4 md:px-8 pt-3 md:pt-4 pb-6 md:pb-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
