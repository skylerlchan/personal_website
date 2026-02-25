"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useMediaQuery } from "@/hooks/useMediaQuery";

type CursorVariant = "default" | "link" | "image";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [variant, setVariant] = useState<CursorVariant>("default");

  useEffect(() => {
    if (isMobile || !cursorRef.current) return;

    const cursor = cursorRef.current;

    const moveCursor = (e: MouseEvent) => {
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.15,
        ease: "power2.out",
      });
    };

    const onEnterLink = () => setVariant("link");
    const onEnterImage = () => setVariant("image");
    const onLeave = () => setVariant("default");

    window.addEventListener("mousemove", moveCursor);

    // Use MutationObserver to handle dynamically added elements
    const attachListeners = () => {
      const links = document.querySelectorAll(
        'a, button, [data-cursor="link"]'
      );
      const images = document.querySelectorAll(
        'img, video, [data-cursor="image"]'
      );

      links.forEach((el) => {
        el.addEventListener("mouseenter", onEnterLink);
        el.addEventListener("mouseleave", onLeave);
      });
      images.forEach((el) => {
        el.addEventListener("mouseenter", onEnterImage);
        el.addEventListener("mouseleave", onLeave);
      });

      return () => {
        links.forEach((el) => {
          el.removeEventListener("mouseenter", onEnterLink);
          el.removeEventListener("mouseleave", onLeave);
        });
        images.forEach((el) => {
          el.removeEventListener("mouseenter", onEnterImage);
          el.removeEventListener("mouseleave", onLeave);
        });
      };
    };

    let cleanup = attachListeners();

    const observer = new MutationObserver(() => {
      cleanup();
      cleanup = attachListeners();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      cleanup();
      observer.disconnect();
    };
  }, [isMobile]);

  // Animate cursor size/style based on variant
  useEffect(() => {
    if (!cursorRef.current || isMobile) return;

    gsap.to(cursorRef.current, {
      width: 12,
      height: 12,
      duration: 0.3,
      ease: "power2.out",
    });
  }, [variant, isMobile]);

  if (isMobile) return null;

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed top-0 left-0 z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground/50 bg-foreground/10 backdrop-blur-sm"
      style={{ width: 12, height: 12, mixBlendMode: variant === "image" ? "difference" : "normal" }}
    />
  );
}
