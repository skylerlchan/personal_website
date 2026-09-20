"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Roster from "@/components/visuals/Roster";
import type { PropKind } from "@/components/visuals/roster/models";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { SITE_CONFIG } from "@/lib/constants";

/**
 * v3: the page, with a select screen.
 *
 * The copy is plain HTML so a person, a crawler or a model reads the same
 * thing: headings, sentences, numbers, links. The other half is a roster,
 * the way a game switches characters: one model of a thing he built stands
 * on the platform, and whichever entry you are reading (or pick from the
 * roster) is the one that's up. Copy rules: his own sentences, no em
 * dashes, "Multiplier" never "WithAI".
 */

type Entry = {
  id: string;
  model: PropKind;
  short: string;
  when: string;
  org?: string;
  title: string;
  line: string;
  stat?: { value: string; note: string };
  links?: { label: string; href: string }[];
};

const WORK: Entry[] = [
  {
    id: "multiplier",
    model: "multiplier",
    short: "Multiplier",
    when: "Jan to Sep 2026",
    org: "Multiplier (YC Spring 2026)",
    title: "Founding engineer",
    line: "Agents for asset managers, running inside their own cloud. Owned product for 6 enterprise clients: user research, usage analytics, roadmap scoping, and the company's first paid product.",
    stat: { value: "$208K", note: "ARR, from zero, in eight months" },
  },
];

