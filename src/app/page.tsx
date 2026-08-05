import Words from "@/components/primitives/Words";
import StatRoll from "@/components/primitives/StatRoll";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { SITE_CONFIG, MULTIPLIER_URL } from "@/lib/constants";

/**
 * v2 — words alone.
 *
 * No images, no canvas, no colour. Every entry is a keyword, one line of what
 * happened, and a date. The only things that move are the words, and they move
 * because of where you have scrolled — not because a timer fired.
 *
 * The keyword sits in mono at the size of a caption while the claim below it
 * runs to 2.5rem. That gap is the whole hierarchy: with nothing but black on
 * white, rank has to come from scale, case and position alone.
 *
 * v1 (attractor hero, project deck, pinned systems) is intact under
 * src/sections and src/components/visuals — nothing was deleted.
 */

type Entry = {
  key: string;
  line: string;
  meta: string;
  stat?: { value: number; unit: string };
  href?: string;
};

const ENTRIES: Entry[] = [
  {
    key: "Now",
    line: "Agents for asset managers, running inside their own cloud.",
    meta: "Multiplier — founding engineer · YC P26",
    href: MULTIPLIER_URL || undefined,
  },
  {
    key: "Climate",
    line: "Black carbon cools the stratosphere better than the sulfate everyone models.",
    meta: "Princeton HMEI — research assistant · 2024–25",
    stat: { value: 10, unit: "×" },
    href: "https://docs.google.com/presentation/d/1YvPFwQQvhCTwXfCP92kaV61j7GZU2b-I/edit",
  },
  {
    key: "Flight",
    line: "Buoyancy carried the load, so the motors did not have to.",
    meta: "Hoverloon — blimp-drone hybrid · 2024–25",
    stat: { value: 19, unit: "×" },
  },
  {
    key: "Machines",
    line: "Teleoperation treated as a data pipeline rather than a control scheme.",
    meta: "SO-101 arms · 2025",
  },
  {
    key: "Markets",
    line: "Delta-neutral carry, harvesting the perpetual funding rate.",
    meta: "Published, SSRN · 2023–24",
    href: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5292305",
  },
  {
    key: "Sensing",
    line: "Edge vision reading open NYC traffic cameras for free kerb space.",
    meta: "LastCurb · 2024",
    href: "https://github.com/skylerlchan/LastCurb",
  },
];

const LINKS = [
  { label: "Email", href: `mailto:${SITE_CONFIG.email}` },
  { label: "GitHub", href: "https://github.com/skylerlchan" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/skylerchan" },
  { label: "X", href: "https://x.com/SkylerChan17" },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 sm:px-10">
      <header className="flex min-h-[82svh] flex-col justify-end pb-24 pt-8">
        <div className="mb-auto flex items-start justify-between">
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.28em] text-muted">
            Skyler Chan
          </span>
          <ThemeToggle />
        </div>

        <h1 className="text-[clamp(2.75rem,11vw,5.5rem)] font-medium leading-[0.95] tracking-[-0.045em] text-foreground">
          Skyler Chan
        </h1>
        <p className="mt-6 max-w-md text-pretty text-lg leading-snug text-muted sm:text-xl">
          I build systems that leave the lab — robotics, climate, and the
          infrastructure under language models.
        </p>
      </header>

      <ol>
        {ENTRIES.map((e) => {
          const Tag = e.href ? "a" : "div";
          const props = e.href
            ? { href: e.href, target: "_blank" as const, rel: "noreferrer" }
            : {};
          return (
            <li key={e.key} className="border-t border-border">
              <Tag
                {...props}
                className="group block py-14 transition-opacity sm:py-20 [@media(hover:hover)]:hover:opacity-60"
              >
                <div className="flex items-baseline justify-between gap-6">
                  <span className="font-mono text-[0.625rem] uppercase tracking-[0.28em] text-muted">
                    {e.key}
                  </span>
                  {e.href && (
                    <span aria-hidden className="font-mono text-[0.625rem] text-muted">
                      ↗
                    </span>
                  )}
                </div>

                {e.stat && (
                  <div className="mt-8 flex items-baseline text-[clamp(3.5rem,16vw,7rem)] font-medium leading-none tracking-[-0.05em] text-foreground">
                    <StatRoll value={e.stat.value} />
                    <span className="text-muted">{e.stat.unit}</span>
                  </div>
                )}

                <Words
                  text={e.line}
                  className="mt-8 max-w-2xl text-[clamp(1.5rem,6vw,2.5rem)] font-medium leading-[1.15] tracking-[-0.035em] text-foreground"
                />

                <Words
                  text={e.meta}
                  delay={0.4}
                  className="mt-6 font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-muted"
                />
              </Tag>
            </li>
          );
        })}
      </ol>

      <footer className="border-t border-border py-20 sm:py-28">
        <Words
          text="Open to interesting problems."
          className="text-[clamp(1.5rem,6vw,2.5rem)] font-medium leading-[1.15] tracking-[-0.035em] text-foreground"
        />
        <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
          {LINKS.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                target={l.href.startsWith("mailto:") ? undefined : "_blank"}
                rel="noreferrer"
                className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-muted underline-offset-[6px] transition-colors hover:text-foreground hover:underline"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-14 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-subtle">
          {SITE_CONFIG.location}
        </p>
      </footer>
    </main>
  );
}
