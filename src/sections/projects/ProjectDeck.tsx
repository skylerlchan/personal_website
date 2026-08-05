"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { Project } from "./data";

/**
 * A scroll-driven card deck.
 *
 * Each project pins in place while the next one rises over it; the covered
 * card recedes — scaling down, lifting, tilting back on the X axis and dimming
 * — so the stack reads as real depth rather than a crossfade.
 *
 * The part that is actually hard is the *feel*. Binding a transform directly
 * to scroll position is stiff: the card is exactly where the scrollbar says it
 * is, which reads as mechanical, and every scroll jitter shows up in the
 * geometry. So scroll only sets a *target*, and each card chases that target
 * through a critically damped spring integrated in a single rAF loop.
 *
 *     ẍ = −k(x − target) − cẋ,    c = 2√k   ⟶  critical damping
 *
 * Critical damping is the unique c that returns to target in minimum time with
 * no overshoot, so cards settle crisply but never wobble. It also low-passes
 * scroll noise for free. Same family of maths as the attractors in the hero,
 * which is a happy accident.
 *
 * Only transform and opacity are written, so the compositor does the work and
 * the main thread stays free for the WebGL sim further up the page.
 */
export default function ProjectDeck({ items }: { items: Project[] }) {
  const slotsRef = useRef<(HTMLDivElement | null)[]>([]);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const veilsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const n = items.length;
    const x = new Float32Array(n); // spring position, 0 = presented, 1 = buried
    const v = new Float32Array(n); // spring velocity

    const K = 190;
    const C = 2 * Math.sqrt(K);

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      // Clamp dt: a backgrounded tab would otherwise hand us a huge step and
      // blow the integrator up on the first frame back.
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;

      for (let i = 0; i < n; i++) {
        const slot = slotsRef.current[i];
        const card = cardsRef.current[i];
        if (!slot || !card) continue;

        // Nothing stacks on top of the last card, so it never recedes.
        let target = 0;
        if (i < n - 1) {
          const r = slot.getBoundingClientRect();
          target = Math.min(1, Math.max(0, -r.top / r.height));
        }

        // Semi-implicit Euler: update velocity first, then position.
        v[i] += (-K * (x[i] - target) - C * v[i]) * dt;
        x[i] += v[i] * dt;

        const p = x[i];
        // Skip work once a card has settled offstage.
        if (p < 0.0005 && Math.abs(v[i]) < 0.0005) {
          card.style.transform = "";
          const veil0 = veilsRef.current[i];
          if (veil0) veil0.style.opacity = "0";
          continue;
        }

        card.style.transform =
          `translate3d(0, ${(-22 * p).toFixed(2)}px, 0) ` +
          `scale(${(1 - 0.08 * p).toFixed(4)}) ` +
          `rotateX(${(4.5 * p).toFixed(2)}deg)`;

        const veil = veilsRef.current[i];
        if (veil) veil.style.opacity = (0.62 * p).toFixed(3);
      }
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [items.length]);

  return (
    <div className="mt-4">
      {items.map((p, i) => (
        <div
          key={p.slug}
          ref={(el) => { slotsRef.current[i] = el; }}
          className="h-[92svh]"
        >
          <div
            className="sticky top-[4.5rem] h-[calc(92svh-4.5rem)]"
            style={{ perspective: "1400px" }}
          >
            <div
              ref={(el) => { cardsRef.current[i] = el; }}
              className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-border bg-surface will-change-transform"
              style={{ transformOrigin: "50% 0%" }}
            >
              {p.image && (
                <div className="relative min-h-0 flex-1 bg-background">
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 960px"
                    className="object-cover"
                    priority={i === 0}
                  />
                  <div
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-2/3"
                    style={{
                      background: `linear-gradient(to top, var(--surface), transparent)`,
                    }}
                  />
                </div>
              )}

              <div className="relative shrink-0 p-6 sm:p-8">
                <div
                  aria-hidden
                  className="absolute inset-x-6 top-0 h-px sm:inset-x-8"
                  style={{ background: p.accent ?? "var(--accent)" }}
                />
                <div className="flex items-baseline justify-between gap-4 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted">
                  <span>
                    {String(i + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
                  </span>
                  <span className="tabular-nums">{p.year}</span>
                </div>

                <h3 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-foreground sm:text-4xl">
                  {p.title}
                </h3>
                <p className="mt-3 max-w-xl text-pretty text-[0.9375rem] leading-relaxed text-muted">
                  {p.blurb}
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md border border-border px-2 py-0.5 font-mono text-[11px] text-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-4 font-mono text-xs">
                    {p.repo && (
                      <a
                        href={p.repo}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent underline-offset-4 hover:underline"
                      >
                        repo ↗
                      </a>
                    )}
                    {p.paper && (
                      <a
                        href={p.paper}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent underline-offset-4 hover:underline"
                      >
                        paper ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Dimming veil — opacity only, so it composites for free. */}
              <div
                ref={(el) => { veilsRef.current[i] = el; }}
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[28px] bg-background opacity-0"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
