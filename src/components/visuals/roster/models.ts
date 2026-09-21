import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Arm } from "./Arm";

/**
 * The roster. One model per thing he built, each with a small idle loop, the
 * way a character stands on a select screen: a globe turns, rotors idle, an
 * arm reaches slowly. Nothing more.
 *
 * Local frame: origin on the floor at the centre of the platform, +Z toward
 * the viewer, +X to the viewer's right. Everything fits in ~3 × 3 × 2.
 */

export type PropKind = "attractor" | "carry" | "curb" | "aerosol" | "hoverloon" | "teleop" | "multiplier" | "browser";

export interface Prop {
  group: THREE.Group;
  update(dt: number, t: number): void;
  dispose(): void;
}

type Disposable = { dispose(): void };

const SHELL = 0xcfcbc2;
const INK = 0x1a1a1a;

abstract class Base implements Prop {
  group = new THREE.Group();
  protected trash: Disposable[] = [];
  protected accent: THREE.Color;
  protected shell = this.keep(new THREE.MeshStandardMaterial({ color: SHELL, roughness: 0.55 }));
  protected ink = this.keep(new THREE.MeshStandardMaterial({ color: INK, roughness: 0.45, metalness: 0.15 }));
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

/** Real funding prints and the equity they compound to, as a still chart. */
class CarryProp extends Base {
  constructor(accent: THREE.Color) {
    super(accent);
    this.rbox(2.6, 0.08, 0.7, this.ink, 0, 0.04, 0);
    fetch("/data/btc-funding.json")
      .then((r) => r.json())
      .then((j: { rates: number[] }) => {
        const rates = j.rates;
        // 80 bars: the funding series resampled across the whole history.
        const n = 80;
        const bars = new THREE.InstancedMesh(this.keep(new THREE.BoxGeometry(2.4 / n - 0.006, 1, 0.25)), this.shell, n);
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
          m4.setPosition(-1.2 + (2.4 / n) * (i + 0.5), 0.08 + (mean >= 0 ? h / 2 : -h / 2), 0);
          bars.setMatrixAt(i, m4);
          curve.push(new THREE.Vector3(-1.2 + (2.4 / n) * (i + 0.5), 0.5 + Math.log(eq) * 0.9, -0.2));
        }
        bars.castShadow = true;
        this.group.add(bars);
        const line = new THREE.Line(this.keep(new THREE.BufferGeometry().setFromPoints(curve)), this.keep(new THREE.LineBasicMaterial({ color: this.accent })));
        this.group.add(line);
      })
      .catch(() => {});
  }
}

/** The camera, and the one frame it saw. */
class CurbProp extends Base {
  constructor(accent: THREE.Color) {
    super(accent);
    this.mesh(new THREE.CylinderGeometry(0.035, 0.045, 2.2, 12), this.ink, -1.0, 1.1, -0.2);
    const head = new THREE.Group();
    head.position.set(-1.0, 2.25, -0.2);
    head.rotation.y = -0.35;
    this.group.add(head);
    const body = this.rbox(0.18, 0.15, 0.38, this.ink, 0, 0, 0.05);
    const lens = this.mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.08, 16), this.lit, 0, 0, 0.27);
    lens.rotation.x = Math.PI / 2;
    head.add(body, lens);
    this.rbox(0.7, 0.05, 0.4, this.ink, 0.45, 0.025, 0.1);
    this.mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8), this.ink, 0.45, 0.35, 0.1);
    const frame = this.rbox(2.2, 1.55, 0.07, this.ink, 0.45, 1.42, 0.1, 0.03);
    const mat = this.keep(new THREE.MeshBasicMaterial({ color: 0x0a0a0a }));
    const screen = new THREE.Mesh(this.keep(new THREE.PlaneGeometry(2.08, 1.44)), mat);
    screen.position.z = 0.04;
    frame.add(screen);
    new THREE.TextureLoader().load("/images/projects/lastcurb-frame.jpg", (tx) => {
      tx.colorSpace = THREE.SRGBColorSpace;
      mat.map = tx;
      mat.color.set(0xbdbdbd);
      mat.needsUpdate = true;
    });
  }
}

/** A globe with its soot shell, turning once every long while. */
class AerosolProp extends Base {
  private sphere = new THREE.Group();
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
    // Soot, denser in the tropics, thinning toward the poles.
    const N = 2600;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const lat = (Math.random() - 0.5) * 2.0 * Math.pow(Math.random(), 0.6) * 1.3;
      const lon = Math.random() * Math.PI * 2;
      const R = 1.06;
      pos[i * 3] = R * Math.cos(lat) * Math.cos(lon);
      pos[i * 3 + 1] = R * Math.sin(lat);
      pos[i * 3 + 2] = R * Math.cos(lat) * Math.sin(lon);
    }
    const g = this.keep(new THREE.BufferGeometry());
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.sphere.add(new THREE.Points(g, this.keep(new THREE.PointsMaterial({ color: accent, size: 0.02, transparent: true, opacity: 0.9 }))));
  }
  update(dt: number) {
    this.sphere.rotation.y += dt * 0.05;
  }
}

