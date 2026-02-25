"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useLenis } from "lenis/react";
import { SECTIONS } from "@/lib/constants";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

// Mobile: contact section shown as single "Connect" page
const MOBILE_SECTIONS = [
  { id: "hero", label: "Intro" },
  { id: "work", label: "Work" },
  { id: "project", label: "Project" },
  { id: "hobbies", label: "Hobbies" },
  { id: "contact", label: "Connect" },
];

export default function ScrollProgress() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeProjectSlug, setActiveProjectSlug] = useState<string | null>(null);
  const [sectionProgress, setSectionProgress] = useState<Record<string, number>>({});
  const [isMobile, setIsMobile] = useState(false);

  // Refs for batching updates
  const rafId = useRef<number | null>(null);
  const latestState = useRef({ activeIndex: 0, slug: null as string | null, progress: {} as Record<string, number> });

  // Lock to prevent scroll detection from overriding during programmatic navigation
  const navLock = useRef(false);

  // Lenis instance for smooth navigation (single scroll controller)
  const lenis = useLenis();

  // Detect mobile viewport
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const scheduleUpdate = useCallback(() => {
    if (rafId.current) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      const { activeIndex: ai, slug, progress } = latestState.current;
      setActiveIndex(ai);
      setActiveProjectSlug(slug);
      setSectionProgress(progress);
    });
  }, []);

  useGSAP(() => {
    // Skip heavy scroll tracking on mobile - use IntersectionObserver instead
    if (isMobile) {
      // Lightweight mobile tracking using IntersectionObserver
      const sections = SECTIONS.map(s => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
              const index = sections.indexOf(entry.target as HTMLElement);
              if (index !== -1 && index !== latestState.current.activeIndex) {
                latestState.current.activeIndex = index;
                scheduleUpdate();
              }
            }
          });
        },
        { threshold: [0.5], rootMargin: '-10% 0px -10% 0px' }
      );

      sections.forEach(el => observer.observe(el));
      return () => observer.disconnect();
    }

    // Desktop: Active section + sub-item tracking with ScrollTrigger
    ScrollTrigger.create({
      trigger: document.documentElement,
      start: "top top",
      end: "bottom bottom",
      onUpdate: () => {
        const vpCenter = window.scrollY + window.innerHeight / 2;
        let closest = 0;

        // Range-based: each section owns from its top to the next section's top.
        // Pick the last section whose top is at or above the viewport center.
        SECTIONS.forEach((section, index) => {
          const el = document.getElementById(section.id);
          if (!el) return;
          const sectionTop = window.scrollY + el.getBoundingClientRect().top;
          if (vpCenter >= sectionTop) {
            closest = index;
          }
        });

        // Track which project panel is active
        let currentSlug: string | null = null;
        const projectEls = document.querySelectorAll<HTMLElement>("[data-project]");
        let projectClosestDist = Infinity;
        projectEls.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const center = window.scrollY + rect.top + rect.height / 2;
          const dist = Math.abs(vpCenter - center);
          if (dist < projectClosestDist) {
            projectClosestDist = dist;
            currentSlug = el.dataset.project ?? null;
          }
        });

        // Calculate per-section progress for sections with children
        const newProgress: Record<string, number> = {};
        SECTIONS.forEach((section) => {
          if (!("children" in section) || !section.children) return;
          const el = document.getElementById(section.id);
          if (!el) return;

          // Find the full extent of this section (from section start to last child end)
          const children = section.children;
          // Compute progress from element positions
          const lastChild = document.querySelector<HTMLElement>(
            `[data-project="${children[children.length - 1].id}"]`
          );
          if (!lastChild) return;

          const sectionTop = el.getBoundingClientRect().top + window.scrollY;
          const lastChildBottom =
            lastChild.getBoundingClientRect().bottom + window.scrollY;
          const totalHeight = lastChildBottom - sectionTop;

          if (totalHeight <= 0) return;
          const scrolled = vpCenter - sectionTop;
          newProgress[section.id] = Math.max(0, Math.min(1, scrolled / totalHeight));
        });

        // Force last section to 100% when at the bottom of the page
        const isAtBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
        if (isAtBottom) {
          const lastSection = SECTIONS[SECTIONS.length - 1];
          if ("children" in lastSection && lastSection.children) {
            newProgress[lastSection.id] = 1;
          }
        }

        // During programmatic navigation, keep the committed activeIndex
        const resolvedIndex = navLock.current ? latestState.current.activeIndex : closest;
        latestState.current = { activeIndex: resolvedIndex, slug: currentSlug, progress: newProgress };
        scheduleUpdate();
      },
    });

    // NOTE: No GSAP snap here — snap is handled by Lenis in LenisProvider
    // to avoid the Lenis/GSAP scroll-control conflict.
  }, [isMobile, scheduleUpdate]);

  // Derive mobile active index: contact section maps to single "Connect"
  const mobileActiveIndex = activeIndex < SECTIONS.length - 1
    ? activeIndex
    : MOBILE_SECTIONS.length - 1;

  const scrollTo = (id: string, sectionIndex?: number) => {
    // Immediately commit the active section (don't wait for scroll to catch up)
    if (sectionIndex !== undefined) {
      setActiveIndex(sectionIndex);
      latestState.current.activeIndex = sectionIndex;
      navLock.current = true;
    }

    const lenisScroll = (el: HTMLElement) => {
      if (lenis) {
        lenis.scrollTo(el, {
          duration: 1.2,
          onComplete: () => { navLock.current = false; },
        });
      } else {
        // Mobile: use direct scrollIntoView without fighting scroll-snap
        el.scrollIntoView({ behavior: "instant", block: "start" });
        navLock.current = false;
      }
    };

    const el = document.getElementById(id)
      || document.querySelector<HTMLElement>(`[data-project="${id}"]`);
    if (el) lenisScroll(el);
  };

  return (
    <>
      {/* ── Mobile: horizontal top bar ── */}
      <aside
        className="fixed top-0 left-0 right-0 z-40 sm:hidden backdrop-blur-xl bg-surface/80 border-b border-foreground/5"
        aria-label="Site navigation"
      >
        <div className="flex items-center justify-between px-2 py-2.5 gap-2">
          {/* Section dots/labels row */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {MOBILE_SECTIONS.map((section, index) => {
              const isActive = index === mobileActiveIndex;
              const isPast = index < mobileActiveIndex;
              // Map mobile index to desktop section index for scroll lock
              const desktopIndex = Math.min(index, SECTIONS.length - 1);

              return (
                <button
                  key={section.id}
                  onClick={() => scrollTo(section.id, desktopIndex)}
                  className="group flex flex-col items-center gap-0.5 cursor-pointer py-1 px-1 min-w-0 flex-1"
                  aria-label={section.label}
                >
                  {/* Dot indicator */}
                  <span
                    className={cn(
                      "block rounded-full transition-all duration-300",
                      isActive
                        ? "w-2 h-2 bg-accent"
                        : isPast
                          ? "w-1.5 h-1.5 bg-accent/50"
                          : "w-1.5 h-1.5 bg-foreground/20"
                    )}
                  />
                  {/* Label */}
                  <span
                    className={cn(
                      "text-[7px] font-mono uppercase tracking-[0.04em] truncate max-w-full",
                      "transition-all duration-300",
                      isActive
                        ? "text-accent opacity-100"
                        : isPast
                          ? "text-muted opacity-40"
                          : "text-muted opacity-25"
                    )}
                  >
                    {section.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Theme toggle */}
          <ThemeToggle />
        </div>
      </aside>

      {/* ── Desktop: vertical right sidebar ── */}
      <aside
        className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 hidden sm:block"
        aria-label="Site navigation"
      >
        <div className="flex flex-col items-end gap-4">
          {/* Section navigation */}
          {SECTIONS.map((section, index) => {
            const isActive = index === activeIndex;
            const isPast = index < activeIndex;
            const hasChildren = "children" in section && section.children;
            const isExpanded = isActive && hasChildren;
            const progress = sectionProgress[section.id] ?? 0;

            return (
              <div key={section.id} className="flex flex-col items-end">
                {/* Parent section button */}
                <button
                  onClick={() => scrollTo(section.id, index)}
                  className="group flex items-center gap-3 cursor-pointer"
                  aria-label={section.label}
                >
                  {/* Label */}
                  <span
                    className={cn(
                      "text-[10px] font-mono uppercase tracking-[0.15em] whitespace-nowrap",
                      "transition-all duration-300",
                      isActive
                        ? "text-accent opacity-100"
                        : isPast
                          ? "text-muted opacity-50 group-hover:opacity-70"
                          : "text-muted opacity-30 group-hover:opacity-60"
                    )}
                  >
                    {section.label}
                  </span>

                  {/* Line indicator */}
                  <span
                    className={cn(
                      "block h-[2px] rounded-full transition-all duration-300",
                      isActive
                        ? "w-8 bg-accent group-hover:w-10"
                        : isPast
                          ? "w-4 bg-accent/50 group-hover:w-6 group-hover:bg-accent/60"
                          : "w-2.5 bg-foreground/20 group-hover:w-5 group-hover:bg-foreground/30"
                    )}
                  />
                </button>

                {/* Expandable children */}
                {hasChildren && (
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-400 ease-in-out",
                      isExpanded ? "max-h-60 opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
                    )}
                  >
                    <div className="flex items-stretch gap-2">
                      {/* Progress bar */}
                      <div className="w-[2px] rounded-full bg-foreground/10 relative self-stretch shrink-0">
                        <div
                          className="absolute top-0 left-0 w-full rounded-full bg-accent transition-all duration-200"
                          style={{ height: `${progress * 100}%` }}
                        />
                      </div>

                      {/* Sub-items */}
                      <div className="flex flex-col gap-1.5 py-0.5">
                        {section.children!.map((child) => {
                          const isChildActive = activeProjectSlug === child.id;
                          return (
                            <button
                              key={child.id}
                              onClick={() => scrollTo(child.id, index)}
                              className={cn(
                                "text-[9px] font-mono uppercase tracking-[0.12em] text-right whitespace-nowrap",
                                "transition-all duration-200 cursor-pointer",
                                "hover:text-accent",
                                isChildActive
                                  ? "text-accent opacity-100"
                                  : "text-muted opacity-50 hover:opacity-80"
                              )}
                            >
                              {child.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Divider */}
          <div className="w-6 h-px bg-foreground/10 self-end" aria-hidden="true" />

          {/* Theme toggle */}
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
