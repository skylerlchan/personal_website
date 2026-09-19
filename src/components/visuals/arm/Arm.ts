import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * A five-axis desk arm in the proportions of the SO-101 (LeRobot's
 * 3D-printed arm): yaw at the base, shoulder and elbow pitch, wrist pitch,
 * wrist roll, and a parallel-ish gripper. White shells, black servos.
 *
 * Kinematics are solved analytically, not by search. The target is rotated
 * into the arm's vertical plane, the tool orientation is chosen from the
 * target's height, the wrist pivot is backed off from the tool point, and
 * the shoulder/elbow pair is closed with the law of cosines. Every joint is
 * then driven by a second-order servo model — a critically-damped-ish spring
 * with a velocity cap — so big moves run at servo speed and small ones settle
 * with a hair of overshoot. That is what makes it read as a machine rather
 * than a tween.
 */

export const ARM = {
  L1: 1.15, // upper arm
  L2: 1.0, // forearm
  L3: 0.24, // wrist link
  JAW: 0.3, // jaw length
  SHOULDER_Y: 0.64,
};

// Wrist pivot → the point between the jaw tips where a prop is held.
export const TOOL_LEN = ARM.L3 + 0.2 + ARM.JAW * 0.65;
export const REACH = ARM.L1 + ARM.L2 + TOOL_LEN;

// Joint limits, radians: yaw, shoulder (from vertical, + forward), elbow,
// wrist pitch, roll. Roughly the SO-101's, minus the bits that would clip
// the floor or the base.
const LIMITS: [number, number][] = [
  [-2.9, 2.9],
  [-0.4, 2.05],
  [0.0, 2.75],
  [-1.75, 1.75],
  [-1.6, 1.6],
];

// Servo model. ω is the natural frequency, ζ the damping ratio, vmax the
// no-load speed. The STS3215 does ~6 rad/s; this is a touch under.
const SERVO = { w: 11, z: 0.8, vmax: 5.2 };

export type ArmColors = { shell: THREE.Color; servo: THREE.Color; accent: THREE.Color };

export class Arm {
  readonly root = new THREE.Group();
  /** Parent this to place a prop between the jaws. */
  readonly tool = new THREE.Group();
  /** Current joint angles, servo-smoothed. */
  readonly angles = [0, 0.35, 1.35, 0.15, 0];
  /** Where the solver wants the joints to be. */
  readonly goal = [0, 0.35, 1.35, 0.15, 0];
  private vel = [0, 0, 0, 0, 0];

  /** Gripper opening, 0 closed → 1 open. */
  grip = 0.35;
  gripGoal = 0.35;
  private gripVel = 0;

  private joints: THREE.Group[] = [];
  private jaw = new THREE.Group();
  private shell: THREE.MeshStandardMaterial;
  private servo: THREE.MeshStandardMaterial;
  private accent: THREE.MeshStandardMaterial;
  private geometries: THREE.BufferGeometry[] = [];

  constructor(colors: ArmColors) {
    this.shell = new THREE.MeshStandardMaterial({ color: colors.shell, roughness: 0.55, metalness: 0.0 });
    this.servo = new THREE.MeshStandardMaterial({ color: colors.servo, roughness: 0.42, metalness: 0.15 });
    this.accent = new THREE.MeshStandardMaterial({ color: colors.accent, roughness: 0.5, metalness: 0.0 });
    this.build();
    this.apply();
  }

  setColors(c: ArmColors) {
    this.shell.color.copy(c.shell);
    this.servo.color.copy(c.servo);
    this.accent.color.copy(c.accent);
  }

  /* ── construction ─────────────────────────────────────────────────── */

