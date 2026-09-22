import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Arm } from "./Arm";
import { skylineTexture } from "./skyline";

/**
 * One model per thing he built, each doing the thing it did, on a loop that
 * reads at a glance: the app answers and charts, the follower arm copies
 * the leader, the browser loads a page, the carry compounds, the blimp
 * inflates and lifts its payload, the camera finds the open bays, the
 * aerosol spreads from the equator. And him, first and last.
 *
 * Local frame: origin at the model's base, +Y up, +Z toward the viewer,
 * +X to the viewer's right. Everything fits in ~3 × 3 × 2.
 */

export type PropKind = "portrait" | "carry" | "curb" | "aerosol" | "hoverloon" | "teleop" | "multiplier" | "browser" | "piano" | "squash";

export interface Prop {
  group: THREE.Group;
  update(dt: number, t: number): void;
  dispose(): void;
}

type Disposable = { dispose(): void };

const SHELL = 0xcfcbc2;
const INK = 0x1a1a1a;
const PANE = 0x2a2a2a;

abstract class Base implements Prop {
  group = new THREE.Group();
  protected trash: Disposable[] = [];
  protected accent: THREE.Color;
  protected shell = this.keep(new THREE.MeshStandardMaterial({ color: SHELL, roughness: 0.55 }));
  protected ink = this.keep(new THREE.MeshStandardMaterial({ color: INK, roughness: 0.45, metalness: 0.15 }));
  protected pane = this.keep(new THREE.MeshStandardMaterial({ color: PANE, roughness: 0.7 }));
  /** The build's own colour, for the parts that glow. */
  protected lit: THREE.MeshBasicMaterial;
  constructor(accent: THREE.Color) {
    this.accent = accent.clone();
    this.lit = this.keep(new THREE.MeshBasicMaterial({ color: accent }));
  }
  protected keep<T extends Disposable>(x: T): T {
    this.trash.push(x);
    return x;
  }
  protected mesh(geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) {
    this.keep(geo);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    this.group.add(m);
    return m;
  }
  protected rbox(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0, r = 0.03) {
    return this.mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)), mat, x, y, z);
  }
  update(_dt: number, _t: number) {}
  dispose() {
    for (const d of this.trash) d.dispose();
  }
}

/* ── Him, and the two cities ─────────────────────────────────────────── */

const PORTRAIT_VS = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

/**
 * A double exposure. His face is lit, so it stays his face; the cities live
 * in the dark of the door, his hair and his jacket, and the windows come on
 * one by one. San Francisco's light is warm, New York's is cool, so the two
 * halves read apart without a word of explanation.
 */
const PORTRAIT_FS = /* glsl */ `
precision highp float;
uniform sampler2D uPhoto;
uniform sampler2D uCity;
uniform float uTime;
uniform float uStrength;
uniform vec3 uWarm;
uniform vec3 uCool;
varying vec2 vUv;

float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

void main() {
  // The photo, cropped to the face.
  vec2 puv = vUv * 0.78 + vec2(0.13, 0.2);
  vec3 photo = texture2D(uPhoto, puv).rgb;
  float lum = dot(photo, vec3(0.299, 0.587, 0.114));

  // The city stands on a horizon low in the disc and sways a hair.
  float base = 0.05, top = 0.82;
  float cy = (vUv.y - base) / (top - base);
  vec3 city = vec3(0.0);
  if (cy > 0.0 && cy < 1.0) {
    vec2 cuv = vec2(vUv.x * 0.94 + 0.03 + 0.006 * sin(uTime * 0.09), cy);
    float mask = texture2D(uCity, cuv).a;
    // Windows: a grid of small lights, most of them on, each with its own slow flicker.
    vec2 cell = vec2(cuv.x * 260.0, cy * 132.0);
    vec2 id = floor(cell), f = fract(cell);
    float lit = step(0.42, hash21(id));
    float flicker = 0.55 + 0.45 * sin(uTime * 1.1 + hash21(id + 11.0) * 6.2831);
    float dot_ = step(0.3, f.x) * step(f.x, 0.72) * step(0.35, f.y) * step(f.y, 0.75);
    float windows = mask * lit * dot_ * flicker;
    // San Francisco is the warm half, New York the cool one.
    vec3 tint = mix(uWarm, uCool, smoothstep(0.25, 0.75, vUv.x));
    // The skyline itself glows faintly; the windows carry the detail.
    city = tint * (0.36 * mask + 1.4 * windows);
    // Haze at street level, and nothing above the roofline.
    city *= 1.0 - smoothstep(0.55, 1.0, cy) * 0.85;
    city *= smoothstep(0.0, 0.16, cy);
  }

  // Screen blend, weighted into the shadows, so his lit face stays his face.
  float w = uStrength * (1.0 - smoothstep(0.12, 0.42, lum));
  vec3 col = 1.0 - (1.0 - photo) * (1.0 - city * w);

  // A soft edge, so the disc is not a cut-out.
  float d = distance(vUv, vec2(0.5));
  float edge = 1.0 - smoothstep(0.47, 0.5, d);
  if (edge <= 0.001) discard;
  gl_FragColor = vec4(col, edge);
}`;

