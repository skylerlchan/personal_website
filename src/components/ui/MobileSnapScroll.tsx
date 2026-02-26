"use client";

import { useEffect, useState, useRef } from "react";

export default function MobileSnapScroll() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalSections, setTotalSections] = useState(0);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastScrollTime = useRef(0);

  useEffect(() => {
    // Only run on mobile
    const mql = window.matchMedia("(max-width: 1023px)");
    if (!mql.matches) return;

    const sections = document.querySelectorAll("[data-snap]");
    setTotalSections(sections.length);

    // Determine current section on mount
    const updateCurrentSection = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const index = Math.round(scrollTop / windowHeight);
      setCurrentIndex(Math.max(0, Math.min(index, sections.length - 1)));
    };

    updateCurrentSection();

    // Strict single-section scroll enforcement
    const handleScroll = () => {
      const now = Date.now();

      // Debounce rapid scroll events
      if (now - lastScrollTime.current < 50) {
        return;
      }
      lastScrollTime.current = now;

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // After scroll stops, snap to nearest section
      scrollTimeoutRef.current = setTimeout(() => {
        if (!isScrollingRef.current) {
          const scrollTop = window.scrollY || document.documentElement.scrollTop;
          const windowHeight = window.innerHeight;
          const targetIndex = Math.round(scrollTop / windowHeight);
          const targetSection = sections[targetIndex];

          if (targetSection) {
            isScrollingRef.current = true;
            targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
            setCurrentIndex(targetIndex);

            setTimeout(() => {
              isScrollingRef.current = false;
            }, 500);
          }
        }
      }, 100);
    };

    // Touch handling for swipe gestures
    let touchStartY = 0;
    let touchStartTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isScrollingRef.current) return;

      const touchEndY = e.changedTouches[0].clientY;
      const touchDuration = Date.now() - touchStartTime;
      const deltaY = touchStartY - touchEndY;
      const absDelta = Math.abs(deltaY);

      // Detect deliberate swipe (minimum distance and velocity)
      if (absDelta > 50 && touchDuration < 300) {
        e.preventDefault();
        isScrollingRef.current = true;

        const direction = deltaY > 0 ? 1 : -1;
        const newIndex = Math.max(
          0,
          Math.min(currentIndex + direction, sections.length - 1)
        );

        const targetSection = sections[newIndex];
        if (targetSection) {
          targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
          setCurrentIndex(newIndex);

          setTimeout(() => {
            isScrollingRef.current = false;
          }, 500);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: false });

    // Update on resize
    const handleResize = () => {
      updateCurrentSection();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("resize", handleResize);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [currentIndex]);

  // Only show on mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  if (!isMobile || totalSections === 0) return null;

  return (
    <div className="snap-indicator">
      {Array.from({ length: totalSections }).map((_, index) => (
        <button
          key={index}
          className={`snap-dot ${index === currentIndex ? "active" : ""}`}
          onClick={() => {
            const sections = document.querySelectorAll("[data-snap]");
            const targetSection = sections[index];
            if (targetSection) {
              isScrollingRef.current = true;
              targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
              setCurrentIndex(index);
              setTimeout(() => {
                isScrollingRef.current = false;
              }, 500);
            }
          }}
          aria-label={`Go to section ${index + 1}`}
        />
      ))}
    </div>
  );
}
