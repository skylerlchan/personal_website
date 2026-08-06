import { Fragment, type ElementType } from "react";
import { cn } from "@/lib/utils";

/**
 * Letters that arrive with a bounce and never quite settle.
 *
 * Two animations run on every character at once, which is why each one needs
 * its own element: you cannot put two keyframe animations on the same
 * `transform` without one clobbering the other.
 *
 *   .k-char  — a slow idle bob, always running, phase-shifted per letter so
 *              the line breathes instead of pulsing in unison.
 *   > span   — the scroll-linked entry: drops in, rotates upright, scales up.
 *
 * The entry uses a back-out curve (control point past 1.0) so letters
 * overshoot and settle rather than easing politely into place. That overshoot
 * is the entire difference between "animated" and "alive".
 *
 * Words are wrapped too, because `display: inline-block` on a character would
 * otherwise let a line break fall mid-word.
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
  delay?: number;
}) {
  const words = text.split(" ");
  const total = text.replace(/ /g, "").length;

  const START = 10 + delay * 16;
  const SPAN = 34;
  const CHAR = 26;

  let seen = 0;

  return (
    <Tag className={cn("k-line", className)}>
      {words.map((word, wi) => {
        const chars = [...word];
        const node = (
          <span key={`${word}-${wi}`} className="k-word">
            {chars.map((ch, ci) => {
              const from = START + (seen + ci) / Math.max(total - 1, 1) * SPAN;
              // Vary the idle so no two neighbours bob together.
              const dur = 2.6 + ((seen + ci) % 5) * 0.42;
              const off = -((seen + ci) % 7) * 0.31;
              return (
                <span
                  key={ci}
                  className="k-char"
                  style={{ animationDuration: `${dur}s`, animationDelay: `${off}s` }}
                >
                  <span
                    style={{
                      animationRange: `cover ${from.toFixed(1)}% cover ${(from + CHAR).toFixed(1)}%`,
                    }}
                  >
                    {ch}
                  </span>
                </span>
              );
            })}
          </span>
        );
        seen += chars.length;
        return (
          <Fragment key={`f-${wi}`}>
            {node}
            {wi < words.length - 1 ? " " : ""}
          </Fragment>
        );
      })}
    </Tag>
  );
}
