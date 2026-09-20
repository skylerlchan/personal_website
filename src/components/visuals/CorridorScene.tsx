"use client";

import { useEffect, useRef, useState } from "react";
import type { CorridorWorld, StationDef, State } from "./corridor/CorridorWorld";

/**
 * A fixed, full-viewport canvas behind the page. The three.js bundle loads
 * lazily so the (screen-reader) copy and the links paint first; the canvas
 * fades in on its first frame.
 */
export default function CorridorScene({ stations, onState }: { stations: StationDef[]; onState?: (s: State) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(onState);
  const defsRef = useRef(stations);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  stateRef.current = onState;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let world: CorridorWorld | null = null;
    import("./corridor/CorridorWorld")
      .then(({ CorridorWorld }) => {
        if (cancelled) return;
        try {
          world = new CorridorWorld(canvas, defsRef.current, { onState: (s) => stateRef.current?.(s), onReady: () => setReady(true) });
        } catch (e) {
          console.error("CorridorScene: WebGL unavailable", e);
          setFailed(true);
        }
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      world?.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 h-full w-full transition-opacity duration-[1500ms]"
      style={{ opacity: ready && !failed ? 1 : 0 }}
    />
  );
}
