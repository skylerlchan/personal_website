import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Arm } from "./Arm";

/**
 * The set pieces — one per platform on the ride. Each is a scene-scale
 * working model of the project it stands for, built in the platform's local
 * frame: origin at the platform centre, +Y up, +Z toward the ride vehicle,
 * +X to the rider's right.
 *
 * Every set exposes the same small surface: update with proximity, react to
 * a tap, optionally take a steering point from a held finger, and report a
 * one-line readout for the masthead dashboard.
 */

export type SetKind = "attractor" | "swarm" | "globe" | "blimp" | "arms" | "market" | "street" | "piano" | "gate";

export type Palette = {
  ink: THREE.Color;
  paper: THREE.Color;
  shell: THREE.Color;
  servo: THREE.Color;
  accent: THREE.Color;
  dark: boolean;
};

export interface SetPiece {
  kind: SetKind;
  group: THREE.Group;
  /** Objects a tap can hit. */
  targets: THREE.Object3D[];
  update(dt: number, t: number, near: number): void;
  poke(): void;
  /** A held finger, as a world-space point, or null when released. */
  steer?(point: THREE.Vector3 | null): void;
  readout(): string;
  retint(p: Palette, show: THREE.Color): void;
  dispose(): void;
}

type Disposable = { dispose(): void };

abstract class Base implements SetPiece {
  abstract kind: SetKind;
  group = new THREE.Group();
  targets: THREE.Object3D[] = [];
  protected trash: Disposable[] = [];
  protected shell: THREE.MeshStandardMaterial;
  protected ink: THREE.MeshStandardMaterial;
  protected accent: THREE.MeshStandardMaterial;
  /** HDR emissive in the scene's show colour — it blooms. */
  protected glow: THREE.MeshBasicMaterial;
  protected show: THREE.Color;

  constructor(p: Palette, show: THREE.Color) {
    this.show = show.clone();
    this.shell = this.keep(new THREE.MeshStandardMaterial({ color: p.shell, roughness: 0.55 }));
    this.ink = this.keep(new THREE.MeshStandardMaterial({ color: p.servo, roughness: 0.5, metalness: 0.1 }));
    this.accent = this.keep(new THREE.MeshStandardMaterial({ color: p.accent, roughness: 0.5 }));
    this.glow = this.keep(new THREE.MeshBasicMaterial({ color: show.clone().multiplyScalar(2.2), toneMapped: false }));
  }
  protected keep<T extends Disposable>(x: T): T {
    this.trash.push(x);
    return x;
  }
  protected mesh(geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0, hit = false) {
    this.keep(geo);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    if (hit) this.targets.push(m);
    return m;
  }
  protected rbox(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0, r = 0.02) {
    return this.mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)), mat, x, y, z);
  }
  /** An invisible volume a finger can hit; the visible parts are too thin to tap. */
  protected hitBox(w: number, h: number, d: number, x = 0, y = 0, z = 0) {
    const m = this.mesh(new THREE.BoxGeometry(w, h, d), this.keep(new THREE.MeshBasicMaterial({ visible: false })), x, y, z, true);
    m.castShadow = false;
    return m;
  }
  poke() {}
  readout() {
    return "";
  }
  retint(p: Palette, show: THREE.Color) {
    this.show.copy(show);
    this.shell.color.copy(p.shell);
    this.ink.color.copy(p.servo);
    this.accent.color.copy(p.accent);
    this.glow.color.copy(show).multiplyScalar(p.dark ? 2.2 : 1.2);
  }
  abstract update(dt: number, t: number, near: number): void;
  dispose() {
    for (const d of this.trash) d.dispose();
  }
}

/* ── Intro · the Lorenz attractor, integrated live ───────────────────── */

class Attractor extends Base {
  kind = "attractor" as const;
  private N = 16000;
  private pos: Float32Array;
  private pts: THREE.Points;
  private mat: THREE.PointsMaterial;
  private sigma = 10;
  private rho = 28;
  private beta = 8 / 3;
  private kick = 0;
  private hub: THREE.Group;

