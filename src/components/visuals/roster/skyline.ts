import * as THREE from "three";

/**
 * One skyline, drawn once: San Francisco on the left, New York on the right,
 * sharing a horizon, so the two cities read as one.
 *
 * Two masks packed into one texture, on opaque black with additive drawing:
 * the red channel is the solid silhouette (where windows may light), the
 * green channel is the outline (the neon wireframe). The portrait shader
 * reads both.
 *
 * Landmarks, left to right: the Golden Gate, Coit Tower, the Transamerica
 * Pyramid, Salesforce Tower, then the Empire State Building, the Chrysler
 * crown, One World Trade, and the Brooklyn Bridge.
 */

const W = 1200;
const H = 600;

let cached: HTMLCanvasElement | null = null;

export function skylineCanvas(): HTMLCanvasElement {
  if (cached) return cached;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const ground = H;
  // Opaque black, then everything adds light, so the two channels stay clean.
  g.fillStyle = "#000";
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "lighter";
  g.fillStyle = "#f00";
  g.strokeStyle = "#f00";

  // Deterministic, so the city is the same on every load.
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  const rect = (x: number, w: number, h: number) => g.fillRect(x, ground - h, w, h);

  /** A generic block, sometimes with a setback tower or an antenna. */
  const block = (x: number, w: number, h: number) => {
    rect(x, w, h);
    const r = rnd();
    if (r > 0.62) rect(x + w * 0.28, w * 0.44, h * (1.08 + 0.16 * r));
    if (r > 0.9) g.fillRect(x + w / 2 - 1, ground - h * 1.32, 2, h * 0.3);
  };

  /** A run of blocks between two x positions. */
  const run = (x0: number, x1: number, lo: number, hi: number) => {
    let x = x0;
    while (x < x1) {
      const w = 26 + rnd() * 46;
      block(x, Math.min(w, x1 - x), lo + rnd() * (hi - lo));
      x += w + 4 + rnd() * 10;
    }
  };

  const pyramid = (cx: number, h: number, halfW: number) => {
    g.beginPath();
    g.moveTo(cx - halfW, ground);
    g.lineTo(cx, ground - h);
    g.lineTo(cx + halfW, ground);
    g.closePath();
    g.fill();
    g.fillRect(cx - 1.5, ground - h - 44, 3, 46);
  };

  const tapered = (cx: number, h: number, wBase: number, wTop: number, spire = 0, round = false) => {
    g.beginPath();
    g.moveTo(cx - wBase / 2, ground);
    g.lineTo(cx - wTop / 2, ground - h);
    if (round) g.quadraticCurveTo(cx, ground - h - wTop * 0.55, cx + wTop / 2, ground - h);
    else g.lineTo(cx + wTop / 2, ground - h);
    g.lineTo(cx + wBase / 2, ground);
    g.closePath();
    g.fill();
    if (spire) g.fillRect(cx - 1.5, ground - h - spire, 3, spire);
  };

  /** Empire State: three setbacks and the mast. */
  const empire = (cx: number, h: number) => {
    const w = 78;
    rect(cx - w / 2, w, h * 0.5);
    rect(cx - w * 0.33, w * 0.66, h * 0.76);
    rect(cx - w * 0.19, w * 0.38, h);
    g.fillRect(cx - 3, ground - h - 40, 6, 42);
    g.fillRect(cx - 1, ground - h - 66, 2, 28);
  };

  /** Chrysler: the stacked crown and the spire. */
  const chrysler = (cx: number, h: number) => {
    const w = 54;
    const bodyH = h * 0.7;
    rect(cx - w / 2, w, bodyH);
    for (let i = 0; i < 5; i++) {
      const rw = (w * (1 - i * 0.15)) / 2;
      const y = ground - bodyH - i * 22;
      g.beginPath();
      g.moveTo(cx - rw, y);
      g.quadraticCurveTo(cx, y - rw * 1.3, cx + rw, y);
      g.closePath();
      g.fill();
    }
    g.fillRect(cx - 1.5, ground - h - 34, 3, 60);
  };

  /** Evaluate a quadratic bezier, for hanging things off a cable. */
  const qy = (p0: number, c: number, p2: number, t: number) => (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * c + t * t * p2;

  /** A suspension bridge: two towers, the main cable, suspenders, the deck. */
  const suspension = (x1: number, x2: number, towerH: number, deckH: number, gothic: boolean) => {
    const deckY = ground - deckH;
    // Deck, running off both edges.
    g.fillRect(x1 - 90, deckY, x2 - x1 + 180, 6);
    for (const x of [x1, x2]) {
      if (gothic) {
        // Brooklyn Bridge: one masonry tower with two pointed arches cut out.
        const w = 44;
        rect(x - w / 2, w, towerH);
        g.globalCompositeOperation = "destination-out";
        for (const ax of [x - 11, x + 11]) {
          const aw = 13, ah = 52, ay = deckY - 8;
          g.beginPath();
          g.moveTo(ax - aw / 2, ay);
          g.lineTo(ax - aw / 2, ay - ah);
          g.quadraticCurveTo(ax, ay - ah - 16, ax + aw / 2, ay - ah);
          g.lineTo(ax + aw / 2, ay);
          g.closePath();
          g.fill();
        }
        g.globalCompositeOperation = "source-over";
      } else {
        // Golden Gate: two legs braced by crossbeams.
        g.fillRect(x - 10, ground - towerH, 7, towerH);
        g.fillRect(x + 3, ground - towerH, 7, towerH);
        for (let i = 0; i < 4; i++) g.fillRect(x - 10, ground - towerH + 22 + i * ((towerH - 40) / 4), 20, 6);
      }
    }
    // Main cable, dipping between the towers, and the two back stays.
    const topY = ground - towerH + 6;
    const midC = deckY + (gothic ? -18 : -6);
    g.lineWidth = 3.5;
    g.beginPath();
    g.moveTo(x1, topY);
    g.quadraticCurveTo((x1 + x2) / 2, midC, x2, topY);
    g.stroke();
    g.beginPath();
    g.moveTo(x1, topY);
    g.quadraticCurveTo(x1 - 55, deckY - 4, x1 - 90, deckY);
    g.stroke();
    g.beginPath();
    g.moveTo(x2, topY);
    g.quadraticCurveTo(x2 + 55, deckY - 4, x2 + 90, deckY);
    g.stroke();
    // Suspenders.
    g.lineWidth = 1.5;
    for (let i = 1; i < 26; i++) {
      const t = i / 26;
      const x = x1 + (x2 - x1) * t;
      const y = qy(topY, midC, topY, t);
      if (y < deckY) g.fillRect(x - 0.75, y, 1.5, deckY - y);
    }
    if (gothic) {
      // The diagonal stays that make the Brooklyn Bridge read as itself.
      g.lineWidth = 1.2;
      for (let i = 1; i <= 7; i++) {
        g.beginPath();
        g.moveTo(x1, topY + 6);
        g.lineTo(x1 + ((x2 - x1) / 2) * (i / 7), deckY);
        g.stroke();
        g.beginPath();
        g.moveTo(x2, topY + 6);
        g.lineTo(x2 - ((x2 - x1) / 2) * (i / 7), deckY);
        g.stroke();
      }
    }
    g.lineWidth = 1;
  };

  // The circle crops the canvas hard at the edges, so everything that has to
  // be read lives between x 180 and x 1020, and the bridges stand clear of
  // the tall clusters with only low roofs behind them.

  /* ── San Francisco, left ── */
  run(186, 330, 46, 96); // low roofs behind the Golden Gate
  // Coit Tower on its hill.
  rect(366, 20, 120);
  g.beginPath();
  g.arc(376, ground - 120, 10, Math.PI, 0);
  g.fill();
  run(340, 410, 70, 150);
  pyramid(440, 306, 34); // Transamerica
  run(466, 500, 80, 170);
  tapered(524, 352, 62, 34, 0, true); // Salesforce
  run(552, 616, 90, 200);

  /* ── the middle: one city running into the other ── */
  run(616, 672, 110, 230);

  /* ── New York, right ── */
  empire(690, 400);
  run(730, 752, 130, 250);
  chrysler(778, 360);
  run(808, 828, 120, 240);
  tapered(856, 446, 66, 34, 84); // One World Trade
  run(886, 1020, 44, 92); // low roofs behind the Brooklyn Bridge

  /* ── the bridges, in front ── */
  suspension(196, 320, 252, 96, false); // Golden Gate
  suspension(902, 994, 182, 88, true); // Brooklyn Bridge

  // The outline pass: the same silhouette, edge-detected into the green
  // channel. Cheaper and truer than drawing every shape twice: take the red
  // mask, and keep the pixels that have a neighbour outside it.
  const src = g.getImageData(0, 0, W, H);
  const out = g.createImageData(W, H);
  const a = src.data, b = out.data;
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : a[(y * W + x) * 4]);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const v = a[i];
      // An edge is a lit pixel touching an unlit one, in any direction.
      const edge = v > 40 && (at(x - 1, y) < 40 || at(x + 1, y) < 40 || at(x, y - 1) < 40 || at(x, y + 1) < 40 || y === H - 1) ? 255 : 0;
      b[i] = v; // keep the fill in red
      b[i + 1] = edge; // the outline in green
      b[i + 2] = 0;
      b[i + 3] = 255;
    }
  }
  g.globalCompositeOperation = "source-over";
  g.putImageData(out, 0, 0);

  cached = c;
  return c;
}

export function skylineTexture(): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(skylineCanvas());
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  return tex;
}
