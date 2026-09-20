import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Arm } from "./Arm";

/**
 * The builds. Each chapter of the site is one of these: a list of parts
 * that fly onto the bench in a deliberate order as the visitor scrolls,
 * then a machine that runs when switched on, then a result.
 *
 * Local frame: origin at the bench centre, +Y up, +Z toward the viewer,
 * +X to the viewer's right. Everything fits in roughly a 4 × 3.5 × 3 box.
 */

export type BuildKind = "carry" | "curb" | "aerosol" | "hoverloon" | "teleop" | "multiplier";

export type Result = { big: string; sub: string };

export interface Build {
  kind: BuildKind;
  group: THREE.Group;
  /** What a tap can hit. */
  targets: THREE.Object3D[];
  /** 0 → 1: parts arrive. */
  assemble(a: number): void;
  power(on: boolean): void;
  on: boolean;
  update(dt: number, t: number): void;
  /** A tap on the build while it is on. */
  poke(): void;
  /** A held finger, world-space, or null. */
  steer?(p: THREE.Vector3 | null): void;
  result(): Result;
  readout(): string;
  dispose(): void;
}

type Part = {
  obj: THREE.Object3D;
  to: THREE.Vector3;
  from: THREE.Vector3;
  tumble: THREE.Euler;
  order: number; // 0..1, when this part arrives
  grow: boolean; // scale in place instead of flying in
  base: number; // the part's own scale, restored when grown
};

type Disposable = { dispose(): void };

// A tiny deterministic generator so parts scatter the same way every load.
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

const ease = (x: number) => 1 - Math.pow(1 - x, 3);

abstract class Base implements Build {
  abstract kind: BuildKind;
  group = new THREE.Group();
  targets: THREE.Object3D[] = [];
  on = false;
  protected parts: Part[] = [];
  protected assembled = false;
  protected trash: Disposable[] = [];
  protected shell: THREE.MeshStandardMaterial;
  protected ink: THREE.MeshStandardMaterial;
  protected glow: THREE.MeshBasicMaterial;
  protected accent: THREE.Color;
  protected onT = 0; // seconds since power on
  private rnd: () => number;

  constructor(accent: THREE.Color, seed: number) {
    this.accent = accent.clone();
    this.rnd = rng(seed);
    this.shell = this.keep(new THREE.MeshStandardMaterial({ color: 0xcfcbc2, roughness: 0.55 }));
    this.ink = this.keep(new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.45, metalness: 0.15 }));
    this.glow = this.keep(new THREE.MeshBasicMaterial({ color: accent.clone().multiplyScalar(2.4), toneMapped: false }));
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
    return m;
  }
  protected rbox(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0, r = 0.03) {
    return this.mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)), mat, x, y, z);
  }
  /**
   * Register a part. `order` is when it arrives, 0 first. Parts fly in from
   * above and a little outward, tumbling, and settle exactly on their spot.
   */
  protected part(obj: THREE.Object3D, order: number, grow = false) {
    const to = obj.position.clone();
    const r = this.rnd;
    const from = to.clone().add(new THREE.Vector3((r() - 0.5) * 3, 3.5 + r() * 2.5, (r() - 0.5) * 2 + 1));
    const tumble = new THREE.Euler((r() - 0.5) * 2.5, (r() - 0.5) * 2.5, (r() - 0.5) * 2.5);
    this.parts.push({ obj, to, from, tumble, order, grow, base: obj.scale.x });
    this.group.add(obj);
    this.targets.push(obj);
    return obj;
  }
  protected hitBox(w: number, h: number, d: number, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(this.keep(new THREE.BoxGeometry(w, h, d)), this.keep(new THREE.MeshBasicMaterial({ visible: false })));
    m.position.set(x, y, z);
    this.group.add(m);
    this.targets.push(m);
    return m;
  }
  /**
   * Each part gets a window of the assembly; windows overlap so it flows.
   * Only called while `a` is changing, so once a build is complete its own
   * update() owns every transform.
   */
  assemble(a: number) {
    this.assembled = a >= 0.999;
    const span = 0.32;
    for (const p of this.parts) {
      const q = ease(THREE.MathUtils.clamp((a - p.order * (1 - span)) / span, 0, 1));
      p.obj.visible = q > 0.001;
      if (p.grow) {
        p.obj.scale.setScalar(Math.max(0.001, q) * p.base);
      } else {
        p.obj.position.lerpVectors(p.from, p.to, q);
        p.obj.rotation.set(p.tumble.x * (1 - q), p.tumble.y * (1 - q), p.tumble.z * (1 - q));
        p.obj.scale.setScalar(p.base);
      }
    }
  }
  power(on: boolean) {
    if (on === this.on) return;
    this.on = on;
    this.onT = 0;
  }
  poke() {}
  readout() {
    return "";
  }
  abstract result(): Result;
  abstract update(dt: number, t: number): void;
  protected tick(dt: number) {
    if (this.on) this.onT += dt;
  }
  dispose() {
    for (const d of this.trash) d.dispose();
  }
}

