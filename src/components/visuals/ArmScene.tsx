"use client";

import { useEffect, useRef, useState } from "react";
import type { RideWorld, SceneDef, Telemetry } from "./arm/RideWorld";

/**
 * Mounts the ride on a fixed, full-viewport canvas behind the page. The
 * three.js bundle is imported lazily so the text paints first; the canvas
 * fades in on its first rendered frame.
 *
 * The canvas takes no pointer events. Touches and scrolls go to the document
 * as normal, and the world listens on `window` — which is how a finger can
 * scroll the page, drag the arm, and turn the vehicle's head.
 */
export default function ArmScene({
  scenes,
  onTelemetry,
}: {
  scenes: SceneDef[];
  onTelemetry?: (t: Telemetry) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const telemetryRef = useRef(onTelemetry);
  const scenesRef = useRef(scenes);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  telemetryRef.current = onTelemetry;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let world: RideWorld | null = null;
    import("./arm/RideWorld")
      .then(({ RideWorld }) => {
        if (cancelled) return;
        try {
          world = new RideWorld(canvas, scenesRef.current, {
            onTelemetry: (t) => telemetryRef.current?.(t),
            onReady: () => setReady(true),
          });
        } catch (e) {
          console.error("ArmScene: WebGL unavailable", e);
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
      className="pointer-events-none fixed inset-0 h-full w-full transition-opacity duration-1000"
      style={{ opacity: ready && !failed ? 1 : 0 }}
    />
  );
}
