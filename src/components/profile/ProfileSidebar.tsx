'use client';

import { useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUpdateProfileMutation } from '@/redux/features/auth/authApi';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface ProfileSidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export default function ProfileSidebar({ activeTab, setActiveTab }: ProfileSidebarProps) {
    const { user, logout } = useAuth();
    const [updateProfile] = useUpdateProfileMutation();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Upload to Cloudinary/local
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (data.success) {
                // Update user profile with new image URL
                await updateProfile({ ...user, image: data.imageUrl }).unwrap();
                toast.success('Profile picture updated');
            } else {
                toast.error(data.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Image upload error:', error);
            toast.error('Cloud upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6 sticky top-24">
            <div className="text-center space-y-3">
                <div className="relative w-24 h-24 mx-auto group">
                    <div className="w-24 h-24 bg-gray-100 rounded-2xl overflow-hidden border-2 border-white shadow-sm transition-transform group-hover:scale-95">
                        {user.image ? (
                            <Image src={user.image} className="w-full h-full object-cover" alt={user.name} width={100} height={100} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                                {user.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="absolute -bottom-1 -right-1 bg-white p-2 rounded-xl shadow-lg border border-gray-100 text-gray-600 hover:text-black hover:scale-110 transition-all z-10"
                    >
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                        {isUploading ? (
                            <div className="animate-spin h-4 w-4 border-2 border-gray-900 border-t-transparent rounded-full" />
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        )}
                    </button>
                </div>
                <div className="pt-2">
                    <h2 className="font-bold text-gray-900 leading-tight">{user.name}</h2>
                    <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                </div>
            </div>

            <nav className="space-y-1 pt-4 border-t border-gray-50">
                {['profile', 'orders', 'addresses'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab
                            ? 'bg-gray-900 text-white shadow-xl shadow-gray-200'
                            : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </nav>

            <button
                onClick={() => logout()}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all mt-4"
            >
                Sign Out
            </button>
        </div>
    );
}
