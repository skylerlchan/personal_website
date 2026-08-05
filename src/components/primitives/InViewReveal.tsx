"use client";

import { useEffect } from "react";

/**
 * Tiny global observer. Adds `is-visible` to any element with `in-view`
 * when it enters the viewport. ~30 lines of JS, no library.
 */
export default function InViewReveal() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document
        .querySelectorAll<HTMLElement>(".in-view")
        .forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );

    document
      .querySelectorAll<HTMLElement>(".in-view")
      .forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, []);

  return null;
}
