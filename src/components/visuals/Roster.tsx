"use client";

import { useEffect, useRef, useState } from "react";
import type { RosterWorld } from "./roster/RosterWorld";
import type { PropKind } from "./roster/models";

/**
 * The select screen: a canvas showing whichever model the page says is up.
 * three.js loads lazily, so the copy is on screen first; the canvas fades in
 * on its first frame and the page reads fine without it.
 */
export default function Roster({ active, className }: { active: PropKind; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const world = useRef<RosterWorld | null>(null);
  const pending = useRef(active);
  const [ready, setReady] = useState(false);
  pending.current = active;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let stopped = false;
    let w: RosterWorld | null = null;
    import("./roster/RosterWorld")
      .then(({ RosterWorld }) => {
        if (stopped) return;
        try {
          w = new RosterWorld(canvas, pending.current);
          world.current = w;
          setReady(true);
        } catch (e) {
          console.error("Roster: WebGL unavailable", e);
        }
      })
      .catch(() => {});
    return () => {
      stopped = true;
      w?.dispose();
      world.current = null;
    };
  }, []);

  useEffect(() => {
    world.current?.select(active);
  }, [active]);

  return <canvas ref={ref} aria-hidden className={`${className ?? ""} transition-opacity duration-700`} style={{ opacity: ready ? 1 : 0 }} />;
}