class PortraitProp extends Base {
  private disc: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  constructor(accent: THREE.Color) {
    super(accent);
    // A dark stand-in until the photo lands, so nothing flashes.
    const blank = this.keep(new THREE.DataTexture(new Uint8Array([10, 10, 10, 255]), 1, 1));
    blank.needsUpdate = true;
    this.mat = this.keep(
      new THREE.ShaderMaterial({
        vertexShader: PORTRAIT_VS,
        fragmentShader: PORTRAIT_FS,
        uniforms: {
          uPhoto: { value: blank },
          uCity: { value: this.keep(skylineTexture()) },
          uTime: { value: 0 },
          uStrength: { value: 1 },
          uWarm: { value: new THREE.Color(0xffb36b) },
          uCool: { value: new THREE.Color(0x9fd0ff) },
        },
        transparent: true,
      }),
    );
    this.disc = this.mesh(new THREE.CircleGeometry(1.35, 96), this.mat, 0, 1.55, 0);
    this.disc.castShadow = false;
    // A thin ring in the screen's colour, like a frame.
    const ring = this.mesh(new THREE.RingGeometry(1.35, 1.375, 96), this.lit, 0, 1.55, 0.001);
    ring.castShadow = false;
    new THREE.TextureLoader().load("/images/skyler.jpg", (tx) => {
      tx.colorSpace = THREE.SRGBColorSpace;
      this.mat.uniforms.uPhoto.value = tx;
    });
  }
  update(_dt: number, t: number) {
    this.mat.uniforms.uTime.value = t;
    // The cities burn brighter at night than against paper.
    this.mat.uniforms.uStrength.value = document.documentElement.classList.contains("dark") ? 1.0 : 0.6;
    this.disc.position.y = 1.55 + 0.02 * Math.sin(t * 0.7);
  }
}

/* ── Multiplier: the app, answering and charting ─────────────────────── */

