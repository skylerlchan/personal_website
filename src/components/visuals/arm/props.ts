import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * The things the arm picks up. Each prop is a small simulation of the project
 * it stands for — not an icon. The group's origin is the point the gripper
 * holds (a handle, a tether, a card edge); the mass of the object sits above
 * or beside it so the jaws read as actually gripping something.
 */

export type PropKind = "swarm" | "globe" | "blimp" | "ribbon" | "cctv" | "piano";

export type Palette = {
  ink: THREE.Color;
  paper: THREE.Color;
  shell: THREE.Color;
  servo: THREE.Color;
  accent: THREE.Color;
  dark: boolean;
};

export interface Prop {
  kind: PropKind;
  group: THREE.Group;
  /** Gripper opening that fits the handle, 0 closed → 1 open. */
  grip: number;
  update(dt: number, t: number): void;
  retint(p: Palette): void;
  /** Called on a tap while this prop is held. */
  tap?(): void;
  /** Extends to one side of the handle, so it should point away from the arm. */
  sided?: boolean;
  dispose(): void;
}

type Disposable = { dispose(): void };

abstract class Base implements Prop {
  abstract kind: PropKind;
  group = new THREE.Group();
  grip = 0.35;
  protected trash: Disposable[] = [];
  protected shell: THREE.MeshStandardMaterial;
  protected ink: THREE.MeshStandardMaterial;
  protected accent: THREE.MeshStandardMaterial;

  constructor(p: Palette) {
    this.shell = this.keep(new THREE.MeshStandardMaterial({ color: p.shell, roughness: 0.6 }));
    this.ink = this.keep(new THREE.MeshStandardMaterial({ color: p.servo, roughness: 0.5 }));
    this.accent = this.keep(new THREE.MeshStandardMaterial({ color: p.accent, roughness: 0.5 }));
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
    return m;
  }
  protected rbox(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0, r = 0.012) {
    return this.mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)), mat, x, y, z);
  }
  /** A thin vertical handle the gripper closes on. */
  protected handle(h = 0.16) {
    return this.mesh(new THREE.CylinderGeometry(0.03, 0.03, h, 16), this.ink, 0, h / 2 - 0.04, 0);
  }
  retint(p: Palette) {
    this.shell.color.copy(p.shell);
    this.ink.color.copy(p.servo);
    this.accent.color.copy(p.accent);
  }
  abstract update(dt: number, t: number): void;
  dispose() {
    for (const d of this.trash) d.dispose();
  }
}

/* ── Now · Multiplier ── agents orbiting inside a boundary ──────────── */

class Swarm extends Base {
  kind = "swarm" as const;
  private agents: THREE.InstancedMesh;
  private orbits: { r: number; speed: number; phase: number; tilt: THREE.Quaternion }[] = [];
  private core: THREE.Mesh;
  private shellLines: THREE.LineSegments;
  private lineMat: THREE.LineBasicMaterial;
  private m4 = new THREE.Matrix4();
  private v = new THREE.Vector3();

  constructor(p: Palette) {
    super(p);
    this.group.add(this.handle());
    const cy = 0.42;

    this.core = this.mesh(new THREE.OctahedronGeometry(0.075, 0), this.accent, 0, cy, 0);
    this.group.add(this.core);

    const N = 30;
    this.agents = new THREE.InstancedMesh(this.keep(new THREE.BoxGeometry(0.032, 0.032, 0.032)), this.ink, N);
    this.agents.castShadow = true;
    this.agents.position.y = cy;
    this.group.add(this.agents);
    for (let i = 0; i < N; i++) {
      const tilt = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
      );
      this.orbits.push({ r: 0.16 + Math.random() * 0.17, speed: 0.6 + Math.random() * 1.4, phase: Math.random() * 6.28, tilt });
    }

    this.lineMat = this.keep(new THREE.LineBasicMaterial({ color: p.ink, transparent: true, opacity: 0.22 }));
    this.shellLines = new THREE.LineSegments(
      this.keep(new THREE.EdgesGeometry(this.keep(new THREE.IcosahedronGeometry(0.38, 1)), 1)),
      this.lineMat,
    );
    this.shellLines.position.y = cy;
    this.group.add(this.shellLines);
  }

  update(dt: number, t: number) {
    for (let i = 0; i < this.orbits.length; i++) {
      const o = this.orbits[i];
      const a = t * o.speed + o.phase;
      this.v.set(Math.cos(a) * o.r, 0, Math.sin(a) * o.r).applyQuaternion(o.tilt);
      this.m4.makeRotationFromQuaternion(o.tilt);
      this.m4.setPosition(this.v);
      this.agents.setMatrixAt(i, this.m4);
    }
    this.agents.instanceMatrix.needsUpdate = true;
    this.core.rotation.y = t * 0.8;
    this.core.rotation.x = Math.sin(t * 0.5) * 0.3;
    this.shellLines.rotation.y = -t * 0.12;
  }
  retint(p: Palette) {
    super.retint(p);
    this.lineMat.color.copy(p.ink);
  }
}

