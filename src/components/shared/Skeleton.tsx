'use client';

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    borderRadius?: string;
}

export default function Skeleton({
    className = '',
    width,
    height,
    borderRadius = '0.5rem',
}: SkeletonProps) {
    const style: React.CSSProperties = {
        width: width,
        height: height,
        borderRadius: borderRadius,
    };

    return (
        <div
            className={`animate-pulse bg-gray-200/60 ${className}`}
            style={style}
        />
    );
}
