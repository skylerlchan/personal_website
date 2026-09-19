"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ArmScene from "@/components/visuals/ArmScene";
import type { SceneDef, Telemetry } from "@/components/visuals/arm/RideWorld";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { SITE_CONFIG, MULTIPLIER_URL } from "@/lib/constants";

/**
 * v3: the ride.
 *
 * Scrolling is the ride vehicle. It rolls past a row of lit platforms, one
 * per section, each with its own animatronic arm holding a working model of
 * that project. The copy is the same six lines as v2; what changed is that
 * you now travel to them.
 *
 * Text is plain DOM over a fixed canvas, so scrolling, selection, search and
 * screen readers all work as they always did. The canvas ignores pointer
 * events; the world listens on `window`.
 */

type Stage = SceneDef & {
  id: string;
  label: string;
  eyebrow?: string;
  title: string;
  meta?: string;
  stat?: string;
  href?: string;
  hint?: string;
};

/**
 * Each stage has a set piece and a show colour: the platform's ring, light
 * bars, spotlight and chase lights all take it, so every scene is its own
 * room. The set kinds live in src/components/visuals/arm/sets.ts.
 */
const STAGES: Stage[] = [
  {
    id: "intro",
    label: "Intro",
    set: "attractor",
    color: "#ffd2a0",
    eyebrow: SITE_CONFIG.location,
    title: "Skyler Chan",
    meta: "I build systems that leave the lab: robotics, climate, and the infrastructure under language models.",
    hint: "Scroll to ride. Tap what you find.",
  },
  {
    id: "multiplier",
    label: "Multiplier",
    set: "swarm",
    color: "#5b9cff",
    title: "Agents for asset managers, running inside their own cloud.",
    meta: "Multiplier (YC Spring 2026) · founding engineer · 2026",
    href: MULTIPLIER_URL || undefined,
    hint: "Tap the swarm to rebalance it.",
  },
  {
    id: "climate",
    label: "Climate",
    set: "globe",
    color: "#7ae7ff",
    stat: "10×",
    title: "Black carbon cools the stratosphere better than the sulfate everyone models.",
    meta: "Princeton HMEI · research assistant · 2024 to 2025",
    href: "https://docs.google.com/presentation/d/1YvPFwQQvhCTwXfCP92kaV61j7GZU2b-I/edit",
    hint: "Tap the globe to inject at the equator.",
  },
  {
    id: "flight",
    label: "Flight",
    set: "blimp",
    color: "#b79cff",
    stat: "19×",
    title: "Buoyancy carried the load, so the motors did not have to.",
    meta: "Hoverloon · blimp-drone hybrid · 2024 to 2025",
    hint: "Tap the blimp for a gust.",
  },
  {
    id: "machines",
    label: "Machines",
    set: "arms",
    color: "#ff7a3d",
    title: "Teleoperation treated as a data pipeline rather than a control scheme.",
    meta: "SO-101 leader → follower · 2025",
    hint: "Hold to steer the leader. The follower is 280 ms behind.",
  },
  {
    id: "markets",
    label: "Markets",
    set: "market",
    color: "#5dffb0",
    title: "Delta-neutral carry, harvesting the perpetual funding rate.",
    meta: "Published, SSRN · 2023 to 2024",
    href: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5292305",
    hint: "Tap the tape for a funding shock.",
  },
  {
    id: "sensing",
    label: "Sensing",
    set: "street",
    color: "#ff5c7a",
    title: "Edge vision reading open NYC traffic cameras for free kerb space.",
    meta: "LastCurb · 2024",
    href: "https://github.com/skylerlchan/LastCurb",
    hint: "Tap the camera to send a car away.",
  },
  {
    id: "piano",
    label: "Piano",
    set: "piano",
    color: "#ff5ee0",
    title: "Eight recordings, Bach to Hiromi.",
    meta: "Piano · The Gambler, Hiromi",
    href: "https://www.youtube.com/watch?v=bbVHVRnYNCc",
    hint: "Tap the piano to hear it.",
  },
  {
    id: "contact",
    label: "Contact",
    set: "gate",
    color: "#ffd2a0",
    title: "Open to interesting problems.",
    hint: "End of the ride.",
  },
];

