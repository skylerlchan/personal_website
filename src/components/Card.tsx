"use client";

import { useEffect, useRef, useState } from "react";
import type { Entry } from "@/content/resume";
import CardArt from "@/components/CardArt";

/**
 * One piece of work.
 *
 * The art is drawn, not photographed. Eleven product shots at eleven crops
 * and exposures read as clutter in a row, and putting the name on top of them
 * in white forced every wash dark. Now the art is a pale mesh with a drawing
 * of the actual thing on it, and the name sits below as dark type, which is
 * both quieter and easier to read.
 *
 * Closed, every card in a row is the same height: the art is a fixed aspect,
 * and the three text blocks each have reserved space. Open, the sentence
 * grows to its full measured height and the links appear. Links are
 * deliberately not on the closed card, because a row of them under every card
 * is noise, and reserving space for a row half the entries do not have was
 * what made the cards ragged.
 *
 * The pill only appears when there is something behind it, which is measured
 * rather than guessed: a card whose sentence already fits and has no links has
 * nothing to open, and offering to expand it is a small lie.
 *
 * The rail is `align-items: start`, so opening one card grows that card and
 * not its neighbours.
 */
/** Three lines of the sentence: 0.875rem type on `leading-relaxed` (1.625). */
const SHUT = 3 * 0.875 * 1.625;

export default function Card({ e, hues, lift = 0 }: { e: Entry; hues: [number, number, number]; lift?: number }) {
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(0);
  const lineRef = useRef<HTMLParagraphElement>(null);

  // The sentence's full height, in pixels, so the open state has a real
  // number to grow to. `none` would not animate and a guessed large value
  // would make the motion run at the wrong speed and finish early.
  useEffect(() => {
    const measure = () => {
      const el = lineRef.current;
      if (el) setFull(el.scrollHeight);
    };
    measure();
    // Fraunces and Geist reflow the paragraph when they land.
    document.fonts?.ready.then(measure).catch(() => {});
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const shutPx = SHUT * 16;
  const clipped = full > shutPx + 1;
  const more = clipped || Boolean(e.links?.length);
  const eyebrow = [e.title, e.tag, e.stat && `${e.stat.value}${e.stat.unit ? ` ${e.stat.unit}` : ""}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <article data-card id={e.id} className="card flex scroll-mt-20 flex-col">
      <button
        type="button"
        onClick={() => more && setOpen((v) => !v)}
        aria-expanded={more ? open : undefined}
        disabled={!more}
        className="group flex flex-1 flex-col text-left disabled:cursor-default"
      >
        <div
          className="card-art w-full"
          style={
            {
              "--h1": hues[0],
              "--h2": hues[1],
              "--h3": hues[2],
              "--lift": `${lift}%`,
            } as React.CSSProperties
          }
        >
          <CardArt id={e.id} />
        </div>

        <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
          <p className="truncate text-[0.75rem] leading-tight text-[var(--faint)]">{eyebrow}</p>

          {/* Two lines are reserved so every card in a row is the same height.
              Bottom-aligned, so a one-line headline leaves its slack under the
              eyebrow, where it reads as spacing, rather than above the
              sentence, where it reads as a hole. */}
          <h3 className="mt-1.5 flex min-h-[2.75rem] items-end text-[1.0625rem] font-medium leading-[1.3] text-[var(--ink)]">
            <span className="clamp-2">{e.claim}</span>
          </h3>

          {/* Closed, the box is exactly three lines tall whether the sentence
              fills them or not, which is what keeps a row uniform. Open, it
              grows to the measured height of the whole thing. */}
          <div className="relative mt-1.5">
            <p
              ref={lineRef}
              className="body-clip text-[0.875rem] leading-relaxed text-[var(--dim)]"
              style={{ minHeight: `${SHUT}rem`, maxHeight: open && full ? full : `${SHUT}rem` }}
            >
              {e.line}
            </p>
            <span aria-hidden className="body-fade" data-on={!open && clipped} />
          </div>

          {/* The foot always exists, so a card with nothing to open is still
              exactly as tall as one that has. */}
          <div className="mt-auto flex items-center justify-between gap-3 pt-4">
            <span className="min-h-[1.6875rem]">
              {more && (
                <span className="pill" data-open={open}>
                  {open ? "Read less" : "Read more"}
                  <svg aria-hidden viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 4.75 6 7.75l3-3" />
                  </svg>
                </span>
              )}
            </span>
            <span className="shrink-0 text-[0.6875rem] text-[var(--faint)]">{e.when}</span>
          </div>
        </div>
      </button>

      {/* 0fr to 1fr: the one expansion that is smooth on a phone. `inert`
          while closed, because a zero-height grid row hides the links from
          the eye and the mouse but leaves them in the tab order. */}
      <div
        className="reveal grid transition-[grid-template-rows] duration-[440ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        data-open={open}
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        inert={!open}
      >
        <div className="overflow-hidden">
          {e.links && (
            <p className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-[var(--hair)] px-4 py-3.5">
              {e.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[0.8125rem] text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4 transition-colors hover:decoration-[var(--accent)]"
                >
                  {l.label}
                </a>
              ))}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
