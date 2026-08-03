'use client';

import { useState, useRef, MouseEvent, useEffect } from 'react';
import WatermarkedImage from '@/components/ui/WatermarkedImage';

interface ProductImageZoomProps {
    src: string;
    alt: string;
    onClick?: () => void;
}

export default function ProductImageZoom({ src, alt, onClick }: ProductImageZoomProps) {
    const [zoomLevel, setZoomLevel] = useState(2);
    const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
    const [isHovered, setIsHovered] = useState(false);
    const [isDesktop, setIsDesktop] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;

        const { left, top, width, height } = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;

        setCursorPos({ x, y });
    };

    const handleZoomChange = (delta: number) => {
        setZoomLevel(prev => Math.min(Math.max(prev + delta, 1.5), 4));
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden group cursor-zoom-in"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseMove={handleMouseMove}
            onClick={onClick}
        >
            <WatermarkedImage
                src={src}
                alt={alt}
                className="absolute inset-0 w-full h-full transition-transform duration-200 ease-out"
                imageClassName="object-cover"
                style={{
                    transformOrigin: `${cursorPos.x}% ${cursorPos.y}%`,
                    transform: isHovered && isDesktop ? `scale(${zoomLevel})` : 'scale(1)',
                }}
            />

            {/* Zoom Controls */}
            <div
                className="hidden lg:flex absolute top-20 right-6 flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 overflow-hidden flex flex-col">
                    <button
                        onClick={() => handleZoomChange(0.5)}
                        className="p-2 hover:bg-gray-100 text-gray-700 transition-colors border-b border-gray-100"
                        title="Zoom In"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                    <button
                        onClick={() => handleZoomChange(-0.5)}
                        className="p-2 hover:bg-gray-100 text-gray-700 transition-colors"
                        title="Zoom Out"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
