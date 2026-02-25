"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { FOOD_PLACES_PHOTOS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/* ── Slight random rotations for scrapbook feel ── */
const ROTATIONS = [-1.5, 1.2, -0.8, 1.8, -1.2, 0.6, -1.8, 1, -0.5];

export default function TravelAlbum() {
  const [current, setCurrent] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const total = FOOD_PLACES_PHOTOS.length;

  const goTo = useCallback((idx: number) => {
    setCurrent((idx + total) % total);
  }, [total]);

  /* ── Native touch listeners (non-passive) to block vertical scroll during horizontal swipe ── */
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let deltaX = 0;
    let direction: "h" | "v" | null = null;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      deltaX = 0;
      direction = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;

      if (direction === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        direction = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      }

      if (direction === "h") {
        e.preventDefault(); // stop vertical snap-scroll
        deltaX = dx;
      }
    };

    const onTouchEnd = () => {
      if (direction === "h" && Math.abs(deltaX) > 50) {
        setCurrent((prev) => (prev + (deltaX < 0 ? 1 : -1) + total) % total);
      }
      direction = null;
      deltaX = 0;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [total]);

  const photo = FOOD_PLACES_PHOTOS[current];

  return (
    <div>
      <div className="text-center mb-4 sm:mb-8">
        <h3 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
          Food &amp; Places
        </h3>
      </div>

      {/* Desktop: masonry columns */}
      <div className="hidden sm:block sm:columns-3 sm:gap-3 lg:gap-4">
        {FOOD_PLACES_PHOTOS.map((photo, i) => (
          <div
            key={photo.src}
            className={cn(
              "group relative mb-3 lg:mb-4 break-inside-avoid",
              "rounded-lg overflow-hidden",
              "shadow-md shadow-black/8 dark:shadow-black/25",
              "ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
              "transition-all duration-300",
              "hover:shadow-lg hover:scale-[1.02]"
            )}
            style={{ transform: `rotate(${ROTATIONS[i % ROTATIONS.length]}deg)` }}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              width={photo.orientation === "landscape" ? 600 : 450}
              height={photo.orientation === "landscape" ? 450 : 600}
              className="w-full h-auto object-cover"
              sizes="(min-width: 1024px) 33vw, 50vw"
            />
          </div>
        ))}
      </div>

      {/* Mobile: slideshow mode */}
      <div className="sm:hidden">
        <div
          ref={carouselRef}
          className="relative overflow-hidden rounded-xl mx-auto"
        >
          {/* Image container – fixed height so portrait/landscape don't shift layout */}
          <div
            className={cn(
              "relative mx-auto rounded-xl overflow-hidden",
              "shadow-lg shadow-black/10 dark:shadow-black/30",
              "ring-1 ring-black/[0.06] dark:ring-white/[0.08]"
            )}
            style={{ transform: `rotate(${ROTATIONS[current % ROTATIONS.length]}deg)` }}
          >
            <div className="relative w-full h-[55dvh]">
              {FOOD_PLACES_PHOTOS.map((p, i) => (
                <Image
                  key={p.src}
                  src={p.src}
                  alt={p.alt}
                  fill
                  className={cn(
                    "object-cover transition-opacity duration-500",
                    i === current ? "opacity-100" : "opacity-0"
                  )}
                  sizes="90vw"
                  priority={i === 0}
                />
              ))}
            </div>
          </div>

          {/* Prev / Next tap zones */}
          <button
            aria-label="Previous photo"
            className="absolute left-0 top-0 h-full w-1/4 z-10"
            onClick={() => goTo(current - 1)}
          />
          <button
            aria-label="Next photo"
            className="absolute right-0 top-0 h-full w-1/4 z-10"
            onClick={() => goTo(current + 1)}
          />

          {/* Arrows */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2 z-20">
            <button
              aria-label="Previous photo"
              className="pointer-events-auto w-8 h-8 rounded-full bg-black/25 dark:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"
              onClick={() => goTo(current - 1)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              aria-label="Next photo"
              className="pointer-events-auto w-8 h-8 rounded-full bg-black/25 dark:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"
              onClick={() => goTo(current + 1)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Caption */}
        <p className="text-center text-sm text-foreground/60 mt-3 transition-opacity duration-300">
          {photo.alt}
        </p>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 mt-2">
          {FOOD_PLACES_PHOTOS.map((p, i) => (
            <button
              key={p.src}
              aria-label={`Go to photo ${i + 1}`}
              className={cn(
                "rounded-full transition-all duration-300",
                i === current
                  ? "w-4 h-1.5 bg-foreground/60"
                  : "w-1.5 h-1.5 bg-foreground/15"
              )}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>

        {/* Counter */}
        <p className="text-center text-xs text-foreground/40 mt-1.5">
          {current + 1} / {total}
        </p>
      </div>
    </div>
  );
}