/* ── 2023 · BTC funding carry ────────────────────────────────────────── */

export type FundingSeries = { start: number; stepMs: number; rates: number[]; from: string; to: string };

class Carry extends Base {
  kind = "carry" as const;
  private series: FundingSeries | null = null;
  private idx = 0;
  private acc = 0;
  private equity = 1;
  private peak = 1;
  private dd = 0;
  private bars: THREE.InstancedMesh;
  private nBars = 90;
  private hist: number[] = [];
  private ribbon: THREE.Mesh;
  private ribbonPos: Float32Array;
  private eq: number[] = [];
  private nEq = 120;
  private lever: THREE.Group;
  private m4 = new THREE.Matrix4();
  private cA = new THREE.Color();
  private cB = new THREE.Color(0x7a7a7a);

  constructor(accent: THREE.Color) {
    super(accent, 11);
    // The tape: a long slab the funding prints run across.
    this.part(this.rbox(4.2, 0.12, 1.0, this.ink, 0, 0.06, 0.4), 0);
    // Two legs of the hedge: long spot, short perp, and the beam that ties them.
    this.part(this.rbox(0.6, 0.6, 0.6, this.shell, -1.0, 0.42, -0.5), 0.15);
    this.part(this.rbox(0.6, 0.6, 0.6, this.ink, 1.0, 0.42, -0.5), 0.25);
    const beam = this.rbox(1.5, 0.05, 0.05, this.glow, 0, 0.42, -0.5);
    beam.castShadow = false;
    this.part(beam, 0.38);
    // The 3× lever.
    this.lever = new THREE.Group();
    this.lever.position.set(1.7, 0.12, -0.5);
    this.lever.add(this.mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 10), this.ink, 0, 0.27, 0));
    this.lever.add(this.mesh(new THREE.SphereGeometry(0.07, 14, 10), this.glow, 0, 0.55, 0));
    this.lever.rotation.z = 0.6;
    this.part(this.lever, 0.5);
    // Rail the equity curve draws along.
    this.part(this.rbox(4.2, 0.03, 0.03, this.ink, 0, 1.45, -0.9), 0.62);

    this.bars = new THREE.InstancedMesh(this.keep(new THREE.BoxGeometry(4.0 / this.nBars - 0.01, 1, 0.5)), this.keep(new THREE.MeshStandardMaterial({ roughness: 0.6 })), this.nBars);
    this.bars.castShadow = true;
    this.bars.position.set(0, 0.12, 0.4);
    this.bars.visible = false;
    this.group.add(this.bars);
    this.ribbonPos = new Float32Array(this.nEq * 2 * 3);
    const geo = this.keep(new THREE.BufferGeometry());
    geo.setAttribute("position", new THREE.BufferAttribute(this.ribbonPos, 3));
    const idx: number[] = [];
    for (let i = 0; i < this.nEq - 1; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    geo.setIndex(idx);
    this.ribbon = new THREE.Mesh(geo, this.keep(new THREE.MeshBasicMaterial({ color: accent.clone().multiplyScalar(2.0), side: THREE.DoubleSide, toneMapped: false })));
    this.ribbon.visible = false;
    this.ribbon.position.z = -0.9;
    this.group.add(this.ribbon);
    this.hitBox(4.4, 2.2, 2.2, 0, 1.0, -0.2);

    fetch("/data/btc-funding.json")
      .then((r) => r.json())
      .then((j: FundingSeries) => {
        this.series = j;
      })
      .catch(() => {});
  }
  power(on: boolean) {
    super.power(on);
    this.bars.visible = on;
    this.ribbon.visible = on;
    if (on) {
      this.idx = 0;
      this.equity = 1;
      this.peak = 1;
      this.dd = 0;
      this.hist = [];
      this.eq = [];
    }
  }
  poke() {
    // Skip ahead a year.
    this.idx += 3 * 365;
  }
  private step() {
    const s = this.series;
    if (!s) return;
    const r = s.rates[this.idx % s.rates.length];
    this.idx++;
    // 3× leveraged: earn three times the funding, pay a sliver of cost.
    this.equity *= 1 + 3 * r - 0.00002;
    this.peak = Math.max(this.peak, this.equity);
    this.dd = Math.max(this.dd, 1 - this.equity / this.peak);
    this.hist.push(r);
    if (this.hist.length > this.nBars) this.hist.shift();
    this.eq.push(this.equity);
    if (this.eq.length > this.nEq) this.eq.shift();
  }
  update(dt: number) {
    this.tick(dt);
    if (this.assembled) this.lever.rotation.z += ((this.on ? -0.4 : 0.6) - this.lever.rotation.z) * Math.min(1, dt * 6);
    if (!this.on || !this.series) return;
    this.acc += dt;
    const per = 1 / 36; // 36 periods a second: a year in ~30 s
    let n = 0;
    while (this.acc > per && n++ < 12) {
      this.acc -= per;
      this.step();
    }
    // Bars.
    const w = 4.0 / this.nBars;
    for (let i = 0; i < this.nBars; i++) {
      const r = this.hist[i] ?? 0;
      const h = Math.max(0.01, Math.abs(r) * 1800);
      this.m4.makeScale(1, h, 1);
      this.m4.setPosition(-2 + w * (i + 0.5), r >= 0 ? h / 2 : -h / 2 + 0.06, 0);
      this.bars.setMatrixAt(i, this.m4);
      this.bars.setColorAt(i, r >= 0 ? this.cA.copy(this.accent) : this.cB);
    }
    this.bars.instanceMatrix.needsUpdate = true;
    if (this.bars.instanceColor) this.bars.instanceColor.needsUpdate = true;
    // Ribbon.
    const n2 = this.eq.length;
    let lo = Infinity, hi = -Infinity;
    for (const e of this.eq) {
      lo = Math.min(lo, e);
      hi = Math.max(hi, e);
    }
    const span = Math.max(hi - lo, 0.02);
    for (let i = 0; i < this.nEq; i++) {
      const k = Math.min(i, n2 - 1);
      const e = n2 ? this.eq[k] : 1;
      const x = -2 + (i / (this.nEq - 1)) * 4;
      const y = 1.5 + ((e - lo) / span) * 1.1;
      const on = i < n2 ? 0.022 : 0;
      this.ribbonPos[i * 6] = x;
      this.ribbonPos[i * 6 + 1] = y - on;
      this.ribbonPos[i * 6 + 3] = x;
      this.ribbonPos[i * 6 + 4] = y + on;
    }
    (this.ribbon.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }
  result() {
    return { big: "16.0%", sub: "annualized · 6.1 Sharpe · <2% drawdown · 3× · 3 yrs tick data" };
  }
  readout() {
    const s = this.series;
    if (!s) return "loading funding history";
    const years = (this.idx * s.stepMs) / (365.25 * 24 * 3600e3);
    const ann = years > 0.05 ? (Math.pow(this.equity, 1 / years) - 1) * 100 : 0;
    const d = new Date(s.start + (this.idx % s.rates.length) * s.stepMs).toISOString().slice(0, 10);
    return `${d} · 3× carry on real BTC funding · +${((this.equity - 1) * 100).toFixed(1)}% · ${ann.toFixed(1)}%⁄yr · dd ${(this.dd * 100).toFixed(1)}%`;
  }
}