const PROJECTS: Entry[] = [
  {
    id: "teleop",
    model: "teleop",
    short: "SO-101",
    when: "2025",
    org: "Princeton Robotics Club",
    title: "SO-101 teleoperation",
    line: "Teleoperation treated as a data pipeline rather than a control scheme: a leader arm's joint stream, replayed by a follower.",
  },
  {
    id: "hoverloon",
    model: "hoverloon",
    short: "Hoverloon",
    when: "2024 to 2025",
    org: "Princeton Robotics Club, tech lead",
    title: "Hoverloon",
    line: "A blimp-drone hybrid. Buoyancy carried the load, so the motors did not have to.",
    stat: { value: "19×", note: "the drone's payload capacity, from buoyant lift" },
  },
  {
    id: "aerosol",
    model: "aerosol",
    short: "Black carbon",
    when: "2024 to 2025",
    org: "Princeton HMEI, research assistant",
    title: "Stratospheric black carbon",
    line: "Solar radiation management research. Black carbon cools the stratosphere better than the sulfate everyone models.",
    stat: { value: "10×", note: "the cooling of reflective sulfate, per unit mass" },
    links: [{ label: "Deck", href: "https://docs.google.com/presentation/d/1YvPFwQQvhCTwXfCP92kaV61j7GZU2b-I/edit" }],
  },
  {
    id: "lastcurb",
    model: "curb",
    short: "LastCurb",
    when: "2024",
    title: "LastCurb",
    line: "Edge vision reading open NYC traffic cameras for free kerb space. Real-time urban sensing on commodity hardware, no sensors installed.",
    links: [{ label: "Code", href: "https://github.com/skylerlchan/LastCurb" }],
  },
  {
    id: "carry",
    model: "carry",
    short: "Carry",
    when: "2023 to 2024, published 2025",
    org: "SSRN",
    title: "BTC funding carry",
    line: "A 3× leveraged, delta-neutral long-spot, short-perpetual strategy harvesting the funding rate. Backtested on three years of tick-level data. 500+ downloads.",
    stat: { value: "16.0%", note: "annualized, 6.1 Sharpe, under 2% max drawdown" },
    links: [
      { label: "Paper", href: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5292305" },
      { label: "Code", href: "https://github.com/skylerlchan/Structured-Basis-Divergence-Arbitrage" },
    ],
  },
];

const ELSEWHERE = [
  { label: "Email", href: `mailto:${SITE_CONFIG.email}` },
  { label: "GitHub", href: "https://github.com/skylerlchan" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/skylerchan" },
  { label: "X", href: "https://x.com/SkylerChan17" },
  { label: "Piano recordings", href: "https://www.youtube.com/watch?v=bbVHVRnYNCc" },
];

const MONO = "font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-muted";

/** The roster, in reading order: him first, then each thing he built. */
const ROSTER: { id: string; model: PropKind; short: string }[] = [
  { id: "top", model: "attractor", short: "Skyler" },
  ...WORK.map((e) => ({ id: e.id, model: e.model, short: e.short })),
  ...PROJECTS.map((e) => ({ id: e.id, model: e.model, short: e.short })),
];

function Item({ e, on, onPick }: { e: Entry; on: boolean; onPick: () => void }) {
  return (
    <article id={e.id} data-entry={e.id} className="scroll-mt-[46svh] border-t border-border py-10 sm:py-12 lg:scroll-mt-6">
      <p className={MONO}>
        {e.when}
        {e.org ? ` · ${e.org}` : ""}
      </p>
      <h3 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-foreground sm:text-[1.75rem]">
        <button type="button" onClick={onPick} aria-pressed={on} className="text-left underline-offset-[6px] hover:underline">
          {e.title}
        </button>
      </h3>
      <p className="mt-3 max-w-xl text-pretty text-base leading-relaxed text-muted sm:text-lg">{e.line}</p>
      {e.stat && (
        <p className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-4xl font-medium tracking-[-0.04em] text-foreground sm:text-5xl">{e.stat.value}</span>
          <span className={MONO}>{e.stat.note}</span>
        </p>
      )}
      {e.links && (
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          {e.links.map((l) => (
            <li key={l.href}>
              <a href={l.href} target="_blank" rel="noreferrer" className={`${MONO} text-foreground underline-offset-[6px] hover:underline`}>
                {l.label} ↗
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

const graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ScholarlyArticle",
      name: "Leveraged BTC Funding Carry Algorithm: A Delta-Neutral Long-Spot/Short-Future Strategy",
      author: { "@type": "Person", name: SITE_CONFIG.name },
      datePublished: "2025-06-01",
      url: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5292305",
    },
    {
      "@type": "SoftwareSourceCode",
      name: "LastCurb",
      author: { "@type": "Person", name: SITE_CONFIG.name },
      codeRepository: "https://github.com/skylerlchan/LastCurb",
      description: "Edge vision reading open NYC traffic cameras for free kerb space.",
    },
  ],
};

export default function Page() {
  const [active, setActive] = useState<string>("top");
  const lock = useRef(0);
  const row = useRef<HTMLOListElement>(null);

  // Keep the active chip in view when the roster row overflows (phones).
  useEffect(() => {
    const r = row.current;
    const chip = r?.querySelector<HTMLElement>('button[aria-pressed="true"]');
    if (!r || !chip) return;
    r.scrollTo({ left: chip.offsetLeft - r.clientWidth / 2 + chip.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  // Reading drives the roster: whichever entry crosses the middle of the
  // viewport is the one on the platform. A pick holds for a moment so the
  // scroll it triggers doesn't fight it.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-entry]"));
    const io = new IntersectionObserver(
      (entries) => {
        if (performance.now() < lock.current) return;
        for (const en of entries) if (en.isIntersecting) setActive((en.target as HTMLElement).dataset.entry!);
      },
      { rootMargin: "-40% 0px -45% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const pick = useCallback((id: string) => {
    lock.current = performance.now() + 900;
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const model = ROSTER.find((r) => r.id === active)?.model ?? "attractor";

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />

      <div className="relative mx-auto w-full max-w-6xl lg:grid lg:grid-cols-[minmax(0,1fr)_46%] lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:px-10">
        <header className="flex items-center justify-between px-6 py-6 sm:px-10 lg:col-start-1 lg:row-start-1 lg:px-0">
          <a href="#top" onClick={(e) => { e.preventDefault(); pick("top"); }} className={`${MONO} text-foreground`}>
            Skyler Chan
          </a>
          <ThemeToggle />
        </header>

        {/* The other half. On a phone it sits at the top and stays while the entries scroll under it. */}
        <aside className="sticky top-0 z-20 h-[44svh] bg-background lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-svh lg:bg-transparent">
          <div className="flex h-full flex-col">
            <Roster active={model} className="min-h-0 w-full flex-1" />
            <ol ref={row} className="no-scrollbar flex gap-1 overflow-x-auto px-4 pb-3 pt-1 lg:flex-wrap lg:justify-center lg:px-6 lg:pb-8">
              {ROSTER.map((r) => {
                const on = r.id === active;
                return (
                  <li key={r.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => pick(r.id)}
                      aria-pressed={on}
                      className={`${MONO} flex min-h-9 items-center rounded-full px-3 transition-colors ${on ? "bg-foreground text-background" : "text-muted hover:text-foreground"}`}
                    >
                      {r.short}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
          <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-6 h-6 bg-gradient-to-b from-background to-transparent lg:hidden" />
        </aside>

        <div className="px-6 sm:px-10 lg:col-start-1 lg:row-start-2 lg:px-0">
        <main className="max-w-xl pb-24">
          <section id="top" data-entry="top" className="scroll-mt-[46svh] pb-6 pt-10 sm:pt-16 lg:scroll-mt-6">
            <p className={MONO}>{SITE_CONFIG.location}</p>
            <h1 className="mt-4 text-[clamp(2.75rem,9vw,4.5rem)] font-medium leading-[0.95] tracking-[-0.045em] text-foreground">Skyler Chan</h1>
            <p className="mt-6 max-w-md text-pretty text-lg leading-snug text-muted sm:text-xl">
              I build systems that leave the lab: robotics, climate, and the infrastructure under language models.
            </p>
          </section>

          <section className="pt-16" aria-labelledby="work">
            <h2 id="work" className={MONO}>
              Work
            </h2>
            <div className="mt-6">
              {WORK.map((e) => (
                <Item key={e.id} e={e} on={active === e.id} onPick={() => pick(e.id)} />
              ))}
            </div>
          </section>

          <section className="pt-16" aria-labelledby="projects">
            <h2 id="projects" className={MONO}>
              Projects
            </h2>
            <div className="mt-6">
              {PROJECTS.map((e) => (
                <Item key={e.id} e={e} on={active === e.id} onPick={() => pick(e.id)} />
              ))}
            </div>
          </section>

          <section data-entry="top" className="border-t border-border pt-16" aria-labelledby="elsewhere">
            <h2 id="elsewhere" className={MONO}>
              Elsewhere
            </h2>
            <p className="mt-6 text-2xl font-medium tracking-[-0.03em] text-foreground sm:text-[1.75rem]">Open to interesting problems.</p>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
              {ELSEWHERE.map((l) => (
                <li key={l.href}>
                  <a href={l.href} target={l.href.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer" className={`${MONO} text-foreground underline-offset-[6px] hover:underline`}>
                    {l.label} ↗
                  </a>
                </li>
              ))}
            </ul>
            <p className={`${MONO} mt-16 text-subtle`}>
              Plain text for machines: <a href="/llms.txt" className="underline-offset-[6px] hover:underline">/llms.txt</a>
            </p>
          </section>
        </main>
        </div>
      </div>
    </>
  );
}
