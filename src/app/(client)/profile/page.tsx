'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import ProfileInfo from '@/components/profile/ProfileInfo';
import ChangePassword from '@/components/profile/ChangePassword';
import AddressBook from '@/components/profile/AddressBook';
import OrderHistory from '@/components/profile/OrderHistory';

export default function ProfilePage() {
    const { user: session, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('profile');

    useEffect(() => {
        if (!isAuthLoading && !session) {
            router.push('/login');
        }
    }, [session, isAuthLoading, router]);

    if (isAuthLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <ProfileSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[500px]">
                            {activeTab === 'profile' && (
                                <>
                                    <ProfileInfo />
                                    <div className="mt-8">
                                        <ChangePassword />
                                    </div>
                                </>
                            )}
                            {activeTab === 'orders' && <OrderHistory />}
                            {activeTab === 'addresses' && <AddressBook />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