/* ── Climate · HMEI ── stratospheric aerosol, tropics to poles ──────── */

class Globe extends Base {
  kind = "globe" as const;
  private sphere: THREE.Group;
  private pts: THREE.Points;
  private pos: Float32Array;
  private lat: Float32Array;
  private lon: Float32Array;
  private rate: Float32Array;
  private ptMat: THREE.PointsMaterial;
  private lineMat: THREE.LineBasicMaterial;
  private N = 900;
  private R = 0.365;

  constructor(p: Palette) {
    super(p);
    this.group.add(this.handle(0.2));
    // Stand.
    this.group.add(this.mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 12), this.ink, 0, 0.2, 0));

    this.sphere = new THREE.Group();
    this.sphere.position.y = 0.66;
    this.sphere.rotation.z = -0.41; // 23.4° obliquity
    this.group.add(this.sphere);

    const globe = this.mesh(new THREE.SphereGeometry(0.3, 48, 32), this.shell);
    this.sphere.add(globe);
    this.lineMat = this.keep(new THREE.LineBasicMaterial({ color: p.ink, transparent: true, opacity: 0.18 }));
    const grat = new THREE.LineSegments(
      this.keep(new THREE.EdgesGeometry(this.keep(new THREE.SphereGeometry(0.302, 18, 9)), 1)),
      this.lineMat,
    );
    this.sphere.add(grat);

    // Soot. Injected in a tropical band, carried poleward by the Brewer–Dobson
    // circulation, removed at high latitude. Each particle carries its own rate
    // so the band smears rather than marching in lockstep.
    const N = this.N;
    this.pos = new Float32Array(N * 3);
    this.lat = new Float32Array(N);
    this.lon = new Float32Array(N);
    this.rate = new Float32Array(N);
    for (let i = 0; i < N; i++) this.seed(i, true);
    const geo = this.keep(new THREE.BufferGeometry());
    geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    this.ptMat = this.keep(new THREE.PointsMaterial({ color: p.ink, size: 0.014, sizeAttenuation: true }));
    this.pts = new THREE.Points(geo, this.ptMat);
    this.sphere.add(this.pts);
    this.write();
  }

  private seed(i: number, scatter: boolean) {
    const side = Math.random() < 0.5 ? -1 : 1;
    // Uniform start in the band; on first fill, spread across the whole shell
    // so it does not begin empty at the poles.
    this.lat[i] = scatter ? side * Math.random() * 1.25 : side * (0.05 + Math.random() * 0.17);
    this.lon[i] = Math.random() * Math.PI * 2;
    this.rate[i] = 0.05 + Math.random() * 0.09;
  }
  private write() {
    const R = this.R;
    for (let i = 0; i < this.N; i++) {
      const la = this.lat[i], lo = this.lon[i];
      this.pos[i * 3] = R * Math.cos(la) * Math.cos(lo);
      this.pos[i * 3 + 1] = R * Math.sin(la);
      this.pos[i * 3 + 2] = R * Math.cos(la) * Math.sin(lo);
    }
    (this.pts.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }
  update(dt: number, t: number) {
    for (let i = 0; i < this.N; i++) {
      const s = Math.sign(this.lat[i]) || 1;
      // Zonal wind, faster at low latitude; meridional drift toward the pole.
      this.lon[i] += dt * (0.5 + 0.4 * Math.cos(this.lat[i]));
      this.lat[i] += s * dt * this.rate[i] * (0.4 + Math.cos(this.lat[i]));
      if (Math.abs(this.lat[i]) > 1.32) this.seed(i, false);
    }
    this.write();
    this.sphere.rotation.y = t * 0.15;
  }
  retint(p: Palette) {
    super.retint(p);
    this.ptMat.color.copy(p.ink);
    this.lineMat.color.copy(p.ink);
  }
}

/* ── Flight · Hoverloon ── buoyant hull on a tether ─────────────────── */

