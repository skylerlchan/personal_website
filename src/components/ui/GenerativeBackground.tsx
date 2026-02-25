"use client";

import { useRef, useEffect } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { simplex3 } from "@/lib/noise";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

/*
 * Curl-noise flow field
 *
 * Particles follow ∇×Ψ where Ψ = simplex3, producing a divergence-free
 * velocity field (no sources or sinks → smooth, coherent streams).
 * Purely time-driven — no user-input coupling.
 */

const FREQ = 0.0015; // base noise scale (lower = larger, calmer structures)
const SPEED = 1.0; // gentle drift
const FADE = 0.04; // trails linger longer
const LINE_ALPHA = 0.14; // visible wisps
const LINE_WIDTH = 0.8;

export default function GenerativeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    let raf = 0;
    let lastFrame = 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const isMobile = window.innerWidth < 768;
    const frameInterval = 1000 / (isMobile ? 20 : 30);
    const N = isMobile ? 800 : 1800;

    let w = 0;
    let h = 0;
    let accent: [number, number, number] = [37, 99, 235];
    let bgColor: [number, number, number] = [250, 250, 249];

    // Particle state (struct-of-arrays)
    const px = new Float32Array(N);
    const py = new Float32Array(N);
    const ox = new Float32Array(N); // previous x
    const oy = new Float32Array(N); // previous y

    // ── Helpers ──────────────────────────────────────────────

    function readColors() {
      const style = getComputedStyle(document.documentElement);
      const ha = style.getPropertyValue("--accent").trim();
      if (ha) accent = hexToRgb(ha);
      const hb = style.getPropertyValue("--bg").trim();
      if (hb) bgColor = hexToRgb(hb);
      // Clear stale trails (wrong bg colour after theme switch)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
    }

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }

    function scatter() {
      for (let i = 0; i < N; i++) {
        px[i] = Math.random() * w;
        py[i] = Math.random() * h;
        ox[i] = px[i];
        oy[i] = py[i];
      }
    }

    // Curl of 2D scalar noise → divergence-free velocity
    // Writes to pre-allocated floats to avoid GC pressure in the hot loop
    let cvx = 0;
    let cvy = 0;
    function curl(nx: number, ny: number, nz: number) {
      const e = 0.001;
      const ddy =
        (simplex3(nx, ny + e, nz) - simplex3(nx, ny - e, nz)) / (2 * e);
      const ddx =
        (simplex3(nx + e, ny, nz) - simplex3(nx - e, ny, nz)) / (2 * e);
      cvx = ddy;
      cvy = -ddx;
    }

    // ── Render ───────────────────────────────────────────────

    function render(timestamp: number, dt: number) {
      const [ar, ag, ab] = accent;
      const [br, bgr, bb] = bgColor;

      // Noise z: time-only drift
      const nz = reducedMotion ? 0 : timestamp * 0.00002;
      const speed = SPEED * dt;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (reducedMotion) {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = `rgba(${ar},${ag},${ab},0.12)`;
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
          ctx.moveTo(px[i] + 0.8, py[i]);
          ctx.arc(px[i], py[i], 0.8, 0, Math.PI * 2);
        }
        ctx.fill();
        return;
      }

      // Fade previous trails (scale by dt so trails fade evenly across frame drops)
      const fade = Math.min(FADE * dt, 1);
      ctx.fillStyle = `rgba(${br},${bgr},${bb},${fade})`;
      ctx.fillRect(0, 0, w, h);

      // ── Update particles ──

      for (let i = 0; i < N; i++) {
        ox[i] = px[i];
        oy[i] = py[i];

        const nx = px[i] * FREQ;
        const ny = py[i] * FREQ;

        // Base flow (large smooth structures)
        curl(nx, ny, nz);

        px[i] += cvx * speed;
        py[i] += cvy * speed;

        // Toroidal wrap (reset prev to suppress cross-screen trail)
        if (px[i] < 0) {
          px[i] += w;
          ox[i] = px[i];
        } else if (px[i] > w) {
          px[i] -= w;
          ox[i] = px[i];
        }
        if (py[i] < 0) {
          py[i] += h;
          oy[i] = py[i];
        } else if (py[i] > h) {
          py[i] -= h;
          oy[i] = py[i];
        }
      }

      // ── Draw trail segments (single batched path) ──

      ctx.strokeStyle = `rgba(${ar},${ag},${ab},${LINE_ALPHA})`;
      ctx.lineWidth = LINE_WIDTH;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const dx = px[i] - ox[i];
        const dy = py[i] - oy[i];
        if (dx * dx + dy * dy > 400) continue; // skip wrapped
        ctx.moveTo(ox[i], oy[i]);
        ctx.lineTo(px[i], py[i]);
      }
      ctx.stroke();
    }

    // ── Loop ─────────────────────────────────────────────────

    function animate(timestamp: number) {
      raf = requestAnimationFrame(animate);
      const elapsed = timestamp - lastFrame;
      if (elapsed < frameInterval) return;
      // dt = 1.0 at target framerate, capped to avoid jumps after tab-switch
      const dt = Math.min(elapsed / frameInterval, 3);
      lastFrame = timestamp;
      render(timestamp, dt);
    }

    // ── Init ─────────────────────────────────────────────────

    readColors();
    resize();
    scatter();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(animate);

    const observer = new MutationObserver(readColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
