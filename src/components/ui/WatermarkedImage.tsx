"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

interface WatermarkedImageProps {
  src: string;
  alt: string;
  watermarkText?: string;
  className?: string;
  imageClassName?: string;
  style?: React.CSSProperties;
}

// Cap canvas size to keep toDataURL() fast and avoid main-thread jank.
// The overlay is invisible anyway so lower resolution is fine.
const MAX_CANVAS_DIM = 600;

export default function WatermarkedImage({
  src,
  alt,
  watermarkText = "techstore.bd",
  className = "",
  imageClassName = "object-cover",
  style,
}: WatermarkedImageProps) {
  const [watermarkedSrc, setWatermarkedSrc] = useState<string | null>(null);
  const idleCallbackRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const generateWatermark = () => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        if (!isMounted) return;

        // Scale down to MAX_CANVAS_DIM so toDataURL() is fast
        const scale = Math.min(1, MAX_CANVAS_DIM / Math.max(img.width || 1, img.height || 1));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx || !isMounted) return;

        ctx.drawImage(img, 0, 0, w, h);

        // Watermark text
        ctx.fillStyle = "rgba(128, 128, 128, 0.28)";
        const fontSize = Math.max(14, Math.floor(w / 10));
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.rotate((-45 * Math.PI) / 180);
        ctx.fillText(watermarkText, 0, 0);
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.lineWidth = Math.max(1, fontSize / 20);
        ctx.strokeText(watermarkText, 0, 0);
        ctx.restore();

        // JPEG at low quality is tiny — much faster than PNG
        const dataUrl = canvas.toDataURL("image/jpeg", 0.55);
        if (isMounted) setWatermarkedSrc(dataUrl);
      };

      img.onerror = () => { /* Silently fail — visible <Image /> still renders fine */ };
      img.src = src;
    };

    // Defer heavy canvas work until the browser has idle time
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleCallbackRef.current = window.requestIdleCallback(generateWatermark, { timeout: 4000 });
    } else {
      // Safari fallback: delay 800ms so initial render/interaction isn't blocked
      const t = setTimeout(generateWatermark, 800);
      return () => { isMounted = false; clearTimeout(t); };
    }

    return () => {
      isMounted = false;
      if (idleCallbackRef.current !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallbackRef.current);
      }
    };
  }, [src, watermarkText]);

  // On right-click: temporarily replace the container's background so that
  // "Save image as" in Chrome/Firefox picks up the watermarked src.
  const handleContextMenu = useCallback(() => {
    if (!watermarkedSrc || !containerRef.current) return;
    const overlay = containerRef.current.querySelector<HTMLImageElement>("img[data-watermark]");
    if (overlay) {
      // Make the overlay momentarily pointer-interactive so the browser's
      // native context menu targets it
      overlay.style.pointerEvents = "auto";
      setTimeout(() => {
        if (overlay) overlay.style.pointerEvents = "none";
      }, 500);
    }
  }, [watermarkedSrc]);

  const positionClass =
    className.includes("absolute") || className.includes("fixed") ? "" : "relative";

  return (
    <div
      ref={containerRef}
      className={`${positionClass} group overflow-hidden w-full h-full ${className}`}
      style={style}
      onContextMenu={handleContextMenu}
    >
      {/* Visible (un-watermarked) image */}
      <Image
        src={src}
        alt={alt}
        fill
        className={imageClassName}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />

      {/*
        Invisible watermarked overlay.
        - opacity-0: invisible to users
        - pointer-events-none by default: cursor stays normal, no hover lag
        - style={{ cursor: "inherit" }}: won't override parent cursor
        - data-watermark: used by handleContextMenu to find this element
        On right-click the parent briefly enables pointer-events so the browser
        native context menu targets this img (saving the watermarked version).
      */}
      {watermarkedSrc && (
        // eslint-disable-next-line @next/next/no-img-element -- src is a canvas data: URL; next/image does not support data: URLs.
        <img
          src={watermarkedSrc}
          alt={alt}
          data-watermark="true"
          className={`absolute inset-0 w-full h-full opacity-0 z-10 ${imageClassName}`}
          style={{ pointerEvents: "none", cursor: "inherit" }}
          draggable={false}
        />
      )}
    </div>
  );
}
