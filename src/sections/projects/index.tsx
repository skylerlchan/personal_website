import Image from "next/image";
import Section from "@/components/primitives/Section";
import { PROJECTS } from "./data";

export const meta = { id: "projects", label: "Projects" };

export default function Projects() {
  return (
    <Section
      id="projects"
      eyebrow="Projects"
      title="Things I've built"
      description="Personal and research projects, from edge AI to climate models."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {PROJECTS.map((p) => (
          <article
            key={p.slug}
            className="group relative overflow-hidden rounded-2xl border border-border bg-surface/40 hover:bg-surface transition-colors"
          >
            {p.image && (
              <div className="relative aspect-[16/10] overflow-hidden bg-background">
                <Image
                  src={p.image}
                  alt={p.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: `linear-gradient(to top, ${p.accent ?? "#2563eb"}22, transparent)`,
                  }}
                />
              </div>
            )}
            <div className="p-6 sm:p-7">
              <div className="flex items-baseline justify-between gap-4 mb-2">
                <h3 className="text-xl sm:text-2xl font-medium tracking-tight">
                  {p.title}
                </h3>
                <span className="text-xs font-mono text-subtle whitespace-nowrap">
                  {p.year}
                </span>
              </div>
              <p className="text-muted leading-relaxed text-[15px]">{p.blurb}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] font-mono text-muted px-2 py-0.5 rounded-md border border-border"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex gap-3 text-xs font-mono">
                  {p.repo && (
                    <a
                      href={p.repo}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent hover:underline underline-offset-4"
                    >
                      repo ↗
                    </a>
                  )}
                  {p.paper && (
                    <a
                      href={p.paper}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent hover:underline underline-offset-4"
                    >
                      paper ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
