"use client";

import { useEffect, useState } from "react";
import Stage from "@/components/visuals/Stage";
import type { PropKind } from "@/components/visuals/roster/models";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { SITE_CONFIG } from "@/lib/constants";

/**
 * v3: one screen per thing, the thing in the centre, four ways down.
 *
 * The first screen is him and a fork: Work, Projects, Hobbies, Contact.
 * Each is a run of screens. The copy is plain HTML so a person, a crawler
 * or a model reads the same thing. Behind it, a fixed stage holds one
 * three.js model of the thing on screen, doing what it did, and the scroll
 * is the animation: each screen of text scrolls past while the model turns,
 * shrinks away, and the next one grows in its place, the light behind them
 * crossing to that screen's colour.
 *
 * Facts and sentences are lifted from his resume (Sep 2026). Copy rules:
 * his own sentences, no em dashes, "Multiplier" never "WithAI", no
 * valuation or AUM on a public page.
 */

type Group = "work" | "projects" | "hobbies" | "contact";

type Entry = {
  id: string;
  group: Group;
  model: PropKind;
  color: string;
  when: string;
  org?: string;
  title: string;
  line: string;
  stat?: { value: string; note: string };
  links?: { label: string; href: string }[];
};

const GROUPS: { id: Group; label: string; color: string }[] = [
  { id: "work", label: "Work", color: "#5b9cff" },
  { id: "projects", label: "Projects", color: "#ff7a3d" },
  { id: "hobbies", label: "Hobbies", color: "#ff5ee0" },
  { id: "contact", label: "Contact", color: "#ffd2a0" },
];

