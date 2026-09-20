import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { readyFonts, Word } from "./text";

/**
 * A screen. The camera never moves. One station's words are up at a time,
 * centred, faintly curved around the viewer and rippling at one slow rate.
 * Stepping to the next station is the same transition every time: the words
 * warp harder and thin out, the next set warps in and settles. The result
 * number sits behind the name, very large and very dim.
 *
 * The whole view goes through a faint lens: a little barrel warp, a hair of
 * colour fringing, a vignette. Nothing depends on where the pointer is.
 */

export type StationDef = {
  id: string;
  lines: { text: string; size: "title" | "name" | "label" | "small"; mono?: boolean }[];
  /** The number behind the words. */
  figure?: string;
};
export type State = { station: number; fps: number; quality: string };

const LENS = {
  uniforms: { tDiffuse: { value: null }, uK: { value: 0.045 }, uCa: { value: 0.002 }, uVig: { value: 0.5 } },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uK; uniform float uCa; uniform float uVig;
    varying vec2 vUv;
    void main(){
      vec2 c = vUv - 0.5;
      float r2 = dot(c, c);
      vec2 d = c * (1.0 + uK * r2) * (1.0 - uK * 0.25);
      float r = texture2D(tDiffuse, 0.5 + d * (1.0 + uCa)).r;
      float g = texture2D(tDiffuse, 0.5 + d).g;
      float b = texture2D(tDiffuse, 0.5 + d * (1.0 - uCa)).b;
      float vig = 1.0 - uVig * smoothstep(0.15, 0.7, r2);
      gl_FragColor = vec4(vec3(r, g, b) * vig, 1.0);
    }`,
};

type Station = { i: number; def: StationDef; group: THREE.Group; words: Word[]; figure: Word | null; k: number };

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export class CorridorWorld {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
  private composer: EffectComposer;
  private lens: ShaderPass;
  private timer = new THREE.Timer();
  private ro: ResizeObserver;
  private disposed = false;
  private stations: Station[] = [];
  private N: number;
  private portrait = false;
  private reduced = false;
  private fontsReady = false;
  private active = 0;
  private houseLights = 0;

  private quality = 3;
  private locked = false;
  private dprCap = 2;
  private slowFrames = 0;
  private qualityT = 0;

  private fpsAcc = 0;
  private fpsN = 0;
  private fps = 60;
  private stateT = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private defs: StationDef[],
    private opts: { onState?: (s: State) => void; onReady?: () => void } = {},
  ) {
    this.N = defs.length;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
    const r = this.renderer;
    r.toneMapping = THREE.NoToneMapping;
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    this.dprCap = coarse ? 1.5 : 2;
    this.quality = coarse ? 2 : 3;
    const q = new URLSearchParams(window.location.search).get("q");
    if (q !== null && /^[0-3]$/.test(q)) {
      this.quality = Number(q);
      this.locked = true;
    }
    this.scene.background = new THREE.Color(0x050505);

    this.composer = new EffectComposer(r);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.lens = new ShaderPass(LENS);
    this.composer.addPass(this.lens);
    this.composer.addPass(new OutputPass());

    defs.forEach((def, i) => {
      const group = new THREE.Group();
      group.visible = i === 0;
      this.scene.add(group);
      this.stations.push({ i, def, group, words: [], figure: null, k: i === 0 ? 1 : 0 });
    });

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.applyQuality();
    this.camera.position.set(0, 0, 7);
    this.camera.lookAt(0, 0, 0);
    r.setAnimationLoop(this.frame);
    (window as unknown as { __screen?: CorridorWorld }).__screen = this;

    void readyFonts().then(() => {
      if (this.disposed) return;
      this.fontsReady = true;
      this.setWords();
    });
  }

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.ro.disconnect();
    for (const s of this.stations) {
      for (const w of s.words) w.dispose();
      s.figure?.dispose();
    }
    this.composer.dispose();
    this.renderer.dispose();
  }

  /** Which station is up. Called by the page from scroll position or the buttons. */
  show(i: number) {
    this.active = THREE.MathUtils.clamp(i, 0, this.N - 1);
  }

  private setWords() {
    if (!this.fontsReady) return;
    const aniso = this.renderer.capabilities.getMaxAnisotropy();
    const p = this.portrait;
    const cap = { title: p ? 0.5 : 0.95, name: p ? 0.3 : 0.6, label: p ? 0.1 : 0.14, small: p ? 0.13 : 0.19 };
    const maxW = p ? 2.5 : 7.2;
    for (const s of this.stations) {
      for (const w of s.words) {
        s.group.remove(w.mesh);
        w.dispose();
      }
      s.words = [];
      if (s.figure) {
        s.group.remove(s.figure.mesh);
        s.figure.dispose();
        s.figure = null;
      }
      // Measure the stack, then centre it.
      const made: { w: Word; k: number; gap: number }[] = [];
      let total = 0;
      for (const line of s.def.lines) {
        const isLabel = line.size === "label";
        const w = new Word(line.text, { cap: cap[line.size], weight: isLabel ? 400 : 500, mono: line.mono || isLabel, label: isLabel, ripple: isLabel ? 0.015 : 0.05, color: isLabel ? 0x8a8a8a : 0xffffff }, aniso);
        const k = Math.min(1, maxW / w.width);
        const gap = isLabel ? 0.14 : 0.04;
        made.push({ w, k, gap });
        total += w.height * k + gap;
      }
      let y = total / 2;
      for (const { w, k, gap } of made) {
        y -= (w.height * k) / 2;
        w.mesh.position.set(0, y, 0);
        w.mesh.scale.setScalar(k);
        y -= (w.height * k) / 2 + gap;
        s.group.add(w.mesh);
        s.words.push(w);
      }
      if (s.def.figure) {
        const f = new Word(s.def.figure, { cap: p ? 1.6 : 2.8, weight: 500, ripple: 0.08, color: 0x2a2a2a }, aniso);
        const k = Math.min(1, (p ? 2.8 : 9) / f.width);
        f.mesh.scale.setScalar(k);
        f.mesh.position.set(0, p ? -0.25 : -0.3, -0.6);
        s.group.add(f.mesh);
        s.figure = f;
      }
    }
  }

  private applyQuality() {
    this.lens.enabled = this.quality >= 1;
    this.resize();
  }
  private stepDown() {
    if (this.quality === 0 || this.locked) return;
    this.quality--;
    this.dprCap = Math.max(1, this.dprCap - 0.5);
    this.applyQuality();
  }

  private resize() {
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    const dpr = Math.min(window.devicePixelRatio || 1, this.dprCap);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    const wasPortrait = this.portrait;
    this.portrait = w / h < 1;
    this.camera.fov = this.portrait ? 44 : 34;
    this.camera.updateProjectionMatrix();
    if (wasPortrait !== this.portrait) this.setWords();
  }

  private frame = () => {
    if (this.disposed) return;
    this.timer.update();
    const raw = this.timer.getDelta();
    const dt = Math.min(raw, 0.05);
    const t = this.timer.getElapsed();
    this.houseLights = Math.min(1, this.houseLights + dt / 1.6);

    this.qualityT += raw;
    if (this.qualityT > 3) {
      if (raw > 1 / 38) this.slowFrames++;
      if (this.slowFrames > 45) {
        this.slowFrames = 0;
        this.qualityT = 0;
        this.stepDown();
      }
    }

    /* the one transition: the same warp every time, 0.9 s each way */
    const speed = this.reduced ? 8 : 1 / 0.9;
    for (const s of this.stations) {
      const want = s.i === this.active ? 1 : 0;
      s.k = THREE.MathUtils.clamp(s.k + (want > s.k ? 1 : -1) * dt * speed, 0, 1);
      s.group.visible = s.k > 0.001;
      if (!s.group.visible) continue;
      const e = ease(s.k);
      // Leaving words drift up and away; arriving ones rise into place.
      const dir = s.i < this.active ? 1 : -1;
      s.group.position.y = this.reduced ? 0 : (1 - e) * 0.35 * dir;
      for (const w of s.words) {
        w.opacity = e * this.houseLights;
        w.ripple = (this.reduced ? 0 : 0.05) + (1 - e) * 0.45;
        w.tick(this.reduced ? 0 : t);
      }
      if (s.figure) {
        s.figure.opacity = e * this.houseLights;
        s.figure.ripple = (this.reduced ? 0 : 0.08) + (1 - e) * 0.6;
        s.figure.tick(this.reduced ? 0 : t * 0.7);
      }
    }

    if (this.lens.enabled) this.composer.render();
    else this.renderer.render(this.scene, this.camera);

    this.fpsAcc += raw;
    this.fpsN++;
    this.stateT += dt;
    if (this.stateT > 0.2) {
      this.stateT = 0;
      if (this.fpsAcc > 0) this.fps = Math.round(this.fpsN / this.fpsAcc);
      this.fpsAcc = 0;
      this.fpsN = 0;
      this.opts.onState?.({ station: this.active, fps: this.fps, quality: ["bare", "lite", "phone", "full"][this.quality] });
    }
    if (this.opts.onReady) {
      this.opts.onReady();
      this.opts.onReady = undefined;
    }
  };
}
