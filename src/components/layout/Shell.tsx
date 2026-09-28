"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AskDrawer from "@/components/AskDrawer";

/**
 * The frame every page sits in: a thin header, and the model in a drawer on
 * the right.
 *
 * The chat used to be the whole home page. It is a side panel now, which is
 * the right relationship: the site is the work, and the model is a way to
 * interrogate it. Opening the drawer never navigates, so you keep your place.
 */


export default function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[84rem] items-center gap-4 px-5 sm:gap-6 sm:px-8">
          <Link href="/" className="label shrink-0 font-medium text-[var(--ink)]">
            Skyler Chan
          </Link>
          <span className="label hidden text-[var(--faint)] md:inline">Engineer + Researcher</span>

          <nav aria-label="Sections" className="ml-auto flex items-center gap-4 sm:gap-7">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              className="label group flex items-center gap-2 text-[var(--dim)] transition-colors hover:text-[var(--ink)]"
            >
              <span
                aria-hidden
                className="grid h-5 w-5 place-items-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)] transition-colors group-hover:bg-[var(--accent)]/20"
              >
                <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor">
                  <path d="M8 0.5l1.6 4.6 4.6 1.6-4.6 1.6L8 12.9 6.4 8.3 1.8 6.7l4.6-1.6z" />
                </svg>
              </span>
              <span className="hidden sm:inline">Ask Skyler</span>
              <span className="sm:hidden">Ask</span>
            </button>
          </nav>
        </div>
      </header>

      {children}

      <div className="drawer-scrim" data-open={open} onClick={close} aria-hidden />
      <AskDrawer open={open} onClose={close} />
    </>
  );
}