const ENTRIES: Entry[] = [
  {
    id: "multiplier",
    group: "work",
    model: "multiplier",
    color: "#5b9cff",
    when: "Feb to Sep 2026",
    org: "Multiplier, Y Combinator Spring 2026",
    title: "Founding software engineer",
    line: "AI agents for hedge-fund analysts. Owned the product end to end for six enterprise clients and grew it into the company's first paid product; one of five engineers, wrote ~30% of the codebase.",
    stat: { value: "$208K", note: "ARR, from zero · 3,500+ AI work sessions, 72% of client requests completed by the agent" },
  },
  {
    id: "exahuman",
    group: "projects",
    model: "teleop",
    color: "#ff7a3d",
    when: "Aug 2026 to now",
    org: "Princeton Robotics Club, founder and tech lead",
    title: "Exahuman",
    line: "A robot teleoperation lab. Secured $4,500 and recruited a 5-person research team; built SO-ARM101 leader / follower arms at 50 Hz and collected datasets for ACT and SmolVLA imitation-learning policies.",
    stat: { value: "50 Hz", note: "leader to follower · C++, ROS, Python, LeRobot, MuJoCo" },
    links: [{ label: "exahuman.io", href: "https://exahuman.io" }],
  },
  {
    id: "betaflow",
    group: "projects",
    model: "browser",
    color: "#7ae7ff",
    when: "Apr to Jun 2026",
    org: "VS Code Marketplace",
    title: "Beta Flow Browser",
    line: "An open-source MIT extension putting a full web browser in the editor sidebar: spaces, vertical tabs, per-profile cookie isolation. TypeScript.",
    stat: { value: "200+", note: "downloads" },
  },
  {
    id: "carry",
    group: "work",
    model: "carry",
    color: "#5dffb0",
    when: "Jan 2025 to May 2026",
    org: "Paragon Global Investments, quant developer",
    title: "BTC funding carry",
    line: "Engineered a high-frequency, exchange-agnostic backtesting engine across spot and perpetual futures. Shipped the winning strategy off it, a 3x-leveraged delta-neutral BTC funding-carry trade, and published it as a sole-author SSRN paper.",
    stat: { value: "16.0%", note: "annualized · Sharpe 6.1 · max drawdown under 2% over three years of tick data" },
    links: [
      { label: "Paper, SSRN", href: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5292305" },
      { label: "Code", href: "https://github.com/skylerlchan/Structured-Basis-Divergence-Arbitrage" },
    ],
  },
  {
    id: "hoverloon",
    group: "projects",
    model: "hoverloon",
    color: "#b79cff",
    when: "Jul 2025 to Jan 2026",
    org: "Princeton Robotics Club, founder and project lead",
    title: "Hoverloon",
    line: "An aerial logistics blimp-drone hybrid. Won $5,000 in funding and led an 8-person team; indoor test flight Dec 2025. ROS, CAD, computer vision, embedded systems.",
    stat: { value: "19×", note: "the drone's own payload capacity from buoyant lift, at roughly the same power draw" },
  },
  {
    id: "lastcurb",
    group: "projects",
    model: "curb",
    color: "#ff5c7a",
    when: "Jun to Aug 2025",
    title: "LastCurb",
    line: "A real-time NYC parking finder: on-device computer vision over public NYC traffic cameras to spot open curb space in real time, with free public cameras as the only sensor layer. Python.",
    links: [{ label: "Code", href: "https://github.com/skylerlchan/LastCurb" }],
  },
  {
    id: "hmei",
    group: "work",
    model: "aerosol",
    color: "#7ad0ff",
    when: "Jun to Aug 2025",
    org: "Princeton HMEI, Vecchi Research Group, climate modeling research intern",
    title: "Solar geoengineering, modeled",
    line: "Built Python pipelines over 15 CMIP6 climate models to quantify how rainfall responds to solar geoengineering; cut data-processing time ~40%.",
    stat: { value: "~10×", note: "black carbon aerosols cool more effectively than sulfates" },
  },
  {
    id: "piano",
    group: "hobbies",
    model: "piano",
    color: "#ff5ee0",
    when: "Since childhood",
    org: "Princeton Piano Ensemble",
    title: "Classical piano",
    line: "Ravel, Liszt, Bach. Eight recordings, from Hiromi to a Bach fugue.",
    links: [{ label: "Recordings", href: "https://www.youtube.com/watch?v=bbVHVRnYNCc" }],
  },
  {
    id: "squash",
    group: "hobbies",
    model: "squash",
    color: "#ffb84d",
    when: "Princeton",
    title: "Squash",
    line: "The other place things move fast and the wall always answers.",
  },
];

const ELSEWHERE = [
  { label: "Email", href: `mailto:${SITE_CONFIG.email}` },
  { label: "GitHub", href: "https://github.com/skylerlchan" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/skylerchan" },
  { label: "X", href: "https://x.com/SkylerChan17" },
];

const MONO = "font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-muted";

type Screen = { id: string; model: PropKind; color: string; group?: Group; entry?: Entry; kind: "intro" | "entry" | "end" };

// Screens run group by group, in the order of the fork.
const SCREENS: Screen[] = [
  { id: "top", model: "portrait", color: "#ffd2a0", kind: "intro" },
  ...(["work", "projects", "hobbies"] as Group[]).flatMap((g) =>
    ENTRIES.filter((e) => e.group === g).map((e): Screen => ({ id: e.id, model: e.model, color: e.color, group: g, entry: e, kind: "entry" })),
  ),
  { id: "contact", model: "portrait", color: "#ffd2a0", group: "contact", kind: "end" },
];

const firstOf = (g: Group) => SCREENS.find((s) => s.group === g)?.id ?? "top";

const graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      alumniOf: { "@type": "CollegeOrUniversity", name: "Princeton University" },
      sameAs: ["https://github.com/skylerlchan", "https://www.linkedin.com/in/skylerchan", "https://x.com/SkylerChan17"],
    },
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
      programmingLanguage: "Python",
    },
  ],
};