class Blimp extends Base {
  kind = "blimp" as const;
  private hull = new THREE.Group();
  private rotors: THREE.Mesh[] = [];
  private tether: THREE.Line;
  private tetherPos: Float32Array;
  private lineMat: THREE.LineBasicMaterial;
  private y = 0.56;
  private vy = 0;
  grip = 0.1;

  constructor(p: Palette) {
    super(p);
    // The gripper pinches the tether itself — a small spool.
    this.group.add(this.mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 16), this.ink, 0, 0, 0));

    const h = this.hull;
    const env = this.mesh(new THREE.SphereGeometry(0.17, 32, 20), this.shell);
    env.scale.set(1.75, 1, 1);
    h.add(env);
    // Tail fins.
    for (const [ry, rz] of [[0, 0], [0, Math.PI / 2], [0, Math.PI], [0, -Math.PI / 2]]) {
      const fin = this.rbox(0.1, 0.085, 0.012, this.ink, -0.26, 0.08, 0, 0.004);
      const pivot = new THREE.Group();
      pivot.rotation.set(rz, ry, 0);
      pivot.add(fin);
      h.add(pivot);
    }
    // Gondola and outriggers.
    h.add(this.rbox(0.12, 0.045, 0.06, this.ink, 0.02, -0.18, 0));
    h.add(this.rbox(0.02, 0.02, 0.44, this.ink, 0.02, -0.165, 0));
    for (const z of [-0.22, 0.22]) {
      h.add(this.mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 8), this.ink, 0.02, -0.14, z));
      const rotor = this.mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.005, 24), this.accent, 0.02, -0.115, z);
      this.rotors.push(rotor);
      h.add(rotor);
    }
    h.position.y = this.y;
    this.group.add(h);

    this.tetherPos = new Float32Array([0, 0, 0, 0, this.y - 0.2, 0]);
    const geo = this.keep(new THREE.BufferGeometry());
    geo.setAttribute("position", new THREE.BufferAttribute(this.tetherPos, 3));
    this.lineMat = this.keep(new THREE.LineBasicMaterial({ color: p.ink, transparent: true, opacity: 0.6 }));
    this.tether = new THREE.Line(geo, this.lineMat);
    this.group.add(this.tether);
  }

  update(dt: number, t: number) {
    // Buoyancy vs. tether: a spring around neutral, gusted by slow noise.
    const gust = 0.05 * Math.sin(t * 0.9) + 0.03 * Math.sin(t * 2.3 + 1.0);
    const target = 0.56 + gust;
    this.vy += (target - this.y) * 6 * dt - this.vy * 1.2 * dt;
    this.y += this.vy * dt;
    this.hull.position.y = this.y;
    this.hull.position.x = 0.04 * Math.sin(t * 0.6);
    this.hull.rotation.z = 0.06 * Math.sin(t * 0.8 + 0.5);
    this.hull.rotation.y = 0.12 * Math.sin(t * 0.35);
    for (const r of this.rotors) r.rotation.y += dt * 9;
    this.tetherPos[3] = this.hull.position.x + 0.02;
    this.tetherPos[4] = this.y - 0.2;
    (this.tether.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }
  retint(p: Palette) {
    super.retint(p);
    this.lineMat.color.copy(p.ink);
  }
}

/* ── Markets · SSRN ── the carry curve, drawn as you watch ──────────── */

class Ribbon extends Base {
  kind = "ribbon" as const;
  private tube: THREE.Mesh;
  private total: number;
  private drawn = 0;
  private cardMat: THREE.MeshStandardMaterial;
  private lineMat: THREE.LineBasicMaterial;
  grip = 0.05;

