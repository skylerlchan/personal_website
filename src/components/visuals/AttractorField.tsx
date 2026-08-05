"use client";

/**
 * AttractorField — a GPU particle field integrating real strange attractors.
 *
 * Every particle is a point in a 3-D dynamical system. Each frame the GPU
 * advances all of them one midpoint-RK step through the chosen vector field
 * and writes the result back into a float texture (classic ping-pong GPGPU).
 * Nothing is pre-baked: the shapes you see are the attractors emerging.
 *
 * The four systems, and why these four:
 *   LORENZ    — Lorenz 1963, "Deterministic Nonperiodic Flow". Derived from
 *               atmospheric convection; the origin of modern chaos theory.
 *   AIZAWA    — a toroidal attractor with a drill-like axial structure.
 *   THOMAS    — cyclically symmetric, built from sines; a lattice of orbits.
 *   HALVORSEN — cyclically symmetric with quadratic coupling; three lobes.
 *
 * Scroll position morphs continuously between their vector fields. Because
 * time-rescaling a vector field leaves its trajectories unchanged, each field
 * is normalised to unit-ish speed before blending — the geometry stays true,
 * only the pacing is matched.
 *
 * No dependencies: raw WebGL2, ~0 KB of library code.
 */

import { useEffect, useRef, useState } from "react";

export type FieldStats = {
  name: string;
  params: string;
  particles: number;
  fps: number;
};

/**
 * `exposure` is per-system on purpose. These attractors differ by an order of
 * magnitude in how much volume they occupy — Lorenz concentrates onto a thin
 * sheet, while Thomas and Aizawa fill a region — so a single exposure either
 * loses Lorenz in the dark or renders the others as opaque blobs.
 */
const ATTRACTORS = [
  { name: "LORENZ", params: "σ 10 · ρ 28 · β 8/3", exposure: 1.0 },
  { name: "AIZAWA", params: "a 0.95 · b 0.7 · d 3.5", exposure: 0.34 },
  { name: "THOMAS", params: "b 0.19", exposure: 0.3 },
  { name: "HALVORSEN", params: "a 1.89", exposure: 0.6 },
];

/* ── shaders ─────────────────────────────────────────────────────────── */

