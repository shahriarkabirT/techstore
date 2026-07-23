'use client';

import { useState } from 'react';
import { useValidateCouponMutation } from '@/redux/features/coupon/couponApi';
import { toast } from 'react-hot-toast';
import { Ticket, Loader2, X } from 'lucide-react';

interface CouponInputProps {
    cartTotal: number;
    onApply: (coupon: any, discount: number) => void;
    onRemove: () => void;
    appliedCoupon: any | null;
}

export default function CouponInput({ cartTotal, onApply, onRemove, appliedCoupon }: CouponInputProps) {
    const [code, setCode] = useState('');
    const [validateCoupon, { isLoading }] = useValidateCouponMutation();

    const handleApply = async () => {
        if (!code) return;
        try {
            const result = await validateCoupon({
                code,
                cartTotal
            }).unwrap();

            if (result.success) {
                onApply(result.data.coupon, result.data.discount);
                toast.success('Coupon applied successfully!');
            } else {
                toast.error(result.message || 'Invalid coupon');
            }
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to apply coupon');
        }
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleApply();
        }
    };

    if (appliedCoupon) {
        return (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-xl">
                <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-green-600" />
                    <div>
                        <p className="text-xs font-bold text-green-700 uppercase tracking-wider">{appliedCoupon.code}</p>
                        <p className="text-[10px] text-green-600 italic">Coupon Applied</p>
                    </div>
                </div>
                <button
                    onClick={onRemove}
                    className="p-1.5 hover:bg-green-100 rounded-lg text-green-700 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            <div className="relative">
                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    onKeyDown={onKeyDown}
                    placeholder="Enter Coupon Code"
                    className="w-full pl-10 pr-20 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 outline-none font-bold text-xs uppercase tracking-widest placeholder:lowercase"
                />
                <button
                    type="button"
                    onClick={handleApply}
                    disabled={isLoading || !code}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-primary text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50"
                >
                    {isLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        'Apply'
                    )}
                </button>
            </div>
        </div>
    );
}
