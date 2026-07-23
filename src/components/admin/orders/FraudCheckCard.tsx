'use client';

import { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Loader2, Info, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface FraudCheckCardProps {
    phoneNumber: string;
}

export default function FraudCheckCard({ phoneNumber }: FraudCheckCardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [fraudData, setFraudData] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);

    const checkFraudStatus = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/fraudbd', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone_number: phoneNumber })
            });
            const data = await res.json();
            
            if (data.status) {
                setFraudData(data.data);
                toast.success('Fraud status retrieved');
            } else {
                toast.error(data.message || 'Failed to check fraud status');
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred while checking fraud status');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-gray-500" />
                        <h2 className="text-base font-semibold text-gray-900">Fraud Detection</h2>
                    </div>
                </div>

                {!fraudData ? (
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-full shadow-sm">
                                <Info className="w-4 h-4 text-gray-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Check Customer Trust</p>
                                <p className="text-xs text-gray-500">Verify previous delivery records</p>
                            </div>
                        </div>
                        <button
                            onClick={checkFraudStatus}
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                            {isLoading ? 'Checking...' : 'Check Status'}
                        </button>
                    </div>
                ) : (
                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-900">Total Summary</h3>
                            {fraudData.totalSummary?.successRate >= 80 ? (
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" /> Low Risk
                                </span>
                            ) : (
                                <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                                    <ShieldAlert className="w-3 h-3" /> Review Needed
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-4 gap-4 mb-4">
                            <div className="bg-white p-3 rounded-lg border border-gray-100 text-center">
                                <p className="text-xs text-gray-500 font-medium uppercase mb-1">Total</p>
                                <p className="text-lg font-bold text-gray-900">{fraudData.totalSummary?.total || 0}</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-gray-100 text-center">
                                <p className="text-xs text-green-600 font-medium uppercase mb-1">Success</p>
                                <p className="text-lg font-bold text-green-700">{fraudData.totalSummary?.success || 0}</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-gray-100 text-center">
                                <p className="text-xs text-red-500 font-medium uppercase mb-1">Cancel</p>
                                <p className="text-lg font-bold text-red-600">{fraudData.totalSummary?.cancel || 0}</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-gray-100 text-center">
                                <p className="text-xs text-blue-500 font-medium uppercase mb-1">Rate</p>
                                <p className="text-lg font-bold text-blue-600">{fraudData.totalSummary?.successRate || 0}%</p>
                            </div>
                        </div>
                        
                        <button
                            onClick={() => setShowModal(true)}
                            className="w-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            Show Detailed Breakdown
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && fraudData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-blue-600" /> Detailed Fraud Report
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Courier Breakdowns */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Courier Data</h3>
                                {Object.entries(fraudData.Summaries || {}).map(([courier, info]: [string, any]) => (
                                    <div key={courier} className="border border-gray-100 rounded-xl overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {info.logo && (
                                                    <div className="w-16 h-6 relative bg-white border border-gray-100 rounded p-1">
                                                        <Image src={info.logo} alt={courier} fill className="object-contain" unoptimized />
                                                    </div>
                                                )}
                                                <h4 className="font-bold text-gray-900">{courier}</h4>
                                            </div>
                                            {info.data_type === 'rating' ? (
                                                <span className={`px-2 py-1 text-xs font-bold rounded ${info.risk_level === 'low' ? 'bg-green-100 text-green-700' : info.risk_level === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                                    {info.customer_rating.replace('_', ' ').toUpperCase()}
                                                </span>
                                            ) : (
                                                <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-bold">
                                                    DELIVERY STATS
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-4 bg-white">
                                            {info.data_type === 'rating' ? (
                                                <div>
                                                    <p className="text-sm text-gray-700 font-medium mb-1">{info.message}</p>
                                                    <p className="text-xs text-gray-500">Success Rate: <span className="font-bold text-gray-900">{info.success_rate}%</span></p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                                                        <p className="text-xs text-gray-500 font-medium mb-1">Total</p>
                                                        <p className="font-bold text-gray-900">{info.total}</p>
                                                    </div>
                                                    <div className="text-center p-2 bg-green-50 rounded-lg">
                                                        <p className="text-xs text-green-600 font-medium mb-1">Success</p>
                                                        <p className="font-bold text-green-700">{info.success}</p>
                                                    </div>
                                                    <div className="text-center p-2 bg-red-50 rounded-lg">
                                                        <p className="text-xs text-red-500 font-medium mb-1">Cancel</p>
                                                        <p className="font-bold text-red-600">{info.cancel}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
