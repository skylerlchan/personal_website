"use client";

import { useEffect, useRef, useState } from "react";
import type { ArmWorld, StageDef, Telemetry } from "./arm/ArmWorld";

/**
 * Mounts the workbench on a fixed, full-viewport canvas behind the page. The
 * three.js bundle is imported lazily so the text paints first; the canvas
 * fades in on its first rendered frame.
 *
 * The canvas takes no pointer events. Touches and scrolls go to the document
 * as normal, and the world listens on `window` — which is how a finger can
 * both scroll the page and drag the arm.
 */
export default function ArmScene({
  stage,
  onTelemetry,
}: {
  stage: StageDef;
  onTelemetry?: (t: Telemetry) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<ArmWorld | null>(null);
  const stageRef = useRef(stage);
  const telemetryRef = useRef(onTelemetry);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  stageRef.current = stage;
  telemetryRef.current = onTelemetry;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let world: ArmWorld | null = null;
    import("./arm/ArmWorld")
      .then(({ ArmWorld }) => {
        if (cancelled) return;
        try {
          world = new ArmWorld(canvas, {
            onTelemetry: (t) => telemetryRef.current?.(t),
            onReady: () => setReady(true),
          });
          worldRef.current = world;
          world.setStage(stageRef.current);
        } catch (e) {
          console.error("ArmScene: WebGL unavailable", e);
          setFailed(true);
        }
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      world?.dispose();
      worldRef.current = null;
    };
  }, []);

  useEffect(() => {
    worldRef.current?.setStage(stage);
  }, [stage]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 h-full w-full transition-opacity duration-700"
      style={{ opacity: ready && !failed ? 1 : 0 }}
    />
  );
}
