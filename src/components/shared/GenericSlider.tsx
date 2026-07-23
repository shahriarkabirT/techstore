"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

interface GenericSliderProps {
  children: React.ReactNode[];
  autoplay?: boolean;
  autoplayInterval?: number;
  showArrows?: boolean;
  showDots?: boolean;
  pauseOnHover?: boolean;
  gap?: number;
  loop?: boolean;
  className?: string;
  slidesPerView?:
    | number
    | {
        mobile: number;
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
        "2xl"?: number;
      };
}

export default function GenericSlider({
  children,
  autoplay = true,
  autoplayInterval = 3500,
  showArrows = true,
  showDots = true,
  pauseOnHover = true,
  gap = 16,
  loop = true,
  className = "",
  slidesPerView,
}: GenericSliderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const snapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unpauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  // touch momentum state
  const touchStartX = useRef(0);
  const touchLastX = useRef(0);
  const touchLastTime = useRef(0);
  const touchVelocity = useRef(0);

  // desktop drag state
  const [isDragging, setIsDragging] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const dragStartX = useRef(0);
  const dragScrollStart = useRef(0);
  const dragDistance = useRef(0);
  const [activeDot, setActiveDot] = useState(0);
  const [visibleItems, setVisibleItems] = useState(1);

  // Calculate visible items based on screen width
  useEffect(() => {
    const updateVisible = () => {
      const width = window.innerWidth;
      if (typeof slidesPerView === "number") {
        setVisibleItems(slidesPerView);
        return;
      }
      
      const config = {
        mobile: 1.2,
        sm: 2,
        md: 2,
        lg: 3,
        xl: 4,
        "2xl": 4,
        ...slidesPerView,
      };

      if (width >= 1536) setVisibleItems(config["2xl"]);
      else if (width >= 1280) setVisibleItems(config.xl);
      else if (width >= 1024) setVisibleItems(config.lg);
      else if (width >= 768) setVisibleItems(config.md);
      else if (width >= 640) setVisibleItems(config.sm);
      else setVisibleItems(config.mobile);
    };

    updateVisible();
    window.addEventListener("resize", updateVisible);
    return () => window.removeEventListener("resize", updateVisible);
  }, [slidesPerView]);

  const cancelMomentum = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const snapToNearest = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const firstChild = container.firstElementChild as HTMLElement | null;
    if (!firstChild) return;
    const itemWidth = firstChild.offsetWidth + gap;
    const nearestIndex = Math.round(container.scrollLeft / itemWidth);
    container.scrollTo({ left: nearestIndex * itemWidth, behavior: "smooth" });
  }, [gap]);

  const scheduleUnpause = useCallback(() => {
    if (unpauseTimeoutRef.current) clearTimeout(unpauseTimeoutRef.current);
    unpauseTimeoutRef.current = setTimeout(() => setIsPaused(false), 5000);
  }, []);

  const scroll = useCallback(
    (direction: "left" | "right") => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const firstChild = container.firstElementChild as HTMLElement | null;
      if (!firstChild) return;
      const scrollAmount = firstChild.offsetWidth + gap;
      container.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    },
    [gap],
  );

  // dot tracker
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const updateDot = () => {
      const firstChild = container.firstElementChild as HTMLElement | null;
      if (!firstChild) return;
      const itemWidth = firstChild.offsetWidth + gap;
      const scrollPos = container.scrollLeft;
      const currentIndex = Math.round(scrollPos / itemWidth);
      setActiveDot(Math.floor(currentIndex / visibleItems));
    };
    container.addEventListener("scroll", updateDot, { passive: true });
    return () => container.removeEventListener("scroll", updateDot);
  }, [visibleItems, gap]);

  // auto-advance
  useEffect(() => {
    if (!children || children.length <= 1 || isDragging || isPaused || !autoplay)
      return;
    const interval = setInterval(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const { scrollLeft, scrollWidth, clientWidth } = container;
      if (Math.ceil(scrollLeft + clientWidth) >= scrollWidth - 10) {
        if (loop) {
          container.scrollTo({ left: 0, behavior: "smooth" });
        }
      } else {
        scroll("right");
      }
    }, autoplayInterval);
    return () => clearInterval(interval);
  }, [children, isDragging, isPaused, scroll, autoplay, autoplayInterval, loop]);

  // TOUCH handlers for momentum scrolling
  const handleTouchStart = (e: React.TouchEvent) => {
    cancelMomentum();
    setIsPaused(true);
    if (unpauseTimeoutRef.current) clearTimeout(unpauseTimeoutRef.current);

    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.scrollSnapType = "none";
    }

    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchLastX.current = touch.clientX;
    touchLastTime.current = performance.now();
    touchVelocity.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const touch = e.touches[0];
    const now = performance.now();
    const dx = touchLastX.current - touch.clientX;
    const dt = now - touchLastTime.current;

    if (dt > 0) {
      const instantV = dx / dt;
      touchVelocity.current = touchVelocity.current * 0.6 + instantV * 0.4;
    }

    container.scrollLeft += dx;
    touchLastX.current = touch.clientX;
    touchLastTime.current = now;
  };

  const handleTouchEnd = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let velocity = touchVelocity.current * 16;
    const deceleration = 0.92;
    const minVelocity = 0.5;

    const momentumStep = () => {
      if (!container || Math.abs(velocity) < minVelocity) {
        snapToNearest();
        if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
        snapTimeoutRef.current = setTimeout(() => {
          if (container) container.style.scrollSnapType = "x mandatory";
        }, 400);
        scheduleUnpause();
        return;
      }

      container.scrollLeft += velocity;
      velocity *= deceleration;

      const { scrollLeft, scrollWidth, clientWidth } = container;
      if (scrollLeft <= 0 || scrollLeft + clientWidth >= scrollWidth) {
        snapToNearest();
        scheduleUnpause();
        return;
      }

      rafRef.current = requestAnimationFrame(momentumStep);
    };

    rafRef.current = requestAnimationFrame(momentumStep);
  };

  // DESKTOP mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    cancelMomentum();
    setIsPaused(true);
    if (unpauseTimeoutRef.current) clearTimeout(unpauseTimeoutRef.current);
    if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);

    setIsDragging(true);
    dragDistance.current = 0;
    dragStartX.current = e.pageX - container.offsetLeft;
    dragScrollStart.current = container.scrollLeft;
    container.style.scrollSnapType = "none";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - dragStartX.current) * 1.5;
    dragDistance.current = Math.abs(walk);
    scrollContainerRef.current.scrollLeft = dragScrollStart.current - walk;
  };

  const finalizeDrag = () => {
    if (!isDragging) return;
    setIsDragging(false);
    snapToNearest();
    if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
    snapTimeoutRef.current = setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.style.scrollSnapType = "x mandatory";
      }
    }, 400);
    scheduleUnpause();
  };

  useEffect(() => () => {
    cancelMomentum();
    if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
    if (unpauseTimeoutRef.current) clearTimeout(unpauseTimeoutRef.current);
  }, []);

  const slideWidth = `calc((100% - ${(visibleItems - 1) * gap}px) / ${visibleItems})`;

  return (
    <div 
      className={`w-full relative ${className}`}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      <div className="flex items-center justify-between mb-4">
        {/* Navigation Arrows */}
        {showArrows && children.length > visibleItems && (
          <div className="flex items-center gap-2 ml-auto z-10">
            <button
              onClick={() => scroll("left")}
              className="w-8 h-8 rounded-full border border-gray-700 bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-gray-100 hover:text-black hover:border-gray-100 transition-all focus:outline-none"
              aria-label="Previous slide"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5 8.25 12l7.5-7.5"
                />
              </svg>
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-8 h-8 rounded-full border border-gray-700 bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-gray-100 hover:text-black hover:border-gray-100 transition-all focus:outline-none"
              aria-label="Next slide"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5 15.75 12l-7.5 7.5"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        .hide-slider-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-slider-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div
        className={`relative w-full overflow-hidden ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onClickCapture={(e) => {
          if (dragDistance.current > 5) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
        onDragStart={(e) => e.preventDefault()}
      >
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={finalizeDrag}
          onMouseUp={finalizeDrag}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="flex overflow-x-auto snap-x snap-mandatory hide-slider-scrollbar"
          style={{
            gap: `${gap}px`,
            touchAction: "pan-y pinch-zoom",
            willChange: "scroll-position",
          }}
        >
          {children.map((child, index) => (
            <div
              key={index}
              className="flex-none snap-start select-none"
              style={{
                width: slideWidth,
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      {showDots && children.length > visibleItems && (
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {Array.from({
            length: Math.max(2, Math.ceil(children.length / visibleItems)),
          }).map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide page ${i + 1}`}
              onClick={() => {
                const container = scrollContainerRef.current;
                if (!container) return;
                const firstChild = container.firstElementChild as HTMLElement | null;
                if (!firstChild) return;
                const itemWidth = firstChild.offsetWidth + gap;
                const targetIndex = i * Math.floor(visibleItems);
                container.scrollTo({
                  left: targetIndex * itemWidth,
                  behavior: "smooth",
                });
              }}
              className={`rounded-full transition-all duration-300 ${
                activeDot === i
                  ? "w-4 h-1.5 bg-red-500"
                  : "w-1.5 h-1.5 bg-gray-600 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