class MultiplierProp extends Base {
  private bubbles: THREE.Mesh[] = [];
  private chart: THREE.Line;
  private chartTotal: number;
  private win = new THREE.Group();
  constructor(accent: THREE.Color) {
    super(accent);
    const w = this.win;
    w.position.y = 1.35;
    w.rotation.y = -0.22;
    w.add(this.rbox(3.2, 2.0, 0.08, this.ink, 0, 0, 0, 0.06));
    // Title bar.
    w.add(this.rbox(3.1, 0.14, 0.02, this.pane, 0, 0.89, 0.045, 0.01));
    // Left: the chat. Bubbles alternate analyst (right, grey) and agent (left, colour).
    const chatX = -0.85;
    for (let i = 0; i < 5; i++) {
      const agent = i % 2 === 1;
      const bw = agent ? 1.15 : 0.75;
      const b = this.rbox(bw, 0.16, 0.02, agent ? this.lit : this.pane, chatX + (agent ? -0.15 : 0.25), 0.62 - i * 0.27, 0.05, 0.05);
      b.castShadow = false;
      b.visible = false;
      this.bubbles.push(b);
      w.add(b);
    }
    // Right: the chart, drawing itself.
    w.add(this.rbox(1.3, 1.5, 0.02, this.pane, 0.85, -0.05, 0.045, 0.02));
    const pts: THREE.Vector3[] = [];
    let seed = 3, v = 0;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) - 0.5;
    for (let i = 0; i < 48; i++) {
      v += 0.012 + rnd() * 0.05;
      pts.push(new THREE.Vector3(0.28 + (i / 47) * 1.14, -0.7 + Math.max(0, v) * 1.0, 0.07));
    }
    const geo = this.keep(new THREE.BufferGeometry().setFromPoints(pts));
    this.chart = new THREE.Line(geo, this.keep(new THREE.LineBasicMaterial({ color: accent })));
    this.chartTotal = pts.length;
    w.add(this.chart);
    this.group.add(w);
  }
  update(_dt: number, t: number) {
    // Every 7 s: five messages arrive one by one, the chart draws alongside.
    const p = (t % 7) / 7;
    this.bubbles.forEach((b, i) => {
      b.visible = p > 0.08 + i * 0.13;
    });
    this.chart.geometry.setDrawRange(0, Math.floor(Math.min(1, p / 0.85) * this.chartTotal));
    this.win.position.y = 1.35 + 0.015 * Math.sin(t * 0.6);
  }
}

/* ── Exahuman: the follower copies the leader ────────────────────────── */

class TeleopProp extends Base {
  private leader: Arm;
  private follower: Arm;
  private buf: number[][] = [];
  private target = new THREE.Vector3();
  constructor(accent: THREE.Color) {
    super(accent);
    const colors = { shell: new THREE.Color(SHELL), servo: new THREE.Color(INK), accent };
    this.leader = new Arm(colors);
    this.follower = new Arm(colors);
    this.leader.root.position.set(-0.95, 0, 0);
    this.follower.root.position.set(0.95, 0, 0);
    this.leader.root.scale.setScalar(0.66);
    this.follower.root.scale.setScalar(0.66);
    this.group.add(this.leader.root, this.follower.root);
    const pipe = this.mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.9, 8), this.lit, 0, 0.1, 0);
    pipe.rotation.z = Math.PI / 2;
    pipe.castShadow = false;
  }
  update(dt: number, t: number) {
    // The leader reaches out, over and back; the follower plays it 0.3 s later.
    this.target.set(-0.95 + 0.45 * Math.sin(t * 0.8), 1.25 + 0.35 * Math.sin(t * 1.6), 0.9 + 0.35 * Math.cos(t * 0.8));
    this.group.localToWorld(this.target);
    this.leader.solve(this.target);
    this.leader.gripGoal = 0.25 + 0.25 * Math.sin(t * 1.6);
    this.leader.update(dt);
    this.buf.push([...this.leader.angles, this.leader.grip]);
    const frames = Math.max(1, Math.round(0.3 / Math.max(dt, 1 / 120)));
    while (this.buf.length > frames) this.buf.shift();
    const src = this.buf[0];
    for (let i = 0; i < 5; i++) this.follower.goal[i] = src[i];
    this.follower.gripGoal = src[5];
    this.follower.update(dt);
  }
  dispose() {
    super.dispose();
    this.leader.dispose();
    this.follower.dispose();
  }
}

/* ── Beta Flow: a browser loading a page inside the editor ───────────── */

