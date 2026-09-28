"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A horizontal run of cards.
 *
 * Nine cards stacked vertically made the page a long scroll for something a
 * reader wants to skim. A rail puts the strongest first, keeps the whole page
 * inside a couple of screens, and lets someone who cares keep going right.
 *
 * Native overflow with scroll snapping does the work, so it flicks correctly
 * on a phone with no JavaScript involved. The arrows are a desktop
 * affordance only: without them a mouse user has no sign the row continues.
 */
export default function Rail({ label, children }: { label: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAt({ start: el.scrollLeft < 8, end: el.scrollLeft > max - 8 });
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  function nudge(dir: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    // One card plus its gap, so a press lands cleanly on the next snap point.
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 32 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  return (
    <section className="mt-14 sm:mt-20">
      <div className="flex items-baseline gap-4">
        <h2 className="label text-[var(--faint)]">{label}</h2>
        <div className="ml-auto hidden gap-1.5 sm:flex">
          <button
            type="button"
            onClick={() => nudge(-1)}
            disabled={at.start}
            aria-label={`Scroll ${label} left`}
            className="grid h-7 w-7 place-items-center rounded-full border border-[var(--line)] text-[var(--dim)] transition-colors hover:border-[var(--dim)] hover:text-[var(--ink)] disabled:opacity-30 disabled:hover:border-[var(--line)]"
          >
            <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3 5 8l5 5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => nudge(1)}
            disabled={at.end}
            aria-label={`Scroll ${label} right`}
            className="grid h-7 w-7 place-items-center rounded-full border border-[var(--line)] text-[var(--dim)] transition-colors hover:border-[var(--dim)] hover:text-[var(--ink)] disabled:opacity-30 disabled:hover:border-[var(--line)]"
          >
            <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3l5 5-5 5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bleeds to the right edge of the viewport, so it is visibly cut off
          rather than looking like a row that simply ends. */}
      {/* Vertical padding, not just horizontal: the row clips its own overflow
          on both axes, and without room the card shadow gets sliced off. */}
      <div ref={ref} className="rail -mr-5 mt-2 flex gap-6 overflow-x-auto px-px pb-5 pr-5 pt-2 sm:-mr-8 sm:gap-7 sm:pr-8">
        {children}
      </div>
    </section>
  );
}