  constructor(p: Palette, show: THREE.Color) {
    super(p, show);
    this.pos = new Float32Array(this.N * 3);
    for (let i = 0; i < this.N; i++) {
      this.pos[i * 3] = (Math.random() - 0.5) * 30;
      this.pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      this.pos[i * 3 + 2] = Math.random() * 50;
    }
    // Burn in so the cloud is on the attractor before anyone sees it.
    for (let k = 0; k < 400; k++) this.step(0.006);
    const geo = this.keep(new THREE.BufferGeometry());
    geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    this.mat = this.keep(
      new THREE.PointsMaterial({
        color: show.clone().multiplyScalar(1.1),
        size: 0.018,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    this.pts = new THREE.Points(geo, this.mat);
    // The system lives in z ∈ [0, 50]; centre it on the hub.
    this.pts.position.z = -26;
    this.hub = new THREE.Group();
    this.hub.position.y = 2.6;
    this.hub.rotation.x = -Math.PI / 2 + 0.25; // z of the system points up
    this.hub.scale.setScalar(0.085);
    this.hub.add(this.pts);
    this.group.add(this.hub);
    // A hit target the size of the cloud.
    const hit = this.mesh(new THREE.SphereGeometry(2.2, 8, 6), this.keep(new THREE.MeshBasicMaterial({ visible: false })), 0, 2.5, 0, true);
    hit.castShadow = false;
    this.group.add(hit);
  }

  private step(h: number) {
    const { sigma, rho, beta } = this;
    const p = this.pos;
    for (let i = 0; i < p.length; i += 3) {
      const x = p[i], y = p[i + 1], z = p[i + 2];
      // Midpoint RK2.
      const dx1 = sigma * (y - x), dy1 = x * (rho - z) - y, dz1 = x * y - beta * z;
      const xm = x + dx1 * h * 0.5, ym = y + dy1 * h * 0.5, zm = z + dz1 * h * 0.5;
      p[i] = x + sigma * (ym - xm) * h;
      p[i + 1] = y + (xm * (rho - zm) - ym) * h;
      p[i + 2] = z + (xm * ym - beta * zm) * h;
    }
  }
  /** Push ρ up for a moment: the wings swell, then it settles back. */
  poke() {
    this.kick = 1;
  }
  update(dt: number, t: number, near: number) {
    if (near < 0.02) return;
    this.kick = Math.max(0, this.kick - dt * 0.5);
    this.rho = 28 + 22 * Math.sin(this.kick * Math.PI);
    const h = Math.min(dt, 0.033) * 0.55;
    this.step(h);
    (this.pts.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    this.hub.rotation.z = 0.4 + 0.5 * Math.sin(t * 0.15);
    this.hub.position.y = 2.6 + 0.08 * Math.sin(t * 0.7);
  }
  readout() {
    return `lorenz · σ 10 · ρ ${this.rho.toFixed(1)} · β 8⁄3 · ${this.N.toLocaleString()} pts · rk2`;
  }
  retint(p: Palette, show: THREE.Color) {
    super.retint(p, show);
    this.mat.color.copy(show).multiplyScalar(p.dark ? 1.1 : 0.5);
  }
}

/* ── Now · agents inside a boundary ──────────────────────────────────── */

class Swarm extends Base {
  kind = "swarm" as const;
  private N = 180;
  private agents: THREE.InstancedMesh;
  private orbits: { r: number; speed: number; phase: number; tilt: THREE.Quaternion; s: number }[] = [];
  private core: THREE.Mesh;
  private cage: THREE.LineSegments;
  private cageMat: THREE.LineBasicMaterial;
  private burst = 0;
  private m4 = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private v = new THREE.Vector3();
  private hub = new THREE.Group();

  constructor(p: Palette, show: THREE.Color) {
    super(p, show);
    this.hub.position.y = 2.4;
    this.group.add(this.hub);
    this.core = this.mesh(new THREE.OctahedronGeometry(0.34, 0), this.glow, 0, 0, 0, true);
    this.core.castShadow = false;
    this.hub.add(this.core);
    this.agents = new THREE.InstancedMesh(this.keep(new THREE.BoxGeometry(0.08, 0.08, 0.08)), this.shell, this.N);
    this.agents.castShadow = false;
    this.hub.add(this.agents);
    this.targets.push(this.agents);
    for (let i = 0; i < this.N; i++) {
      const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0));
      this.orbits.push({ r: 0.7 + Math.random() * 1.2, speed: 0.25 + Math.random() * 0.7, phase: Math.random() * 6.28, tilt, s: 0.6 + Math.random() * 0.8 });
    }
    this.cageMat = this.keep(new THREE.LineBasicMaterial({ color: show.clone().multiplyScalar(1.2), transparent: true, opacity: 0.35, toneMapped: false }));
    this.cage = new THREE.LineSegments(this.keep(new THREE.EdgesGeometry(this.keep(new THREE.IcosahedronGeometry(2.15, 1)), 1)), this.cageMat);
    this.hub.add(this.cage);
    this.group.add(this.hitBox(3.6, 3.6, 3.6, 0, 2.4, 0));
  }
  poke() {
    this.burst = 1;
  }
  update(dt: number, t: number, near: number) {
    if (near < 0.02) return;
    this.burst = Math.max(0, this.burst - dt * 0.7);
    const spread = 1 + 0.9 * Math.sin(this.burst * Math.PI);
    for (let i = 0; i < this.N; i++) {
      const o = this.orbits[i];
      const a = t * o.speed * (1 + 2 * this.burst) + o.phase;
      this.v.set(Math.cos(a) * o.r * spread, 0.12 * Math.sin(a * 3), Math.sin(a) * o.r * spread).applyQuaternion(o.tilt);
      this.q.setFromAxisAngle(this.v, a);
      this.m4.compose(this.v, this.q, new THREE.Vector3(o.s, o.s, o.s));
      this.agents.setMatrixAt(i, this.m4);
    }
    this.agents.instanceMatrix.needsUpdate = true;
    this.core.rotation.y = t * 0.9 + this.burst * 8;
    this.core.rotation.x = Math.sin(t * 0.6) * 0.4;
    this.cage.rotation.y = -t * 0.08;
    this.cage.rotation.x = Math.sin(t * 0.2) * 0.15;
    this.hub.position.y = 2.4 + 0.06 * Math.sin(t * 0.8);
  }
  readout() {
    return `${this.N} agents · own cloud · ${(this.burst > 0 ? "rebalancing" : "steady")}`;
  }
  retint(p: Palette, show: THREE.Color) {
    super.retint(p, show);
    this.cageMat.color.copy(show).multiplyScalar(p.dark ? 1.2 : 0.7);
  }
}

/* ── Climate · a stratosphere, injected in the tropics ───────────────── */

class Globe extends Base {
  kind = "globe" as const;
  private N = 5000;
  private R = 1.62;
  private pos: Float32Array;
  private lat: Float32Array;
  private lon: Float32Array;
  private rate: Float32Array;
  private pts: THREE.Points;
  private ptMat: THREE.PointsMaterial;
  private sphere = new THREE.Group();
  private gratMat: THREE.LineBasicMaterial;
  private haloMat: THREE.MeshBasicMaterial;
  private globeMat!: THREE.MeshStandardMaterial;
  private spin = 0;
  private injected = 0;

  constructor(p: Palette, show: THREE.Color) {
    super(p, show);
    this.sphere.position.y = 2.55;
    this.sphere.rotation.z = -0.41;
    this.group.add(this.sphere);
    // A darker body than the other props: under its own spot a white sphere
    // burns out, and the soot has to read against it.
    this.globeMat = this.keep(new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.85 }));
    const globe = this.mesh(new THREE.SphereGeometry(1.5, 64, 40), this.globeMat, 0, 0, 0, true);
    this.sphere.add(globe);
    this.gratMat = this.keep(new THREE.LineBasicMaterial({ color: p.ink, transparent: true, opacity: 0.16 }));
    this.sphere.add(new THREE.LineSegments(this.keep(new THREE.EdgesGeometry(this.keep(new THREE.SphereGeometry(1.503, 24, 12)), 1)), this.gratMat));
    this.haloMat = this.keep(
      new THREE.MeshBasicMaterial({ color: show, transparent: true, opacity: 0.08, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    const halo = this.mesh(new THREE.SphereGeometry(1.78, 48, 32), this.haloMat);
    halo.castShadow = false;
    this.sphere.add(halo);

    const N = this.N;
    this.pos = new Float32Array(N * 3);
    this.lat = new Float32Array(N);
    this.lon = new Float32Array(N);
    this.rate = new Float32Array(N);
    for (let i = 0; i < N; i++) this.seed(i, true);
    const geo = this.keep(new THREE.BufferGeometry());
    geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    this.ptMat = this.keep(new THREE.PointsMaterial({ color: p.dark ? 0xffffff : 0x111111, size: 0.026, sizeAttenuation: true }));
    this.pts = new THREE.Points(geo, this.ptMat);
    this.sphere.add(this.pts);
    this.write();

    // A stand: a slim mast and a glowing ring on the platform.
    this.group.add(this.mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.9, 12), this.ink, 0, 0.61, 0));
    const ring = this.mesh(new THREE.TorusGeometry(0.5, 0.015, 8, 48), this.glow, 0, 0.18, 0);
    ring.rotation.x = Math.PI / 2;
    ring.castShadow = false;
    this.group.add(ring);
  }
  private seed(i: number, scatter: boolean) {
    const side = Math.random() < 0.5 ? -1 : 1;
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
  poke() {
    const idx = Array.from({ length: this.N }, (_, i) => i).sort((a, b) => Math.abs(this.lat[b]) - Math.abs(this.lat[a]));
    for (let k = 0; k < this.N / 3; k++) this.seed(idx[k], false);
    this.spin = 1;
    this.injected++;
  }
  update(dt: number, t: number, near: number) {
    if (near < 0.02) return;
    this.spin = Math.max(0, this.spin - dt * 0.5);
    for (let i = 0; i < this.N; i++) {
      const s = Math.sign(this.lat[i]) || 1;
      this.lon[i] += dt * (0.4 + 0.35 * Math.cos(this.lat[i]));
      this.lat[i] += s * dt * this.rate[i] * (0.4 + Math.cos(this.lat[i]));
      if (Math.abs(this.lat[i]) > 1.32) this.seed(i, false);
    }
    this.write();
    this.sphere.rotation.y += dt * (0.12 + 1.0 * this.spin);
    this.sphere.position.y = 2.55 + 0.05 * Math.sin(t * 0.6);
  }
  readout() {
    let polar = 0;
    for (let i = 0; i < this.N; i++) if (Math.abs(this.lat[i]) > 0.9) polar++;
    return `black carbon · ${this.N.toLocaleString()} parcels · ${((polar / this.N) * 100).toFixed(0)}% past 50° · ${this.injected} injections`;
  }
  retint(p: Palette, show: THREE.Color) {
    super.retint(p, show);
    this.ptMat.color.set(p.dark ? 0xffffff : 0x111111);
    this.gratMat.color.copy(p.ink);
    this.haloMat.color.copy(show);
    this.globeMat.color.set(p.dark ? 0x5a5a5a : 0xd8d6d0);
  }
}

/* ── Flight · a blimp flying laps on a tether ────────────────────────── */

class Blimp extends Base {
  kind = "blimp" as const;
  private hull = new THREE.Group();
  private rotors: THREE.Mesh[] = [];
  private tether: THREE.Line;
  private tetherPos: Float32Array;
  private tetherMat: THREE.LineBasicMaterial;
  private y = 2.7;
  private vy = 0;
  private gustT = 0;
  private a = 0;

  constructor(p: Palette, show: THREE.Color) {
    super(p, show);
    const h = this.hull;
    const env = this.mesh(new THREE.SphereGeometry(0.55, 48, 28), this.shell, 0, 0, 0, true);
    env.scale.set(2.5, 1, 1);
    h.add(env);
    for (const rz of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const pivot = new THREE.Group();
      pivot.rotation.x = rz;
      pivot.add(this.rbox(0.42, 0.34, 0.03, this.ink, -1.15, 0.36, 0, 0.01));
      h.add(pivot);
    }
    h.add(this.rbox(0.42, 0.14, 0.2, this.ink, 0.1, -0.6, 0));
    h.add(this.rbox(0.05, 0.05, 1.5, this.ink, 0.1, -0.55, 0));
    for (const z of [-0.75, 0.75]) {
      h.add(this.mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 8), this.ink, 0.1, -0.47, z));
      const rotor = this.mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.012, 24), this.glow, 0.1, -0.39, z);
      rotor.castShadow = false;
      this.rotors.push(rotor);
      h.add(rotor);
    }
    // Navigation light.
    h.add(this.mesh(new THREE.SphereGeometry(0.05, 10, 8), this.glow, 1.38, 0, 0));
    this.group.add(h);

    this.group.add(this.hitBox(5.0, 2.6, 3.4, 0, 2.7, 0));
    // Winch on the platform.
    this.group.add(this.mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.2, 24), this.ink, 0, 0.26, 0));
    this.tetherPos = new Float32Array([0, 0.36, 0, 0, this.y, 0]);
    const geo = this.keep(new THREE.BufferGeometry());
    geo.setAttribute("position", new THREE.BufferAttribute(this.tetherPos, 3));
    this.tetherMat = this.keep(new THREE.LineBasicMaterial({ color: p.ink, transparent: true, opacity: 0.55 }));
    this.tether = new THREE.Line(geo, this.tetherMat);
    this.group.add(this.tether);
  }
  poke() {
    this.vy += 2.0;
    this.gustT = 2.2;
  }
  update(dt: number, t: number, near: number) {
    if (near < 0.02) return;
    this.gustT = Math.max(0, this.gustT - dt);
    // A slow lap around the platform, a spring in height.
    this.a += dt * 0.32;
    const r = 1.9;
    const px = Math.cos(this.a) * r, pz = Math.sin(this.a) * r * 0.6;
    const target = 2.7 + 0.12 * Math.sin(t * 0.9) + 0.06 * Math.sin(t * 2.3);
    this.vy += (target - this.y) * 5 * dt - this.vy * 1.1 * dt;
    this.y += this.vy * dt;
    this.hull.position.set(px, this.y, pz);
    // Heading along the lap; nose leads.
    this.hull.rotation.y = -this.a + Math.PI;
    this.hull.rotation.z = 0.08 * Math.sin(t * 0.8) + 0.25 * Math.min(1, this.gustT);
    this.hull.rotation.x = 0.05 * Math.sin(t * 0.5);
    for (const rt of this.rotors) rt.rotation.y += dt * (12 + 40 * this.gustT);
    this.tetherPos[3] = px + 0.1;
    this.tetherPos[4] = this.y - 0.62;
    this.tetherPos[5] = pz;
    (this.tether.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }
  readout() {
    return `hoverloon · alt ${this.y.toFixed(2)} · rotors ${(12 + 40 * this.gustT).toFixed(0)} rad⁄s · ${this.gustT > 0 ? "gust" : "trim"}`;
  }
  retint(p: Palette, show: THREE.Color) {
    super.retint(p, show);
    this.tetherMat.color.copy(p.ink);
  }
}