class BrowserProp extends Base {
  private win = new THREE.Group();
  private lines: THREE.Mesh[] = [];
  private tabs: THREE.Mesh[] = [];
  constructor(accent: THREE.Color) {
    super(accent);
    const w = this.win;
    w.position.y = 1.35;
    w.rotation.y = -0.22;
    w.add(this.rbox(3.0, 1.95, 0.08, this.ink, 0, 0, 0, 0.06));
    w.add(this.rbox(2.9, 0.16, 0.02, this.pane, 0, 0.86, 0.045, 0.01));
    const code = this.keep(new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 }));
    [0.9, 1.3, 0.6, 1.1, 0.8, 1.2, 0.5].forEach((cw, i) => w.add(this.rbox(cw, 0.05, 0.02, code, -1.35 + cw / 2 + (i % 3) * 0.1, 0.62 - i * 0.2, 0.045, 0.01)));
    // The sidebar: vertical tabs, and a page that loads line by line.
    w.add(this.rbox(1.05, 1.62, 0.03, this.shell, 0.9, -0.08, 0.05, 0.03));
    const page = this.keep(new THREE.MeshStandardMaterial({ color: 0xb0aca2, roughness: 0.9 }));
    for (let i = 0; i < 6; i++) {
      const m = this.rbox(0.7 - (i % 2) * 0.2, 0.05, 0.02, page, 0.86 - ((i % 2) * 0.2) / 2, 0.45 - i * 0.15, 0.075, 0.01);
      m.castShadow = false;
      this.lines.push(m);
      w.add(m);
    }
    const hero = this.rbox(0.75, 0.3, 0.02, page, 0.9, -0.6, 0.075, 0.02);
    hero.castShadow = false;
    this.lines.push(hero);
    w.add(hero);
    for (let i = 0; i < 4; i++) {
      const tab = this.rbox(0.08, 0.08, 0.02, this.keep(new THREE.MeshBasicMaterial({ color: 0x8a8781 })), 0.44, 0.6 - i * 0.16, 0.075, 0.02);
      tab.castShadow = false;
      this.tabs.push(tab);
      w.add(tab);
    }
    this.group.add(w);
  }
  update(_dt: number, t: number) {
    // Every 5 s: switch tab, the page loads top to bottom.
    const cycle = Math.floor(t / 5) % 4;
    const p = (t % 5) / 5;
    this.tabs.forEach((tab, i) => ((tab.material as THREE.MeshBasicMaterial).color.copy(i === cycle ? this.accent : new THREE.Color(0x8a8781))));
    this.lines.forEach((l, i) => (l.visible = p > 0.1 + i * 0.09));
    this.win.position.y = 1.35 + 0.015 * Math.sin(t * 0.6);
  }
}

/* ── Carry: real funding prints, and the equity compounding across them ─ */

class CarryProp extends Base {
  private line: THREE.Line | null = null;
  private total = 0;
  constructor(accent: THREE.Color) {
    super(accent);
    this.rbox(2.8, 0.08, 0.7, this.ink, 0, 0.04, 0);
    fetch("/data/btc-funding.json")
      .then((r) => r.json())
      .then((j: { rates: number[] }) => {
        const rates = j.rates;
        const n = 90;
        const bars = new THREE.InstancedMesh(this.keep(new THREE.BoxGeometry(2.6 / n - 0.006, 1, 0.25)), this.shell, n);
        const m4 = new THREE.Matrix4();
        let eq = 1;
        const curve: THREE.Vector3[] = [];
        for (let i = 0; i < n; i++) {
          const a = Math.floor((i / n) * rates.length), b = Math.floor(((i + 1) / n) * rates.length);
          let s = 0;
          for (let k = a; k < b; k++) {
            s += rates[k];
            eq *= 1 + 3 * rates[k] - 0.00002;
          }
          const mean = s / Math.max(1, b - a);
          const h = Math.max(0.01, Math.abs(mean) * 2600);
          m4.makeScale(1, h, 1);
          m4.setPosition(-1.3 + (2.6 / n) * (i + 0.5), 0.08 + (mean >= 0 ? h / 2 : -h / 2), 0);
          bars.setMatrixAt(i, m4);
          curve.push(new THREE.Vector3(-1.3 + (2.6 / n) * (i + 0.5), 0.45 + Math.log(eq) * 1.1, -0.2));
        }
        bars.castShadow = true;
        this.group.add(bars);
        this.line = new THREE.Line(this.keep(new THREE.BufferGeometry().setFromPoints(curve)), this.keep(new THREE.LineBasicMaterial({ color: this.accent })));
        this.total = curve.length;
        this.group.add(this.line);
      })
      .catch(() => {});
  }
  update(_dt: number, t: number) {
    // The equity line draws itself across three years every 6 s.
    if (!this.line) return;
    const p = Math.min(1, ((t % 6) / 6) * 1.25);
    this.line.geometry.setDrawRange(0, Math.floor(p * this.total));
  }
}

