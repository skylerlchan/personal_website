import * as THREE from "three";
import { Arm, REACH } from "./Arm";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { makeProp, type Palette, type Prop, type PropKind } from "./props";

/**
 * The workbench. One arm, one floor, one camera, and a state machine that
 * decides where the arm's tool point should be at any moment:
 *
 *   present   — hold the current prop at a fixed screen anchor
 *   track     — nothing held; follow the pointer, wander when idle
 *   handshake — reach toward the viewer, jaws open
 *
 * When the stage changes, the arm dips to a tray beside the base, the old
 * prop shrinks away, the new one grows between the jaws, and the arm rises
 * to the anchor again. Pointer contact overrides all of that: a touch drags
 * the tool point to the finger, and the arm returns once the finger lifts.
 */

export type Pose = "present" | "track" | "handshake";
export type StageDef = { prop: PropKind | null; pose: Pose; /** A tap toggles the gripper. */ grab?: boolean };
export type Telemetry = { joints: number[]; grip: number; fps: number; target: string };

type Phase = "idle" | "stow" | "swap" | "rise";

const LIGHT: Palette = {
  ink: new THREE.Color("#141414"),
  paper: new THREE.Color("#ffffff"),
  shell: new THREE.Color("#f3f1ec"),
  servo: new THREE.Color("#151515"),
  accent: new THREE.Color("#ff5a1f"),
  dark: false,
};
const DARK: Palette = {
  ink: new THREE.Color("#e8e8e8"),
  paper: new THREE.Color("#1a1a1a"),
  shell: new THREE.Color("#e9e6df"),
  servo: new THREE.Color("#2a2a2a"),
  accent: new THREE.Color("#ff6a30"),
  dark: true,
};
const BG = { light: new THREE.Color("#f5f4f0"), dark: new THREE.Color("#0a0a0a") };