/* ── 2024 · LastCurb ─────────────────────────────────────────────────── */

const CURB_MARKS: [number, number][] = [
  [0.455, 0.56],
  [0.72, 0.56],
  [0.745, 0.65],
  [0.86, 0.82],
];

class Curb extends Base {
  kind = "curb" as const;
  private screen: THREE.Mesh;
  private screenMat: THREE.MeshBasicMaterial;
  private marks: THREE.Mesh[] = [];
  private head: THREE.Group;
  private tex: THREE.Texture | null = null;
  private scan: THREE.Mesh;

  constructor(accent: THREE.Color) {
    super(accent, 23);
    // The pole and camera.
    this.part(this.mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.4, 12), this.ink, -1.5, 1.2, -0.6), 0);
    this.head = new THREE.Group();
    this.head.position.set(-1.5, 2.45, -0.6);
    this.head.add(this.rbox(0.22, 0.18, 0.44, this.ink, 0, 0, 0.06));
    const lens = this.mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.1, 20), this.glow, 0, 0, 0.32);
    lens.rotation.x = Math.PI / 2;
    this.head.add(lens);
    this.part(this.head, 0.15);
    // The monitor the feed lands on.
    this.part(this.rbox(0.9, 0.06, 0.5, this.ink, 0.8, 0.03, 0.3), 0.3);
    this.part(this.mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 10), this.ink, 0.8, 0.4, 0.3), 0.4);
    const frame = this.rbox(2.6, 1.85, 0.08, this.ink, 0.8, 1.55, 0.3, 0.04);
    this.part(frame, 0.55);
    this.screenMat = this.keep(new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false }));
    this.screen = this.mesh(new THREE.PlaneGeometry(2.46, 1.71), this.screenMat, 0, 0, 0.045);
    this.screen.castShadow = false;
    frame.add(this.screen);
    // Detection markers: rings on the frame.
    const ringGeo = this.keep(new THREE.RingGeometry(0.05, 0.075, 24));
    for (const [u, v] of CURB_MARKS) {
      const m = new THREE.Mesh(ringGeo, this.glow);
      m.position.set((u - 0.5) * 2.46, (0.5 - v) * 1.71, 0.05);
      m.visible = false;
      frame.add(m);
      this.marks.push(m);
    }
    // A scanline that sweeps when it's thinking.
    this.scan = this.mesh(new THREE.PlaneGeometry(2.46, 0.02), this.keep(new THREE.MeshBasicMaterial({ color: accent.clone().multiplyScalar(1.5), transparent: true, opacity: 0.7, toneMapped: false })), 0, 0, 0.05);
    this.scan.visible = false;
    frame.add(this.scan);
    this.hitBox(4.0, 3.0, 2.0, 0, 1.4, 0);

    new THREE.TextureLoader().load("/images/projects/lastcurb-frame.jpg", (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      this.tex = t;
      if (this.on) this.showFeed();
    });
  }
  private showFeed() {
    if (!this.tex) return;
    this.screenMat.map = this.tex;
    this.screenMat.color.set(0xffffff);
    this.screenMat.needsUpdate = true;
  }
  power(on: boolean) {
    super.power(on);
    if (on) this.showFeed();
    else {
      this.screenMat.map = null;
      this.screenMat.color.set(0x000000);
      this.screenMat.needsUpdate = true;
      for (const m of this.marks) m.visible = false;
    }
    this.scan.visible = on;
  }
  poke() {
    this.onT = 0;
    for (const m of this.marks) m.visible = false;
  }
  update(dt: number, t: number) {
    this.tick(dt);
    if (this.assembled) this.head.rotation.y = 0.25 * Math.sin(t * 0.5) - 0.3;
    if (!this.on) return;
    // A sweep, then the detections land one by one.
    const sweepT = 1.2;
    this.scan.visible = this.onT < sweepT;
    this.scan.position.y = 0.85 - (this.onT / sweepT) * 1.7;
    this.marks.forEach((m, i) => {
      const at = sweepT + 0.25 + i * 0.3;
      m.visible = this.onT > at;
      const age = this.onT - at;
      m.scale.setScalar(m.visible ? 1 + 0.6 * Math.max(0, 0.4 - age) : 1);
    });
  }
  result() {
    return { big: "4 / 4", sub: "kerb bays open · Wythe Ave at N 12th · one public camera" };
  }
  readout() {
    const found = this.marks.filter((m) => m.visible).length;
    return this.on ? `NYC DOT feed · edge inference · ${found} of 4 bays detected` : "camera idle";
  }
}

