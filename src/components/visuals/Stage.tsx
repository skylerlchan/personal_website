"use client";

import { useEffect, useRef, useState } from "react";
import type { ScrollWorld, Slot } from "./roster/ScrollWorld";

/**
 * The fixed stage behind the page. Feeds the scroll position, in screens,
 * to the world; three.js loads lazily so the copy paints first, and the page
 * reads fine without it.
 */
export default function Stage({ slots, className }: { slots: Slot[]; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let stopped = false;
    let world: ScrollWorld | null = null;
    const read = () => world?.setProgress(window.scrollY / Math.max(1, window.innerHeight));
    import("./roster/ScrollWorld")
      .then(({ ScrollWorld }) => {
        if (stopped) return;
        try {
          world = new ScrollWorld(canvas, slots);
          read();
          window.addEventListener("scroll", read, { passive: true });
          window.addEventListener("resize", read);
          setReady(true);
        } catch (e) {
          console.error("Stage: WebGL unavailable", e);
        }
      })
      .catch(() => {});
    return () => {
      stopped = true;
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
      world?.dispose();
    };
    // The roster is fixed for the life of the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={ref} aria-hidden className={`${className ?? ""} transition-opacity duration-700`} style={{ opacity: ready ? 1 : 0 }} />;
}
