"use client";

import React, { useState, useEffect } from "react";
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
  const [watermarkedSrc, setWatermarkedSrc] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const generateWatermark = async () => {
      try {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = src;
        });

        if (!isMounted) return;

        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) return;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Configure watermark styles
        ctx.fillStyle = "rgba(128, 128, 128, 0.25)"; // Faint gray
        const fontSize = Math.max(24, Math.floor(canvas.width / 12));
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Draw watermark diagonally across the center
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((-45 * Math.PI) / 180);
        ctx.fillText(watermarkText, 0, 0);
        
        // Faint white stroke
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = Math.max(1, fontSize / 20);
        ctx.strokeText(watermarkText, 0, 0);

        // Reset transforms
        ctx.rotate((45 * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);

        // Convert to data URL
        const dataUrl = canvas.toDataURL("image/png");
        if (isMounted) {
          setWatermarkedSrc(dataUrl);
        }
      } catch (err) {
        console.error("Failed to generate watermarked image overlay:", err);
      }
    };

    generateWatermark();

    return () => {
      isMounted = false;
    };
  }, [src, watermarkText]);

  const positionClass = className.includes('absolute') || className.includes('fixed') ? '' : 'relative';

  return (
    <div className={`${positionClass} group overflow-hidden w-full h-full ${className}`} style={style}>
      {/* The main visible (unwatermarked) image */}
      <Image
        src={src}
        alt={alt}
        fill
        className={imageClassName}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      
      {/* 
        The INVISIBLE watermarked image overlay!
        This ensures that when a user right-clicks and chooses "Save image as..." in Chrome, 
        they are interacting with this invisible layer, which forces Chrome to save the watermarked image instead.
      */}
      {watermarkedSrc && (
        <img 
          src={watermarkedSrc} 
          alt={alt}
          className={`absolute inset-0 w-full h-full opacity-0 z-10 cursor-context-menu ${imageClassName}`}
          draggable={false}
        />
      )}
    </div>
  );
}