/* ── 2024–25 · stratospheric aerosol ─────────────────────────────────── */

class Aerosol extends Base {
  kind = "aerosol" as const;
  private sphere = new THREE.Group();
  private N = 3000;
  private pos: Float32Array;
  private lat: Float32Array;
  private lon: Float32Array;
  private rate: Float32Array;
  private live: Uint8Array;
  private pts: THREE.Points;
  private ptMat: THREE.PointsMaterial;
  private plane: THREE.Group;
  private orbit = 0;
  private needle: THREE.Mesh;
  private blackCarbon = true;
  private gaugeVal = 0;
  private injected = 0;
  private tmp = new THREE.Vector3();

  constructor(accent: THREE.Color) {
    super(accent, 37);
    // Stand and globe.
    this.part(this.mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.1, 40), this.ink, 0, 0.05, 0), 0);
    this.part(this.mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 10), this.ink, 0, 0.5, 0), 0.1);
    this.sphere.position.y = 2.05;
    this.sphere.rotation.z = -0.41;
    const globe = this.mesh(new THREE.SphereGeometry(1.05, 56, 36), this.keep(new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 })));
    this.sphere.add(globe);
    const grat = new THREE.LineSegments(this.keep(new THREE.EdgesGeometry(this.keep(new THREE.SphereGeometry(1.052, 24, 12)), 1)), this.keep(new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 })));
    this.sphere.add(grat);
    this.part(this.sphere, 0.25, true);
    // The stratosphere: a faint shell.
    const shell = this.mesh(new THREE.SphereGeometry(1.2, 48, 32), this.keep(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05, side: THREE.BackSide, depthWrite: false })), 0, 2.05, 0);
    shell.castShadow = false;
    this.part(shell, 0.42, true);
    // Injection aircraft on an equatorial ring.
    this.plane = new THREE.Group();
    const body = this.rbox(0.3, 0.06, 0.06, this.shell);
    const wing = this.rbox(0.08, 0.02, 0.36, this.shell, 0.02, 0, 0);
    this.plane.add(body, wing);
    this.plane.position.set(1.32, 2.05, 0);
    this.part(this.plane, 0.6);
    // Gauge: an arc with a needle, sulfate at one end, black carbon at the other.
    const gauge = new THREE.Group();
    gauge.position.set(1.9, 0.14, 0.4);
    const arc = new THREE.Mesh(this.keep(new THREE.TorusGeometry(0.42, 0.012, 8, 40, Math.PI)), this.ink);
    arc.rotation.x = -Math.PI / 2;
    arc.rotation.z = 0;
    gauge.add(arc);
    this.needle = this.mesh(new THREE.BoxGeometry(0.4, 0.02, 0.02), this.glow, 0.2, 0.02, 0);
    const pivot = new THREE.Group();
    pivot.add(this.needle);
    pivot.rotation.y = Math.PI;
    gauge.add(pivot);
    this.needle.userData.pivot = pivot;
    this.part(gauge, 0.75);

    const N = this.N;
    this.pos = new Float32Array(N * 3);
    this.lat = new Float32Array(N);
    this.lon = new Float32Array(N);
    this.rate = new Float32Array(N);
    this.live = new Uint8Array(N);
    const geo = this.keep(new THREE.BufferGeometry());
    geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    this.ptMat = this.keep(new THREE.PointsMaterial({ color: accent.clone().multiplyScalar(1.8), size: 0.034, transparent: true, opacity: 0.95, toneMapped: false }));
    this.pts = new THREE.Points(geo, this.ptMat);
    this.pts.visible = false;
    this.sphere.add(this.pts);
    this.write();
    this.hitBox(3.2, 3.2, 3.2, 0, 2.0, 0);
  }
  private write() {
    const R = 1.17;
    for (let i = 0; i < this.N; i++) {
      if (!this.live[i]) {
        this.pos[i * 3 + 1] = -99;
        continue;
      }
      const la = this.lat[i], lo = this.lon[i];
      this.pos[i * 3] = R * Math.cos(la) * Math.cos(lo);
      this.pos[i * 3 + 1] = R * Math.sin(la);
      this.pos[i * 3 + 2] = R * Math.cos(la) * Math.sin(lo);
    }
    (this.pts.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }
  power(on: boolean) {
    super.power(on);
    this.pts.visible = on;
    if (on) {
      this.live.fill(0);
      this.injected = 0;
    }
  }
  /** Switch the aerosol: the same mass, a different material. */
  poke() {
    this.blackCarbon = !this.blackCarbon;
    this.ptMat.color.copy(this.blackCarbon ? this.accent.clone().multiplyScalar(1.6) : new THREE.Color(0xdddddd));
  }
  update(dt: number, t: number) {
    this.tick(dt);
    // Aircraft flies the equator; when on, it seeds parcels behind it.
    if (this.assembled) {
      this.orbit += dt * (this.on ? 1.1 : 0.3);
      this.plane.position.set(1.32 * Math.cos(this.orbit), 2.05 + 0.02 * Math.sin(t * 3), -1.32 * Math.sin(this.orbit));
      this.plane.rotation.y = this.orbit + Math.PI / 2;
    }
    if (this.on && this.assembled) {
      // Where the aircraft is, in the globe's own (tilted, spinning) frame.
      this.plane.getWorldPosition(this.tmp);
      this.sphere.worldToLocal(this.tmp);
      const R = this.tmp.length() || 1;
      const la0 = Math.asin(THREE.MathUtils.clamp(this.tmp.y / R, -1, 1));
      const lo0 = Math.atan2(this.tmp.z, this.tmp.x);
      for (let k = 0; k < 9; k++) {
        const i = this.injected % this.N;
        this.injected++;
        this.live[i] = 1;
        this.lat[i] = la0 + (Math.random() - 0.5) * 0.12;
        this.lon[i] = lo0 + (Math.random() - 0.5) * 0.05;
        this.rate[i] = 0.05 + Math.random() * 0.09;
      }
      for (let i = 0; i < this.N; i++) {
        if (!this.live[i]) continue;
        const s = Math.sign(this.lat[i]) || 1;
        this.lon[i] += dt * (0.35 + 0.3 * Math.cos(this.lat[i]));
        this.lat[i] += s * dt * this.rate[i] * (0.4 + Math.cos(this.lat[i]));
        if (Math.abs(this.lat[i]) > 1.3) this.live[i] = 0;
      }
      this.write();
    }
    this.sphere.rotation.y += dt * 0.08;
    // Gauge: cooling per unit mass. Black carbon ~10×, sulfate 1×.
    const target = this.on ? (this.blackCarbon ? 10 : 1) : 0;
    this.gaugeVal += (target - this.gaugeVal) * Math.min(1, dt * 2.5);
    const pivot = this.needle.userData.pivot as THREE.Group;
    pivot.rotation.y = Math.PI - (this.gaugeVal / 10) * Math.PI;
  }
  result() {
    return { big: "10×", sub: "cooling per unit mass, black carbon vs sulfate · stratosphere" };
  }
  readout() {
    let alive = 0;
    for (let i = 0; i < this.N; i++) alive += this.live[i];
    return this.on ? `${this.blackCarbon ? "black carbon" : "sulfate"} · ${alive} parcels aloft · efficacy ${this.gaugeVal.toFixed(1)}×` : "model idle";
  }
}

