"use client";

import { useCallback, useRef, useState } from "react";
import StoryScene, { type StoryHandle } from "@/components/visuals/StoryScene";
import type { ChapterDef, State } from "@/components/visuals/story/StoryWorld";
import { SITE_CONFIG } from "@/lib/constants";

/**
 * v3: a builder's montage.
 *
 * Six things he built, in the order he built them. Each chapter plays the
 * same four beats as you scroll: empty bench, the parts arrive, it switches
 * on and runs, the result stamps in. Then it sinks away and the bench is
 * empty for the next one. The copy is labels, numbers and receipts; the
 * builds do the talking.
 */

type Chapter = ChapterDef & {
  year: string;
  name: string;
  receipts: { label: string; href: string }[];
  steer?: boolean;
};

const CHAPTERS: Chapter[] = [
  { id: "intro", kind: null, color: "#ffd2a0", year: "", name: "", receipts: [] },
  {
    id: "carry",
    kind: "carry",
    color: "#5dffb0",
    year: "2023",
    name: "BTC funding carry",
    receipts: [
      { label: "Paper, SSRN", href: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5292305" },
      { label: "Code", href: "https://github.com/skylerlchan/Structured-Basis-Divergence-Arbitrage" },
    ],
  },
  {
    id: "lastcurb",
    kind: "curb",
    color: "#ff5c7a",
    year: "2024",
    name: "LastCurb",
    receipts: [{ label: "Code", href: "https://github.com/skylerlchan/LastCurb" }],
  },
  {
    id: "aerosol",
    kind: "aerosol",
    color: "#7ae7ff",
    year: "2024 to 2025",
    name: "Stratospheric black carbon",
    receipts: [{ label: "Deck, Princeton HMEI", href: "https://docs.google.com/presentation/d/1YvPFwQQvhCTwXfCP92kaV61j7GZU2b-I/edit" }],
  },
  { id: "hoverloon", kind: "hoverloon", color: "#b79cff", year: "2024 to 2025", name: "Hoverloon", receipts: [] },
  { id: "teleop", kind: "teleop", color: "#ff7a3d", year: "2025", name: "SO-101 teleop", receipts: [], steer: true },
  {
    id: "multiplier",
    kind: "multiplier",
    color: "#5b9cff",
    year: "2026",
    name: "Multiplier",
    receipts: [{ label: "YC", href: "https://www.ycombinator.com/companies" }],
  },
  { id: "next", kind: null, color: "#ffd2a0", year: "", name: "", receipts: [] },
];

const LINKS = [
  { label: "Email", href: `mailto:${SITE_CONFIG.email}` },
  { label: "GitHub", href: "https://github.com/skylerlchan" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/skylerchan" },
  { label: "X", href: "https://x.com/SkylerChan17" },
];

const MONO = "font-mono text-[0.625rem] uppercase tracking-[0.22em]";
const BUILT = CHAPTERS.filter((c) => c.kind).length;

export default function Story() {
  const scene = useRef<StoryHandle>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State | null>(null);

  const onState = useCallback((s: State) => {
    if (hudRef.current) hudRef.current.textContent = `${s.readout || "bench"} · ${s.fps} fps`;
    setState((prev) => (prev && prev.chapter === s.chapter && prev.phase === s.phase && prev.on === s.on ? prev : s));
  }, []);

  const active = state?.chapter ?? 0;
  const phase = state?.phase ?? "empty";

  return (
    <>
      <StoryScene ref={scene} chapters={CHAPTERS} onState={onState} />

      <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-start justify-between px-5 pt-4 sm:px-8 sm:pt-5">
        <div className="min-w-0 flex-1 overflow-hidden pr-4">
          <a href="#intro" className={`${MONO} pointer-events-auto text-foreground`}>
            Skyler Chan
          </a>
          <div ref={hudRef} aria-hidden className="mt-1.5 truncate font-mono text-[0.5625rem] tracking-[0.08em] text-subtle tabular-nums">
            bench
          </div>
        </div>
        <ol className="pointer-events-auto flex shrink-0 items-center gap-2 pt-1">
          {CHAPTERS.map((c, i) =>
            c.kind ? (
              <li key={c.id}>
                <a href={`#${c.id}`} aria-label={c.name} className="block p-1">
                  <span className={`block h-1.5 w-1.5 rounded-full transition-all ${i === active ? "scale-125 bg-foreground" : i < active ? "bg-foreground/60" : "bg-foreground/20"}`} />
                </a>
              </li>
            ) : null,
          )}
        </ol>
      </header>

      <main className="relative z-10">
        {CHAPTERS.map((c, i) => {
          const isActive = i === active;
          const idx = CHAPTERS.slice(0, i).filter((x) => x.kind).length;
          if (!c.kind) {
            const intro = c.id === "intro";
            return (
              <section key={c.id} id={c.id} data-chapter className="stage relative flex h-[160svh] flex-col">
                <div className="sticky top-0 flex h-svh flex-col justify-end px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] landscape:justify-center landscape:pb-0 sm:px-8 lg:px-12">
                  <div className="max-w-[26rem] landscape:max-w-[30rem]">
                    <p className={`${MONO} text-muted`}>{intro ? SITE_CONFIG.location : "What's next"}</p>
                    <h1 className="mt-4 text-[clamp(2.5rem,10vw,5rem)] font-medium leading-[0.95] tracking-[-0.045em] text-foreground">
                      {intro ? "Skyler Chan" : "Open to interesting problems."}
                    </h1>
                    {intro ? (
                      <p className="mt-4 max-w-sm text-base leading-snug text-muted sm:text-lg">
                        I build systems that leave the lab.
                      </p>
                    ) : (
                      <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
                        {LINKS.map((l) => (
                          <li key={l.label}>
                            <a href={l.href} target={l.href.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer" className={`${MONO} text-foreground underline-offset-[6px] hover:underline`}>
                              {l.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                    {intro && (
                      <p className={`${MONO} mt-8 flex items-center gap-2 text-subtle`}>
                        <span aria-hidden className="inline-block h-4 w-px animate-pulse bg-subtle" />
                        scroll
                      </p>
                    )}
                  </div>
                </div>
              </section>
            );
          }
          const result = isActive ? state?.result ?? null : null;
          const showResult = isActive && (phase === "on" || phase === "sinking") && !!result;
          const dormant = isActive && phase === "dormant";
          return (
            <section key={c.id} id={c.id} data-chapter className="stage relative h-[300svh]">
              <div className="sticky top-0 flex h-svh flex-col justify-end px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] landscape:justify-center landscape:pb-0 sm:px-8 lg:px-12">
                <div className="chapter max-w-[26rem] landscape:max-w-[30rem]" data-active={isActive ? "" : undefined}>
                  <p className={`${MONO} text-muted`}>
                    {String(idx + 1).padStart(2, "0")} / {String(BUILT).padStart(2, "0")} · {c.year}
                  </p>
                  <h2 className="mt-3 text-[clamp(1.5rem,5.5vw,2.25rem)] font-medium leading-[1.1] tracking-[-0.03em] text-foreground">{c.name}</h2>

                  {/* The result stamps in once it runs. Reserved height, so nothing jumps. */}
                  <div className="mt-4 min-h-[6.5rem]">
                    <div className="result" data-show={showResult ? "" : undefined}>
                      <div className="text-[clamp(3.25rem,14vw,6rem)] font-medium leading-none tracking-[-0.05em] text-foreground" style={{ color: showResult ? c.color : undefined }}>
                        {result?.big ?? " "}
                      </div>
                      <p className={`${MONO} mt-2 text-muted`}>{result?.sub ?? ""}</p>
                    </div>
                  </div>

                  <div className="mt-2 flex min-h-8 flex-wrap items-center gap-x-6 gap-y-2">
                    {c.receipts.map((r) => (
                      <a key={r.href} href={r.href} target="_blank" rel="noreferrer" className={`${MONO} text-foreground underline-offset-[6px] hover:underline`}>
                        {r.label} ↗
                      </a>
                    ))}
                    <button
                      type="button"
                      onClick={() => scene.current?.toggle()}
                      className={`${MONO} ml-auto inline-flex min-h-8 items-center gap-2 rounded-full border px-3 transition-opacity ${dormant ? "opacity-100" : "opacity-40"}`}
                      style={{ borderColor: c.color, color: c.color }}
                    >
                      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${dormant ? "animate-ping" : ""}`} style={{ background: c.color }} />
                      {isActive && state?.on ? "on" : "switch on"}
                    </button>
                  </div>
                  {c.steer && isActive && state?.on && <p className={`${MONO} mt-3 text-subtle`}>hold to steer</p>}
                </div>
              </div>
            </section>
          );
        })}
      </main>
    </>
  );
}
