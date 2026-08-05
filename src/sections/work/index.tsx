import Section from "@/components/primitives/Section";
import { WORK } from "./data";

export const meta = { id: "work", label: "Work" };

export default function Work() {
  return (
    <Section id="work" eyebrow="Work" title="Where I've been">
      <ul className="divide-y divide-border border-y border-border">
        {WORK.map((w) => {
          const Wrapper: React.ElementType = w.href ? "a" : "div";
          const wrapperProps = w.href
            ? { href: w.href, target: "_blank", rel: "noreferrer" }
            : {};
          return (
            <li key={w.slug}>
              <Wrapper
                {...wrapperProps}
                className="group grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 sm:gap-8 py-8 sm:py-10 hover:bg-surface/60 transition-colors -mx-4 sm:-mx-6 px-4 sm:px-6 rounded-lg"
              >
                <div>
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground">
                      {w.company}
                    </h3>
                    <span className="text-sm text-muted">{w.role}</span>
                  </div>
                  <p className="mt-3 text-muted max-w-2xl leading-relaxed">
                    {w.blurb}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {w.tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs font-mono text-muted px-2 py-1 rounded-md bg-surface border border-border"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-sm font-mono text-subtle sm:text-right whitespace-nowrap">
                  {w.period}
                  {w.href && (
                    <span className="block mt-2 text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                      open ↗
                    </span>
                  )}
                </div>
              </Wrapper>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