/* ── Hoverloon: inflate, lift the payload, hover ─────────────────────── */

class HoverloonProp extends Base {
  private rotors: THREE.Mesh[] = [];
  private craft = new THREE.Group();
  private envelope: THREE.Mesh;
  private tether: THREE.Line;
  private tetherPos: Float32Array;
  constructor(accent: THREE.Color) {
    super(accent);
    this.mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.14, 24), this.ink, 0, 0.07, 0);
    const c = this.craft;
    this.envelope = this.mesh(new THREE.SphereGeometry(0.62, 40, 26), this.shell, 0, 0.5, 0);
    const gondola = this.rbox(0.8, 0.14, 0.44, this.ink, 0, 0, 0);
    c.add(this.envelope, gondola);
    for (const [x, z] of [[-0.7, -0.5], [0.7, -0.5], [-0.7, 0.5], [0.7, 0.5]]) {
      const arm = this.rbox(Math.hypot(x, z), 0.04, 0.04, this.ink, x / 2, 0, z / 2);
      arm.rotation.y = -Math.atan2(z, x);
      const rotor = this.mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.01, 28), this.keep(new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.35, roughness: 0.4 })), x, 0.08, z);
      this.rotors.push(rotor);
      c.add(arm, rotor);
    }
    c.add(this.rbox(0.42, 0.42, 0.42, this.shell, 0, -0.45, 0));
    this.group.add(c);
    this.tetherPos = new Float32Array([0, 0.14, 0, 0, 0.5, 0]);
    const g = this.keep(new THREE.BufferGeometry());
    g.setAttribute("position", new THREE.BufferAttribute(this.tetherPos, 3));
    this.tether = new THREE.Line(g, this.keep(new THREE.LineBasicMaterial({ color: 0x777777 })));
    this.group.add(this.tether);
  }
  update(dt: number, t: number) {
    // Every 9 s: the envelope fills, the craft lifts its payload, hovers, comes down.
    const p = (t % 9) / 9;
    const fill = THREE.MathUtils.smoothstep(p, 0.05, 0.4) * (1 - THREE.MathUtils.smoothstep(p, 0.85, 0.98));
    const s = 0.55 + 0.45 * fill;
    this.envelope.scale.set(2.1 * s, s, s);
    const lift = THREE.MathUtils.smoothstep(p, 0.3, 0.55) * (1 - THREE.MathUtils.smoothstep(p, 0.8, 0.95));
    this.craft.position.y = 0.7 + 1.3 * lift + 0.03 * Math.sin(t * 1.2) * lift;
    this.craft.rotation.z = 0.03 * Math.sin(t * 0.9) * lift;
    // Rotors work hardest before buoyancy takes over, then idle.
    const work = Math.max(0.15, 1 - lift);
    for (const r of this.rotors) r.rotation.y += dt * (2 + 18 * work);
    this.tetherPos[4] = this.craft.position.y - 0.66;
    (this.tether.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }
}

/* ── LastCurb: the camera, the frame it saw, the bays it found ───────── */

