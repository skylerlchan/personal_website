"use client";

import { useState } from "react";
import type { Entry } from "@/content/resume";
import CardArt from "@/components/CardArt";

/**
 * One piece of work, on a card with two faces.
 *
 * The front is the drawing, the name and the one-line claim. Nothing else:
 * the description used to sit under the claim, clipped to three lines with
 * a Read more, and he asked for it gone. Click the card and it turns over.
 * The back is the description in full and the links. That is the whole
 * interaction.
 *
 * Both faces share one box. The front lays out normally and sets the height;
 * the back is pinned over it, rotated half a turn so the 3-D flip shows it
 * right way round. Every closed card in a row is the same height because the
 * front reserves the same space on each, and the back never changes the box.
 *
 * Links live on the back, which is why the back is not inside the front's
 * button: a link inside a button is a nested control, and a screen reader
 * gets two things fighting over one tap.
 */
export default function Card({ e, hues, lift = 0 }: { e: Entry; hues: [number, number, number]; lift?: number }) {
  const [open, setOpen] = useState(false);
  const eyebrow = [e.title, e.tag, e.stat && `${e.stat.value}${e.stat.unit ? ` ${e.stat.unit}` : ""}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      data-card
      id={e.id}
      className="card scroll-mt-20"
      style={
        {
          "--h1": hues[0],
          "--h2": hues[1],
          "--h3": hues[2],
          "--lift": `${lift}%`,
        } as React.CSSProperties
      }
    >
      <div className="flip" data-open={open}>
        {/* Front: the face that sets the height. */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-label={`${e.title}. Turn over for more.`}
          inert={open}
          className="face face-front group flex w-full flex-col text-left"
        >
          <div className="card-art w-full">
            <CardArt id={e.id} />
          </div>

          <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
            <p className="truncate text-[0.75rem] leading-tight text-[var(--faint)]">{eyebrow}</p>

            {/* Two lines reserved, bottom-aligned, so a one-line claim leaves
                its slack under the eyebrow where it reads as spacing. */}
            <h3 className="mt-1.5 flex min-h-[2.75rem] items-end text-[1.0625rem] font-medium leading-[1.3] text-[var(--ink)]">
              <span className="clamp-2">{e.claim}</span>
            </h3>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-[0.6875rem] text-[var(--faint)]">{e.when}</span>
              <span aria-hidden className="flip-hint">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.5 8a5.5 5.5 0 0 1 9.6-3.7M13.5 8a5.5 5.5 0 0 1-9.6 3.7" />
                  <path d="M12.5 1.5v3h-3M3.5 14.5v-3h3" />
                </svg>
              </span>
            </div>
          </div>
        </button>

        {/* Back: the description and the links. A click anywhere that is not
            a link turns the card back over. */}
        <div
          className="face face-back"
          inert={!open}
          onClick={(ev) => {
            if ((ev.target as HTMLElement).closest("a")) return;
            setOpen(false);
          }}
        >
          <div className="flex h-full flex-col p-4">
            <p className="truncate text-[0.75rem] leading-tight text-[var(--faint)]">{e.title}</p>
            <p className="back-body mt-2 text-[0.8125rem] leading-[1.5] text-[var(--ink)]">{e.line}</p>

            <div className="mt-auto flex items-end justify-between gap-3 pt-3">
              {e.links?.length ? (
                <p className="flex flex-wrap gap-x-4 gap-y-1">
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
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 text-[0.6875rem] text-[var(--faint)] transition-colors hover:text-[var(--ink)]"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
