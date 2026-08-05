import Section from "@/components/primitives/Section";
import StatRoll from "@/components/primitives/StatRoll";
import { WORK } from "./data";

export const meta = { id: "work", label: "Work" };

/**
 * These numbers were buried inside prose. They are the strongest thing on the
 * page, so they get to be the largest thing on the page.
 */
const STATS = [
  { value: 19, unit: "×", label: "payload capacity", note: "Hoverloon vs. baseline drone" },
  { value: 10, unit: "×", label: "cooling effectiveness", note: "black carbon vs. sulfate aerosol" },
  { value: 2, unit: "hr", label: "demonstrated flight", note: "projected 6–12 with a better envelope" },
  { value: 1, unit: "", label: "published paper", note: "SSRN — basis divergence arbitrage" },
];

export default function Work() {
  return (
    <Section id="work" eyebrow="Work" title="Where I've been">
      {/* Roles — period on a rail, detail alongside. */}
      <ul className="border-t border-border">
        {WORK.map((w) => {
          const Wrapper: React.ElementType = w.href ? "a" : "div";
          const wrapperProps = w.href
            ? { href: w.href, target: "_blank", rel: "noreferrer" }
            : {};
          return (
            <li key={w.slug} className="border-b border-border">
              <Wrapper
                {...wrapperProps}
                className="group -mx-4 grid grid-cols-1 gap-x-10 gap-y-4 rounded-lg px-4 py-9 transition-colors hover:bg-surface/50 sm:-mx-6 sm:px-6 sm:py-11 lg:grid-cols-[9rem_1fr]"
              >
                <div className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-subtle">
                  {w.period}
                  {w.href && (
                    <span className="mt-2 block text-accent opacity-0 transition-opacity group-hover:opacity-100">
                      open ↗
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-2xl font-medium tracking-[-0.03em] text-foreground sm:text-3xl">
                      {w.company}
                    </h3>
                    <span className="text-sm text-muted">{w.role}</span>
                  </div>
                  <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted">
                    {w.blurb}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {w.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md border border-border bg-surface px-2 py-1 font-mono text-[11px] text-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Wrapper>
            </li>
          );
        })}
      </ul>

      {/* By the numbers. */}
      <div className="mt-16 sm:mt-20">
        <div className="mb-8 font-mono text-[0.625rem] uppercase tracking-[0.22em] text-muted">
          By the numbers
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <dd className="flex items-baseline text-5xl font-medium tracking-[-0.04em] text-foreground sm:text-6xl">
                <StatRoll value={s.value} />
                {/* A symbol carries the numeral's weight; a word set that large
                    competes with it, so word units step down. */}
                <span
                  className={
                    s.unit.length > 1
                      ? "ml-0.5 text-2xl text-accent sm:text-3xl"
                      : "text-accent"
                  }
                >
                  {s.unit}
                </span>
              </dd>
              <dt className="mt-3 text-[0.9375rem] leading-snug text-foreground/90">
                {s.label}
              </dt>
              <p className="mt-1.5 text-[0.8125rem] leading-snug text-subtle">{s.note}</p>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}