/* ── 2024–25 · Hoverloon ─────────────────────────────────────────────── */

class Hoverloon extends Base {
  kind = "hoverloon" as const;
  private craft = new THREE.Group();
  private envelope: THREE.Mesh;
  private rotors: THREE.Mesh[] = [];
  private payload: THREE.Mesh;
  private fill = 0;
  private alt = 0;
  private thrustBars: THREE.Mesh[] = [];

  constructor(accent: THREE.Color) {
    super(accent, 41);
    // Gondola frame first, then arms, rotors, payload, and the envelope last.
    const c = this.craft;
    c.position.y = 0.75;
    this.part(this.rbox(0.9, 0.16, 0.5, this.ink, 0, 0, 0), 0);
    for (const [x, z] of [[-0.8, -0.6], [0.8, -0.6], [-0.8, 0.6], [0.8, 0.6]]) {
      const arm = new THREE.Group();
      arm.add(this.rbox(Math.hypot(x, z), 0.05, 0.05, this.ink, x / 2, 0, z / 2));
      arm.children[0].rotation.y = -Math.atan2(z, x);
      arm.add(this.mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.1, 8), this.ink, x, 0.06, z));
      const rotor = this.mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.012, 28), this.glow, x, 0.12, z);
      rotor.castShadow = false;
      this.rotors.push(rotor);
      arm.add(rotor);
      this.part(arm, 0.12 + 0.08 * this.rotors.length);
    }
    this.payload = this.rbox(0.5, 0.5, 0.5, this.shell, 0, -0.5, 0);
    this.part(this.payload, 0.5);
    this.envelope = this.mesh(new THREE.SphereGeometry(0.75, 40, 26), this.shell, 0, 0.55, 0);
    this.envelope.scale.set(2.2, 1, 1);
    this.part(this.envelope, 0.65);
    for (const p of this.parts) c.add(p.obj);
    this.group.add(c);
    // Thrust gauge: four bars that drop as buoyancy takes the load.
    for (let i = 0; i < 4; i++) {
      const b = this.mesh(new THREE.BoxGeometry(0.12, 1, 0.12), this.glow, 1.9 + i * 0.18, 0.5, 0.6);
      b.castShadow = false;
      this.thrustBars.push(b);
      this.part(b, 0.85, true);
    }
    this.hitBox(3.6, 3.2, 2.6, 0, 1.6, 0);
  }
  power(on: boolean) {
    super.power(on);
    if (!on) {
      this.fill = 0;
      this.alt = 0;
    }
  }
  poke() {
    this.alt += 0.4;
  }
  update(dt: number, t: number) {
    this.tick(dt);
    const wantFill = this.on ? 1 : 0;
    this.fill += (wantFill - this.fill) * Math.min(1, dt * 0.9);
    // Envelope inflates from a slack sliver to full.
    const f = 0.25 + 0.75 * this.fill;
    this.envelope.scale.set(2.2 * f, 1 * f, 1 * f);
    // Buoyancy carries the payload once the envelope is mostly full.
    const lift = Math.max(0, this.fill - 0.55) / 0.45;
    const wantAlt = lift * 1.3 + 0.06 * Math.sin(t * 0.9) * lift;
    this.alt += (wantAlt - this.alt) * Math.min(1, dt * 1.5);
    this.craft.position.y = 0.75 + this.alt;
    this.craft.rotation.z = 0.04 * Math.sin(t * 0.7) * lift;
    // Rotors spin hard at first, then idle as buoyancy takes over.
    const thrust = this.on ? 1 - 0.95 * lift : 0;
    if (this.assembled) for (const r of this.rotors) r.rotation.y += dt * (2 + 40 * thrust);
    this.thrustBars.forEach((b, i) => {
      const h = 0.06 + 1.1 * thrust * (0.85 + 0.15 * Math.sin(t * 9 + i));
      b.scale.y = h;
      b.position.y = 0.14 + h / 2;
    });
  }
  result() {
    return { big: "19×", sub: "payload per unit of motor thrust, buoyant lift vs rotors alone" };
  }
  readout() {
    return this.on ? `helium ${(this.fill * 100).toFixed(0)}% · thrust ${((1 - 0.95 * Math.max(0, this.fill - 0.55) / 0.45) * 100).toFixed(0)}% · alt ${this.alt.toFixed(2)} m` : "on the bench";
  }
}

