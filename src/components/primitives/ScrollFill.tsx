import { cn } from "@/lib/utils";

/**
 * Copy that inks in word by word as it crosses the viewport — the Apple /
 * Linear reading-pace effect.
 *
 * Each word animates on the *paragraph's* view timeline (declared once by the
 * `.scroll-fill` class) rather than its own, so every word is scheduled
 * against the same scroll range. Staggering is done by giving each word a
 * slice of that range via `animation-range`, which is why this needs no JS at
 * all — the browser drives it on the compositor.
 *
 * Without view-timeline support the words simply render at their final colour;
 * see the @supports guard in globals.css.
 */
export default function ScrollFill({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const words = text.split(" ");
  // Spread the stagger across the middle of the element's pass, and let each
  // word take a wide-ish slice so neighbours overlap and it reads as a sweep
  // rather than a row of individual blinks.
  const START = 18;
  const SPAN = 46;
  const WORD = 16;

  return (
    <p className={cn("scroll-fill", className)}>
      {words.map((w, i) => {
        const from = START + (i / Math.max(words.length - 1, 1)) * SPAN;
        return (
          <span
            key={`${w}-${i}`}
            className="scroll-fill-word"
            style={{
              animationRange: `cover ${from.toFixed(1)}% cover ${(from + WORD).toFixed(1)}%`,
            }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </p>
  );
}