const GRID_VS = /* glsl */ `
varying vec3 vW;
void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const GRID_FS = /* glsl */ `
precision highp float;
uniform vec3 uColor; uniform float uAlpha; uniform float uFade;
varying vec3 vW;
float line(vec2 p, float s){ vec2 g = abs(fract(p / s - 0.5) - 0.5) / fwidth(p / s); return 1.0 - min(min(g.x, g.y), 1.0); }
void main(){
  float minor = line(vW.xz, 0.5) * 0.45;
  float major = line(vW.xz, 2.0);
  float d = length(vW.xz);
  float fade = 1.0 - smoothstep(uFade * 0.35, uFade, d);
  float a = max(minor, major) * fade * uAlpha;
  gl_FragColor = vec4(uColor, a);
}`;

export class ArmWorld {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  private arm: Arm;
  private prop: Prop | null = null;
  private leaving: Prop | null = null;
  private palette: Palette = LIGHT;
  private timer = new THREE.Timer();
  private raycaster = new THREE.Raycaster();
  private plane = new THREE.Plane();
  private key: THREE.DirectionalLight;
  private hemi: THREE.HemisphereLight;
  private shadowMat: THREE.ShadowMaterial;
  private gridMat: THREE.ShaderMaterial;
  private observer: MutationObserver;
  private ro: ResizeObserver;
  private disposed = false;

  // Framing.
  private portrait = false;
  private look = new THREE.Vector3(0, 1.2, 0);
  private orbit = { dist: 6.4, elev: 0.3, azim: 0.62 };
  private parallax = new THREE.Vector2();
  private parallaxGoal = new THREE.Vector2();

  // Stage.
  private stage: StageDef = { prop: null, pose: "track" };
  private pending: StageDef | null = null;
  private phase: Phase = "idle";
  private phaseT = 0;
  private propScale = 0;
  private propScaleGoal = 0;
  private wave = 2.2; // seconds of hello left at start

  // Targeting.
  private target = new THREE.Vector3(0, 1.6, 1.2);
  private goal = new THREE.Vector3(0, 1.6, 1.2);
  private pointer = new THREE.Vector2(0, 0);
  private pointerWorld = new THREE.Vector3();
  private pointerValid = false;
  private pointerDown = false;
  private pointerIsMouse = false;
  private release = 0; // seconds since the finger lifted
  private tapGrip = false;
  private reduced = false;

  private fpsAcc = 0;
  private fpsN = 0;
  private fps = 60;
  private telemetryT = 0;
  private tmp = new THREE.Vector3();
  private tmp2 = new THREE.Vector3();

  constructor(
    private canvas: HTMLCanvasElement,
    private opts: { onTelemetry?: (t: Telemetry) => void; onReady?: () => void } = {},
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    const r = this.renderer;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;

    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // A neutral room reflected faintly in the shells, so white plastic has
    // some sheen instead of reading as chalk.
    const pmrem = new THREE.PMREMGenerator(r);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.4;
    pmrem.dispose();

    // Lights: a soft sky, one shadowing key from high front-left, a fill
    // from the camera side so the servos keep some form in the dark.
    this.hemi = new THREE.HemisphereLight(0xffffff, 0xd8d6d0, 0.9);
    this.scene.add(this.hemi);
    this.key = new THREE.DirectionalLight(0xffffff, 2.2);
    this.key.position.set(-2.5, 7, 3.5);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(1536, 1536);
    this.key.shadow.camera.near = 1;
    this.key.shadow.camera.far = 20;
    const s = 4.5;
    this.key.shadow.camera.left = -s;
    this.key.shadow.camera.right = s;
    this.key.shadow.camera.top = s;
    this.key.shadow.camera.bottom = -s;
    this.key.shadow.bias = -0.0004;
    this.key.shadow.normalBias = 0.02;
    this.key.shadow.radius = 4;
    this.scene.add(this.key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.55);
    fill.position.set(4, 2, 5);
    this.scene.add(fill);

    // Floor: shadow catcher plus an engineering grid that fades out.
    this.shadowMat = new THREE.ShadowMaterial({ opacity: 0.2 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), this.shadowMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.gridMat = new THREE.ShaderMaterial({
      vertexShader: GRID_VS,
      fragmentShader: GRID_FS,
      uniforms: { uColor: { value: new THREE.Color("#000") }, uAlpha: { value: 0.16 }, uFade: { value: 9 } },
      transparent: true,
      depthWrite: false,
    });
    const grid = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), this.gridMat);
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = 0.001;
    this.scene.add(grid);

    this.arm = new Arm(LIGHT);
    this.scene.add(this.arm.root);

    this.applyTheme(document.documentElement.classList.contains("dark"));
    this.observer = new MutationObserver(() => this.applyTheme(document.documentElement.classList.contains("dark")));
    this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.resize();

    window.addEventListener("pointermove", this.onMove, { passive: true });
    window.addEventListener("pointerdown", this.onDown, { passive: true });
    window.addEventListener("pointerup", this.onUp, { passive: true });
    window.addEventListener("pointercancel", this.onUp, { passive: true });
    window.addEventListener("deviceorientation", this.onTilt, { passive: true });

    r.setAnimationLoop(this.frame);
  }

  /* ── public ───────────────────────────────────────────────────────── */

  setStage(def: StageDef) {
    if (def.prop === this.stage.prop && def.pose === this.stage.pose && !!def.grab === !!this.stage.grab) return;
    this.pending = def;
    if (this.phase === "idle" || this.phase === "rise") {
      this.phase = "stow";
      this.phaseT = 0;
    }
  }

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    window.removeEventListener("pointermove", this.onMove);
    window.removeEventListener("pointerdown", this.onDown);
    window.removeEventListener("pointerup", this.onUp);
    window.removeEventListener("pointercancel", this.onUp);
    window.removeEventListener("deviceorientation", this.onTilt);
    this.observer.disconnect();
    this.ro.disconnect();
    this.prop?.dispose();
    this.leaving?.dispose();
    this.arm.dispose();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const m = o.material as THREE.Material | THREE.Material[];
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m.dispose();
      }
    });
    this.renderer.dispose();
  }

  /* ── theme & framing ─────────────────────────────────────────────── */

  private applyTheme(dark: boolean) {
    this.palette = dark ? DARK : LIGHT;
    const bg = dark ? BG.dark : BG.light;
    this.scene.background = bg;
    this.scene.fog = new THREE.Fog(bg, 7, 16);
    this.hemi.groundColor.set(dark ? "#1a1a1a" : "#d8d6d0");
    this.hemi.intensity = dark ? 0.55 : 0.9;
    this.key.intensity = dark ? 2.6 : 2.2;
    this.shadowMat.opacity = dark ? 0.5 : 0.2;
    this.gridMat.uniforms.uColor.value.set(dark ? "#ffffff" : "#000000");
    this.gridMat.uniforms.uAlpha.value = dark ? 0.13 : 0.16;
    this.arm.setColors(this.palette);
    this.prop?.retint(this.palette);
    this.leaving?.retint(this.palette);
  }

  private resize() {
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.portrait = w / h < 1;
    // A screen's centre always maps to the camera axis, so an arm whose base
    // sits mid-screen can only reach straight at the viewer — foreshortened
    // to a blob. The base is pushed off-centre instead, and the arm sweeps
    // diagonally across the frame to its anchor: lower-left to upper-right
    // on a phone, lower-right to upper-right on a wide screen.
    if (this.portrait) {
      this.camera.fov = 46;
      this.orbit = { dist: 5.4, elev: 0.22, azim: 0.62 };
      this.planeOffset = 1.15;
      this.lookOffset(0.62, 1.05);
    } else {
      this.camera.fov = 30;
      this.orbit = { dist: 7.0, elev: 0.27, azim: 0.62 };
      this.planeOffset = 1.5;
      this.lookOffset(-1.7, 1.1);
    }
    this.camera.updateProjectionMatrix();
  }

  private planeOffset = 1.7;

  /** Look `right` units to the camera's right of the base, at height `y`. */
  private lookOffset(right: number, y: number) {
    const a = this.orbit.azim;
    this.look.set(right * Math.cos(a), y, -right * Math.sin(a));
  }

  private placeCamera() {
    const { dist, elev, azim } = this.orbit;
    const e = elev + this.parallax.y * 0.06;
    const a = azim + this.parallax.x * 0.09;
    this.camera.position.set(
      this.look.x + dist * Math.cos(e) * Math.sin(a),
      this.look.y + dist * Math.sin(e),
      this.look.z + dist * Math.cos(e) * Math.cos(a),
    );
    this.camera.lookAt(this.look);
    // The target plane faces the camera and passes well in front of the base,
    // so a screen point maps to a spot the arm has to extend for — an arm
    // that reaches reads as an arm; one that hovers over its own base folds
    // up like a lamp.
    const n = this.tmp.copy(this.camera.position).setY(0).normalize();
    const p = this.tmp2.copy(n).multiplyScalar(this.planeOffset);
    this.plane.setFromNormalAndCoplanarPoint(n, p);
  }

  /** Screen (NDC) → a point on the target plane, clamped into reach. */
  private project(ndcX: number, ndcY: number, out: THREE.Vector3) {
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    if (!this.raycaster.ray.intersectPlane(this.plane, out)) out.set(0, 1.5, 1);
    out.y = Math.max(0.3, out.y);
    const sh = this.tmp.set(0, 0.64, 0);
    const d = out.distanceTo(sh);
    const max = REACH * 0.93;
    if (d > max) out.sub(sh).multiplyScalar(max / d).add(sh);
    return out;
  }

  private anchor(out: THREE.Vector3) {
    return this.portrait ? this.project(0.3, 0.27, out) : this.project(0.1, 0.18, out);
  }

  /* ── input ────────────────────────────────────────────────────────── */

  private toNdc(e: PointerEvent) {
    this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  }
  private onMove = (e: PointerEvent) => {
    this.pointerIsMouse = e.pointerType === "mouse";
    if (e.pointerType !== "mouse" && !this.pointerDown) return;
    this.toNdc(e);
    this.pointerValid = true;
    this.parallaxGoal.set(this.pointer.x, this.pointer.y);
  };
  private downAt = { x: 0, y: 0, t: 0 };
  private onDown = (e: PointerEvent) => {
    // Let real controls keep their taps.
    if ((e.target as HTMLElement | null)?.closest("a, button, input, textarea, select, label")) return;
    this.pointerIsMouse = e.pointerType === "mouse";
    this.toNdc(e);
    this.pointerValid = true;
    this.pointerDown = true;
    this.release = 0;
    this.wave = 0;
    this.downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
  };
  private onUp = (e: PointerEvent) => {
    if (!this.pointerDown) return;
    this.pointerDown = false;
    // A tap is a short, still press. The start of a scroll is neither, and
    // must not toggle the gripper or wake the piano.
    if (e.type !== "pointerup") return;
    const moved = Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y);
    if (moved < 12 && performance.now() - this.downAt.t < 450) this.tap();
  };
  private tap() {
    if (this.stage.grab) this.tapGrip = !this.tapGrip;
    this.prop?.tap?.();
  }
  private onTilt = (e: DeviceOrientationEvent) => {
    if (e.gamma == null || e.beta == null) return;
    this.parallaxGoal.set(THREE.MathUtils.clamp(e.gamma / 30, -1, 1), THREE.MathUtils.clamp((e.beta - 45) / 40, -1, 1));
  };

  /* ── frame ────────────────────────────────────────────────────────── */

  private frame = () => {
    if (this.disposed) return;
    this.timer.update();
    const dt = Math.min(this.timer.getDelta(), 0.05);
    const t = this.timer.getElapsed();

    this.parallax.lerp(this.parallaxGoal, Math.min(1, dt * 3));
    this.placeCamera();

    // Choreography.
    this.phaseT += dt;
    if (this.phase === "stow") {
      this.propScaleGoal = 0;
      if (this.phaseT > 0.55 || !this.prop) {
        this.phase = "swap";
        this.phaseT = 0;
        if (this.leaving) this.discard(this.leaving);
        this.leaving = this.prop;
        this.prop = null;
        this.propScale = 0;
        this.stage = this.pending ?? this.stage;
        this.pending = null;
        if (this.stage.prop) {
          this.prop = makeProp(this.stage.prop, this.palette);
          this.prop.group.scale.setScalar(0.001);
          this.scene.add(this.prop.group);
          this.arm.gripGoal = this.prop.grip;
        }
      }
    } else if (this.phase === "swap") {
      this.propScaleGoal = this.portrait ? 0.8 : 0.95;
      if (this.phaseT > 0.35) {
        this.phase = "rise";
        this.phaseT = 0;
      }
    } else if (this.phase === "rise") {
      if (this.pending) {
        this.phase = "stow";
        this.phaseT = 0;
      } else if (this.phaseT > 0.6) this.phase = "idle";
    }

    // Where should the tool point be?
    const pose = this.stage.pose;
    const wander = this.reduced ? 0 : 1;
    if (this.phase === "stow" || this.phase === "swap") {
      // The tray: front-right of the base, low.
      this.goal.set(1.15, 0.5, 1.05);
    } else if (this.pointerValid && (this.pointerDown || this.pointerIsMouse || this.release < 1.2)) {
      this.project(this.pointer.x, this.pointer.y, this.pointerWorld);
      if (this.pointerDown || pose === "track" || !this.pointerIsMouse) {
        this.goal.copy(this.pointerWorld);
      } else {
        // Hover: lean toward the cursor, don't abandon the anchor.
        this.anchor(this.goal).lerp(this.pointerWorld, 0.3);
      }
    } else if (pose === "handshake") {
      // Out past the anchor plane, toward the viewer, at shaking height.
      this.project(this.portrait ? 0.3 : 0.15, this.portrait ? 0.12 : -0.1, this.goal);
      this.goal.add(this.tmp.copy(this.camera.position).setY(0).normalize().multiplyScalar(0.6));
      this.goal.y = 1.35 + 0.03 * Math.sin(t * 1.7) * wander;
    } else if (pose === "track") {
      if (this.wave > 0) {
        // Hello: a couple of sweeps at head height.
        this.wave -= dt;
        this.project(0.35 * Math.sin(t * 5.5), 0.3, this.goal);
      } else {
        this.anchor(this.goal);
        this.goal.x += 0.35 * Math.sin(t * 0.55) * wander;
        this.goal.y += 0.16 * Math.sin(t * 0.83 + 1.2) * wander;
        this.goal.z += 0.2 * Math.sin(t * 0.37 + 0.4) * wander;
      }
    } else {
      this.anchor(this.goal);
      this.goal.x += 0.05 * Math.sin(t * 0.7) * wander;
      this.goal.y += 0.035 * Math.sin(t * 1.1 + 0.8) * wander;
    }
    // A lifted finger keeps the arm for a beat, then it goes back to work.
    if (!this.pointerDown && !this.pointerIsMouse && this.pointerValid) {
      this.release += dt;
      if (this.release > 1.2) this.pointerValid = false;
    }

    this.target.lerp(this.goal, Math.min(1, dt * (this.pointerDown ? 14 : 7)));
    const toolPitch = pose === "handshake" ? Math.PI / 2 - 0.15 : undefined;
    const roll = pose === "handshake" ? Math.PI / 2 : 0;
    this.arm.solve(this.target, toolPitch, roll);

    if (this.prop === null) {
      // Empty-handed: offer at the handshake, hold the toggle in a grab stage,
      // otherwise pinch at whatever finger is pressing the screen.
      this.arm.gripGoal =
        pose === "handshake" ? 0.95 : this.stage.grab ? (this.tapGrip ? 0.02 : 0.45) : this.pointerDown ? 0.05 : 0.45;
    }
    this.arm.update(dt, this.reduced);

    // Props ride the tool point but stay upright, facing the camera.
    this.propScale += (this.propScaleGoal - this.propScale) * Math.min(1, dt * 9);
    if (this.prop) {
      const g = this.prop.group;
      this.arm.toolPosition(g.position);
      g.scale.setScalar(Math.max(0.001, this.propScale));
      const yaw = Math.atan2(this.camera.position.x - g.position.x, this.camera.position.z - g.position.z);
      // One-sided props extend away from the base, whichever side it is on.
      g.rotation.set(0, yaw + (this.prop.sided && !this.portrait ? Math.PI : 0), 0);
      this.prop.update(dt, t);
    }
    if (this.leaving) {
      const g = this.leaving.group;
      this.arm.toolPosition(g.position);
      const s = g.scale.x * (1 - Math.min(1, dt * 11));
      g.scale.setScalar(s);
      if (s < 0.003) {
        this.discard(this.leaving);
        this.leaving = null;
      }
    }

    this.renderer.render(this.scene, this.camera);

    // Telemetry at ~10 Hz.
    this.fpsAcc += dt;
    this.fpsN++;
    this.telemetryT += dt;
    if (this.telemetryT > 0.1) {
      this.telemetryT = 0;
      if (this.fpsAcc > 0) this.fps = Math.round(this.fpsN / this.fpsAcc);
      this.fpsAcc = 0;
      this.fpsN = 0;
      this.opts.onTelemetry?.({
        joints: this.arm.angles.map((a) => (a * 180) / Math.PI),
        grip: this.arm.grip,
        fps: this.fps,
        target: `${this.target.x.toFixed(2)} ${this.target.y.toFixed(2)} ${this.target.z.toFixed(2)}`,
      });
    }
    if (this.opts.onReady) {
      this.opts.onReady();
      this.opts.onReady = undefined;
    }
  };

  private discard(p: Prop) {
    this.scene.remove(p.group);
    p.dispose();
  }
}
