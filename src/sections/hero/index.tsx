"use client";

import Link from "next/link";
import { useState } from "react";
import AttractorField, { type FieldStats } from "@/components/visuals/AttractorField";
import { SITE_CONFIG } from "@/lib/constants";

export const meta = { id: "hero", label: "Intro" };

const INDEX = [
  { k: "NOW", v: "Founding engineer, Multiplier", href: "#work" },
  { k: "BEFORE", v: "Princeton HMEI — climate", href: "#work" },
  { k: "BUILDING", v: "Robotics, LLM infrastructure", href: "#projects" },
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
    { text: "tap the field to switch system", accent: true },
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
      className="w-full overflow-hidden border-t border-border/70 bg-background/60 py-2 backdrop-blur-sm"
    >
      <div className="marquee flex w-max font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted">
        {track}
        {track}
      </div>
    </div>
  );
}

export default function Hero() {
  const [stats, setStats] = useState<FieldStats | null>(null);

  return (
    <section
      id="hero"
      className="relative isolate flex min-h-[100svh] w-full flex-col justify-end overflow-hidden"
    >
      {/* The attractor sits behind everything, full bleed. */}
      <AttractorField className="absolute inset-0 -z-10 h-full w-full" onStats={setStats} />

      {/* Scrim: keeps type legible over the densest part of the field. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-[72%] bg-gradient-to-t from-background via-background/88 to-transparent"
      />

      <div className="mx-auto w-full max-w-5xl px-6 pb-10 pt-32 sm:px-8 lg:px-12">
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
          I build <span className="text-accent">robotics, climate and LLM systems</span> that
          leave the lab.
        </p>

        {/* An index rather than buttons — denser, and it reads as a system. */}
        <dl className="reveal mt-8 divide-y divide-border border-y border-border" data-delay="3">
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

        <div className="reveal mt-7 flex flex-wrap items-center gap-x-6 gap-y-3" data-delay="4">
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

      {/* Live readout of the system actually running above. */}
      <Ticker stats={stats} />
    </section>
  );
}