const CURB_MARKS: [number, number][] = [
  [0.455, 0.56],
  [0.72, 0.56],
  [0.745, 0.65],
  [0.86, 0.82],
];

class CurbProp extends Base {
  private head = new THREE.Group();
  private marks: THREE.Mesh[] = [];
  private scan: THREE.Mesh;
  constructor(accent: THREE.Color) {
    super(accent);
    this.mesh(new THREE.CylinderGeometry(0.035, 0.045, 2.2, 12), this.ink, -1.0, 1.1, -0.2);
    this.head.position.set(-1.0, 2.25, -0.2);
    this.group.add(this.head);
    const body = this.rbox(0.18, 0.15, 0.38, this.ink, 0, 0, 0.05);
    const lens = this.mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.08, 16), this.lit, 0, 0, 0.27);
    lens.rotation.x = Math.PI / 2;
    this.head.add(body, lens);
    this.rbox(0.7, 0.05, 0.4, this.ink, 0.45, 0.025, 0.1);
    this.mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8), this.ink, 0.45, 0.35, 0.1);
    const frame = this.rbox(2.2, 1.55, 0.07, this.ink, 0.45, 1.42, 0.1, 0.03);
    const mat = this.keep(new THREE.MeshBasicMaterial({ color: 0x0a0a0a }));
    const screen = new THREE.Mesh(this.keep(new THREE.PlaneGeometry(2.08, 1.44)), mat);
    screen.position.z = 0.04;
    frame.add(screen);
    const ringGeo = this.keep(new THREE.RingGeometry(0.045, 0.07, 24));
    for (const [u, v] of CURB_MARKS) {
      const m = new THREE.Mesh(ringGeo, this.lit);
      m.position.set((u - 0.5) * 2.08, (0.5 - v) * 1.44, 0.045);
      frame.add(m);
      this.marks.push(m);
    }
    this.scan = new THREE.Mesh(this.keep(new THREE.PlaneGeometry(2.08, 0.015)), this.keep(new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.8 })));
    this.scan.position.z = 0.045;
    frame.add(this.scan);
    new THREE.TextureLoader().load("/images/projects/lastcurb-frame.jpg", (tx) => {
      tx.colorSpace = THREE.SRGBColorSpace;
      mat.map = tx;
      mat.color.set(0xbdbdbd);
      mat.needsUpdate = true;
    });
  }
  update(_dt: number, t: number) {
    // Every 6 s: a pass down the frame, then the four bays light up in turn.
    const p = (t % 6) / 6;
    this.scan.visible = p < 0.3;
    this.scan.position.y = 0.72 - (p / 0.3) * 1.44;
    this.marks.forEach((m, i) => {
      const at = 0.35 + i * 0.1;
      m.visible = p > at;
      m.scale.setScalar(1 + 0.5 * Math.max(0, 0.06 - (p - at)) / 0.06);
    });
    this.head.rotation.y = -0.3 + 0.2 * Math.sin(t * 0.5);
  }
}

/* ── Solar geoengineering: aerosol injected at the equator, spreading ── */