/* ── Machines · a leader/follower teleop pair ────────────────────────── */

class Arms extends Base {
  kind = "arms" as const;
  private leader: Arm;
  private follower: Arm;
  private buf: number[][] = [];
  private gripBuf: number[] = [];
  private steerPt: THREE.Vector3 | null = null;
  private target = new THREE.Vector3();
  private goal = new THREE.Vector3();
  private local = new THREE.Vector3();
  private latency = 0.28;
  private grip = false;

  constructor(p: Palette, show: THREE.Color) {
    super(p, show);
    this.leader = new Arm(p);
    this.follower = new Arm(p);
    this.leader.root.position.set(-1.15, 0.16, 0.2);
    this.follower.root.position.set(1.15, 0.16, 0.2);
    this.leader.root.scale.setScalar(1.05);
    this.follower.root.scale.setScalar(1.05);
    this.group.add(this.leader.root, this.follower.root);
    this.targets.push(this.leader.root, this.follower.root);
    // A conduit between the two: the data pipeline, lit.
    const pipe = this.mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.3, 8), this.glow, 0, 0.2, 0.2);
    pipe.rotation.z = Math.PI / 2;
    pipe.castShadow = false;
    this.group.add(pipe);
    this.target.set(-1.15, 1.9, 1.4);
    this.goal.copy(this.target);
    this.group.add(this.hitBox(4.2, 3.2, 3.0, 0, 1.6, 0.4));
  }
  steer(point: THREE.Vector3 | null) {
    this.steerPt = point ? point.clone() : null;
  }
  poke() {
    this.grip = !this.grip;
  }
  update(dt: number, t: number, near: number) {
    if (near < 0.02) return;
    // Leader: your finger, or a slow figure-eight in front of it.
    if (this.steerPt) {
      this.local.copy(this.steerPt);
      this.group.worldToLocal(this.local);
      this.local.x = THREE.MathUtils.clamp(this.local.x, -2.6, 0.5);
      this.local.z = THREE.MathUtils.clamp(this.local.z, -0.6, 1.9);
      this.local.y = THREE.MathUtils.clamp(this.local.y, 0.5, 2.6);
      this.goal.copy(this.local);
    } else {
      this.goal.set(-1.15 + 0.6 * Math.sin(t * 0.6), 1.9 + 0.4 * Math.sin(t * 1.2), 1.4 + 0.3 * Math.cos(t * 0.6));
    }
    this.target.lerp(this.goal, Math.min(1, dt * (this.steerPt ? 12 : 4)));
    this.local.copy(this.target);
    this.group.localToWorld(this.local);
    this.leader.solve(this.local);
    this.leader.gripGoal = this.grip ? 0.03 : 0.5;
    this.leader.update(dt);
    // Follower: the leader's joint stream, delayed by the pipeline.
    this.buf.push([...this.leader.angles]);
    this.gripBuf.push(this.leader.grip);
    const frames = Math.max(1, Math.round(this.latency / Math.max(dt, 1 / 120)));
    while (this.buf.length > frames) {
      this.buf.shift();
      this.gripBuf.shift();
    }
    const src = this.buf[0];
    for (let i = 0; i < 5; i++) this.follower.goal[i] = src[i];
    this.follower.gripGoal = this.gripBuf[0];
    this.follower.update(dt);
  }
  readout() {
    const a = this.leader.angles.map((x) => ((x * 180) / Math.PI).toFixed(0).padStart(4, " ")).join(" ");
    return `teleop · leader → follower · ${(this.latency * 1000).toFixed(0)} ms · θ${a}`;
  }
  retint(p: Palette, show: THREE.Color) {
    super.retint(p, show);
    this.leader.setColors(p);
    this.follower.setColors(p);
  }
  dispose() {
    super.dispose();
    this.leader.dispose();
    this.follower.dispose();
  }
}

