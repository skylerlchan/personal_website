import { Fragment } from "react";
import { cn } from "@/lib/utils";

/**
 * Words rising out of a mask, scrubbed by scroll.
 *
 * Each word sits in an `overflow: hidden` box and starts pushed fully below
 * it, so it is genuinely clipped rather than faded — the edge is what sells it
 * as type being set rather than an element animating in.
 *
 * The important distinction: this is *scroll-linked*, not scroll-triggered.
 * Every word's position is a pure function of where the line sits in the
 * viewport, so scrolling back up un-sets the type. A triggered animation plays
 * once and is done; a linked one is something you operate. That is the part
 * that reads as authored rather than installed.
 *
 * All of it runs on one view timeline declared by the line, with each word
 * taking a staggered slice via `animation-range` — no JS, no observers, and
 * the whole thing composites off the main thread.
 */
export default function StoryLine({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  /** Shifts this line's whole stagger later, so a detail trails its lead. */
  delay?: number;
}) {
  const words = text.split(" ");

  // Reveal across the lower-middle of the line's pass through the viewport:
  // late enough that it is comfortably on screen, early enough to finish
  // before the reader gets there.
  const START = 12 + delay * 18;
  const SPAN = 30;
  const WORD = 20;

  return (
    <p className={cn("story-line", className)}>
      {words.map((w, i) => {
        const from = START + (i / Math.max(words.length - 1, 1)) * SPAN;
        return (
          // The space must be a sibling of the clipping box, not a child:
          // inside an overflow-hidden inline-block a trailing space is
          // trimmed, and every word in the line runs together.
          <Fragment key={`${w}-${i}`}>
            <span className="story-word">
              <span
                style={{
                  animationRange: `cover ${from.toFixed(1)}% cover ${(from + WORD).toFixed(1)}%`,
                }}
              >
                {w}
              </span>
            </span>
            {i < words.length - 1 ? " " : ""}
          </Fragment>
        );
      })}
    </p>
  );
}