  constructor(p: Palette) {
    super(p);
    const W = 0.78, H = 0.42;
    this.cardMat = this.keep(
      new THREE.MeshStandardMaterial({ color: p.paper, roughness: 0.9, side: THREE.DoubleSide }),
    );
    const card = this.mesh(new THREE.PlaneGeometry(W, H), this.cardMat, 0, H / 2 + 0.06, 0);
    card.receiveShadow = true;
    this.group.add(card);
    this.lineMat = this.keep(new THREE.LineBasicMaterial({ color: p.ink, transparent: true, opacity: 0.35 }));
    this.group.add(new THREE.LineSegments(this.keep(new THREE.EdgesGeometry(card.geometry as THREE.BufferGeometry)), this.lineMat).translateY(H / 2 + 0.06));

    // Random walk with drift and a low vol: carry is steady, not spectacular.
    const pts: THREE.Vector3[] = [];
    let v = 0, seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) - 0.5;
    const n = 90;
    for (let i = 0; i < n; i++) {
      v += 0.0028 + rnd() * 0.02 + (i % 23 === 0 ? -0.03 : 0);
      pts.push(new THREE.Vector3(-W / 2 + 0.05 + (i / (n - 1)) * (W - 0.1), 0.06 + 0.08 + v * 0.9, 0.006));
    }
    const geo = this.keep(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, 0.006, 6, false));
    this.total = geo.index ? geo.index.count : geo.attributes.position.count;
    this.tube = new THREE.Mesh(geo, this.accent);
    this.tube.castShadow = false;
    this.group.add(this.tube);
    geo.setDrawRange(0, 0);

    // Baseline.
    const base = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-W / 2 + 0.05, 0.14, 0.004),
      new THREE.Vector3(W / 2 - 0.05, 0.14, 0.004),
    ]);
    this.group.add(new THREE.Line(this.keep(base), this.lineMat));
  }

  update(dt: number) {
    if (this.drawn < 1) {
      this.drawn = Math.min(1, this.drawn + dt / 2.4);
      const e = 1 - Math.pow(1 - this.drawn, 2);
      this.tube.geometry.setDrawRange(0, Math.floor(e * this.total));
    }
  }
  retint(p: Palette) {
    super.retint(p);
    this.cardMat.color.copy(p.paper);
    this.lineMat.color.copy(p.ink);
  }
}

/* ── Sensing · LastCurb ── a camera sweeping a kerb for a gap ───────── */

class Cctv extends Base {
  kind = "cctv" as const;
  private head = new THREE.Group();
  private cone: THREE.Mesh;
  private coneMat: THREE.MeshBasicMaterial;
  private gap: THREE.Mesh;
  private gapMat: THREE.MeshStandardMaterial;
  private gapX = 0.1;
  private lit = 0;

  constructor(p: Palette) {
    super(p);
    this.group.add(this.handle(0.9));

    // Head on the pole, panning.
    this.head.position.y = 0.86;
    this.group.add(this.head);
    this.head.add(this.rbox(0.09, 0.075, 0.2, this.ink, 0, 0, 0.02));
    const lens = this.mesh(new THREE.CylinderGeometry(0.03, 0.036, 0.05, 20), this.shell, 0, 0, 0.14);
    lens.rotation.x = Math.PI / 2;
    this.head.add(lens);
    this.head.add(this.rbox(0.13, 0.02, 0.22, this.shell, 0, 0.05, 0.02));

    // Field of view. The cone's axis is Y; tilt it so it looks down at the kerb.
    this.coneMat = this.keep(
      new THREE.MeshBasicMaterial({ color: p.accent, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }),
    );
    const L = 0.86;
    this.cone = this.mesh(new THREE.ConeGeometry(0.15, L, 24, 1, true), this.coneMat, 0, -L / 2, 0);
    const tilt = new THREE.Group();
    tilt.position.z = 0.16;
    tilt.rotation.x = -0.72;
    tilt.add(this.cone);
    this.head.add(tilt);
    this.cone.castShadow = false;

    // Kerb with parked cars and one gap.
    const kerb = new THREE.Group();
    kerb.position.set(0, 0.01, 0.62);
    this.group.add(kerb);
    const strip = this.rbox(0.9, 0.012, 0.16, this.shell, 0, 0, 0, 0.004);
    strip.receiveShadow = true;
    kerb.add(strip);
    const slots = [-0.36, -0.22, -0.08, 0.24, 0.36];
    for (const x of slots) kerb.add(this.rbox(0.11, 0.045, 0.07, this.ink, x, 0.03, 0, 0.01));
    this.gapMat = this.keep(new THREE.MeshStandardMaterial({ color: p.accent, roughness: 0.6, transparent: true, opacity: 0.0 }));
    this.gap = this.mesh(new THREE.PlaneGeometry(0.13, 0.09), this.gapMat, this.gapX, 0.008, 0);
    this.gap.rotation.x = -Math.PI / 2;
    this.gap.castShadow = false;
    kerb.add(this.gap);
  }

  update(dt: number, t: number) {
    const pan = Math.sin(t * 0.7) * 0.55;
    this.head.rotation.y = pan;
    // Where the cone axis meets the kerb, roughly.
    const hit = -Math.tan(pan) * 0.62;
    const on = Math.abs(hit - this.gapX) < 0.09 ? 1 : 0;
    this.lit += (on - this.lit) * Math.min(1, dt * 8);
    this.gapMat.opacity = 0.15 + 0.7 * this.lit;
    this.coneMat.opacity = 0.14 + 0.12 * this.lit;
  }
  retint(p: Palette) {
    super.retint(p);
    this.coneMat.color.copy(p.accent);
    this.gapMat.color.copy(p.accent);
  }
}

