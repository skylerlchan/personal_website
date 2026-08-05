"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import AttractorField, { type FieldStats } from "@/components/visuals/AttractorField";
import { SITE_CONFIG } from "@/lib/constants";

export const meta = { id: "hero", label: "Intro" };

const INDEX = [
  { k: "NOW", v: "Founding engineer, Multiplier", href: "#work" },
  { k: "BEFORE", v: "Princeton HMEI — climate", href: "#work" },
  { k: "BUILDING", v: "Robotics, LLM infrastructure", href: "#projects" },
];

/**
 * The three systems the field scrubs through after the hero. Panel k lines up
 * with attractor k, because the pinned track is exactly four viewports tall
 * and the morph is mapped linearly across it.
 */
const SYSTEMS = [
  {
    id: "systems",
    name: "Aizawa",
    eq: ["ẋ = (z − b)x − dy", "ẏ = dx + (z − b)y", "ż = c + az − z³⁄3 − (x²+y²)(1+ez) + fzx³"],
    note: "A torus with a spindle driven through its axis. The orbit never closes and never escapes.",
  },
  {
    id: "thomas",
    name: "Thomas",
    eq: ["ẋ = sin y − bx", "ẏ = sin z − by", "ż = sin x − bz"],
    note: "Cyclically symmetric, built from three sines. Below b = 0.208 it stops being periodic and starts wandering.",
  },
  {
    id: "halvorsen",
    name: "Halvorsen",
    eq: ["ẋ = −ax − 4y − 4z − y²", "ẏ = −ay − 4z − 4x − z²", "ż = −az − 4x − 4y − x²"],
    note: "Quadratic coupling under the same symmetry, folded into three interlocking scrolls.",
  },
];

/**
 * A marquee rather than a clipped row: on a phone the readout is wider than
 * the screen, and drifting it makes that legible instead of looking truncated.
 * The track is rendered twice so the loop has no seam.
 */
function Ticker({ stats }: { stats: FieldStats | null }) {
  const cells = [
    { text: stats?.name ?? "LORENZ", accent: true },
    // Not uppercased: `uppercase` mangles σ ρ β into Σ Ρ Β.
    { text: stats?.params ?? "σ 10 · ρ 28 · β 8/3", raw: true },
    { text: `${(stats?.particles ?? 65536).toLocaleString()} particles` },
    { text: "midpoint rk2, 3 substeps, on gpu" },
    { text: `${stats?.fps ?? 60} fps` },
    { text: "scroll to integrate", accent: true },
  ];

  const track = (
    <div className="flex shrink-0 items-center gap-3 pr-3">
      {cells.map((c, i) => (
        <span key={i} className="flex shrink-0 items-center gap-3">
          <span
            className={`${c.accent ? "text-accent" : ""} ${c.raw ? "normal-case" : ""} tabular-nums`}
          >
            {c.text}
          </span>
          <span className="text-border">/</span>
        </span>
      ))}
    </div>
  );

  return (
    <div
      aria-hidden
      className="absolute inset-x-0 bottom-0 overflow-hidden border-t border-border/70 bg-background/60 py-2 backdrop-blur-sm"
    >
      <div className="marquee flex w-max font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted">
        {track}
        {track}
      </div>
    </div>
  );
}

export default function Hero() {
  const track = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<FieldStats | null>(null);

  return (
    // Four viewports tall. The field pins for the whole run; content slides
    // over it. This is the pinned-product pattern, with the product being a
    // differential equation.
    <div ref={track} className="relative">
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        <AttractorField
          className="absolute inset-0 h-full w-full"
          onStats={setStats}
          scrollTrack={track}
        />
        {/* Scrim sits over the field but under the copy. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-background via-background/85 to-transparent"
        />
        <Ticker stats={stats} />
      </div>

      <div className="relative -mt-[100svh]">
        {/* ── panel 0 · Lorenz ── */}
        <section
          id="hero"
          className="flex min-h-svh w-full flex-col justify-end pb-20"
        >
          <div className="mx-auto w-full max-w-5xl px-6 sm:px-8 lg:px-12">
            <div
              className="reveal flex items-center gap-2.5 font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-muted"
              data-delay="0"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              Open to interesting problems
            </div>

            <h1
              className="reveal mt-5 text-[3.25rem] font-medium leading-[0.92] tracking-[-0.04em] text-foreground sm:text-7xl lg:text-8xl"
              data-delay="1"
            >
              Skyler Chan
            </h1>

            <p
              className="reveal mt-5 max-w-xl text-balance text-lg leading-snug tracking-tight text-foreground/85 sm:text-2xl"
              data-delay="2"
            >
              I build <span className="text-accent">robotics, climate and LLM systems</span>{" "}
              that leave the lab.
            </p>

            <dl
              className="reveal mt-8 divide-y divide-border border-y border-border"
              data-delay="3"
            >
              {INDEX.map((row) => (
                <Link
                  key={row.k}
                  href={row.href}
                  className="group flex min-h-12 items-center gap-4 py-2.5 transition-colors hover:bg-surface/40"
                >
                  <dt className="w-20 shrink-0 font-mono text-[0.625rem] uppercase tracking-[0.18em] text-muted">
                    {row.k}
                  </dt>
                  <dd className="flex-1 text-[0.9375rem] tracking-tight text-foreground/90">
                    {row.v}
                  </dd>
                  <span
                    aria-hidden
                    className="text-muted transition-transform group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </Link>
              ))}
            </dl>

            <div
              className="reveal mt-7 flex flex-wrap items-center gap-x-6 gap-y-3"
              data-delay="4"
            >
              <Link
                href="#projects"
                className="inline-flex min-h-11 items-center rounded-full bg-foreground px-6 text-[0.9375rem] font-medium text-background transition-opacity hover:opacity-90 active:scale-[0.98]"
              >
                See the work
              </Link>
              <a
                href={`mailto:${SITE_CONFIG.email}`}
                className="inline-flex min-h-11 items-center text-[0.9375rem] text-muted underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Email me
              </a>
            </div>
          </div>
        </section>

        {/* ── panels 1–3 · the other three systems ── */}
        {SYSTEMS.map((s, i) => (
          <section
            key={s.id}
            id={s.id}
            className="flex min-h-svh w-full flex-col justify-end pb-20"
          >
            <div className="panel mx-auto w-full max-w-5xl px-6 sm:px-8 lg:px-12">
              <div className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted">
                System {String(i + 2).padStart(2, "0")} / 04
              </div>
              <h2 className="mt-3 text-4xl font-medium tracking-[-0.03em] text-foreground sm:text-6xl">
                {s.name}
              </h2>
              <div className="mt-5 space-y-1 font-mono text-[0.8125rem] leading-relaxed text-accent sm:text-sm">
                {s.eq.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
              <p className="mt-5 max-w-md text-pretty text-[0.9375rem] leading-relaxed text-muted">
                {s.note}
              </p>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