const QUAD_VS = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const SIM_FS = `#version 300 es
precision highp float;

uniform sampler2D uPos;
uniform float uDt;
uniform float uMorph;
uniform uint  uFrame;
uniform int   uTexW;
uniform int   uSteps;

out vec4 outPos;

uint hash(uint x) {
  x ^= x >> 16; x *= 0x7feb352du;
  x ^= x >> 15; x *= 0x846ca68bu;
  x ^= x >> 16; return x;
}
float rnd(uint s) { return float(hash(s)) * (1.0 / 4294967296.0); }

// Uniform point in a ball — the initial cloud particles fall out of.
vec3 seedPos(uint s) {
  float u = rnd(s * 3u + 0u);
  float v = rnd(s * 3u + 1u);
  float w = rnd(s * 3u + 2u);
  float th = u * 6.28318530718;
  float z  = v * 2.0 - 1.0;
  // Small: seeding wide means most of a particle's life is spent falling in
  // rather than tracing structure, which reads as haze.
  float r  = pow(w, 1.0 / 3.0) * 0.55;
  float sr = sqrt(max(0.0, 1.0 - z * z));
  return vec3(sr * cos(th), sr * sin(th), z) * r;
}

// Each field maps normalised space -> normalised velocity, scaled so all
// four run at comparable speed. Dividing a vector field by a constant is a
// pure time-rescale: the orbits are untouched.

vec3 fLorenz(vec3 n) {
  vec3 p = n * 24.0 + vec3(0.0, 0.0, 26.0);
  vec3 d = vec3(10.0 * (p.y - p.x),
                p.x * (28.0 - p.z) - p.y,
                p.x * p.y - 2.6666667 * p.z);
  return d * (1.0 / 24.0) * 0.11;
}

vec3 fAizawa(vec3 n) {
  vec3 p = n * 1.55 + vec3(0.0, 0.0, 0.6);
  float x = p.x, y = p.y, z = p.z;
  vec3 d = vec3((z - 0.7) * x - 3.5 * y,
                3.5 * x + (z - 0.7) * y,
                0.6 + 0.95 * z - z * z * z / 3.0
                  - (x * x + y * y) * (1.0 + 0.25 * z)
                  + 0.1 * z * x * x * x);
  return d * (1.0 / 1.55) * 0.42;
}

vec3 fThomas(vec3 n) {
  vec3 p = n * 4.2;
  vec3 d = vec3(sin(p.y) - 0.19 * p.x,
                sin(p.z) - 0.19 * p.y,
                sin(p.x) - 0.19 * p.z);
  return d * (1.0 / 4.2) * 4.2;
}

vec3 fHalvorsen(vec3 n) {
  vec3 p = n * 6.5 + vec3(-1.5, -1.5, -1.5);
  float x = p.x, y = p.y, z = p.z;
  vec3 d = vec3(-1.89 * x - 4.0 * y - 4.0 * z - y * y,
                -1.89 * y - 4.0 * z - 4.0 * x - z * z,
                -1.89 * z - 4.0 * x - 4.0 * y - x * x);
  return d * (1.0 / 6.5) * 0.24;
}

vec3 field(int i, vec3 p) {
  if (i == 0) return fLorenz(p);
  if (i == 1) return fAizawa(p);
  if (i == 2) return fThomas(p);
  return fHalvorsen(p);
}

vec3 vel(vec3 p) {
  int i0 = int(floor(uMorph));
  int i1 = min(i0 + 1, 3);
  float f = uMorph - float(i0);
  return mix(field(i0, p), field(i1, p), f);
}

void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  uint id = uint(c.y * uTexW + c.x);

  vec4 s = texelFetch(uPos, c, 0);
  vec3 p = s.xyz;
  float age = s.w;

  // Midpoint (RK2), subdivided. Substepping buys world-time per frame without
  // the per-step error a single large step would incur in the stiff regions.
  float h = uDt / float(uSteps);
  for (int i = 0; i < uSteps; i++) {
    vec3 k1 = vel(p);
    vec3 k2 = vel(p + k1 * h * 0.5);
    p += k2 * h;
  }
  age += uDt;

  // Long lives: a particle needs many world-time units to trace the full
  // structure. Short lifetimes are why an attractor renders as loose arcs.
  float life = 26.0 + rnd(id * 7u + 11u) * 34.0;
  // Negated less-than, not greater-than: NaN fails both, so it respawns too.
  bool bad = !(dot(p, p) < 16.0) || age > life;
  if (bad) {
    p = seedPos(id + uFrame * 2654435761u);
    age = 0.0;
  }

  outPos = vec4(p, age);
}`;

const DRAW_VS = `#version 300 es
precision highp float;

uniform sampler2D uPos;
uniform mat4  uVP;
uniform float uSize;
uniform int   uTexW;

out float vR;

void main() {
  ivec2 c = ivec2(gl_VertexID % uTexW, gl_VertexID / uTexW);
  vec4 s = texelFetch(uPos, c, 0);

  // Swizzle to z-up. These systems are conventionally drawn with z vertical —
  // it is what makes Lorenz read as the butterfly and Aizawa as a spindle.
  vec3 wp = vec3(s.x, s.z, s.y);

  vec4 clip = uVP * vec4(wp, 1.0);
  gl_Position = clip;

  float d = clamp(clip.w, 0.35, 24.0);
  gl_PointSize = uSize / d;

  // Fade the first moments of a particle's life so respawns don't pop.
  vR = length(s.xyz) * smoothstep(0.0, 0.45, s.w);
}`;