/* ── Markets · a live funding-rate carry ticker ──────────────────────── */

class Market extends Base {
  kind = "market" as const;
  private n = 72;
  private equity: number[] = [];
  private funding: number[] = [];
  private strip: THREE.Mesh;
  private stripPos: Float32Array;
  private bars: THREE.InstancedMesh;
  private acc = 0;
  private seed = 11;
  private shock = 0;
  private m4 = new THREE.Matrix4();
  private W = 4.2;
  private barMat: THREE.MeshStandardMaterial;

  constructor(p: Palette, show: THREE.Color) {
    super(p, show);
    for (let i = 0; i < this.n; i++) this.push();
    // The equity curve as a glowing strip.
    this.stripPos = new Float32Array(this.n * 2 * 3);
    const geo = this.keep(new THREE.BufferGeometry());
    geo.setAttribute("position", new THREE.BufferAttribute(this.stripPos, 3));
    const idx: number[] = [];
    for (let i = 0; i < this.n - 1; i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      idx.push(a, b, c, b, d, c);
    }
    geo.setIndex(idx);
    this.strip = new THREE.Mesh(geo, this.keep(new THREE.MeshBasicMaterial({ color: show.clone().multiplyScalar(2.0), side: THREE.DoubleSide, toneMapped: false })));
    this.strip.castShadow = false;
    this.group.add(this.strip);
    this.targets.push(this.strip);
    // Funding-rate bars underneath.
    this.barMat = this.keep(new THREE.MeshStandardMaterial({ color: p.shell, roughness: 0.6 }));
    this.bars = new THREE.InstancedMesh(this.keep(new THREE.BoxGeometry(this.W / this.n - 0.012, 1, 0.12)), this.barMat, this.n);
    this.bars.castShadow = true;
    this.group.add(this.bars);
    this.targets.push(this.bars);
    // Baseline.
    const base = this.mesh(new THREE.BoxGeometry(this.W + 0.2, 0.02, 0.02), this.glow, 0, 1.0, 0);
    base.castShadow = false;
    this.group.add(base);
    this.group.add(this.hitBox(this.W + 0.4, 2.6, 0.8, 0, 2.0, 0));
    this.write();
  }
  private rnd() {
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed / 2147483647 - 0.5;
  }
  private push() {
    // Funding rate: mean-reverting, mostly positive; equity accrues it.
    const prev = this.funding[this.funding.length - 1] ?? 0.01;
    let f = prev + (0.01 - prev) * 0.15 + this.rnd() * 0.012;
    if (this.shock > 0) f -= 0.02 * this.shock;
    this.funding.push(f);
    const e = (this.equity[this.equity.length - 1] ?? 1) * (1 + f * 0.9 + this.rnd() * 0.004);
    this.equity.push(e);
    if (this.funding.length > this.n) {
      this.funding.shift();
      this.equity.shift();
    }
  }
  private write() {
    const n = this.n, W = this.W;
    const e0 = this.equity[0];
    let lo = Infinity, hi = -Infinity;
    for (const e of this.equity) {
      lo = Math.min(lo, e / e0);
      hi = Math.max(hi, e / e0);
    }
    const span = Math.max(0.02, hi - lo);
    for (let i = 0; i < n; i++) {
      const x = -W / 2 + (i / (n - 1)) * W;
      const y = 1.7 + ((this.equity[i] / e0 - lo) / span) * 1.3;
      this.stripPos[i * 6] = x;
      this.stripPos[i * 6 + 1] = y - 0.025;
      this.stripPos[i * 6 + 2] = 0;
      this.stripPos[i * 6 + 3] = x;
      this.stripPos[i * 6 + 4] = y + 0.025;
      this.stripPos[i * 6 + 5] = 0;
      const f = this.funding[i];
      const h = Math.max(0.02, Math.abs(f) * 28);
      this.m4.makeScale(1, h, 1);
      this.m4.setPosition(x, 1.0 + (f >= 0 ? h / 2 : -h / 2), 0);
      this.bars.setMatrixAt(i, this.m4);
      this.bars.setColorAt(i, f >= 0 ? this.show : this.accent.color);
    }
    (this.strip.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    this.bars.instanceMatrix.needsUpdate = true;
    if (this.bars.instanceColor) this.bars.instanceColor.needsUpdate = true;
  }
  /** A funding shock: rates flip negative for a stretch, carry pays to hold. */
  poke() {
    this.shock = 1;
  }
  update(dt: number, t: number, near: number) {
    if (near < 0.02) return;
    this.acc += dt;
    while (this.acc > 0.22) {
      this.acc -= 0.22;
      this.push();
      this.shock = Math.max(0, this.shock - 0.12);
      this.write();
    }
    this.group.children.forEach((c) => void c);
    this.strip.position.y = 0.04 * Math.sin(t * 0.7);
    this.bars.position.y = this.strip.position.y;
  }
  readout() {
    const f = this.funding[this.funding.length - 1];
    const ret = (this.equity[this.equity.length - 1] / this.equity[0] - 1) * 100;
    return `perp funding ${(f * 100).toFixed(3)}% ⁄ 8h · carry ${ret >= 0 ? "+" : ""}${ret.toFixed(1)}% · delta-neutral`;
  }
  retint(p: Palette, show: THREE.Color) {
    super.retint(p, show);
    (this.strip.material as THREE.MeshBasicMaterial).color.copy(show).multiplyScalar(p.dark ? 2.0 : 1.0);
    this.barMat.color.copy(p.shell);
    this.write();
  }
}

/* ── Sensing · a kerb watched by one camera ──────────────────────────── */

class Street extends Base {
  kind = "street" as const;
  private head = new THREE.Group();
  private cone: THREE.Mesh;
  private coneMat: THREE.MeshBasicMaterial;
  private slots: { x: number; car: THREE.Mesh | null; gapLight: THREE.Mesh; lit: number; leaving: number }[] = [];
  private pool: THREE.Mesh[] = [];
  private nextEvent = 3;
  private gapMat: THREE.MeshBasicMaterial;
  private detections = 0;
  private lockT = 0;
  private lockX = 0;