const LINKS = [
  { label: "Email", href: `mailto:${SITE_CONFIG.email}` },
  { label: "GitHub", href: "https://github.com/skylerlchan" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/skylerchan" },
  { label: "X", href: "https://x.com/SkylerChan17" },
];

const MONO = "font-mono text-[0.625rem] uppercase tracking-[0.22em] text-muted";

const SCENES: SceneDef[] = STAGES.map((s) => ({ set: s.set, color: s.color }));

export default function Bench() {
  const [active, setActive] = useState(0);
  const hudRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);

  // Which section is under the middle of the viewport.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("main > section[data-stage]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.stage));
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Joint readout, written straight into the DOM at 10 Hz.
  const onTelemetry = useCallback((t: Telemetry) => {
    const el = hudRef.current;
    if (!el) return;
    el.textContent = `sc ${String(t.scene).padStart(2, "0")} · ${t.readout} · ${t.fps} fps · ${t.quality}`;
    if (scoreRef.current) scoreRef.current.textContent = `found ${t.found} / ${t.total}`;
  }, []);

  return (
    <>
      <ArmScene scenes={SCENES} onTelemetry={onTelemetry} />
      {/* Windshield: darkens the corners so the frame reads as a vehicle. */}
      <div aria-hidden className="vignette pointer-events-none fixed inset-0 z-[5]" />

      {/* Masthead */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-start justify-between px-5 pt-4 sm:px-8 sm:pt-5">
        <div className="pointer-events-auto min-w-0 flex-1 overflow-hidden pr-4">
          <a href="#intro" className={`${MONO} text-foreground`}>
            Skyler Chan
          </a>
          <div
            ref={hudRef}
            aria-hidden
            className="mt-1.5 truncate font-mono text-[0.5625rem] tracking-[0.08em] text-subtle tabular-nums"
          >
            sc 00 · boarding · 60 fps
          </div>
        </div>
        <div className="pointer-events-auto -mr-2 -mt-2 flex shrink-0 items-center gap-3">
          <span ref={scoreRef} className={`${MONO} tabular-nums`}>
            found 0 / 9
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* Index */}
      <nav
        aria-label="Sections"
        className="pointer-events-none fixed right-3 top-1/2 z-20 -translate-y-1/2 sm:right-6"
      >
        <ol className="flex flex-col gap-3">
          {STAGES.map((s, i) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-label={s.label}
                aria-current={i === active ? "true" : undefined}
                className="pointer-events-auto group flex h-4 w-6 items-center justify-end"
              >
                <span
                  className={`block h-px rounded-full bg-foreground transition-all duration-300 ${
                    i === active ? "w-5 opacity-100" : "w-2 opacity-30 group-hover:opacity-70"
                  }`}
                />
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <main className="relative z-10">
        {STAGES.map((s, i) => {
          const on = i === active;
          const Tag = s.href ? "a" : "div";
          const linkProps = s.href ? { href: s.href, target: "_blank" as const, rel: "noreferrer" } : {};
          return (
            <section
              key={s.id}
              id={s.id}
              data-stage={i}
              data-active={on ? "" : undefined}
              className="stage relative flex min-h-svh w-full flex-col justify-end px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-24 landscape:justify-center landscape:pb-0 landscape:pt-0 sm:px-8 lg:px-12"
            >
              <div className="stage-copy w-full max-w-[26rem] landscape:max-w-[30rem] lg:landscape:max-w-[34rem]">
                <div className="flex items-baseline gap-3">
                  <span className={MONO}>
                    {String(i).padStart(2, "0")} / {String(STAGES.length - 1).padStart(2, "0")}
                  </span>
                  <span className={`${MONO} text-foreground`}>{s.eyebrow ?? s.label}</span>
                </div>

                {s.stat && (
                  <div className="mt-5 text-[clamp(3rem,12vw,5.5rem)] font-medium leading-none tracking-[-0.05em] text-foreground">
                    {s.stat}
                  </div>
                )}

                <Tag {...linkProps} className={`group block ${s.href ? "cursor-pointer" : ""}`}>
                  <h2
                    className={`mt-4 text-pretty font-medium leading-[1.1] tracking-[-0.035em] text-foreground ${
                      i === 0
                        ? "text-[clamp(2.75rem,11vw,5.5rem)] leading-[0.95] tracking-[-0.045em]"
                        : "text-[clamp(1.5rem,5.6vw,2.4rem)]"
                    }`}
                  >
                    {s.title}
                    {s.href && (
                      <span aria-hidden className="ml-2 inline-block text-muted transition-transform group-hover:translate-x-0.5">
                        ↗
                      </span>
                    )}
                  </h2>
                  {s.meta && (
                    <p
                      className={`mt-4 ${
                        i === 0
                          ? "max-w-sm text-pretty text-base leading-snug text-muted sm:text-lg"
                          : `${MONO}`
                      }`}
                    >
                      {s.meta}
                    </p>
                  )}
                </Tag>

                {s.hint && (
                  <p className={`${MONO} mt-6 flex items-center gap-2 text-subtle`}>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                    </span>
                    {s.hint}
                  </p>
                )}

                {s.id === "contact" && (
                  <ul className="mt-7 flex flex-wrap gap-x-7 gap-y-3">
                    {LINKS.map((l) => (
                      <li key={l.label}>
                        <a
                          href={l.href}
                          target={l.href.startsWith("mailto:") ? undefined : "_blank"}
                          rel="noreferrer"
                          className={`${MONO} text-foreground underline-offset-[6px] transition-colors hover:underline`}
                        >
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          );
        })}
      </main>
    </>
  );
}