const DRAW_FS = `#version 300 es
precision highp float;

in float vR;
uniform vec3  uC0;
uniform vec3  uC1;
uniform vec3  uC2;
uniform float uAlpha;

out vec4 outColor;

void main() {
  vec2 q = gl_PointCoord - 0.5;
  float d2 = dot(q, q);
  if (d2 > 0.25) discard;

  float a = smoothstep(0.25, 0.0, d2);
  float t = clamp(vR * 0.85, 0.0, 1.0);
  vec3 col = t < 0.5
    ? mix(uC0, uC1, t * 2.0)
    : mix(uC1, uC2, (t - 0.5) * 2.0);

  outColor = vec4(col * a * uAlpha, a * uAlpha);
}`;

/**
 * Fade pass. Drawn with blendFunc(ZERO, CONSTANT_COLOR) so the framebuffer is
 * simply multiplied by a decay constant — the source colour is discarded. That
 * turns the HDR buffer into a decaying accumulator, so each particle leaves a
 * short trail along its own trajectory. It is the difference between rendering
 * a cloud of dust and rendering the flow itself.
 */
const FADE_FS = `#version 300 es
precision highp float;
out vec4 outColor;
void main() { outColor = vec4(1.0); }`;

/**
 * Tone mapping. Particles accumulate into an HDR buffer with plain additive
 * blending, then get mapped here. This matters more than it sounds: a strange
 * attractor's density spans orders of magnitude — the Lorenz core is thousands
 * of times denser than its wingtips — so blending straight to an 8-bit canvas
 * blows out the core to flat white and drops the wings to black. A saturating
 * exponential keeps both.
 */
const TONE_FS = `#version 300 es
precision highp float;

uniform sampler2D uHdr;
uniform vec3  uBg;
uniform float uExposure;
uniform float uLight;

out vec4 outColor;

void main() {
  vec3 h = texelFetch(uHdr, ivec2(gl_FragCoord.xy), 0).rgb;

  // Dark: light added to the void.
  vec3 glow = 1.0 - exp(-h * uExposure);

  // Light: the same density subtracted from paper. Absorbing red hardest
  // leaves a cool blue-grey ink rather than the muddy complement you would
  // get from tinting per channel.
  float d = dot(h, vec3(0.299, 0.587, 0.114));
  vec3 ink = exp(-d * uExposure * vec3(1.35));

  // uBg arrives linearised, so compose in linear and encode once at the end.
  vec3 col = mix(uBg + glow, uBg * ink, uLight);
  outColor = vec4(pow(max(col, 0.0), vec3(1.0 / 2.2)), 1.0);
}`;

/* ── tiny mat4 helpers ───────────────────────────────────────────────── */

function perspective(fovy: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  // prettier-ignore
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ]);
}

function lookAt(eye: number[], center: number[], up: number[]) {
  let [zx, zy, zz] = [eye[0] - center[0], eye[1] - center[1], eye[2] - center[2]];
  let len = Math.hypot(zx, zy, zz) || 1;
  zx /= len; zy /= len; zz /= len;

  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  len = Math.hypot(xx, xy, xz) || 1;
  xx /= len; xy /= len; xz /= len;

  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;

  // prettier-ignore
  return new Float32Array([
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
    -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
    -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
    1,
  ]);
}

function multiply(a: Float32Array, b: Float32Array) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      o[c * 4 + r] =
        a[r] * b[c * 4] +
        a[4 + r] * b[c * 4 + 1] +
        a[8 + r] * b[c * 4 + 2] +
        a[12 + r] * b[c * 4 + 3];
    }
  }
  return o;
}

/* ── component ───────────────────────────────────────────────────────── */