  constructor(p: Palette, show: THREE.Color) {
    super(p, show);
    // Road and kerb.
    const road = this.rbox(5.2, 0.05, 1.5, this.ink, 0, 0.19, 0.55, 0.01);
    road.receiveShadow = true;
    this.group.add(road);
    this.group.add(this.rbox(5.2, 0.09, 0.14, this.shell, 0, 0.21, -0.22, 0.01));
    this.gapMat = this.keep(new THREE.MeshBasicMaterial({ color: show.clone().multiplyScalar(1.8), transparent: true, opacity: 0.0, toneMapped: false }));
    const slotW = 0.68;
    for (let i = 0; i < 7; i++) {
      const x = -2.2 + i * slotW + slotW / 2;
      const gapLight = this.mesh(new THREE.PlaneGeometry(slotW - 0.1, 0.5), this.gapMat, x, 0.225, 0.2);
      gapLight.rotation.x = -Math.PI / 2;
      gapLight.castShadow = false;
      this.group.add(gapLight);
      const slot = { x, car: null as THREE.Mesh | null, gapLight, lit: 0, leaving: 0 };
      if (i !== 2 && i !== 5) slot.car = this.park(x);
      this.slots.push(slot);
    }
    // The camera on its pole, behind the kerb.
    this.group.add(this.mesh(new THREE.CylinderGeometry(0.03, 0.04, 2.6, 10), this.ink, 0, 1.46, -0.9));
    this.head.position.set(0, 2.72, -0.9);
    this.group.add(this.head);
    this.head.add(this.rbox(0.2, 0.16, 0.42, this.ink, 0, 0, 0.05));
    const lens = this.mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.1, 20), this.glow, 0, 0, 0.3);
    lens.rotation.x = Math.PI / 2;
    lens.castShadow = false;
    this.head.add(lens);
    this.targets.push(this.head);
    this.coneMat = this.keep(
      new THREE.MeshBasicMaterial({ color: show, transparent: true, opacity: 0.09, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
    );
    const L = 3.2;
    this.cone = this.mesh(new THREE.ConeGeometry(0.75, L, 28, 1, true), this.coneMat, 0, -L / 2, 0);
    this.cone.castShadow = false;
    const tilt = new THREE.Group();
    tilt.position.z = 0.3;
    tilt.rotation.x = -0.62;
    tilt.add(this.cone);
    this.head.add(tilt);
    this.group.add(this.hitBox(5.4, 3.2, 2.4, 0, 1.6, 0));
  }
  private park(x: number) {
    const car = this.pool.pop() ?? this.rbox(0.5, 0.2, 0.3, this.shell, 0, 0, 0, 0.05);
    car.position.set(x, 0.32, 0.25);
    car.scale.setScalar(1);
    this.group.add(car);
    return car;
  }
  poke() {
    // The car nearest the beam pulls out.
    const hit = this.head.rotation.y;
    let best = -1, bd = 9;
    this.slots.forEach((s, i) => {
      if (!s.car || s.leaving > 0) return;
      const d = Math.abs(Math.atan2(s.x, 1.55) - hit);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    if (best >= 0) this.slots[best].leaving = 1;
  }
  update(dt: number, t: number, near: number) {
    if (near < 0.02) return;
    // Pan, with a lock-on after a detection.
    this.lockT = Math.max(0, this.lockT - dt);
    const sweep = Math.sin(t * 0.45) * 0.75;
    const pan = this.lockT > 0 ? this.lockX : sweep;
    this.head.rotation.y += (pan - this.head.rotation.y) * Math.min(1, dt * 6);
    // Which slot the beam is on: the camera sits at z=-0.9, slots at z≈0.25.
    const beamX = -Math.tan(this.head.rotation.y) * 1.55;
    for (const s of this.slots) {
      const on = !s.car && Math.abs(beamX - s.x) < 0.36 ? 1 : 0;
      if (on && s.lit < 0.5) {
        this.detections++;
        this.lockT = 1.2;
        this.lockX = -Math.atan2(s.x, 1.55);
      }
      s.lit += (on - s.lit) * Math.min(1, dt * 7);
      (s.gapLight.material as THREE.MeshBasicMaterial).opacity = 0.12 * (s.car ? 0 : 1) + 0.8 * s.lit;
      if (s.car && s.leaving > 0) {
        s.leaving += dt * 0.9;
        s.car.position.z = 0.25 + Math.min(1, s.leaving) * 0.55;
        s.car.position.x = s.x + Math.max(0, s.leaving - 0.6) * 4;
        if (s.leaving > 1.8) {
          this.group.remove(s.car);
          this.pool.push(s.car);
          s.car = null;
          s.leaving = 0;
        }
      }
    }
    // Traffic: every few seconds a car arrives or leaves.
    this.nextEvent -= dt;
    if (this.nextEvent < 0) {
      this.nextEvent = 3 + Math.random() * 4;
      const empty = this.slots.filter((s) => !s.car);
      const full = this.slots.filter((s) => s.car && s.leaving === 0);
      if (empty.length && (full.length < 3 || Math.random() < 0.5)) {
        const s = empty[Math.floor(Math.random() * empty.length)];
        s.car = this.park(s.x);
        s.car.scale.setScalar(0.01);
      } else if (full.length) full[Math.floor(Math.random() * full.length)].leaving = 1;
    }
    for (const s of this.slots) if (s.car && s.leaving === 0 && s.car.scale.x < 1) s.car.scale.setScalar(Math.min(1, s.car.scale.x + dt * 3));
    this.coneMat.opacity = 0.08 + 0.06 * (this.lockT > 0 ? 1 : 0);
  }
  readout() {
    const free = this.slots.filter((s) => !s.car).length;
    return `kerb cam · ${free} of 7 bays free · pan ${((this.head.rotation.y * 180) / Math.PI).toFixed(0)}° · ${this.detections} detections`;
  }
  retint(p: Palette, show: THREE.Color) {
    super.retint(p, show);
    this.coneMat.color.copy(show);
    this.gapMat.color.copy(show).multiplyScalar(p.dark ? 1.8 : 1.0);
  }
}

/* ── Piano · two octaves, a phrase, notes that rise ──────────────────── */

const WHITE_HZ = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5];
const BLACK_HZ = [277.18, 311.13, 369.99, 415.3, 466.16, 554.37, 622.25, 739.99, 830.61, 932.33];
const BLACK_AFTER = [0, 1, 3, 4, 5, 7, 8, 10, 11, 12];
// [key, beat]. Keys ≥ 15 are black.
const PHRASE: [number, number][] = [
  [0, 0], [2, 1], [4, 2], [7, 3], [9, 4], [7, 5], [4, 6], [2, 7],
  [1, 8], [17, 9], [5, 10], [8, 11], [12, 12], [8, 13], [5, 14], [1, 15],
  [3, 16], [18, 17], [7, 18], [10, 19], [14, 20], [10, 21], [7, 22], [3, 23],
];
const BEAT = 0.17;

class Piano extends Base {
  kind = "piano" as const;
  private keys: THREE.Mesh[] = [];
  private press = new Float32Array(25);
  private keyMats: THREE.MeshStandardMaterial[] = [];
  private next = 0;
  private start = -1;
  private audio: AudioContext | null = null;
  private audibleUntil = 0;
  private notes: { m: THREE.Mesh; life: number }[] = [];
  private body = new THREE.Group();
  private played = 0;

  constructor(p: Palette, show: THREE.Color) {
    super(p, show);
    this.body.position.y = 1.5;
    this.body.rotation.x = 0.35;
    this.group.add(this.body);
    const w = 0.17, d = 0.75;
    this.body.add(this.rbox(w * 15 + 0.14, 0.12, d + 0.14, this.ink, 0, -0.08, -0.02, 0.02));
    for (let i = 0; i < 15; i++) {
      const m = this.keep(new THREE.MeshStandardMaterial({ color: p.shell, roughness: 0.4, emissive: show, emissiveIntensity: 0 }));
      this.keyMats.push(m);
      const k = this.rbox(w - 0.012, 0.08, d, m, (i - 7) * w, 0.02, 0, 0.01);
      this.keys.push(k);
      this.body.add(k);
      this.targets.push(k);
    }
    for (let i = 0; i < 10; i++) {
      const m = this.keep(new THREE.MeshStandardMaterial({ color: p.servo, roughness: 0.35, emissive: show, emissiveIntensity: 0 }));
      this.keyMats.push(m);
      const k = this.rbox(0.09, 0.09, d * 0.58, m, (BLACK_AFTER[i] - 6.5) * w, 0.07, -d * 0.21, 0.01);
      this.keys.push(k);
      this.body.add(k);
      this.targets.push(k);
    }
    this.group.add(this.hitBox(3.0, 1.2, 1.4, 0, 1.5, 0));
    const noteGeo = this.keep(new THREE.SphereGeometry(0.05, 10, 8));
    for (let i = 0; i < 24; i++) {
      const m = new THREE.Mesh(noteGeo, this.glow);
      m.visible = false;
      m.castShadow = false;
      this.group.add(m);
      this.notes.push({ m, life: 0 });
    }
  }
  poke() {
    if (!this.audio) {
      try {
        this.audio = new AudioContext();
      } catch {
        /* no audio */
      }
    }
    if (this.audio?.state === "suspended") void this.audio.resume();
    this.audibleUntil = performance.now() / 1000 + 10;
    this.next = 0;
    this.start = -1;
  }
  private strike(key: number) {
    this.press[key] = 1;
    this.played++;
    const k = this.keys[key];
    const note = this.notes.find((n) => n.life <= 0);
    if (note) {
      note.life = 1;
      note.m.visible = true;
      note.m.position.copy(k.position).applyMatrix4(this.body.matrix);
      note.m.scale.setScalar(1);
    }
    const ac = this.audio;
    if (!ac || performance.now() / 1000 > this.audibleUntil) return;
    const hz = key < 15 ? WHITE_HZ[key] : BLACK_HZ[key - 15];
    const t0 = ac.currentTime;
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.1, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + 1.1);
    g.connect(ac.destination);
    for (const [mult, amp, type] of [[1, 1, "triangle"], [2, 0.25, "sine"], [3, 0.08, "sine"]] as const) {
      const o = ac.createOscillator();
      o.type = type;
      o.frequency.value = hz * mult;
      const og = ac.createGain();
      og.gain.value = amp;
      o.connect(og).connect(g);
      o.start(t0);
      o.stop(t0 + 1.2);
    }
  }
  update(dt: number, t: number, near: number) {
    if (near < 0.02) return;
    if (this.start < 0) this.start = t + 0.5;
    const beat = (t - this.start) / BEAT;
    while (this.next < PHRASE.length && PHRASE[this.next][1] <= beat) this.strike(PHRASE[this.next++][0]);
    if (this.next >= PHRASE.length && beat > PHRASE[PHRASE.length - 1][1] + 8) {
      this.next = 0;
      this.start = t;
    }
    for (let i = 0; i < 25; i++) {
      this.press[i] = Math.max(0, this.press[i] - dt * 6);
      const k = this.keys[i];
      k.position.y = (i < 15 ? 0.02 : 0.07) - 0.05 * Math.min(1, this.press[i] * 1.5);
      this.keyMats[i].emissiveIntensity = 1.6 * this.press[i];
    }
    for (const n of this.notes) {
      if (n.life <= 0) continue;
      n.life -= dt * 0.55;
      n.m.position.y += dt * 1.1;
      n.m.scale.setScalar(Math.max(0.01, n.life));
      if (n.life <= 0) n.m.visible = false;
    }
    this.body.position.y = 1.5 + 0.04 * Math.sin(t * 0.8);
  }
  readout() {
    return `piano · 25 keys · ${this.played} notes · ${this.audio && performance.now() / 1000 < this.audibleUntil ? "sound on" : "tap for sound"}`;
  }
}

/* ── Contact · the exit gate ─────────────────────────────────────────── */

class Gate extends Base {
  kind = "gate" as const;
  private ring: THREE.Mesh;
  private inner: THREE.Mesh;
  private pulse = 0;
  private motes: THREE.Points;
  private mp: Float32Array;
  private moteMat: THREE.PointsMaterial;

