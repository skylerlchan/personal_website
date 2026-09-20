"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CorridorScene, { type ScreenHandle } from "@/components/visuals/CorridorScene";
import type { StationDef } from "@/components/visuals/corridor/CorridorWorld";
import { SITE_CONFIG } from "@/lib/constants";

/**
 * v3: the screen.
 *
 * The words live in the scene, one station at a time. The page itself is
 * only scroll length (one snap point per station), the same words for
 * screen readers, the links, and two buttons.
 */

type Station = StationDef & { receipts?: { label: string; href: string }[] };

const STATIONS: Station[] = [
  {
    id: "intro",
    lines: [
      { text: SITE_CONFIG.location, size: "label" },
      { text: "Skyler Chan", size: "title" },
      { text: "I build systems that leave the lab.", size: "small" },
    ],
  },
  {
    id: "carry",
    lines: [{ text: "2023", size: "label" }, { text: "BTC funding carry", size: "name" }],
    figure: "16.0%",
    receipts: [
      { label: "Paper, SSRN", href: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5292305" },
      { label: "Code", href: "https://github.com/skylerlchan/Structured-Basis-Divergence-Arbitrage" },
    ],
  },
  {
    id: "lastcurb",
    lines: [{ text: "2024", size: "label" }, { text: "LastCurb", size: "name" }],
    figure: "4 / 4",
    receipts: [{ label: "Code", href: "https://github.com/skylerlchan/LastCurb" }],
  },
  {
    id: "aerosol",
    lines: [{ text: "2024 to 2025", size: "label" }, { text: "Stratospheric black carbon", size: "name" }],
    figure: "10×",
    receipts: [{ label: "Deck, Princeton HMEI", href: "https://docs.google.com/presentation/d/1YvPFwQQvhCTwXfCP92kaV61j7GZU2b-I/edit" }],
  },
  { id: "hoverloon", lines: [{ text: "2024 to 2025", size: "label" }, { text: "Hoverloon", size: "name" }], figure: "19×" },
  { id: "teleop", lines: [{ text: "2025", size: "label" }, { text: "SO-101 teleop", size: "name" }], figure: "280 ms" },
  { id: "multiplier", lines: [{ text: "2026", size: "label" }, { text: "Multiplier", size: "name" }], figure: "$208K" },
  { id: "next", lines: [{ text: "Open to interesting problems.", size: "name" }] },
];

const LINKS = [
  { label: "Email", href: `mailto:${SITE_CONFIG.email}` },
  { label: "GitHub", href: "https://github.com/skylerlchan" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/skylerchan" },
  { label: "X", href: "https://x.com/SkylerChan17" },
];

const MONO = "font-mono text-[0.625rem] uppercase tracking-[0.22em]";
const LAST = STATIONS.length - 1;

export default function Corridor() {
  const screen = useRef<ScreenHandle>(null);
  const [station, setStation] = useState(0);

  // The page is one snap point per station; the station is whichever one
  // the viewport is nearest. Buttons and keys just scroll there.
  useEffect(() => {
    const read = () => {
      const i = Math.round(window.scrollY / Math.max(1, window.innerHeight));
      setStation((prev) => (prev === i ? prev : Math.max(0, Math.min(LAST, i))));
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, []);

  useEffect(() => {
    screen.current?.show(station);
  }, [station]);

  const goTo = useCallback((i: number) => {
    const j = Math.max(0, Math.min(LAST, i));
    window.scrollTo({ top: j * window.innerHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (["ArrowRight", "ArrowDown", " ", "PageDown"].includes(e.key)) {
        e.preventDefault();
        goTo(station + 1);
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        goTo(station - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [station, goTo]);

  const btn = "pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-border text-foreground transition-colors hover:bg-surface disabled:opacity-25 disabled:hover:bg-transparent";

  return (
    <>
      <CorridorScene ref={screen} stations={STATIONS} />

      <header className="pointer-events-none fixed inset-x-0 top-0 z-20 px-5 pt-4 sm:px-8 sm:pt-5">
        <a href="#intro" onClick={(e) => { e.preventDefault(); goTo(0); }} className={`${MONO} pointer-events-auto text-foreground`}>
          Skyler Chan
        </a>
      </header>

      {/* Back, count, forward. */}
      <nav aria-label="Stations" className="pointer-events-none fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-30 flex items-center gap-3 sm:right-8">
        <button type="button" aria-label="Previous" className={btn} disabled={station === 0} onClick={() => goTo(station - 1)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <span className={`${MONO} w-16 whitespace-nowrap text-center text-subtle tabular-nums`}>
          {String(station).padStart(2, "0")} / {String(LAST).padStart(2, "0")}
        </span>
        <button type="button" aria-label="Next" className={btn} disabled={station === LAST} onClick={() => goTo(station + 1)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </nav>

      {/* The current station's links, pinned to the bottom edge. */}
      <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-20">
        {STATIONS.map((s, i) => {
          const links = s.id === "next" ? LINKS : (s.receipts ?? []);
          if (!links.length) return null;
          const on = i === station;
          return (
            <ul key={s.id} className="absolute bottom-[max(2rem,env(safe-area-inset-bottom))] left-5 right-44 flex flex-wrap gap-x-6 gap-y-2 transition-opacity duration-700 sm:left-8 sm:right-48" style={{ opacity: on ? 1 : 0, pointerEvents: on ? "auto" : "none" }}>
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} target={l.href.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer" className={`${MONO} text-muted underline-offset-[6px] hover:text-foreground hover:underline`}>
                    {l.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          );
        })}
      </footer>

      <main className="relative z-10">
        {STATIONS.map((s) => (
          <section key={s.id} id={s.id} data-station className="relative h-svh snap-start">
            <div className="sr-only">
              {s.lines.map((l) => (
                <p key={l.text}>{l.text}</p>
              ))}
              {s.figure && <p>{s.figure}</p>}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
