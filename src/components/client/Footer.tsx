'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail, Facebook, Instagram, Youtube } from 'lucide-react';
import { useGetPublicGeneralSettingsQuery, useGetPublicSettingsQuery } from '@/redux/features/settings/settingsApi';
import { useGetCategoriesQuery } from '@/redux/features/categories/categoryApi';
import { useGetPoliciesQuery } from '@/redux/features/policies/policyApi';

import { useAuth } from '@/context/AuthContext';
import { useSubscribeMutation } from '@/redux/features/newsletter/newsletterApi';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { ArrowRight, Loader2 } from 'lucide-react';

const TikTokIcon = ({ className }: { className?: string }) => (
    <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
);

export default function Footer() {
    const { user } = useAuth();
    const { data: generalSettingsData } = useGetPublicGeneralSettingsQuery();
    const { data: logoSettingsData } = useGetPublicSettingsQuery();
    const { data: categoriesData } = useGetCategoriesQuery({ active: 'true', limit: 6, sortBy: 'order', sortOrder: 'asc' });
    const { data: policiesData } = useGetPoliciesQuery({ isActive: 'true' });
    const settings = generalSettingsData?.settings;
    const logoSettings = logoSettingsData?.settings;
    const contactSettings = logoSettingsData?.settings;
    const brandName = settings?.brandName || 'Store';
    const currentYear = new Date().getFullYear();

    const [email, setEmail] = useState('');
    const [subscribe, { isLoading: isSubscribing }] = useSubscribeMutation();

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        try {
            const res = await subscribe({ email }).unwrap();
            if (res.success) {
                toast.success('Subscribed successfully!');
                setEmail('');
            } else {
                toast.error(res.message || 'Something went wrong');
            }
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to subscribe');
        }
    };

    const infoLinks = [
        { label: 'About Us', href: '/about' },
        { label: 'FAQs', href: '/faq' },
        { label: 'Blogs', href: '/blogs' },
        { label: 'Contact', href: '/contact' },
        { label: 'Track Order', href: '/track/order' },
        { label: 'Wishlist', href: '/wishlist' },
    ];

    const dynamicCategoryLinks = (categoriesData?.categories || []).slice(0, 6).map((category: any) => ({
        label: category.name,
        href: `/products?category=${category.slug}`,
    }));

    const supportLinks = [
        ...(!user ? [
            { label: 'Login', href: '/login' },
            { label: 'Register', href: '/register' },
        ] : [
            { label: 'Home', href: '/' },
            { label: 'Shop', href: '/products' }
         
        ]),
        { label: 'Store Location', href: '/store-locations' },
        { label: 'Forgot Password', href: '/forgot-password' },
        { label: 'My Profile', href: '/profile' },
        { label: 'Cart', href: '/cart' },
    ];

    const dynamicPolicyLinks = (policiesData?.policies || []).map((policy: any) => ({
        label: policy.title,
        href: `/policy/${policy.slug}`,
    }));

    return (
        <footer className="bg-white border-t border-gray-200 mt-12">
            <div className="container mx-auto px-4 py-12 lg:py-10">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-8">
                    <div className="col-span-2 lg:col-span-1">
                        <div className="mb-3">
                            <Link href="/" className="inline-flex items-center">
                                {logoSettings?.logoUrl ? (
                                    <Image
                                        src={logoSettings.logoUrl}
                                        alt={brandName}
                                        width={logoSettings.logoWidth || 120}
                                        height={logoSettings.logoHeight || 40}
                                        style={{
                                            width: `${logoSettings.logoWidth || 120}px`,
                                            height: `${logoSettings.logoHeight || 40}px`,
                                        }}
                                        className="object-contain object-left"
                                    />
                                ) : (
                                    <span className="text-xl font-black text-primary">{brandName}</span>
                                )}
                            </Link>
                            <p className="text-[14px] text-gray-500 leading-4.5 mt-1">
                                {brandName} is an e-commerce platform dedicated to providing safe and reliable products to every home.
                            </p>
                        </div>

                        <div className="space-y-2 text-sm text-gray-700">
                            {contactSettings?.address && (
                                <p className="flex items-start gap-2.5">
                                    <MapPin className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                                    <span>{contactSettings.address}</span>
                                </p>
                            )}
                            {contactSettings?.contactPhone && (
                                <p className="flex items-center gap-2.5">
                                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span>{contactSettings.contactPhone}</span>
                                </p>
                            )}
                            {contactSettings?.contactEmail && (
                                <p className="flex items-center gap-2.5">
                                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span>{contactSettings.contactEmail}</span>
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-2.5 mt-3">
                            {contactSettings?.facebook && (
                                <a href={contactSettings.facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/40 transition-colors" aria-label="Facebook">
                                    <Facebook className="w-4 h-4" />
                                </a>
                            )}
                            {contactSettings?.instagram && (
                                <a href={contactSettings.instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/40 transition-colors" aria-label="Instagram">
                                    <Instagram className="w-4 h-4" />
                                </a>
                            )}
                            {contactSettings?.youtube && (
                                <a href={contactSettings.youtube} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/40 transition-colors" aria-label="YouTube">
                                    <Youtube className="w-4 h-4" />
                                </a>
                            )}
                            {contactSettings?.tiktok && (
                                <a href={contactSettings.tiktok} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/40 transition-colors" aria-label="TikTok">
                                    <TikTokIcon className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Information</h3>
                        <ul className="space-y-2.5">
                            {infoLinks.map((item) => (
                                <li key={item.label}>
                                    <Link href={item.href} className="text-sm text-gray-600 hover:text-primary transition-colors">
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Shop By</h3>
                        <ul className="space-y-2.5">
                            {dynamicCategoryLinks.map((item: { label: string; href: string }) => (
                                <li key={item.label}>
                                    <Link href={item.href} className="text-sm text-gray-600 hover:text-primary transition-colors">
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                            {dynamicCategoryLinks.length === 0 && (
                                <li>
                                    <Link href="/products" className="text-sm text-gray-600 hover:text-primary transition-colors">
                                        Browse Categories
                                    </Link>
                                </li>
                            )}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Support</h3>
                        <ul className="space-y-2.5">
                            {supportLinks.map((item) => (
                                <li key={item.label}>
                                    <Link href={item.href} className="text-sm text-gray-600 hover:text-primary transition-colors">
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Consumer Policy</h3>
                        <ul className="space-y-2.5">
                            {dynamicPolicyLinks.map((item: { label: string; href: string }) => (
                                <li key={item.label}>
                                    <Link href={item.href} className="text-sm text-gray-600 hover:text-primary transition-colors">
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                            {dynamicPolicyLinks.length === 0 && (
                                <li className="text-sm text-gray-400 italic">No policies active</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-100 pt-8 pb-12">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col-reverse md:grid md:grid-cols-3 gap-8 items-center md:items-end">
                        {/* Copyright & Attribution - Bottom on Mobile */}
                        <div className="w-full text-[13px] text-gray-500 font-medium text-center md:text-left">
                            <p>Copyright © {currentYear} {brandName}</p>
                            <p className="sr-only">
                                Built with <span className="text-rose-500">❤</span> by{' '}
                                <a
                                    href="https://ccloudlab.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    Collaborative Cloud
                                </a>
                            </p>
                        </div>

                        {/* Subscription - Top on Mobile */}
                        <div className="w-full">
                            <h4 className="text-[14px] font-bold text-gray-900 mb-3 text-center">Join Us for Exclusive Discounts & News</h4>
                            <form onSubmit={handleSubscribe} className="relative flex items-center">
                                <input
                                    type="email"
                                    placeholder="Enter your email address..."
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-3 text-sm placeholder:text-gray-400 text-gray-700 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-center"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={isSubscribing}
                                    className="absolute right-3 text-gray-400 hover:text-primary transition-colors disabled:opacity-50"
                                >
                                    {isSubscribing ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 -rotate-45">
                                            <line x1="22" y1="2" x2="11" y2="13"></line>
                                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                        </svg>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Spacer for Desktop */}
                        <div className="hidden md:block"></div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