/* ── 2025 · SO-101 teleop ────────────────────────────────────────────── */

class Teleop extends Base {
  kind = "teleop" as const;
  private leader: Arm;
  private follower: Arm;
  private buf: number[][] = [];
  private gripBuf: number[] = [];
  private latency = 0.28;
  private steerPt: THREE.Vector3 | null = null;
  private target = new THREE.Vector3(-1.1, 1.6, 1.0);
  private goal = new THREE.Vector3();
  private local = new THREE.Vector3();
  private packets: THREE.InstancedMesh;
  private m4 = new THREE.Matrix4();
  private grip = false;
  private pipe: THREE.Mesh;

  constructor(accent: THREE.Color) {
    super(accent, 53);
    this.leader = new Arm({ shell: this.shell.color, servo: this.ink.color, accent });
    this.follower = new Arm({ shell: this.shell.color, servo: this.ink.color, accent });
    this.leader.root.position.set(-1.15, 0, 0.1);
    this.follower.root.position.set(1.15, 0, 0.1);
    this.leader.root.scale.setScalar(0.72);
    this.follower.root.scale.setScalar(0.72);
    // Assemble joint by joint: each joint group grows in place, base first.
    const order = (arm: Arm, offset: number) => {
      const joints = arm.jointGroups();
      this.part(arm.root, offset, true);
      joints.forEach((j, i) => {
        const to = j.position.clone();
        this.parts.push({ obj: j, to, from: to, tumble: new THREE.Euler(), order: offset + 0.08 + i * 0.09, grow: true, base: 1 });
      });
    };
    order(this.leader, 0);
    order(this.follower, 0.3);
    // The pipeline between them.
    this.pipe = this.mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.3, 8), this.glow, 0, 0.12, 0.1);
    this.pipe.rotation.z = Math.PI / 2;
    this.pipe.castShadow = false;
    this.part(this.pipe, 0.82);
    this.packets = new THREE.InstancedMesh(this.keep(new THREE.SphereGeometry(0.035, 8, 6)), this.glow, 14);
    this.packets.visible = false;
    this.group.add(this.packets);
    this.hitBox(4.0, 3.0, 2.6, 0, 1.4, 0.4);
  }
  steer(p: THREE.Vector3 | null) {
    this.steerPt = p ? p.clone() : null;
  }
  power(on: boolean) {
    super.power(on);
    this.packets.visible = on;
  }
  poke() {
    this.grip = !this.grip;
  }
  update(dt: number, t: number) {
    this.tick(dt);
    if (!this.on) return;
    if (this.steerPt) {
      this.local.copy(this.steerPt);
      this.group.worldToLocal(this.local);
      this.local.x = THREE.MathUtils.clamp(this.local.x, -2.4, 0.3);
      this.local.y = THREE.MathUtils.clamp(this.local.y, 0.4, 2.3);
      this.local.z = THREE.MathUtils.clamp(this.local.z, -0.6, 1.6);
      this.goal.copy(this.local);
    } else {
      // A figure of eight in front of the leader.
      this.goal.set(-1.15 + 0.5 * Math.sin(t * 0.9), 1.55 + 0.35 * Math.sin(t * 1.8), 1.0 + 0.25 * Math.cos(t * 0.9));
    }
    this.target.lerp(this.goal, Math.min(1, dt * (this.steerPt ? 12 : 4)));
    this.local.copy(this.target);
    this.group.localToWorld(this.local);
    this.leader.solve(this.local);
    this.leader.gripGoal = this.grip ? 0.03 : 0.5;
    this.leader.update(dt);
    this.buf.push([...this.leader.angles]);
    this.gripBuf.push(this.leader.grip);
    const frames = Math.max(1, Math.round(this.latency / Math.max(dt, 1 / 120)));
    while (this.buf.length > frames) {
      this.buf.shift();
      this.gripBuf.shift();
    }
    for (let i = 0; i < 5; i++) this.follower.goal[i] = this.buf[0][i];
    this.follower.gripGoal = this.gripBuf[0];
    this.follower.update(dt);
    // Packets stream leader → follower along the pipe.
    for (let k = 0; k < 14; k++) {
      const u = ((t * 0.9 + k / 14) % 1);
      this.m4.identity();
      this.m4.setPosition(-1.15 + u * 2.3, 0.12, 0.1);
      this.packets.setMatrixAt(k, this.m4);
    }
    this.packets.instanceMatrix.needsUpdate = true;
  }
  result() {
    return { big: "280 ms", sub: "leader to follower, joint stream replayed through the pipeline" };
  }
  readout() {
    const a = this.leader.angles.map((x) => ((x * 180) / Math.PI).toFixed(0).padStart(4, " ")).join(" ");
    return this.on ? `θ${a} · ${this.steerPt ? "your hand" : "demo path"}` : "servos unpowered";
  }
  dispose() {
    super.dispose();
    this.leader.dispose();
    this.follower.dispose();
  }
}