class AerosolProp extends Base {
  private sphere = new THREE.Group();
  private N = 2400;
  private pos: Float32Array;
  private lat: Float32Array;
  private lon: Float32Array;
  private rate: Float32Array;
  private pts: THREE.Points;
  constructor(accent: THREE.Color) {
    super(accent);
    this.mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.08, 40), this.ink, 0, 0.04, 0);
    this.mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 10), this.ink, 0, 0.53, 0);
    this.sphere.position.y = 2.0;
    this.sphere.rotation.z = -0.41;
    this.group.add(this.sphere);
    const globe = new THREE.Mesh(this.keep(new THREE.SphereGeometry(0.95, 56, 36)), this.keep(new THREE.MeshStandardMaterial({ color: 0x2c2c2c, roughness: 0.9 })));
    globe.castShadow = true;
    this.sphere.add(globe);
    this.sphere.add(new THREE.LineSegments(this.keep(new THREE.EdgesGeometry(this.keep(new THREE.SphereGeometry(0.952, 24, 12)), 1)), this.keep(new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 }))));
    const N = this.N;
    this.pos = new Float32Array(N * 3);
    this.lat = new Float32Array(N);
    this.lon = new Float32Array(N);
    this.rate = new Float32Array(N);
    for (let i = 0; i < N; i++) this.seed(i, true);
    const g = this.keep(new THREE.BufferGeometry());
    g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    this.pts = new THREE.Points(g, this.keep(new THREE.PointsMaterial({ color: accent, size: 0.022, transparent: true, opacity: 0.9 })));
    this.sphere.add(this.pts);
    this.write();
  }
  private seed(i: number, scatter: boolean) {
    const side = Math.random() < 0.5 ? -1 : 1;
    this.lat[i] = scatter ? side * Math.random() * 1.25 : side * (0.04 + Math.random() * 0.15);
    this.lon[i] = Math.random() * Math.PI * 2;
    this.rate[i] = 0.05 + Math.random() * 0.09;
  }
  private write() {
    const R = 1.06;
    for (let i = 0; i < this.N; i++) {
      const la = this.lat[i], lo = this.lon[i];
      this.pos[i * 3] = R * Math.cos(la) * Math.cos(lo);
      this.pos[i * 3 + 1] = R * Math.sin(la);
      this.pos[i * 3 + 2] = R * Math.cos(la) * Math.sin(lo);
    }
    (this.pts.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }
  update(dt: number) {
    // Injected in the tropics, carried poleward, removed at high latitude.
    for (let i = 0; i < this.N; i++) {
      const s = Math.sign(this.lat[i]) || 1;
      this.lon[i] += dt * (0.4 + 0.35 * Math.cos(this.lat[i]));
      this.lat[i] += s * dt * this.rate[i] * (0.4 + Math.cos(this.lat[i]));
      if (Math.abs(this.lat[i]) > 1.3) this.seed(i, false);
    }
    this.write();
    this.sphere.rotation.y += dt * 0.06;
  }
}

/* ── Piano: two octaves, a phrase ────────────────────────────────────── */

const BLACK_AFTER = [0, 1, 3, 4, 5, 7, 8, 10, 11, 12];
// [key, beat]. Keys ≥ 15 are black.
const PHRASE: [number, number][] = [
  [0, 0], [2, 1], [4, 2], [7, 3], [9, 4], [7, 5], [4, 6], [2, 7],
  [1, 8], [17, 9], [5, 10], [8, 11], [12, 12], [8, 13], [5, 14], [1, 15],
  [3, 16], [18, 17], [7, 18], [10, 19], [14, 20], [10, 21], [7, 22], [3, 23],
];

class PianoProp extends Base {
  private keys: THREE.Mesh[] = [];
  private press = new Float32Array(25);
  private next = 0;
  private start = -1;
  private body = new THREE.Group();
  private keyMats: THREE.MeshStandardMaterial[] = [];
  constructor(accent: THREE.Color) {
    super(accent);
    this.body.position.y = 1.2;
    this.body.rotation.x = 0.45;
    this.body.rotation.y = -0.15;
    this.group.add(this.body);
    const w = 0.16, d = 0.72;
    this.body.add(this.rbox(w * 15 + 0.14, 0.12, d + 0.14, this.ink, 0, -0.08, -0.02, 0.02));
    for (let i = 0; i < 15; i++) {
      const m = this.keep(new THREE.MeshStandardMaterial({ color: 0xe6e3dc, roughness: 0.4, emissive: accent, emissiveIntensity: 0 }));
      this.keyMats.push(m);
      const k = this.rbox(w - 0.012, 0.08, d, m, (i - 7) * w, 0.02, 0, 0.01);
      this.keys.push(k);
      this.body.add(k);
    }
    for (let i = 0; i < 10; i++) {
      const m = this.keep(new THREE.MeshStandardMaterial({ color: INK, roughness: 0.35, emissive: accent, emissiveIntensity: 0 }));
      this.keyMats.push(m);
      const k = this.rbox(0.085, 0.09, d * 0.58, m, (BLACK_AFTER[i] - 6.5) * w, 0.07, -d * 0.21, 0.01);
      this.keys.push(k);
      this.body.add(k);
    }
  }
  update(dt: number, t: number) {
    if (this.start < 0) this.start = t + 0.3;
    const beat = (t - this.start) / 0.17;
    while (this.next < PHRASE.length && PHRASE[this.next][1] <= beat) this.press[PHRASE[this.next++][0]] = 1;
    if (this.next >= PHRASE.length && beat > PHRASE[PHRASE.length - 1][1] + 8) {
      this.next = 0;
      this.start = t;
    }
    for (let i = 0; i < 25; i++) {
      this.press[i] = Math.max(0, this.press[i] - dt * 6);
      this.keys[i].position.y = (i < 15 ? 0.02 : 0.07) - 0.045 * Math.min(1, this.press[i] * 1.5);
      this.keyMats[i].emissiveIntensity = 1.4 * this.press[i];
    }
  }
}

