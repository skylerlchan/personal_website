"use client";

import { useEffect, useState, useRef } from "react";

export default function MobileSnapScroll() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalSections, setTotalSections] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const isScrollingRef = useRef(false);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);

  useEffect(() => {
    // Only run on mobile
    const mql = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mql.matches);

    if (!mql.matches) return;

    const sections = document.querySelectorAll("[data-snap]");
    setTotalSections(sections.length);

    // Update current section based on scroll position
    const updateCurrentSection = () => {
      if (isScrollingRef.current) return;

      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const index = Math.round(scrollTop / windowHeight);
      setCurrentIndex(Math.max(0, Math.min(index, sections.length - 1)));
    };

    updateCurrentSection();

    // Smooth snap scrolling with wheel events
    const handleWheel = (e: WheelEvent) => {
      if (isScrollingRef.current) {
        e.preventDefault();
        return;
      }

      const direction = e.deltaY > 0 ? 1 : -1;
      const newIndex = Math.max(0, Math.min(currentIndex + direction, sections.length - 1));

      if (newIndex !== currentIndex) {
        e.preventDefault();
        scrollToSection(newIndex);
      }
    };

    // Touch handling for smooth swipes
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchStartTime.current = Date.now();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isScrollingRef.current) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isScrollingRef.current) return;

      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchStartY.current - touchEndY;
      const absDelta = Math.abs(deltaY);
      const touchDuration = Date.now() - touchStartTime.current;

      // Swipe detected - minimum 30px movement
      if (absDelta > 30) {
        const direction = deltaY > 0 ? 1 : -1;
        const newIndex = Math.max(0, Math.min(currentIndex + direction, sections.length - 1));

        if (newIndex !== currentIndex) {
          e.preventDefault();
          scrollToSection(newIndex);
        }
      }
    };

    const scrollToSection = (index: number) => {
      isScrollingRef.current = true;
      const targetSection = sections[index] as HTMLElement;

      if (targetSection) {
        targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
        setCurrentIndex(index);

        setTimeout(() => {
          isScrollingRef.current = false;
        }, 800);
      }
    };

    // Passive scroll listener for indicator updates
    const handleScroll = () => {
      if (!isScrollingRef.current) {
        updateCurrentSection();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: false });
    window.addEventListener("scroll", handleScroll, { passive: true });

    const handleResize = () => updateCurrentSection();
    window.addEventListener("resize", handleResize);

    const mqHandler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", mqHandler);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      mql.removeEventListener("change", mqHandler);
    };
  }, [currentIndex]);

  const scrollToIndex = (index: number) => {
    const sections = document.querySelectorAll("[data-snap]");
    const targetSection = sections[index] as HTMLElement;

    if (targetSection) {
      isScrollingRef.current = true;
      targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentIndex(index);

      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    }
  };

  if (!isMobile || totalSections === 0) return null;

  return (
    <div className="snap-indicator">
      {Array.from({ length: totalSections }).map((_, index) => (
        <button
          key={index}
          className={`snap-dot ${index === currentIndex ? "active" : ""}`}
          onClick={() => scrollToIndex(index)}
          aria-label={`Go to section ${index + 1}`}
        />
      ))}
    </div>
  );
}
