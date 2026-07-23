'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollToTop() {
    const btnRef = useRef<HTMLButtonElement>(null);
    const progressRef = useRef<SVGCircleElement>(null);
    const rafRef = useRef<number>(0);
    const pathname = usePathname();

    // SVG circle math (static)
    const size = 44;
    const strokeWidth = 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const updateProgress = useCallback(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const btn = btnRef.current;
        const circle = progressRef.current;
        if (!btn || !circle) return;

        if (docHeight <= 0) {
            circle.style.strokeDashoffset = String(circumference);
            btn.style.opacity = '0';
            btn.style.pointerEvents = 'none';
            btn.style.transform = 'translateY(12px) scale(0.8)';
            return;
        }

        const progress = Math.min(scrollTop / docHeight, 1);
        const visible = scrollTop > 200;

        circle.style.strokeDashoffset = String(circumference - progress * circumference);
        btn.style.opacity = visible ? '1' : '0';
        btn.style.pointerEvents = visible ? 'auto' : 'none';
        btn.style.transform = visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.8)';
    }, [circumference]);

    useEffect(() => {
        const handleScroll = () => {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(updateProgress);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        // Initial check via rAF (no sync setState)
        rafRef.current = requestAnimationFrame(updateProgress);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            cancelAnimationFrame(rafRef.current);
        };
    }, [updateProgress]);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (pathname?.startsWith('/admin')) {
        return null;
    }

    return (
        <button
            ref={btnRef}
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className="scroll-to-top-btn"
            style={{
                position: 'fixed',
                bottom: 'calc(5rem + 30px)',
                right: 'calc(1rem + 68px)',
                zIndex: 49,
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                background: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.05), 0 8px 32px rgba(0, 0, 0, 0.12)',
                opacity: 0,
                pointerEvents: 'none',
                transform: 'translateY(12px) scale(0.8)',
                transition: 'opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
        >

            {/* SVG progress ring */}
            <svg
                width={size}
                height={size}
                style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
            >
                {/* Track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(0,0,0,0.06)"
                    strokeWidth={strokeWidth}
                />
                {/* Progress */}
                <circle
                    ref={progressRef}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(0,0,0,0.2)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference}
                    style={{
                        transition: 'stroke-dashoffset 0.1s linear',
                    }}
                />
                <defs>
                    <linearGradient id="scrollGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Arrow icon */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                    position: 'relative',
                    zIndex: 1,
                    color: '#4B5563',
                    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                className="scroll-to-top-arrow"
            >
                <path d="M12 19V5" />
                <path d="m5 12 7-7 7 7" />
            </svg>

            <style>{`
                .scroll-to-top-btn:hover .scroll-to-top-arrow {
                    transform: translateY(-2px);
                }
                .scroll-to-top-btn:active .scroll-to-top-arrow {
                    transform: translateY(0);
                }
                .scroll-to-top-btn:hover span {
                    background: rgba(255,255,255,0.95) !important;
                    box-shadow: 0 6px 28px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08) !important;
                }
                @media (max-width: 767px) {
                    .scroll-to-top-btn {
                        bottom: 150px !important;
                        right: 20px !important;
                        left: auto !important;
                    }
                }
                @media (min-width: 768px) {
                    .scroll-to-top-btn {
                        bottom: calc(1.5rem + 30px) !important;
                        right: calc(1.5rem + 68px) !important;
                    }
                }
            `}</style>
        </button>
    );
}
