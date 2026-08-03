"use client";

import React, { useState } from "react";
import Image from "next/image";

interface WatermarkedImageProps {
  src: string;
  alt: string;
  watermarkText?: string;
  className?: string;
  imageClassName?: string;
  style?: React.CSSProperties;
}

export default function WatermarkedImage({
  src,
  alt,
  watermarkText = "techstore.bd",
  className = "",
  imageClassName = "object-cover",
  style,
}: WatermarkedImageProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = src;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) throw new Error("Could not get canvas context");

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Configure watermark styles
      ctx.fillStyle = "rgba(128, 128, 128, 0.4)"; // Gray transparent
      const fontSize = Math.max(24, Math.floor(canvas.width / 12));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Draw watermark diagonally across the center
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((-45 * Math.PI) / 180);
      ctx.fillText(watermarkText, 0, 0);
      
      // Optional: Add a very faint white stroke so it's visible on both dark and light backgrounds
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = Math.max(1, fontSize / 20);
      ctx.strokeText(watermarkText, 0, 0);

      // Reset transforms
      ctx.rotate((45 * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      // Convert to file and download
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      const filename = src.split('/').pop()?.split('?')[0] || 'product-image';
      a.download = `${watermarkText}-${filename}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

    } catch (err) {
      console.error("Failed to generate watermarked image:", err);
      alert("Failed to download image. It might be blocked by browser security rules (CORS).");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={`relative group overflow-hidden ${className}`} style={style}>
      {/* The main image */}
      <Image
        src={src}
        alt={alt}
        fill
        className={imageClassName}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      
      {/* Visual CSS overlay for the website (matches the downloaded look) */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div 
          className="text-gray-500/40 font-bold select-none whitespace-nowrap transform -rotate-45"
          style={{ fontSize: 'clamp(1.5rem, 8vw, 4rem)', WebkitTextStroke: '1px rgba(255,255,255,0.3)' }}
        >
          {watermarkText}
        </div>
      </div>

      {/* Download button overlay */}
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="absolute bottom-3 right-3 bg-white/80 hover:bg-white text-gray-800 p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md flex items-center justify-center backdrop-blur-sm"
        title="Download Image"
      >
        {isDownloading ? (
          <svg className="animate-spin h-5 w-5 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        )}
      </button>
    </div>
  );
}