/** The craft, hovering on its tether. */
class HoverloonProp extends Base {
  private rotors: THREE.Mesh[] = [];
  private craft = new THREE.Group();
  constructor(accent: THREE.Color) {
    super(accent);
    this.mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.14, 24), this.ink, 0, 0.07, 0);
    const c = this.craft;
    c.position.y = 1.9;
    const env = this.mesh(new THREE.SphereGeometry(0.62, 40, 26), this.shell, 0, 0.5, 0);
    env.scale.set(2.1, 1, 1);
    const gondola = this.rbox(0.8, 0.14, 0.44, this.ink, 0, 0, 0);
    c.add(env, gondola);
    for (const [x, z] of [[-0.7, -0.5], [0.7, -0.5], [-0.7, 0.5], [0.7, 0.5]]) {
      const arm = this.rbox(Math.hypot(x, z), 0.04, 0.04, this.ink, x / 2, 0, z / 2);
      arm.rotation.y = -Math.atan2(z, x);
      const rotor = this.mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.01, 28), this.keep(new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.35, roughness: 0.4 })), x, 0.08, z);
      this.rotors.push(rotor);
      c.add(arm, rotor);
    }
    c.add(this.rbox(0.42, 0.42, 0.42, this.shell, 0, -0.45, 0));
    this.group.add(c);
    const tether = new THREE.Line(this.keep(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.14, 0), new THREE.Vector3(0, 1.9 - 0.66, 0)])), this.keep(new THREE.LineBasicMaterial({ color: 0x777777 })));
    this.group.add(tether);
  }
  update(dt: number, t: number) {
    for (const r of this.rotors) r.rotation.y += dt * 1.2;
    this.craft.position.y = 1.9 + 0.02 * Math.sin(t * 0.5);
  }
}

/** Leader and follower, holding the same pose. */
class TeleopProp extends Base {
  private leader: Arm;
  private follower: Arm;
  private target = new THREE.Vector3();
  constructor(accent: THREE.Color) {
    super(accent);
    const colors = { shell: new THREE.Color(SHELL), servo: new THREE.Color(INK), accent };
    this.leader = new Arm(colors);
    this.follower = new Arm(colors);
    this.leader.root.position.set(-0.9, 0, 0);
    this.follower.root.position.set(0.9, 0, 0);
    this.leader.root.scale.setScalar(0.62);
    this.follower.root.scale.setScalar(0.62);
    this.group.add(this.leader.root, this.follower.root);
    const pipe = this.mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.8, 8), this.lit, 0, 0.1, 0);
    pipe.rotation.z = Math.PI / 2;
  }
  update(dt: number, t: number) {
    // A very slow reach, the follower a beat behind.
    this.target.set(-0.9 + 0.25 * Math.sin(t * 0.25), 1.3 + 0.2 * Math.sin(t * 0.4), 0.9);
    this.group.localToWorld(this.target);
    this.leader.solve(this.target);
    this.leader.update(dt);
    for (let i = 0; i < 5; i++) this.follower.goal[i] = this.leader.angles[i];
    this.follower.update(dt);
  }
  dispose() {
    super.dispose();
    this.leader.dispose();
    this.follower.dispose();
  }
}

/** The client's cloud, the runtime in it, the data it draws on. */
class MultiplierProp extends Base {
  private core: THREE.Mesh;
  constructor(accent: THREE.Color) {
    super(accent);
    const cage = new THREE.LineSegments(this.keep(new THREE.EdgesGeometry(this.keep(new THREE.BoxGeometry(3.0, 2.0, 1.8)))), this.keep(new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.55 })));
    cage.position.y = 1.0;
    this.group.add(cage);
    this.rbox(1.3, 0.07, 0.8, this.ink, 0, 0.035, 0.2);
    this.core = this.rbox(0.4, 0.4, 0.4, this.lit, 0, 0.3, 0.2, 0.05);
    for (let i = 0; i < 3; i++) this.rbox(0.45, 0.75, 0.25, this.shell, -0.95 + i * 0.95, 0.4, -0.6);
  }
  update(dt: number) {
    this.core.rotation.y += dt * 0.15;
  }
}

