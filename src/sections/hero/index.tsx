import Link from "next/link";
import { SITE_CONFIG } from "@/lib/constants";

export const meta = { id: "hero", label: "Intro" };

const PROOF = [
  { label: "YC P26", href: "#work" },
  { label: "Princeton", href: "#about" },
  { label: "4 projects shipped", href: "#projects" },
  { label: "1 published paper", href: "#projects" },
];

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-[88svh] w-full px-6 sm:px-8 lg:px-12 pt-28 sm:pt-32 pb-16 flex flex-col justify-center"
    >
      <div className="max-w-5xl mx-auto w-full">
        {/* Status */}
        <div className="reveal inline-flex items-center gap-2.5 rounded-full border border-border bg-surface/60 pl-2.5 pr-3.5 py-1.5 text-xs font-mono text-muted" data-delay="0">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          Founding Engineer — open to interesting problems
        </div>

        {/* Name + instant value prop */}
        <h1 className="reveal mt-7 text-5xl sm:text-7xl lg:text-8xl font-semibold tracking-[-0.03em] leading-[0.95] text-foreground" data-delay="1">
          Skyler Chan
        </h1>

        <p className="reveal mt-6 max-w-2xl text-xl sm:text-2xl md:text-3xl font-medium tracking-tight text-foreground/90 leading-snug" data-delay="2">
          I build <span className="text-accent">AI, robotics &amp; climate systems</span> that
          ship — currently founding engineer at WithAI{" "}
          <span className="text-muted">(YC&nbsp;P26)</span>.
        </p>

        {/* Tappable proof chips */}
        <div className="reveal mt-8 flex flex-wrap gap-2" data-delay="3">
          {PROOF.map((p) => (
            <Link
              key={p.label}
              href={p.href}
              className="inline-flex items-center min-h-9 px-3.5 rounded-full border border-border bg-surface/50 text-sm text-muted hover:text-foreground hover:border-accent/50 active:scale-[0.97] transition-all"
            >
              {p.label}
            </Link>
          ))}
        </div>

        {/* Single primary CTA + quiet secondary */}
        <div className="reveal mt-9 flex flex-wrap items-center gap-x-5 gap-y-3" data-delay="4">
          <Link
            href="#projects"
            className="group inline-flex items-center gap-2 min-h-12 px-7 rounded-full bg-accent text-white text-[0.95rem] font-medium hover:opacity-90 active:scale-[0.98] transition-all"
          >
            See my work
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <a
            href={`mailto:${SITE_CONFIG.email}`}
            className="inline-flex items-center min-h-12 text-[0.95rem] font-medium text-muted hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Email me
          </a>
        </div>
      </div>
    </section>
  );
}
