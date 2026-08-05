"use client";

import { useEffect, useRef } from "react";

/**
 * An odometer that rolls its digits into place the first time it is seen.
 *
 * Each digit is a column of numerals 0–9 translated vertically. The column is
 * driven by the same critically damped spring as the project deck, with a
 * per-digit stagger so the number resolves left to right instead of snapping
 * as a block — the way a mechanical counter settles.
 *
 * Rolling *up* from below zero (a full extra turn) rather than counting from
 * zero is what makes it read as a physical wheel: you see numerals pass.
 */
export default function StatRoll({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const colsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const digits = String(value).split("");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      digits.forEach((d, i) => {
        const c = colsRef.current[i];
        if (c) c.style.transform = `translateY(${-Number(d) * 10}%)`;
      });
      return;
    }

    const n = digits.length;
    // Start one full wheel-turn below target so numerals visibly pass by.
    const x = digits.map((d) => Number(d) - 10);
    const v = new Array(n).fill(0);
    const target = digits.map((d) => Number(d));
    const delay = digits.map((_, i) => i * 0.075);

    const K = 120;
    const C = 2 * Math.sqrt(K);

    let raf = 0;
    let started = false;
    let t = 0;
    let last = 0;

    const frame = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      t += dt;

      let settled = true;
      for (let i = 0; i < n; i++) {
        if (t < delay[i]) { settled = false; continue; }
        v[i] += (-K * (x[i] - target[i]) - C * v[i]) * dt;
        x[i] += v[i] * dt;
        if (Math.abs(x[i] - target[i]) > 0.001 || Math.abs(v[i]) > 0.001) settled = false;

        const col = colsRef.current[i];
        if (col) col.style.transform = `translateY(${(-x[i] * 10).toFixed(3)}%)`;
      }

      if (settled) return; // stop the loop entirely once the number has landed
      raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || started) return;
        started = true;
        io.disconnect();
        last = performance.now();
        raf = requestAnimationFrame(frame);
      },
      { threshold: 0.6 },
    );
    io.observe(root);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // Values are static content; re-running on identity change is not wanted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span ref={rootRef} className={className} aria-label={String(value)}>
      {digits.map((d, i) => (
        <span
          key={i}
          aria-hidden
          className="inline-block overflow-hidden align-baseline"
          style={{ height: "1em", lineHeight: "1em" }}
        >
          <span
            ref={(el) => { colsRef.current[i] = el; }}
            className="block will-change-transform"
            style={{ transform: `translateY(${-(Number(d) - 10) * 10}%)` }}
          >
            {Array.from({ length: 10 }, (_, k) => (
              <span key={k} className="block tabular-nums" style={{ height: "1em", lineHeight: "1em" }}>
                {k}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}
