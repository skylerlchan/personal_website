"use client";

import { useCallback, useState } from "react";
import CorridorScene from "@/components/visuals/CorridorScene";
import type { StationDef, State } from "@/components/visuals/corridor/CorridorWorld";
import { SITE_CONFIG } from "@/lib/constants";

/**
 * v3: the corridor.
 *
 * The words live in the scene. Each station is a few standing words, a
 * number painted on the floor, and the machine it refers to, at rest. The
 * page itself is only scroll length, the same words for screen readers, and
 * the links, which have to be real.
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
    lines: [{ text: "2023", size: "label" }, { text: "BTC funding carry", size: "name" }, { text: "3× · delta-neutral · 6.1 Sharpe", size: "label" }],
    floor: "16.0%",
    prop: "carry",
    receipts: [
      { label: "Paper, SSRN", href: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5292305" },
      { label: "Code", href: "https://github.com/skylerlchan/Structured-Basis-Divergence-Arbitrage" },
    ],
  },
  {
    id: "lastcurb",
    lines: [{ text: "2024", size: "label" }, { text: "LastCurb", size: "name" }, { text: "edge vision on public cameras", size: "label" }],
    floor: "4 / 4",
    prop: "curb",
    receipts: [{ label: "Code", href: "https://github.com/skylerlchan/LastCurb" }],
  },
  {
    id: "aerosol",
    lines: [{ text: "2024 to 2025", size: "label" }, { text: "Stratospheric black carbon", size: "name" }, { text: "cooling per unit mass vs sulfate", size: "label" }],
    floor: "10×",
    prop: "aerosol",
    receipts: [{ label: "Deck, Princeton HMEI", href: "https://docs.google.com/presentation/d/1YvPFwQQvhCTwXfCP92kaV61j7GZU2b-I/edit" }],
  },
  {
    id: "hoverloon",
    lines: [{ text: "2024 to 2025", size: "label" }, { text: "Hoverloon", size: "name" }, { text: "payload per unit thrust", size: "label" }],
    floor: "19×",
    prop: "hoverloon",
  },
  {
    id: "teleop",
    lines: [{ text: "2025", size: "label" }, { text: "SO-101 teleop", size: "name" }, { text: "leader to follower", size: "label" }],
    floor: "280 ms",
    prop: "teleop",
  },
  {
    id: "multiplier",
    lines: [{ text: "2026", size: "label" }, { text: "Multiplier", size: "name" }, { text: "ARR from zero · 6 clients", size: "label" }],
    floor: "$208K",
    prop: "multiplier",
  },
  {
    id: "next",
    lines: [{ text: "Open to interesting problems.", size: "name" }],
  },
];

const LINKS = [
  { label: "Email", href: `mailto:${SITE_CONFIG.email}` },
  { label: "GitHub", href: "https://github.com/skylerlchan" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/skylerchan" },
  { label: "X", href: "https://x.com/SkylerChan17" },
];

const MONO = "font-mono text-[0.625rem] uppercase tracking-[0.22em]";

export default function Corridor() {
  const [station, setStation] = useState(0);
  const onState = useCallback((s: State) => setStation((prev) => (prev === s.station ? prev : s.station)), []);

  return (
    <>
      <CorridorScene stations={STATIONS} onState={onState} />

      <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-start justify-between px-5 pt-4 sm:px-8 sm:pt-5">
        <a href="#intro" className={`${MONO} pointer-events-auto text-foreground`}>
          Skyler Chan
        </a>
        <span className={`${MONO} text-subtle tabular-nums`}>
          {String(station).padStart(2, "0")} / {String(STATIONS.length - 1).padStart(2, "0")}
        </span>
      </header>

      {/* The current station's links, pinned to the bottom edge. */}
      <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8">
        {STATIONS.map((s, i) => {
          const links = s.id === "next" ? LINKS : (s.receipts ?? []);
          if (!links.length) return null;
          const on = i === station;
          return (
            <ul key={s.id} className="absolute inset-x-5 bottom-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-wrap gap-x-6 gap-y-2 transition-opacity duration-700 sm:inset-x-8" style={{ opacity: on ? 1 : 0, pointerEvents: on ? "auto" : "none" }}>
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
          <section key={s.id} id={s.id} data-station className="relative h-svh">
            {/* The same words, for readers who don't get the canvas. */}
            <div className="sr-only">
              {s.lines.map((l) => (
                <p key={l.text}>{l.text}</p>
              ))}
              {s.floor && <p>{s.floor}</p>}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