function Copy({ e, index, count }: { e: Entry; index: number; count: number }) {
  return (
    <>
      <p className={MONO}>
        <span style={{ color: e.color }}>{GROUPS.find((g) => g.id === e.group)?.label} {index + 1} / {count}</span> · {e.when}
        {e.org ? ` · ${e.org}` : ""}
      </p>
      <h2 className="mt-3 text-[1.75rem] font-medium leading-tight tracking-[-0.03em] text-foreground sm:text-4xl">{e.title}</h2>
      <p className="mt-3 max-w-md text-pretty text-[0.9375rem] leading-relaxed text-muted sm:text-base">{e.line}</p>
      {e.stat && (
        <p className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-4xl font-medium tracking-[-0.04em] sm:text-5xl" style={{ color: e.color }}>
            {e.stat.value}
          </span>
          <span className={`${MONO} max-w-xs`}>{e.stat.note}</span>
        </p>
      )}
      {e.links && (
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {e.links.map((l) => (
            <li key={l.href}>
              <a href={l.href} target="_blank" rel="noreferrer" className={`${MONO} text-foreground underline-offset-[6px] hover:underline`}>
                {l.label} ↗
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function Page() {
  const [at, setAt] = useState(0);
  useEffect(() => {
    const read = () =>
      setAt((prev) => {
        const i = Math.round(window.scrollY / Math.max(1, window.innerHeight));
        return prev === i ? prev : i;
      });
    read();
    window.addEventListener("scroll", read, { passive: true });
    return () => window.removeEventListener("scroll", read);
  }, []);

  const here = SCREENS[Math.min(at, SCREENS.length - 1)]?.group;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />

      {/* The stage: fixed, full-screen, behind everything. */}
      <Stage slots={SCREENS.map((s) => ({ kind: s.model, color: s.color }))} className="pointer-events-none fixed inset-0 z-0 h-full w-full" />

      <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center justify-between gap-4 px-6 py-5 sm:px-10">
        <a href="#top" className={`${MONO} pointer-events-auto shrink-0 text-foreground`}>
          Skyler Chan
        </a>
        {/* The four ways down, always one tap away. */}
        <nav aria-label="Sections" className="pointer-events-auto hidden items-center gap-5 sm:flex">
          {GROUPS.map((g) => (
            <a key={g.id} href={`#${firstOf(g.id)}`} className={`${MONO} transition-colors hover:text-foreground`} style={{ color: here === g.id ? g.color : undefined }}>
              {g.label}
            </a>
          ))}
        </nav>
        <div className="pointer-events-auto">
          <ThemeToggle />
        </div>
      </header>

      {/* Where you are: one dot per screen, the current one in its colour. */}
      <nav aria-label="Screens" className="pointer-events-none fixed right-3 top-1/2 z-20 -translate-y-1/2 sm:right-6">
        <ol className="flex flex-col gap-2.5">
          {SCREENS.map((s, i) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-label={s.entry?.title ?? (s.kind === "intro" ? "Top" : "Elsewhere")}
                aria-current={i === at ? "true" : undefined}
                className="pointer-events-auto block p-1"
              >
                <span
                  className="block h-1.5 w-1.5 rounded-full transition-all duration-300"
                  style={{ background: i === at ? s.color : "var(--subtle)", opacity: i === at ? 1 : 0.35, transform: i === at ? "scale(1.4)" : "none" }}
                />
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <main className="relative z-10">
        {SCREENS.map((s) => (
          <section key={s.id} id={s.id} className="screen relative flex h-svh flex-col justify-end">
            <div className="relative mx-auto w-full max-w-6xl px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-10 lg:pb-16">
              <div className="max-w-md">
                {s.kind === "intro" && (
                  <>
                    <p className={MONO}>New York · San Francisco · Princeton ORFE, class of 2028</p>
                    <h1 className="mt-3 text-[clamp(2.5rem,9vw,4.25rem)] font-medium leading-[0.95] tracking-[-0.045em] text-foreground">Skyler Chan</h1>
                    <p className="mt-4 max-w-md text-pretty text-base leading-snug text-muted sm:text-lg">
                      Founding engineer at a YC startup, $0 to $208K ARR. Two robotics ventures. Two SSRN papers.
                    </p>
                    {/* The fork. */}
                    <ul className="mt-7 grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-8">
                      {GROUPS.map((g) => {
                        const n = g.id === "contact" ? 0 : ENTRIES.filter((e) => e.group === g.id).length;
                        return (
                          <li key={g.id}>
                            <a href={`#${firstOf(g.id)}`} className="group flex items-baseline gap-2 text-xl font-medium tracking-[-0.02em] text-foreground sm:text-2xl">
                              <span aria-hidden className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: g.color }} />
                              {g.label}
                              <span className={`${MONO} text-subtle`}>{n ? n : "↗"}</span>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
                {s.kind === "entry" && s.entry && s.group && (
                  <Copy e={s.entry} index={SCREENS.filter((x) => x.group === s.group).findIndex((x) => x.id === s.id)} count={SCREENS.filter((x) => x.group === s.group).length} />
                )}
                {s.kind === "end" && (
                  <>
                    <p className={MONO}>
                      <span style={{ color: "#ffd2a0" }}>Contact</span>
                    </p>
                    <h2 className="mt-3 text-[1.75rem] font-medium leading-tight tracking-[-0.03em] text-foreground sm:text-4xl">Open to interesting problems.</h2>
                    <p className="mt-3 max-w-md text-pretty text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                      Also: RBC Capital Markets Early ID Program, ~150 of 1,500. A second SSRN paper, written in high school.
                    </p>
                    <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
                      {ELSEWHERE.map((l) => (
                        <li key={l.href}>
                          <a href={l.href} target={l.href.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer" className={`${MONO} text-foreground underline-offset-[6px] hover:underline`}>
                            {l.label} ↗
                          </a>
                        </li>
                      ))}
                    </ul>
                    <p className={`${MONO} mt-8 text-subtle`}>
                      Plain text for machines: <a href="/llms.txt" className="underline-offset-[6px] hover:underline">/llms.txt</a>
                    </p>
                  </>
                )}
              </div>
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
