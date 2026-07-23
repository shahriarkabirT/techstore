'use client';

import React from 'react';
import toast, { Toast } from 'react-hot-toast';

interface CustomToastProps {
    t: Toast;
    type: 'success' | 'error' | 'info';
    message: string;
    description?: string;
}

export const CustomToast = ({ t, type, message, description }: CustomToastProps) => {
    const icons = {
        success: (
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 animate-in zoom-in duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 text-emerald-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
            </div>
        ),
        error: (
            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0 animate-in zoom-in duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 text-rose-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </div>
        ),
        info: (
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 animate-in zoom-in duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 text-indigo-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
            </div>
        ),
    };

    const backgrounds = {
        success: 'bg-white/80 border-emerald-100 shadow-emerald-500/10',
        error: 'bg-white/80 border-rose-100 shadow-rose-500/10',
        info: 'bg-white/80 border-indigo-100 shadow-indigo-500/10',
    };

    return (
        <div
            className={`
                ${t.visible ? 'animate-in fade-in slide-in-from-top-2' : 'animate-out fade-out slide-out-to-top-2'}
                max-w-md w-full ${backgrounds[type]} backdrop-blur-xl border-2 pointer-events-auto flex items-center gap-4 p-4 rounded-2xl shadow-2xl transition-all duration-300
            `}
        >
            {icons[type]}
            <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 leading-tight tracking-tight">
                    {message}
                </p>
                {description && (
                    <p className="text-[11px] font-medium text-gray-500 mt-0.5 leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
            <button
                onClick={() => toast.dismiss(t.id)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default CustomToast;