/* ── 2026 · Multiplier ───────────────────────────────────────────────── */

class Multiplier extends Base {
  kind = "multiplier" as const;
  private agents: THREE.InstancedMesh;
  private N = 24;
  private sources: THREE.Mesh[] = [];
  private core: THREE.Mesh;
  private arr = 0;
  private m4 = new THREE.Matrix4();
  private v = new THREE.Vector3();
  private v2 = new THREE.Vector3();
  private cage: THREE.LineSegments;

  constructor(accent: THREE.Color) {
    super(accent, 61);
    // The client's cloud: a boundary the agents never leave.
    this.cage = new THREE.LineSegments(this.keep(new THREE.EdgesGeometry(this.keep(new THREE.BoxGeometry(4.0, 2.6, 2.4)))), this.keep(new THREE.LineBasicMaterial({ color: accent.clone().multiplyScalar(0.9), transparent: true, opacity: 0.5, toneMapped: false })));
    this.cage.position.set(0, 1.45, 0);
    this.part(this.cage, 0, true);
    // The app: a slab with the runtime core on it.
    this.part(this.rbox(1.6, 0.08, 1.0, this.ink, 0, 0.19, 0.3), 0.12);
    this.core = this.rbox(0.5, 0.5, 0.5, this.glow, 0, 0.48, 0.3, 0.06);
    this.core.castShadow = false;
    this.part(this.core, 0.25);
    // The data the firm already runs on: three sources at the back wall.
    for (let i = 0; i < 3; i++) {
      const s = this.rbox(0.55, 0.9, 0.3, this.shell, -1.2 + i * 1.2, 0.6, -0.85);
      this.sources.push(s);
      this.part(s, 0.4 + i * 0.1);
    }
    // Agents, sleeping on the slab until power.
    this.agents = new THREE.InstancedMesh(this.keep(new THREE.BoxGeometry(0.1, 0.1, 0.1)), this.shell, this.N);
    this.agents.castShadow = true;
    this.agents.visible = false;
    this.group.add(this.agents);
    this.hitBox(4.2, 2.8, 2.6, 0, 1.4, 0);
  }
  power(on: boolean) {
    super.power(on);
    this.agents.visible = on;
    if (!on) this.arr = 0;
  }
  poke() {
    this.onT = 0;
  }
  update(dt: number, t: number) {
    this.tick(dt);
    this.core.rotation.y = t * (this.on ? 1.2 : 0.2);
    if (!this.on) return;
    // ARR climbs over the first eight seconds: Jan to Sep 2026.
    this.arr = 208 * Math.min(1, this.onT / 8);
    // Each agent shuttles between the core and a source, inside the cage.
    for (let k = 0; k < this.N; k++) {
      const src = this.sources[k % 3].position;
      const phase = (t * 0.5 + k / this.N) % 1;
      const u = phase < 0.5 ? phase * 2 : 2 - phase * 2;
      const e = u * u * (3 - 2 * u);
      this.v.set(0, 0.48, 0.3).lerp(this.v2.set(src.x, src.y + 0.2, src.z + 0.3), e);
      this.v.y += 0.35 * Math.sin(e * Math.PI) + 0.08 * Math.sin(t * 3 + k);
      this.v.x += 0.15 * Math.sin(k * 1.7);
      this.m4.makeRotationY(t + k);
      this.m4.setPosition(this.v);
      this.agents.setMatrixAt(k, this.m4);
    }
    this.agents.instanceMatrix.needsUpdate = true;
    for (const s of this.sources) (s.material as THREE.MeshStandardMaterial).emissive.copy(this.accent).multiplyScalar(0.15 + 0.15 * Math.sin(t * 2));
  }
  result() {
    return { big: "$208K", sub: "ARR, from $0 · 6 enterprise clients · Jan to Sep 2026" };
  }
  readout() {
    return this.on ? `${this.N} agents inside the client's cloud · ARR $${this.arr.toFixed(0)}K` : "runtime offline";
  }
}

export function makeBuild(kind: BuildKind, accent: THREE.Color): Build {
  switch (kind) {
    case "carry":
      return new Carry(accent);
    case "curb":
      return new Curb(accent);
    case "aerosol":
      return new Aerosol(accent);
    case "hoverloon":
      return new Hoverloon(accent);
    case "teleop":
      return new Teleop(accent);
    case "multiplier":
      return new Multiplier(accent);
  }
}
