'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronUp } from 'lucide-react';

interface SpeedDialProps {
    initialSettings: {
        contactPhone?: string | null;
        whatsapp?: string | null;
    } | null;
}

export default function SpeedDial({ initialSettings }: SpeedDialProps) {
    const pathname = usePathname();

    const [showScrollToTop, setShowScrollToTop] = useState(false);
    
    // Default to the provided format in settings, but remove any spaces or '+' for the link
    const whatsappNumber = initialSettings?.whatsapp || '8801700000000';

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollToTop(window.scrollY > 50);
        };
        const initTimer = setTimeout(() => {
            handleScroll();
        }, 0);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            clearTimeout(initTimer);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleScrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleWhatsApp = () => {
        const clean = whatsappNumber.replace(/\+/g, '').replace(/[\s\-()]/g, '');
        window.open(`https://api.whatsapp.com/send?phone=${clean}`, '_blank');
    };

    if (pathname?.startsWith('/admin')) return null;

    return (
        <div className="fixed z-[9999] bottom-20 right-4 md:bottom-6 md:right-6 flex flex-col items-center gap-3">
            {/* Scroll to Top Button */}
            {showScrollToTop && (
                <button
                    onClick={handleScrollToTop}
                    aria-label="Scroll to top"
                    className="flex items-center justify-center rounded-full bg-white shadow-xl ring-1 ring-black/5 hover:bg-gray-50 text-gray-700 active:scale-95 transition-all duration-300 w-14 h-14"
                >
                    <ChevronUp size={30} strokeWidth={2} className="text-primary" />
                </button>
            )}

            {/* WhatsApp Button */}
            <button
                onClick={handleWhatsApp}
                aria-label="Chat on WhatsApp"
                className="flex items-center justify-center rounded-full bg-[#25D366] text-white hover:bg-[#20bd5a] shadow-xl hover:shadow-2xl transition-all duration-300 w-14 h-14 hover:scale-110 active:scale-95 border-none"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="34"
                    height="34"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path d="M19.007 4.908A9.817 9.817 0 0 0 11.992 2C6.534 2 2.085 6.448 2.08 11.91c0 1.748.458 3.45 1.321 4.956L2 22l5.251-1.378a9.8 9.8 0 0 0 4.732 1.22h.005c5.46 0 9.908-4.448 9.913-9.913a9.807 9.807 0 0 0-2.894-6.921zm-7.015 15.39a8.136 8.136 0 0 1-4.156-1.145l-.298-.177-3.093.81.824-3.017-.194-.31a8.151 8.151 0 0 1-1.25-4.347c.004-4.502 3.669-8.164 8.175-8.164a8.125 8.125 0 0 1 5.78 2.4 8.132 8.132 0 0 1 2.396 5.78c-.004 4.505-3.67 8.172-8.18 8.172zm4.48-6.132c-.245-.123-1.454-.717-1.68-.8-.224-.08-.388-.122-.55.123-.162.246-.63.8-.772.963-.143.164-.285.184-.53.06a6.68 6.68 0 0 1-1.968-1.215 7.37 7.37 0 0 1-1.36-1.697c-.143-.246-.015-.38.11-.503.11-.11.245-.287.37-.43.12-.143.162-.245.243-.41.082-.164.041-.307-.02-.43-.062-.124-.55-1.332-.752-1.823-.197-.475-.397-.411-.55-.419-.143-.008-.306-.008-.47-.008a.9.9 0 0 0-.65.307c-.224.246-.857.84-1.04 2.05.18 1.21.94 2.379 1.04 2.522.1.143 1.85 2.825 4.48 3.963.626.27 1.114.432 1.494.553.63.2 1.2.172 1.653.105.503-.074 1.454-.594 1.66-1.17.203-.573.203-1.065.142-1.17-.061-.103-.224-.163-.47-.285z" />
                </svg>
            </button>
        </div>
    );
}
