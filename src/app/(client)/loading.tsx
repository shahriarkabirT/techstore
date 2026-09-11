import React from 'react';
import Image from 'next/image';

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
            <div className="relative flex flex-col items-center animate-pulse">
                <Image
                    src="/logo.png"
                    alt="TechStore"
                    width={150}
                    height={50}
                    className="object-contain"
                    style={{
                        width: '150px',
                        height: '50px',
                    }}
                    priority
                />
                <div className="mt-6 flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        </div>
    );
}
