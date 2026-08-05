"use client";

import { useEffect, useState } from "react";
import { sections } from "@/sections";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

const VISIBLE = sections.filter((s) => s.id !== "hero").map((s) => ({
  id: s.id,
  label: s.label,
}));

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-40 transition-all duration-300",
          scrolled
            ? "backdrop-blur-xl bg-background/70 border-b border-border"
            : "bg-transparent border-b border-transparent",
        )}
      >
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 h-14 flex items-center justify-between">
          <a
            href="#hero"
            className="text-sm font-medium tracking-tight text-foreground hover:opacity-70 transition-opacity"
          >
            Skyler Chan
          </a>

          <nav className="hidden sm:flex items-center gap-1">
            {VISIBLE.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="text-sm text-muted hover:text-foreground px-3 py-1.5 rounded-full hover:bg-surface transition-colors"
              >
                {item.label}
              </a>
            ))}
            <div className="w-px h-4 bg-border mx-1" />
            <ThemeToggle />
          </nav>

          {/* Read-progress rail. Scaled on a scroll timeline, so it tracks the
              document on the compositor rather than through a scroll handler. */}
          <div
            aria-hidden
            className="scroll-rail absolute inset-x-0 bottom-0 h-px origin-left bg-accent"
          />

          <div className="flex sm:hidden items-center gap-1">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={open}
              className="grid place-items-center w-11 h-11 rounded-full text-muted hover:text-foreground hover:bg-surface transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {open ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="4" y1="7" x2="20" y2="7" />
                    <line x1="4" y1="17" x2="20" y2="17" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu sheet */}
      <div
        className={cn(
          "fixed inset-x-0 top-14 z-30 sm:hidden transition-all duration-300",
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none",
        )}
      >
        <div className="bg-background border-b border-border">
          <nav className="max-w-6xl mx-auto px-6 py-4 flex flex-col">
            {VISIBLE.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setOpen(false)}
                className="py-3 text-foreground text-lg border-b border-border last:border-b-0"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