/* ── Hobbies · Piano ── keys that play a phrase ─────────────────────── */

const WHITE_HZ = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25];
const BLACK_HZ = [277.18, 311.13, 369.99, 415.3, 466.16];
// Which white key each black key sits after.
const BLACK_AFTER = [0, 1, 3, 4, 5];
// A little Hiromi-ish phrase: [key, beat]. Keys ≥ 8 are the black ones.
const PHRASE: [number, number][] = [
  [0, 0], [2, 1], [4, 2], [7, 3], [9, 4], [7, 5], [4, 6], [2, 7],
  [1, 8], [10, 9], [5, 10], [7, 11], [5, 12], [10, 13], [1, 14], [0, 15],
];
const BEAT = 0.19;

class Piano extends Base {
  kind = "piano" as const;
  sided = true;
  private keys: THREE.Mesh[] = [];
  private press = new Float32Array(13);
  private next = 0;
  private start = -1;
  private audio: AudioContext | null = null;
  private audibleUntil = 0;
  grip = 0.6;

  constructor(p: Palette) {
    super(p);
    // Held by the side, like a toy.
    this.group.add(this.rbox(0.06, 0.05, 0.16, this.ink, 0, 0.02, 0, 0.01));
    const body = new THREE.Group();
    body.position.set(0.24, 0.02, 0);
    this.group.add(body);
    const w = 0.048, d = 0.19;
    body.add(this.rbox(w * 8 + 0.04, 0.03, d + 0.04, this.ink, 0, -0.02, -0.01, 0.008));
    for (let i = 0; i < 8; i++) {
      const k = this.rbox(w - 0.004, 0.024, d, this.shell, (i - 3.5) * w, 0.01, 0, 0.004);
      this.keys.push(k);
      body.add(k);
    }
    for (let i = 0; i < 5; i++) {
      const k = this.rbox(0.026, 0.026, d * 0.6, this.ink, (BLACK_AFTER[i] - 3) * w, 0.022, -d * 0.2, 0.004);
      this.keys.push(k);
      body.add(k);
    }
  }

  /** A tap makes the next few seconds audible. Audio needs a gesture anyway. */
  tap() {
    if (!this.audio) {
      try {
        this.audio = new AudioContext();
      } catch {
        return;
      }
    }
    if (this.audio.state === "suspended") void this.audio.resume();
    this.audibleUntil = performance.now() / 1000 + 8;
  }

  private strike(key: number) {
    this.press[key] = 1;
    const ac = this.audio;
    if (!ac || performance.now() / 1000 > this.audibleUntil) return;
    const hz = key < 8 ? WHITE_HZ[key] : BLACK_HZ[key - 8];
    const t0 = ac.currentTime;
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.12, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.9);
    g.connect(ac.destination);
    for (const [mult, amp, type] of [[1, 1, "triangle"], [2, 0.25, "sine"], [3, 0.08, "sine"]] as const) {
      const o = ac.createOscillator();
      o.type = type;
      o.frequency.value = hz * mult;
      const og = ac.createGain();
      og.gain.value = amp;
      o.connect(og).connect(g);
      o.start(t0);
      o.stop(t0 + 1);
    }
  }

  update(dt: number, t: number) {
    if (this.start < 0) this.start = t + 0.4;
    const beat = (t - this.start) / BEAT;
    while (this.next < PHRASE.length && PHRASE[this.next][1] <= beat) {
      this.strike(PHRASE[this.next][0]);
      this.next++;
    }
    if (this.next >= PHRASE.length && beat > PHRASE[PHRASE.length - 1][1] + 6) {
      this.next = 0;
      this.start = t;
    }
    for (let i = 0; i < 13; i++) {
      this.press[i] = Math.max(0, this.press[i] - dt * 7);
      const k = this.keys[i];
      k.position.y = (i < 8 ? 0.01 : 0.022) - 0.012 * Math.min(1, this.press[i] * 1.6);
    }
  }
  dispose() {
    super.dispose();
    void this.audio?.close();
  }
}

export function makeProp(kind: PropKind, p: Palette): Prop {
  switch (kind) {
    case "swarm":
      return new Swarm(p);
    case "globe":
      return new Globe(p);
    case "blimp":
      return new Blimp(p);
    case "ribbon":
      return new Ribbon(p);
    case "cctv":
      return new Cctv(p);
    case "piano":
      return new Piano(p);
  }
}