/* ── Squash: the ball, the wall, the racket ──────────────────────────── */

class SquashProp extends Base {
  private ball: THREE.Mesh;
  private racket = new THREE.Group();
  constructor(accent: THREE.Color) {
    super(accent);
    // The front wall, with the tin and the service line.
    this.rbox(2.6, 2.2, 0.08, this.pane, 0, 1.15, -1.0, 0.02);
    const line = this.keep(new THREE.MeshBasicMaterial({ color: 0xff4d4d }));
    this.rbox(2.6, 0.03, 0.02, line, 0, 0.5, -0.95, 0.005);
    this.rbox(2.6, 0.03, 0.02, this.keep(new THREE.MeshBasicMaterial({ color: 0xffffff })), 0, 1.7, -0.95, 0.005);
    // Racket: a hoop on a handle, swinging from the right.
    const hoop = this.mesh(new THREE.TorusGeometry(0.19, 0.016, 8, 40), this.ink, 0, 0.42, 0);
    const handle = this.mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), this.ink, 0, 0, 0);
    this.racket.add(hoop, handle);
    this.racket.position.set(0.9, 0.9, 0.9);
    this.racket.rotation.y = -0.4;
    this.group.add(this.racket);
    this.ball = this.mesh(new THREE.SphereGeometry(0.06, 16, 12), this.lit, 0, 1.0, 0);
    this.ball.castShadow = false;
  }
  update(_dt: number, t: number) {
    // A rally: racket to wall and back every 1.6 s, the racket swinging on contact.
    const p = (t % 1.6) / 1.6;
    const out = p < 0.5 ? p * 2 : 2 - p * 2; // 0 at the racket, 1 at the wall
    const e = out * out * (3 - 2 * out);
    this.ball.position.set(0.8 - 1.4 * e, 1.05 + 0.5 * Math.sin(out * Math.PI), 0.85 - 1.8 * e);
    const swing = Math.exp(-((p < 0.06 ? p : 1 - p + 0.0) ** 2) / 0.004);
    this.racket.rotation.z = 0.35 - 0.9 * swing;
  }
}

export function makeProp(kind: PropKind, accent: THREE.Color): Prop {
  switch (kind) {
    case "piano":
      return new PianoProp(accent);
    case "squash":
      return new SquashProp(accent);
    case "portrait":
      return new PortraitProp(accent);
    case "multiplier":
      return new MultiplierProp(accent);
    case "teleop":
      return new TeleopProp(accent);
    case "browser":
      return new BrowserProp(accent);
    case "carry":
      return new CarryProp(accent);
    case "hoverloon":
      return new HoverloonProp(accent);
    case "curb":
      return new CurbProp(accent);
    case "aerosol":
      return new AerosolProp(accent);
  }
}
