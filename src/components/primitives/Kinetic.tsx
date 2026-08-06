import { Fragment, type ElementType } from "react";
import { cn } from "@/lib/utils";

/**
 * Words rising into place as you scroll past them.
 *
 * Deliberately uniform: every word travels the same distance, in the same
 * direction, on the same curve. An earlier version gave each word a random
 * angle and side to arrive from, which read as chaos rather than character —
 * with type, the restraint is the elegance. The only variation is *when* each
 * word starts, which is what makes the line resolve left to right like it is
 * being set rather than switched on.
 *
 * Each word sits in an `overflow: hidden` box and starts fully below it, so it
 * is genuinely clipped rather than faded — that hard edge is the whole effect.
 *
 * Scroll-*linked*, not scroll-triggered: every word's position is a pure
 * function of where its line sits in the viewport, so scrolling back up
 * un-sets the type. Runs on one view timeline per line, no JS.
 */
export default function Kinetic({
  text,
  as: Tag = "p",
  className,
  delay = 0,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  /** Shifts the whole stagger later, so a caption trails its headline. */
  delay?: number;
}) {
  const words = text.split(" ");

  // Reveal across the lower-middle of the line's pass through the viewport.
  // A wide per-word window means neighbours overlap heavily, which is what
  // makes it read as one sweep instead of a row of separate reveals.
  const START = 14 + delay * 16;
  const SPAN = 28;
  const WORD = 26;

  return (
    <Tag className={cn("k-line", className)}>
      {words.map((w, i) => {
        const from = START + (i / Math.max(words.length - 1, 1)) * SPAN;
        return (
          // The space must be a sibling of the clipping box, not a child:
          // inside an overflow-hidden inline-block a trailing space is
          // trimmed and every word in the line runs together.
          <Fragment key={`${w}-${i}`}>
            <span className="k-word">
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