export default function AttractorField({
  className,
  onStats,
  scrollTrack,
}: {
  className?: string;
  onStats?: (s: FieldStats) => void;
  /**
   * When given, the morph is scrubbed by how far this element has scrolled
   * past, rather than cycling on a timer. That turns the field into a
   * scroll-driven explainer instead of ambient decoration.
   */
  scrollTrack?: React.RefObject<HTMLElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statsRef = useRef(onStats);
  statsRef.current = onStats;
  const trackRef = useRef(scrollTrack);
  trackRef.current = scrollTrack;

  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: false,
      premultipliedAlpha: true,
      powerPreference: "high-performance",
    });
    if (!gl) {
      setFailed(true);
      return;
    }
    // Float render targets are what make GPGPU integration possible at all.
    if (!gl.getExtension("EXT_color_buffer_float")) {
      setFailed(true);
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    // 256² = 65,536 particles on phones; 384² = 147,456 on desktop.
    const TEX = coarse ? 256 : 384;
    const COUNT = TEX * TEX;

    // World-time advanced per real second, and how finely it is subdivided.
    const SIM_SPEED = 3.2;
    const SUBSTEPS = 3;
    // Per-frame decay of the trail accumulator. ~0.9 gives roughly a 10-frame
    // tail: long enough to draw a filament, short enough not to smear.
    const TRAIL_DECAY = 0.9;

    /* -- program helpers ------------------------------------------------ */

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(sh) || "shader compile failed");
      }
      return sh;
    };

    const link = (vs: string, fs: string) => {
      const p = gl.createProgram()!;
      gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(p) || "program link failed");
      }
      return p;
    };

    let simProg: WebGLProgram, drawProg: WebGLProgram, toneProg: WebGLProgram;
    let fadeProg: WebGLProgram;
    try {
      simProg = link(QUAD_VS, SIM_FS);
      drawProg = link(DRAW_VS, DRAW_FS);
      toneProg = link(QUAD_VS, TONE_FS);
      fadeProg = link(QUAD_VS, FADE_FS);
    } catch {
      setFailed(true);
      return;
    }

    /* -- ping-pong position textures ------------------------------------ */

    const seed = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT; i++) {
      // Match the shader's seed distribution: uniform in a ball.
      const u = Math.random(), v = Math.random(), w = Math.random();
      const th = u * Math.PI * 2;
      const z = v * 2 - 1;
      const r = Math.cbrt(w) * 0.55;
      const sr = Math.sqrt(Math.max(0, 1 - z * z));
      seed[i * 4 + 0] = sr * Math.cos(th) * r;
      seed[i * 4 + 1] = sr * Math.sin(th) * r;
      seed[i * 4 + 2] = z * r;
      seed[i * 4 + 3] = Math.random() * 55; // staggered ages, so respawns never pulse
    }

    const makeTarget = () => {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, TEX, TEX, 0, gl.RGBA, gl.FLOAT, seed);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      return { tex, fbo };
    };

    let a = makeTarget();
    let b = makeTarget();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const uSim = {
      pos: gl.getUniformLocation(simProg, "uPos"),
      dt: gl.getUniformLocation(simProg, "uDt"),
      morph: gl.getUniformLocation(simProg, "uMorph"),
      frame: gl.getUniformLocation(simProg, "uFrame"),
      texW: gl.getUniformLocation(simProg, "uTexW"),
      steps: gl.getUniformLocation(simProg, "uSteps"),
    };
    const uDraw = {
      pos: gl.getUniformLocation(drawProg, "uPos"),
      vp: gl.getUniformLocation(drawProg, "uVP"),
      size: gl.getUniformLocation(drawProg, "uSize"),
      texW: gl.getUniformLocation(drawProg, "uTexW"),
      c0: gl.getUniformLocation(drawProg, "uC0"),
      c1: gl.getUniformLocation(drawProg, "uC1"),
      c2: gl.getUniformLocation(drawProg, "uC2"),
      alpha: gl.getUniformLocation(drawProg, "uAlpha"),
    };
    const uTone = {
      hdr: gl.getUniformLocation(toneProg, "uHdr"),
      bg: gl.getUniformLocation(toneProg, "uBg"),
      exposure: gl.getUniformLocation(toneProg, "uExposure"),
      light: gl.getUniformLocation(toneProg, "uLight"),
    };

    /* -- sizing + HDR target ---------------------------------------------- */

    let dpr = 1, W = 1, H = 1;
    let hdrTex: WebGLTexture | null = null;
    let hdrFbo: WebGLFramebuffer | null = null;

    const allocHdr = () => {
      if (hdrTex) gl.deleteTexture(hdrTex);
      if (hdrFbo) gl.deleteFramebuffer(hdrFbo);
      hdrTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, hdrTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, W, H, 0, gl.RGBA, gl.HALF_FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      hdrFbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, hdrFbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, hdrTex, 0);
      // The accumulator is never cleared during the loop, so clear it here.
      gl.disable(gl.BLEND);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, coarse ? 2 : 1.75);
      const r = canvas.getBoundingClientRect();
      const nw = Math.max(1, Math.round(r.width * dpr));
      const nh = Math.max(1, Math.round(r.height * dpr));
      if (nw === W && nh === H) return;
      W = nw; H = nh;
      canvas.width = W;
      canvas.height = H;
      allocHdr();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    /* -- input ----------------------------------------------------------- */

    let index = 0;
    let targetMorph = 0, morph = 0;
    let targetYaw = 0, yaw = 0;
    let targetPitch = 0, pitch = 0;
    let lastSwitch = performance.now();

    // The field only lives in the hero, so driving the morph from page scroll
    // would mean three of the four systems were never actually on screen.
    // Instead: cycle on a timer, and let a tap advance it immediately.
    const CYCLE_MS = 15000;
    const advance = () => {
      index = (index + 1) % ATTRACTORS.length;
      targetMorph = index;
      lastSwitch = performance.now();
    };

    const onPointer = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      targetYaw = ((e.clientX - r.left) / r.width - 0.5) * 1.1;
      targetPitch = ((e.clientY - r.top) / r.height - 0.5) * 0.55;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    // Tap advances; drag rotates. Distinguishing them keeps both gestures.
    let downAt = 0, downX = 0, downY = 0;
    const onDown = (e: PointerEvent) => {
      downAt = performance.now();
      downX = e.clientX;
      downY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      // Scroll owns the morph when a track is driving it; tapping would fight it.
      if (trackRef.current?.current) return;
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (performance.now() - downAt < 500 && moved < 12) advance();
    };
    canvas.addEventListener("pointerdown", onDown, { passive: true });
    canvas.addEventListener("pointerup", onUp, { passive: true });

    // Opportunistic gyro: works on Android and any iOS device that has
    // already granted motion access. We never prompt.
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      targetYaw = Math.max(-1.1, Math.min(1.1, (e.gamma / 45) * 1.1));
      targetPitch = Math.max(-0.55, Math.min(0.55, ((e.beta - 45) / 60) * 0.55));
    };
    window.addEventListener("deviceorientation", onTilt);

    /* -- theme ------------------------------------------------------------ */

    // The canvas is opaque, so it has to paint the page's own background —
    // read it from the CSS variable rather than duplicating the palette here.
    let isDark = false;
    const bg = [0, 0, 0];
    const readTheme = () => {
      isDark = document.documentElement.classList.contains("dark");
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue("--bg")
        .trim();
      const m = /^#?([0-9a-f]{6})$/i.exec(raw);
      if (m) {
        const v = parseInt(m[1], 16);
        // sRGB -> linear, so the additive glow sums in the right space.
        const lin = (c: number) => Math.pow(c / 255, 2.2);
        bg[0] = lin((v >> 16) & 255);
        bg[1] = lin((v >> 8) & 255);
        bg[2] = lin(v & 255);
      }
    };
    readTheme();
    const mo = new MutationObserver(readTheme);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    /* -- visibility -------------------------------------------------------- */

    let onScreen = true;
    const io = new IntersectionObserver(
      ([entry]) => { onScreen = entry.isIntersecting; },
      { rootMargin: "120px" }
    );
    io.observe(canvas);

    /* -- loop -------------------------------------------------------------- */

    let raf = 0;
    let frame = 0;
    let last = performance.now();
    let fpsAcc = 0, fpsN = 0, lastReport = 0;
    let simTime = 0;

    const render = (now: number) => {
      raf = requestAnimationFrame(render);

      const rawDt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!onScreen || document.hidden) return;

      fpsAcc += rawDt; fpsN++;

      // Scroll-scrubbed when a track is supplied; otherwise cycle on a timer.
      const track = trackRef.current?.current;
      if (track) {
        const r = track.getBoundingClientRect();
        const span = r.height - window.innerHeight;
        const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
        targetMorph = p * (ATTRACTORS.length - 1);
        index = Math.round(targetMorph);
      } else if (now - lastSwitch > CYCLE_MS) {
        advance();
      }

      // Camera eases quickly; the morph is deliberately slow so the transition
      // between two vector fields reads as a transformation, not a cut. Under
      // scroll it has to keep up with the thumb, so it eases roughly 4× faster.
      const ease = 1 - Math.pow(0.001, rawDt);
      const morphEase = 1 - Math.pow(track ? 0.004 : 0.5, rawDt);
      morph += (targetMorph - morph) * morphEase;
      yaw += (targetYaw - yaw) * ease;
      pitch += (targetPitch - pitch) * ease;

      // Reduced motion: settle the attractor, then hold it still.
      const running = !reduced || simTime < 6;
      const dt = running ? Math.min(0.033, rawDt) : 0;
      simTime += dt;

      /* simulate */
      if (dt > 0) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, b.fbo);
        gl.viewport(0, 0, TEX, TEX);
        gl.useProgram(simProg);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, a.tex);
        gl.uniform1i(uSim.pos, 0);
        gl.uniform1f(uSim.dt, dt * SIM_SPEED);
        gl.uniform1f(uSim.morph, morph);
        gl.uniform1ui(uSim.frame, frame >>> 0);
        gl.uniform1i(uSim.texW, TEX);
        gl.uniform1i(uSim.steps, SUBSTEPS);
        gl.disable(gl.BLEND);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        [a, b] = [b, a];
      }

      /* decay the accumulator, then add this frame's particles to it */
      gl.bindFramebuffer(gl.FRAMEBUFFER, hdrFbo);
      gl.viewport(0, 0, W, H);
      gl.enable(gl.BLEND);

      const decay = Math.pow(TRAIL_DECAY, rawDt * 60); // frame-rate independent
      gl.useProgram(fadeProg);
      gl.blendColor(decay, decay, decay, decay);
      gl.blendFunc(gl.ZERO, gl.CONSTANT_COLOR);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.blendFunc(gl.ONE, gl.ONE);

      const aspect = W / H;
      const FOV = (46 * Math.PI) / 180;
      const proj = perspective(FOV, aspect, 0.1, 60);

      // Lens shift: nudging m[2][1] translates the image in screen space at
      // every depth, so on a tall phone the attractor rides above the type
      // instead of sitting behind it. Portrait needs much more than landscape.
      const shift = aspect < 0.8 ? 0.34 : 0.08;
      proj[9] = -shift;

      // Frame against the *narrow* axis so a 390px-wide phone never crops the
      // structure; portrait gets pulled in a little for presence.
      const radius = aspect < 0.8 ? 1.5 : 1.75;
      const dist = radius / (Math.tan(FOV / 2) * Math.min(aspect, 1));
      // Sweep around the face-on view rather than orbiting a full circle: a
      // full turn spends half its time edge-on, where the butterfly collapses
      // into a plume. ±32° keeps the structure legible at all times.
      const ey = yaw + Math.sin(now * 0.00009) * 0.56;
      const pv = pitch + 0.13; // a little elevation reads better than dead-on
      const ex = Math.sin(ey) * Math.cos(pv) * dist;
      const ez = Math.cos(ey) * Math.cos(pv) * dist;
      const eyv = Math.sin(pv) * dist;
      const view = lookAt([ex, eyv, ez], [0, 0, 0], [0, 1, 0]);
      const vp = multiply(proj, view);

      gl.useProgram(drawProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, a.tex);
      gl.uniform1i(uDraw.pos, 0);
      gl.uniformMatrix4fv(uDraw.vp, false, vp);
      gl.uniform1i(uDraw.texW, TEX);

      // Neutral grey ramp — no hue anywhere. Depth has to be carried purely by
      // luminance, which is why the three stops are spaced so widely: with no
      // colour separation, only a big value gap keeps the structure readable.
      gl.uniform3f(uDraw.c0, 1.00, 1.00, 1.00);
      gl.uniform3f(uDraw.c1, 0.52, 0.52, 0.52);
      gl.uniform3f(uDraw.c2, 0.20, 0.20, 0.20);

      // Two passes: a wide dim one for glow, a tight bright one for the core.
      // Alphas are ~1/10 of the un-trailed values: the accumulator sums about
      // ten frames before decay catches up.
      gl.uniform1f(uDraw.size, 7.0 * dpr);
      gl.uniform1f(uDraw.alpha, 0.014);
      gl.drawArrays(gl.POINTS, 0, COUNT);

      gl.uniform1f(uDraw.size, 1.7 * dpr);
      gl.uniform1f(uDraw.alpha, 0.085);
      gl.drawArrays(gl.POINTS, 0, COUNT);

      /* tone map to the canvas */
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      gl.disable(gl.BLEND);
      gl.useProgram(toneProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, hdrTex);
      gl.uniform1i(uTone.hdr, 0);
      gl.uniform3f(uTone.bg, bg[0], bg[1], bg[2]);
      // Blend the per-system exposure alongside the morph so the transition
      // does not flash bright or dark halfway through.
      const e0 = Math.floor(morph);
      const e1 = Math.min(e0 + 1, ATTRACTORS.length - 1);
      const ef = morph - e0;
      const expo =
        ATTRACTORS[e0].exposure * (1 - ef) + ATTRACTORS[e1].exposure * ef;
      gl.uniform1f(uTone.exposure, expo * (isDark ? 0.62 : 0.55));
      gl.uniform1f(uTone.light, isDark ? 0 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      frame++;

      /* stats, ~4 Hz */
      if (statsRef.current && now - lastReport > 250) {
        lastReport = now;
        const fps = fpsN ? Math.round(fpsN / Math.max(fpsAcc, 1e-6)) : 0;
        fpsAcc = 0; fpsN = 0;
        statsRef.current({
          name: ATTRACTORS[index].name,
          params: ATTRACTORS[index].params,
          particles: COUNT,
          fps,
        });
      }
    };

    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      window.removeEventListener("deviceorientation", onTilt);
      gl.deleteProgram(simProg);
      gl.deleteProgram(drawProg);
      gl.deleteProgram(toneProg);
      gl.deleteProgram(fadeProg);
      if (hdrTex) gl.deleteTexture(hdrTex);
      if (hdrFbo) gl.deleteFramebuffer(hdrFbo);
      gl.deleteTexture(a.tex);
      gl.deleteTexture(b.tex);
      gl.deleteFramebuffer(a.fbo);
      gl.deleteFramebuffer(b.fbo);
      gl.deleteVertexArray(vao);
    };
  }, []);

  if (failed) {
    // No WebGL2 / no float targets — a quiet gradient stands in.
    return (
      <div
        aria-hidden
        className={`${className ?? ""} bg-[radial-gradient(ellipse_at_50%_45%,var(--accent)_0%,transparent_62%)] opacity-25`}
      />
    );
  }

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
