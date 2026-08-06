import { Fragment, type ElementType } from "react";
import { cn } from "@/lib/utils";

/**
 * Words that slide, rotate and drop into place as you scroll past them.
 *
 * Deliberately per-word, not per-character: at body size, characters moving
 * independently read as broken text rather than as motion, and the line stops
 * being legible. Whole words carry the same energy and stay readable.
 *
 * There is no idle animation. Once a line has arrived it is perfectly still —
 * type that never stops moving cannot be read. All the character is in the
 * arrival: each word comes from its own direction, at its own angle, and the
 * easing overshoots slightly so it settles rather than glides.
 *
 * Offsets come from a deterministic hash of the word index, so the layout is
 * identical on server and client (no hydration mismatch) but no two words
 * travel the same path.
 */

/** Cheap integer hash — stable across renders, varied across indices. */
function noise(i: number, salt: number) {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x); // 0..1
}

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

  const START = 10 + delay * 16;
  const SPAN = 34;
  const WORD = 30;

  return (
    <Tag className={cn("k-line", className)}>
      {words.map((w, i) => {
        const from = START + (i / Math.max(words.length - 1, 1)) * SPAN;

        // Alternate the horizontal direction so the line assembles from both
        // sides rather than drifting one way.
        const dir = i % 2 === 0 ? -1 : 1;
        const tx = (0.35 + noise(i, 1) * 0.75) * dir;      // em
        const ty = 0.5 + noise(i, 2) * 0.7;                // em, always downward
        const rot = (2.5 + noise(i, 3) * 7) * dir;         // deg
        const sc = 0.88 + noise(i, 4) * 0.07;

        return (
          <Fragment key={`${w}-${i}`}>
            <span className="k-word">
              <span
                style={
                  {
                    "--tx": `${tx.toFixed(3)}em`,
                    "--ty": `${ty.toFixed(3)}em`,
                    "--rot": `${rot.toFixed(2)}deg`,
                    "--sc": sc.toFixed(3),
                    animationRange: `cover ${from.toFixed(1)}% cover ${(from + WORD).toFixed(1)}%`,
                  } as React.CSSProperties
                }
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