  constructor(p: Palette, show: THREE.Color) {
    super(p, show);
    this.ring = this.mesh(new THREE.TorusGeometry(1.9, 0.06, 16, 96), this.glow, 0, 2.3, 0, true);
    this.ring.castShadow = false;
    this.group.add(this.ring);
    this.inner = this.mesh(new THREE.TorusGeometry(1.5, 0.02, 12, 96), this.glow, 0, 2.3, 0);
    this.inner.castShadow = false;
    this.group.add(this.inner);
    this.group.add(this.hitBox(4.0, 4.0, 0.6, 0, 2.3, 0));
    this.mp = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * 1.7;
      this.mp[i * 3] = Math.cos(a) * r;
      this.mp[i * 3 + 1] = Math.random() * 4.2;
      this.mp[i * 3 + 2] = Math.sin(a) * r * 0.3;
    }
    const geo = this.keep(new THREE.BufferGeometry());
    geo.setAttribute("position", new THREE.BufferAttribute(this.mp, 3));
    this.moteMat = this.keep(
      new THREE.PointsMaterial({ color: show.clone().multiplyScalar(1.5), size: 0.03, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    );
    this.motes = new THREE.Points(geo, this.moteMat);
    this.group.add(this.motes);
  }
  poke() {
    this.pulse = 1;
  }
  update(dt: number, t: number, near: number) {
    if (near < 0.02) return;
    this.pulse = Math.max(0, this.pulse - dt * 0.8);
    const s = 1 + 0.03 * Math.sin(t * 1.5) + 0.15 * Math.sin(this.pulse * Math.PI);
    this.ring.scale.setScalar(s);
    this.inner.scale.setScalar(2 - s);
    this.inner.rotation.z = t * 0.3;
    for (let i = 0; i < 400; i++) {
      this.mp[i * 3 + 1] += dt * (0.25 + 0.6 * this.pulse);
      if (this.mp[i * 3 + 1] > 4.4) this.mp[i * 3 + 1] = 0;
    }
    (this.motes.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }
  readout() {
    return "end of line · doors open on the left";
  }
  retint(p: Palette, show: THREE.Color) {
    super.retint(p, show);
    this.moteMat.color.copy(show).multiplyScalar(p.dark ? 1.5 : 0.6);
  }
}

export function makeSet(kind: SetKind, p: Palette, show: THREE.Color): SetPiece {
  switch (kind) {
    case "attractor":
      return new Attractor(p, show);
    case "swarm":
      return new Swarm(p, show);
    case "globe":
      return new Globe(p, show);
    case "blimp":
      return new Blimp(p, show);
    case "arms":
      return new Arms(p, show);
    case "market":
      return new Market(p, show);
    case "street":
      return new Street(p, show);
    case "piano":
      return new Piano(p, show);
    case "gate":
      return new Gate(p, show);
  }
}