  private mesh(geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) {
    this.geometries.push(geo);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }
  private rbox(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0, r = 0.028) {
    return this.mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)), mat, x, y, z);
  }
  /** A servo horn: a short cylinder lying along X, so a joint reads as a hinge. */
  private horn(r: number, len: number, mat: THREE.Material) {
    const m = this.mesh(new THREE.CylinderGeometry(r, r, len, 32), mat);
    m.rotation.z = Math.PI / 2;
    return m;
  }

  private build() {
    const { L1, L2, L3, JAW } = ARM;
    const root = this.root;

    // Base plate and the yaw servo hiding inside it.
    root.add(this.mesh(new THREE.CylinderGeometry(0.5, 0.56, 0.1, 64), this.shell, 0, 0.05, 0));
    root.add(this.mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 64), this.accent, 0, 0.12, 0));
    root.add(this.rbox(0.4, 0.3, 0.4, this.servo, 0, 0.27, 0));

    const yaw = new THREE.Group();
    yaw.position.y = 0.42;
    root.add(yaw);
    yaw.add(this.rbox(0.46, 0.14, 0.36, this.shell, 0, 0.07, 0));
    yaw.add(this.rbox(0.3, 0.26, 0.24, this.servo, 0, 0.22, 0));
    yaw.add(this.rbox(0.05, 0.34, 0.32, this.shell, 0.2, 0.22, 0));
    yaw.add(this.rbox(0.05, 0.34, 0.32, this.shell, -0.2, 0.22, 0));

    const shoulder = new THREE.Group();
    shoulder.position.y = 0.22;
    yaw.add(shoulder);
    shoulder.add(this.horn(0.14, 0.44, this.shell));
    shoulder.add(this.rbox(0.16, L1, 0.2, this.shell, 0, L1 / 2, 0));

    const elbow = new THREE.Group();
    elbow.position.y = L1;
    shoulder.add(elbow);
    elbow.add(this.rbox(0.24, 0.22, 0.22, this.servo));
    elbow.add(this.horn(0.11, 0.3, this.shell));
    elbow.add(this.rbox(0.13, L2, 0.17, this.shell, 0, L2 / 2, 0));

    const wrist = new THREE.Group();
    wrist.position.y = L2;
    elbow.add(wrist);
    wrist.add(this.rbox(0.2, 0.18, 0.2, this.servo));
    wrist.add(this.horn(0.09, 0.26, this.shell));
    wrist.add(this.rbox(0.11, L3, 0.14, this.shell, 0, L3 / 2, 0));

    const roll = new THREE.Group();
    roll.position.y = L3;
    wrist.add(roll);
    roll.add(this.mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.1, 32), this.servo, 0, 0.05, 0));
    roll.add(this.rbox(0.24, 0.1, 0.16, this.shell, 0, 0.15, 0));
    // Fixed jaw.
    roll.add(this.rbox(0.05, JAW, 0.1, this.shell, -0.08, 0.2 + JAW / 2, 0));
    roll.add(this.rbox(0.05, 0.05, 0.1, this.accent, -0.08, 0.2 + JAW - 0.025, 0, 0.012));
    // Moving jaw, hinged at the palm.
    this.jaw.position.set(0.08, 0.2, 0);
    roll.add(this.jaw);
    this.jaw.add(this.rbox(0.05, JAW, 0.1, this.shell, 0, JAW / 2, 0));
    this.jaw.add(this.rbox(0.05, 0.05, 0.1, this.accent, 0, JAW - 0.025, 0, 0.012));

    this.tool.position.set(0, 0.2 + JAW * 0.65, 0);
    roll.add(this.tool);

    this.joints = [yaw, shoulder, elbow, wrist, roll];
  }

  /* ── kinematics ───────────────────────────────────────────────────── */

  private static tmp = new THREE.Vector3();

  /**
   * Point the tool at a world-space target. `toolPitch` is the absolute
   * pitch of the gripper measured from vertical (π/2 = level, pointing
   * outward); left undefined it is chosen from the target height so low
   * targets are approached from above and high ones from below.
   */
  solve(target: THREE.Vector3, toolPitch?: number, roll = 0) {
    const p = Arm.tmp.copy(target);
    this.root.worldToLocal(p);
    p.y -= ARM.SHOULDER_Y;

    const yaw = Math.atan2(p.x, p.z);
    let r = Math.hypot(p.x, p.z);
    let h = p.y;

    // Keep the tool point inside the reachable shell.
    const rho = Math.hypot(r, h);
    const maxRho = REACH * 0.985;
    if (rho > maxRho) {
      r *= maxRho / rho;
      h *= maxRho / rho;
    }

    let aT = toolPitch;
    if (aT === undefined) {
      const radial = Math.atan2(r, h);
      // Level by default; tip down toward low targets, up toward high ones.
      aT = Math.PI / 2 + 0.55 * (radial - Math.PI / 2);
      aT = THREE.MathUtils.clamp(aT, 0.6, 2.4);
    }

    // Back the wrist pivot off along the tool axis.
    const wr = r - TOOL_LEN * Math.sin(aT);
    const wh = h - TOOL_LEN * Math.cos(aT);
    let d = Math.hypot(wr, wh);
    const { L1, L2 } = ARM;
    const dMax = (L1 + L2) * 0.995;
    const dMin = Math.abs(L1 - L2) + 0.05;
    d = THREE.MathUtils.clamp(d, dMin, dMax);

    const cosE = (d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2);
    const elbow = Math.acos(THREE.MathUtils.clamp(cosE, -1, 1));
    const shoulder = Math.atan2(wr, wh) - Math.atan2(L2 * Math.sin(elbow), L1 + L2 * Math.cos(elbow));
    const wrist = aT - (shoulder + elbow);

    const g = this.goal;
    g[0] = THREE.MathUtils.clamp(yaw, LIMITS[0][0], LIMITS[0][1]);
    g[1] = THREE.MathUtils.clamp(shoulder, LIMITS[1][0], LIMITS[1][1]);
    g[2] = THREE.MathUtils.clamp(elbow, LIMITS[2][0], LIMITS[2][1]);
    g[3] = THREE.MathUtils.clamp(wrist, LIMITS[3][0], LIMITS[3][1]);
    g[4] = THREE.MathUtils.clamp(roll, LIMITS[4][0], LIMITS[4][1]);
  }

  /** Advance the servos. With `snap`, joints go straight to goal (reduced motion). */
  update(dt: number, snap = false) {
    const { w, z, vmax } = SERVO;
    for (let i = 0; i < 5; i++) {
      if (snap) {
        this.angles[i] += (this.goal[i] - this.angles[i]) * Math.min(1, dt * 6);
        continue;
      }
      const x = this.goal[i] - this.angles[i];
      this.vel[i] += (w * w * x - 2 * z * w * this.vel[i]) * dt;
      this.vel[i] = THREE.MathUtils.clamp(this.vel[i], -vmax, vmax);
      this.angles[i] += this.vel[i] * dt;
    }
    const gx = this.gripGoal - this.grip;
    this.gripVel += (14 * 14 * gx - 2 * 0.85 * 14 * this.gripVel) * dt;
    this.gripVel = THREE.MathUtils.clamp(this.gripVel, -6, 6);
    this.grip = THREE.MathUtils.clamp(this.grip + this.gripVel * dt, 0, 1);
    this.apply();
  }

  private apply() {
    const [yaw, shoulder, elbow, wrist, roll] = this.joints;
    const a = this.angles;
    yaw.rotation.y = a[0];
    shoulder.rotation.x = a[1];
    elbow.rotation.x = a[2];
    wrist.rotation.x = a[3];
    roll.rotation.y = a[4];
    this.jaw.rotation.z = -this.grip * 0.55;
  }

  /** World position of the point between the jaws. */
  toolPosition(out: THREE.Vector3) {
    return this.tool.getWorldPosition(out);
  }

  dispose() {
    for (const g of this.geometries) g.dispose();
    this.shell.dispose();
    this.servo.dispose();
    this.accent.dispose();
  }
}
