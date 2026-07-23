'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUpdateProfileMutation } from '@/redux/features/auth/authApi';
import { toast } from 'react-hot-toast';

export default function AddressBook() {
    const { user } = useAuth();
    const [updateProfile] = useUpdateProfileMutation();
    const [showAddressModal, setShowAddressModal] = useState(false);

    const [newAddress, setNewAddress] = useState({
        name: '',
        phone: '',
        address: '',
        city: '',
        isDefault: false
    });

    const handleAddAddress = async () => {
        if (!newAddress.name || !newAddress.address || !newAddress.city || !newAddress.phone) {
            return toast.error('Please fill all address fields');
        }

        const updatedAddressBook = [...(user?.addressBook || []), newAddress];
        if (newAddress.isDefault) {
            updatedAddressBook.forEach((addr, i) => {
                if (i !== updatedAddressBook.length - 1) addr.isDefault = false;
            });
        }

        try {
            await updateProfile({ ...user, addressBook: updatedAddressBook }).unwrap();
            setShowAddressModal(false);
            setNewAddress({ name: '', phone: '', address: '', city: '', isDefault: false });
            toast.success('Address added');
        } catch (error: any) {
            toast.error(error.data?.message || 'Failed to add address');
        }
    };

    const handleDeleteAddress = async (index: number) => {
        const updatedAddressBook = user?.addressBook?.filter((_, i) => i !== index);
        try {
            await updateProfile({ ...user, addressBook: updatedAddressBook }).unwrap();
            toast.success('Address deleted');
        } catch (error: any) {
            toast.error(error.data?.message || 'Failed to delete address');
        }
    };

    if (!user) return null;

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Saved Addresses</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your delivery locations.</p>
                </div>
                <button
                    onClick={() => setShowAddressModal(true)}
                    className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black shadow-lg shadow-gray-200 transition-all"
                >
                    + New Address
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {user.addressBook && user.addressBook.length > 0 ? (
                    user.addressBook.map((addr, idx) => (
                        <div key={idx} className={`relative p-8 rounded-3xl border transition-all ${addr.isDefault ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-100 bg-white'}`}>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-lg">{addr.name}</h3>
                                    {addr.isDefault && (
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded-lg">Default</span>
                                    )}
                                </div>
                                <div className={`space-y-1 ${addr.isDefault ? 'text-gray-300' : 'text-gray-500'} text-sm font-medium`}>
                                    <p>{addr.address}</p>
                                    <p>{addr.city}</p>
                                    <p className="pt-2 font-bold">{addr.phone}</p>
                                </div>
                                <div className="pt-4 flex gap-4">
                                    <button
                                        onClick={() => handleDeleteAddress(idx)}
                                        className={`text-[10px] font-black uppercase tracking-widest ${addr.isDefault ? 'text-rose-400 hover:text-rose-300' : 'text-rose-500 hover:text-rose-600'}`}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-2 py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-300 shadow-sm">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        </div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">No addresses found</p>
                    </div>
                )}
            </div>

            {/* Address Modal */}
            {showAddressModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Add New Address</h3>
                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Contact Name</label>
                                <input
                                    type="text"
                                    value={newAddress.name}
                                    onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                                    className="w-full bg-gray-50 border border-transparent focus:border-gray-200 focus:bg-white rounded-xl px-5 py-3 text-sm font-bold text-gray-900 outline-none"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                                <input
                                    type="text"
                                    value={newAddress.phone}
                                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                                    className="w-full bg-gray-50 border border-transparent focus:border-gray-200 focus:bg-white rounded-xl px-5 py-3 text-sm font-bold text-gray-900 outline-none"
                                    placeholder="+1 234 567 890"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Street Address</label>
                                <textarea
                                    value={newAddress.address}
                                    onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                                    className="w-full bg-gray-50 border border-transparent focus:border-gray-200 focus:bg-white rounded-xl px-5 py-3 text-sm font-bold text-gray-900 outline-none resize-none"
                                    rows={3}
                                    placeholder="123 Shopping Ave"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">City</label>
                                <input
                                    type="text"
                                    value={newAddress.city}
                                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                    className="w-full bg-gray-50 border border-transparent focus:border-gray-200 focus:bg-white rounded-xl px-5 py-3 text-sm font-bold text-gray-900 outline-none"
                                    placeholder="New York"
                                />
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer group py-2">
                                <input
                                    type="checkbox"
                                    checked={newAddress.isDefault}
                                    onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                                    className="w-5 h-5 rounded-lg border-2 border-gray-200 text-gray-900 focus:ring-gray-900"
                                />
                                <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">Set as default delivery address</span>
                            </label>
                        </div>
                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setShowAddressModal(false)}
                                className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddAddress}
                                className="flex-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-black shadow-xl shadow-gray-200"
                            >
                                Save Address
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
