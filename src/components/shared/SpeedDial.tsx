'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleChat } from '@/redux/features/chat/chatSlice';
import { RootState } from '@/redux/store';
import { usePathname } from 'next/navigation';
import { ChevronUp, MessagesSquare, X, MessageCircle, Phone } from 'lucide-react';

interface SpeedDialProps {
    initialSettings: {
        contactPhone?: string | null;
        whatsapp?: string | null;
    } | null;
}

export default function SpeedDial({ initialSettings }: SpeedDialProps) {
    const dispatch = useDispatch();
    const pathname = usePathname();
    const chatIsOpen = useSelector((state: RootState) => state.chat.isOpen);

    const [isOpen, setIsOpen] = useState(false);
    const [showScrollToTop, setShowScrollToTop] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    const whatsappNumber = initialSettings?.whatsapp || '8801700000000';
    const phoneNumber = initialSettings?.contactPhone || '8801700000000';

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollToTop(window.scrollY > 50);
        };
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };

        // Defer initial layout & scroll state checks to the next event tick.
        // This avoids calling state setters synchronously inside the effect,
        // preventing cascading renders and satisfying React's performance standards.
        const initTimer = setTimeout(() => {
            handleScroll();
            handleResize();
        }, 0);

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize);
        return () => {
            clearTimeout(initTimer);
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Robust Click Outside Listener: Closes the fanned-out options in a stable React-driven way
    useEffect(() => {
        if (!isOpen) return;
        const handleOutsideClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.speed-dial-container')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('click', handleOutsideClick);
        return () => {
            document.removeEventListener('click', handleOutsideClick);
        };
    }, [isOpen]);

    const handleScrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleWhatsApp = (e: React.MouseEvent) => {
        e.stopPropagation();
        const clean = whatsappNumber.replace(/\+/g, '').replace(/[\s\-()]/g, '');
        window.open(`https://api.whatsapp.com/send?phone=${clean}`, '_blank');
        setIsOpen(false);
    };

    const handleCall = (e: React.MouseEvent) => {
        e.stopPropagation();
        window.open(`tel:${phoneNumber.replace(/[\s\-()]/g, '')}`, '_self');
        setIsOpen(false);
    };

    const handleLiveChat = (e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(toggleChat());
        setIsOpen(false);
    };

    if (pathname?.startsWith('/admin')) return null;
    if (chatIsOpen) return null;

    return (
        <div className="fixed z-[9999] bottom-20 right-4 md:bottom-6 md:right-6 flex flex-col items-center justify-end w-14 h-14 speed-dial-container">
            {/* Direct style overrides to bypass global DaisyUI / framework SVG constraints */}
            <style dangerouslySetInnerHTML={{ __html: `
                .speed-dial-container svg {
                    width: 30px !important;
                    height: 30px !important;
                }
                .speed-dial-container .speed-dial-trigger svg {
                    width: 34px !important;
                    height: 34px !important;
                }
            `}} />
            
            {/* Scroll to Top Button */}
            <button
                onClick={handleScrollToTop}
                aria-label="Scroll to top"
                className="absolute flex items-center justify-center !p-0 rounded-full bg-white shadow-xl ring-1 ring-black/5 hover:bg-gray-50 text-gray-700 active:scale-95 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer outline-none w-14 h-14"
                style={{
                    transform: `translateY(${
                        showScrollToTop 
                            ? (isOpen 
                                ? '-216px'
                                : '-72px'
                              ) 
                            : '40px'
                    }) translateX(0px) scale(${showScrollToTop ? 1 : 0})`,
                    opacity: showScrollToTop ? 1 : 0,
                    pointerEvents: showScrollToTop ? 'auto' : 'none',
                    zIndex: 10,
                    borderRadius: '9999px',
                }}
            >
                <ChevronUp size={30} strokeWidth={2} className="text-[#FF4F87] transition-transform duration-300 scroll-arrow" />
            </button>

            {/* Custom Flex FAB Container */}
            <div className="relative w-14 h-14 flex items-center justify-center">
                {/* Trigger Button (closed state) */}
                <div
                    role="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="btn btn-circle !p-0 w-14 h-14 rounded-full bg-gradient-to-tr from-[#FF4F87] to-[#FF75A0] text-white hover:brightness-110 shadow-xl shadow-[#FF4F87]/30 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] absolute cursor-pointer speed-dial-trigger border-none"
                    style={{
                        transform: `scale(${isOpen ? 0 : 1})`,
                        opacity: isOpen ? 0 : 1,
                        pointerEvents: isOpen ? 'none' : 'auto',
                        zIndex: 2,
                        borderRadius: '9999px',
                    }}
                >
                    <MessagesSquare size={34} strokeWidth={2} />
                </div>

                {/* Main Action Button (open state) */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="btn btn-circle !p-0 w-14 h-14 rounded-full bg-white text-black border border-white shadow-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] absolute cursor-pointer speed-dial-trigger"
                    style={{
                        transform: `scale(${isOpen ? 1 : 0}) rotate(${isOpen ? '180deg' : '0deg'})`,
                        opacity: isOpen ? 1 : 0,
                        pointerEvents: isOpen ? 'auto' : 'none',
                        zIndex: 3,
                        borderRadius: '9999px',
                    }}
                >
                    <X size={34} strokeWidth={2.5} className="text-[#FF4F87]" />
                </button>

                {/* 2. WhatsApp Option (Fans Left) */}
                <div 
                    className="tooltip tooltip-left absolute transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" 
                    data-tip="WhatsApp"
                    style={{
                        transform: `translateY(${isOpen ? '-144px' : '0px'}) translateX(0px) scale(${isOpen ? 1 : 0})`,
                        opacity: isOpen ? 1 : 0,
                        pointerEvents: isOpen ? 'auto' : 'none',
                        zIndex: 8,
                    }}
                >
                    <button
                        onClick={handleWhatsApp}
                        className="btn btn-circle !p-0 w-14 h-14 rounded-full bg-[#25D366] text-white hover:bg-[#20bd5a] shadow-xl border-none"
                        style={{ borderRadius: '9999px' }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="30"
                            height="30"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            style={{ width: '30px', height: '30px' }}
                        >
                            <path d="M19.007 4.908A9.817 9.817 0 0 0 11.992 2C6.534 2 2.085 6.448 2.08 11.91c0 1.748.458 3.45 1.321 4.956L2 22l5.251-1.378a9.8 9.8 0 0 0 4.732 1.22h.005c5.46 0 9.908-4.448 9.913-9.913a9.807 9.807 0 0 0-2.894-6.921zm-7.015 15.39a8.136 8.136 0 0 1-4.156-1.145l-.298-.177-3.093.81.824-3.017-.194-.31a8.151 8.151 0 0 1-1.25-4.347c.004-4.502 3.669-8.164 8.175-8.164a8.125 8.125 0 0 1 5.78 2.4 8.132 8.132 0 0 1 2.396 5.78c-.004 4.505-3.67 8.172-8.18 8.172zm4.48-6.132c-.245-.123-1.454-.717-1.68-.8-.224-.08-.388-.122-.55.123-.162.246-.63.8-.772.963-.143.164-.285.184-.53.06a6.68 6.68 0 0 1-1.968-1.215 7.37 7.37 0 0 1-1.36-1.697c-.143-.246-.015-.38.11-.503.11-.11.245-.287.37-.43.12-.143.162-.245.243-.41.082-.164.041-.307-.02-.43-.062-.124-.55-1.332-.752-1.823-.197-.475-.397-.411-.55-.419-.143-.008-.306-.008-.47-.008a.9.9 0 0 0-.65.307c-.224.246-.857.84-1.04 2.05.18 1.21.94 2.379 1.04 2.522.1.143 1.85 2.825 4.48 3.963.626.27 1.114.432 1.494.553.63.2 1.2.172 1.653.105.503-.074 1.454-.594 1.66-1.17.203-.573.203-1.065.142-1.17-.061-.103-.224-.163-.47-.285z" />
                        </svg>
                    </button>
                </div>

                {/* 3. Call Option (Directly straight up) */}
                <div 
                    className="tooltip tooltip-left absolute transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" 
                    data-tip="Call"
                    style={{
                        transform: `translateY(${isOpen ? '-72px' : '0px'}) translateX(0px) scale(${isOpen ? 1 : 0})`,
                        opacity: isOpen ? 1 : 0,
                        pointerEvents: isOpen ? 'auto' : 'none',
                        zIndex: 9,
                    }}
                >
                    <button
                        onClick={handleCall}
                        className="btn btn-circle !p-0 w-14 h-14 rounded-full bg-[#007AFF] text-white hover:bg-[#006bdd] shadow-xl border-none"
                        style={{ borderRadius: '9999px' }}
                    >
                        <Phone size={30} strokeWidth={2} />
                    </button>
                </div>
            </div>
        </div>
    );
}
