"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ArmScene from "@/components/visuals/ArmScene";
import type { StageDef, Telemetry } from "@/components/visuals/arm/ArmWorld";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { SITE_CONFIG, MULTIPLIER_URL } from "@/lib/constants";

/**
 * v3 — the bench.
 *
 * One robot arm presents the whole site. Each section is a stage: the arm
 * picks up a small working model of that project and holds it up while you
 * read. The copy is the same six lines as v2; what changed is who is holding
 * them.
 *
 * Text is plain DOM over a fixed canvas, so scrolling, selection, search and
 * screen readers all work as they always did. The canvas ignores pointer
 * events; the world listens on `window`.
 */

type Stage = StageDef & {
  id: string;
  label: string;
  eyebrow?: string;
  title: string;
  meta?: string;
  stat?: string;
  href?: string;
  hint?: string;
};

const STAGES: Stage[] = [
  {
    id: "intro",
    label: "Intro",
    prop: null,
    pose: "track",
    eyebrow: SITE_CONFIG.location,
    title: "Skyler Chan",
    meta: "I build systems that leave the lab — robotics, climate, and the infrastructure under language models.",
    hint: "Touch anywhere. The arm follows.",
  },
  {
    id: "now",
    label: "Now",
    prop: "swarm",
    pose: "present",
    title: "Agents for asset managers, running inside their own cloud.",
    meta: "Multiplier — founding engineer · YC P26",
    href: MULTIPLIER_URL || undefined,
  },
  {
    id: "climate",
    label: "Climate",
    prop: "globe",
    pose: "present",
    stat: "10×",
    title: "Black carbon cools the stratosphere better than the sulfate everyone models.",
    meta: "Princeton HMEI — research assistant · 2024–25",
    href: "https://docs.google.com/presentation/d/1YvPFwQQvhCTwXfCP92kaV61j7GZU2b-I/edit",
    hint: "Soot injected in the tropics, carried poleward.",
  },
  {
    id: "flight",
    label: "Flight",
    prop: "blimp",
    pose: "present",
    stat: "19×",
    title: "Buoyancy carried the load, so the motors did not have to.",
    meta: "Hoverloon — blimp-drone hybrid · 2024–25",
  },
  {
    id: "machines",
    label: "Machines",
    prop: null,
    pose: "track",
    grab: true,
    title: "Teleoperation treated as a data pipeline rather than a control scheme.",
    meta: "SO-101 arms · 2025",
    hint: "This arm is the project. Tap to close the gripper.",
  },
  {
    id: "markets",
    label: "Markets",
    prop: "ribbon",
    pose: "present",
    title: "Delta-neutral carry, harvesting the perpetual funding rate.",
    meta: "Published, SSRN · 2023–24",
    href: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5292305",
  },
  {
    id: "sensing",
    label: "Sensing",
    prop: "cctv",
    pose: "present",
    title: "Edge vision reading open NYC traffic cameras for free kerb space.",
    meta: "LastCurb · 2024",
    href: "https://github.com/skylerlchan/LastCurb",
  },
  {
    id: "piano",
    label: "Piano",
    prop: "piano",
    pose: "present",
    title: "Eight recordings, Bach to Hiromi.",
    meta: "Piano · The Gambler, Hiromi",
    href: "https://www.youtube.com/watch?v=bbVHVRnYNCc",
    hint: "Tap to hear it.",
  },
  {
    id: "contact",
    label: "Contact",
    prop: null,
    pose: "handshake",
    title: "Open to interesting problems.",
  },
];

const LINKS = [
  { label: "Email", href: `mailto:${SITE_CONFIG.email}` },
  { label: "GitHub", href: "https://github.com/skylerlchan" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/skylerchan" },
  { label: "X", href: "https://x.com/SkylerChan17" },
];

const MONO = "font-mono text-[0.625rem] uppercase tracking-[0.22em] text-muted";

export default function Bench() {
  const [active, setActive] = useState(0);
  const hudRef = useRef<HTMLDivElement>(null);
  const stage = STAGES[active];

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
    const j = t.joints.map((a) => (a < 0 ? "−" : "+") + Math.abs(a).toFixed(0).padStart(3, "0") + "°");
    el.textContent = `θ ${j.join(" ")} · grip ${(t.grip * 100).toFixed(0).padStart(2, "0")} · ${t.fps} fps`;
  }, []);

  const stageDef: StageDef = { prop: stage.prop, pose: stage.pose, grab: stage.grab };

  return (
    <>
      <ArmScene stage={stageDef} onTelemetry={onTelemetry} />

      {/* Masthead */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-start justify-between px-5 pt-4 sm:px-8 sm:pt-5">
        <div className="pointer-events-auto">
          <a href="#intro" className={`${MONO} text-foreground`}>
            Skyler Chan
          </a>
          <div
            ref={hudRef}
            aria-hidden
            className="mt-1.5 whitespace-nowrap font-mono text-[0.5625rem] tracking-[0.08em] text-subtle tabular-nums"
          >
            θ +000° +000° +000° +000° +000° · grip 00 · 60 fps
          </div>
        </div>
        <div className="pointer-events-auto -mr-2 -mt-2">
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
