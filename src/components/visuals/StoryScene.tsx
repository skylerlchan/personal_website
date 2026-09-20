"use client";

import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import type { ChapterDef, State, StoryWorld } from "./story/StoryWorld";

export type StoryHandle = { toggle: () => void };

/**
 * A fixed, full-viewport canvas behind the page. The three.js bundle loads
 * lazily so the copy paints first; the canvas fades in on its first frame
 * and the page still reads without WebGL.
 */
const StoryScene = forwardRef<StoryHandle, { chapters: ChapterDef[]; onState?: (s: State) => void }>(function StoryScene(
  { chapters, onState },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<StoryWorld | null>(null);
  const stateRef = useRef(onState);
  const chaptersRef = useRef(chapters);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  stateRef.current = onState;

  useImperativeHandle(ref, () => ({ toggle: () => worldRef.current?.toggle() }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let world: StoryWorld | null = null;
    import("./story/StoryWorld")
      .then(({ StoryWorld }) => {
        if (cancelled) return;
        try {
          world = new StoryWorld(canvas, chaptersRef.current, {
            onState: (s) => stateRef.current?.(s),
            onReady: () => setReady(true),
          });
          worldRef.current = world;
        } catch (e) {
          console.error("StoryScene: WebGL unavailable", e);
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

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 h-full w-full transition-opacity duration-1000"
      style={{ opacity: ready && !failed ? 1 : 0 }}
    />
  );
});

export default StoryScene;
