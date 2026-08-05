import { Fragment, type ElementType } from "react";
import { cn } from "@/lib/utils";

/**
 * Type that sets itself as you scroll.
 *
 * Each word sits in an `overflow: hidden` box and starts pushed fully below
 * it, so it is genuinely clipped rather than faded — that hard edge is what
 * reads as type being set rather than an element animating in.
 *
 * Scroll-*linked*, not scroll-triggered: every word's position is a pure
 * function of where its line sits in the viewport, so scrolling back up
 * un-sets the type. A triggered animation plays once and is spent; a linked
 * one is something you operate.
 *
 * One view timeline per line, each word taking a staggered slice via
 * `animation-range` — no JS, no observers, composited off the main thread.
 */
export default function Words({
  text,
  as: Tag = "p",
  className,
  delay = 0,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  /** Shifts the whole stagger later, so a subhead trails its heading. */
  delay?: number;
}) {
  const words = text.split(" ");

  const START = 12 + delay * 18;
  const SPAN = 30;
  const WORD = 20;

  return (
    <Tag className={cn("story-line", className)}>
      {words.map((w, i) => {
        const from = START + (i / Math.max(words.length - 1, 1)) * SPAN;
        return (
          // The space must be a sibling of the clipping box, not a child:
          // inside an overflow-hidden inline-block a trailing space is
          // trimmed and every word in the line runs together.
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
    </Tag>
  );
}