/** The signature: a Lorenz attractor, integrated live. */
class AttractorModel extends Base {
  private pos: Float32Array;
  private geo: THREE.BufferGeometry;
  private hub = new THREE.Group();
  constructor(accent: THREE.Color) {
    super(accent);
    const N = 6000;
    this.pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      this.pos[i * 3] = (Math.random() - 0.5) * 30;
      this.pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      this.pos[i * 3 + 2] = Math.random() * 50;
    }
    for (let k = 0; k < 500; k++) this.step(0.006);
    this.geo = this.keep(new THREE.BufferGeometry());
    this.geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    const pts = new THREE.Points(this.geo, this.keep(new THREE.PointsMaterial({ color: accent, size: 0.022, transparent: true, opacity: 0.85, depthWrite: false })));
    pts.position.z = -26;
    this.hub.position.y = 1.35;
    this.hub.rotation.x = -Math.PI / 2 + 0.3;
    this.hub.rotation.z = Math.PI / 2;
    this.hub.scale.setScalar(0.05);
    this.hub.add(pts);
    this.group.add(this.hub);
  }
  private step(h: number) {
    const p = this.pos, s = 10, r = 28, b = 8 / 3;
    for (let i = 0; i < p.length; i += 3) {
      const x = p[i], y = p[i + 1], z = p[i + 2];
      const dx = s * (y - x), dy = x * (r - z) - y, dz = x * y - b * z;
      const xm = x + dx * h * 0.5, ym = y + dy * h * 0.5, zm = z + dz * h * 0.5;
      p[i] = x + s * (ym - xm) * h;
      p[i + 1] = y + (xm * (r - zm) - ym) * h;
      p[i + 2] = z + (xm * ym - b * zm) * h;
    }
  }
  update(dt: number) {
    this.step(Math.min(dt, 0.033) * 0.55);
    (this.geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    this.hub.rotation.z += dt * 0.1;
  }
}

/** An editor window with a browser living in its sidebar. */
class BrowserProp extends Base {
  private win = new THREE.Group();
  constructor(accent: THREE.Color) {
    super(accent);
    const w = this.win;
    w.position.y = 1.35;
    w.rotation.y = -0.25;
    // The editor: a dark slab with a title bar and a few lines of code.
    w.add(this.rbox(3.0, 1.95, 0.08, this.ink, 0, 0, 0, 0.06));
    const pane = this.keep(new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 }));
    w.add(this.rbox(2.9, 0.16, 0.02, pane, 0, 0.86, 0.045, 0.01));
    for (let i = 0; i < 3; i++) w.add(this.mesh(new THREE.SphereGeometry(0.03, 8, 6), i === 0 ? this.lit : pane, -1.3 + i * 0.1, 0.86, 0.07));
    const code = this.keep(new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 }));
    const widths = [0.9, 1.3, 0.6, 1.1, 0.8, 1.2, 0.5];
    widths.forEach((cw, i) => w.add(this.rbox(cw, 0.05, 0.02, code, -1.35 + cw / 2 + (i % 3) * 0.1, 0.62 - i * 0.2, 0.045, 0.01)));
    // The browser sidebar: a lighter pane with a page in it, and vertical tabs.
    w.add(this.rbox(1.05, 1.62, 0.03, this.shell, 0.9, -0.08, 0.05, 0.03));
    const page = this.keep(new THREE.MeshStandardMaterial({ color: 0xb0aca2, roughness: 0.9 }));
    for (let i = 0; i < 5; i++) w.add(this.rbox(0.7 - (i % 2) * 0.2, 0.05, 0.02, page, 0.86 - ((i % 2) * 0.2) / 2, 0.42 - i * 0.16, 0.075, 0.01));
    w.add(this.rbox(0.75, 0.3, 0.02, page, 0.9, -0.5, 0.075, 0.02));
    for (let i = 0; i < 4; i++) w.add(this.rbox(0.08, 0.08, 0.02, i === 1 ? this.lit : page, 0.44, 0.6 - i * 0.16, 0.075, 0.02));
    this.group.add(w);
  }
  update(dt: number, t: number) {
    this.win.position.y = 1.35 + 0.02 * Math.sin(t * 0.6);
  }
}

export function makeProp(kind: PropKind, accent: THREE.Color): Prop {
  switch (kind) {
    case "browser":
      return new BrowserProp(accent);
    case "attractor":
      return new AttractorModel(accent);
    case "carry":
      return new CarryProp(accent);
    case "curb":
      return new CurbProp(accent);
    case "aerosol":
      return new AerosolProp(accent);
    case "hoverloon":
      return new HoverloonProp(accent);
    case "teleop":
      return new TeleopProp(accent);
    case "multiplier":
      return new MultiplierProp(accent);
  }
}
