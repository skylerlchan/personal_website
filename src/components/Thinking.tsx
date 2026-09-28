"use client";

import { useEffect, useState } from "react";

/**
 * What the reader sees between sending and the first word.
 *
 * "Reading his resume" was a sentence about the machinery. This is the shape
 * X uses for Grok, which reads as thought rather than loading: nine dots in a
 * grid, a wave of brightness crossing them corner to corner, and a line that
 * says what is happening, typed in rather than dropped in. The typing is the
 * part that makes it feel alive; the dots alone are a spinner with better
 * manners.
 */
export default function Thinking({ label = "Thinking about your question" }: { label?: string }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (still) {
      setShown(label.length);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= label.length) clearInterval(id);
    }, 26);
    return () => clearInterval(id);
  }, [label]);

  return (
    <span className="think" role="status" aria-label={label}>
      <span aria-hidden className="think-grid">
        {Array.from({ length: 9 }, (_, i) => (
          <i key={i} style={{ animationDelay: `${(Math.floor(i / 3) + (i % 3)) * 110}ms` }} />
        ))}
      </span>
      <span aria-hidden className="think-label">
        {label.slice(0, shown)}
      </span>
    </span>
  );
}
