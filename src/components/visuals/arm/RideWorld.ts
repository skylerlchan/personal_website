import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { makeSet, type Palette, type SetKind, type SetPiece } from "./sets";

/**
 * A dark ride. The page's scroll position is the ride vehicle's position on
 * a track that winds past a row of lit platforms — one set piece per section.
 * The show light comes up in that scene's colour as the vehicle approaches,
 * the camera turns its head toward the platform, dwells, then glides on under
 * an archway with chase lights running ahead of it.
 *
 * Interaction, all touch-native:
 *   tap a set piece   → it reacts, and counts toward "found"
 *   hold              → sets that can be steered (the arms) follow the finger
 *   drag sideways     → look around from the vehicle; springs back
 *   tilt (Android)    → the same, from the gyroscope
 *
 * Quality adapts: pixel ratio, bloom and the mirror floor all step down if
 * the frame rate can't hold, so an older phone still gets the ride.
 */

export type SceneDef = { set: SetKind; color: string };
export type Telemetry = { scene: number; readout: string; fps: number; found: number; total: number; quality: string };

const SPACING = 14;
const LATERAL = 3.7;
const AHEAD = 5.9;
const CAM_H = 2.2;
const CHASE_PER_SCENE = 12;

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
const BG = { light: new THREE.Color("#efede8"), dark: new THREE.Color("#050505") };

const GRID_VS = /* glsl */ `
varying vec3 vW;
void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const GRID_FS = /* glsl */ `
precision highp float;
uniform vec3 uColor; uniform float uAlpha; uniform vec3 uEye;
varying vec3 vW;
float line(vec2 p, float s){ vec2 g = abs(fract(p / s - 0.5) - 0.5) / fwidth(p / s); return 1.0 - min(min(g.x, g.y), 1.0); }
void main(){
  float minor = line(vW.xz, 0.5) * 0.4;
  float major = line(vW.xz, 2.0);
  float d = distance(vW.xz, uEye.xz);
  float fade = 1.0 - smoothstep(4.0, 18.0, d);
  gl_FragColor = vec4(uColor, max(minor, major) * fade * uAlpha);
}`;

type Scene = {
  i: number;
  def: SceneDef;
  show: THREE.Color;
  center: THREE.Vector3;
  group: THREE.Group;
  set: SetPiece;
  spot: THREE.SpotLight;
  cone: THREE.Mesh;
  ringMat: THREE.MeshBasicMaterial;
  barMat: THREE.MeshBasicMaterial;
  near: number;
  found: boolean;
  bounce: number;
};

export class RideWorld {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(60, 1, 0.1, 90);
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private palette: Palette = LIGHT;
  private timer = new THREE.Timer();
  private raycaster = new THREE.Raycaster();
  private plane = new THREE.Plane();
  private key: THREE.DirectionalLight;
  private hemi: THREE.HemisphereLight;
  private shadowMat: THREE.ShadowMaterial;
  private gridMat: THREE.ShaderMaterial;
  private platformMat: THREE.MeshStandardMaterial;
  private archMat: THREE.MeshStandardMaterial;
  private trackMat: THREE.MeshBasicMaterial;
  private mirror: Reflector | null = null;
  private floorMat: THREE.MeshStandardMaterial;
  private floor: THREE.Mesh;
  private chase: THREE.InstancedMesh;
  private chaseColor: THREE.Color[] = [];
  private motes: THREE.Points;
  private moteMat: THREE.PointsMaterial;
  private observer: MutationObserver;
  private ro: ResizeObserver;
  private disposed = false;

  private curve: THREE.CatmullRomCurve3;
  private scenes: Scene[] = [];
  private N: number;
  private portrait = false;
  private reduced = false;

  // Quality ladder: 3 = everything, 0 = bare.
  private quality = 3;
  private locked = false;
  private slowFrames = 0;
  private qualityT = 0;
  private dprCap = 2;

  // Vehicle.
  private s = 0;
  private sGoal = 0;
  private sVel = 0;
  private lastYaw = 0;
  private bank = 0;
  private lookDir = new THREE.Vector3(0, 0, -1);
  private headYaw = 0;
  private headYawGoal = 0;
  private headPitch = 0;
  private headPitchGoal = 0;
  private houseLights = 0;

  // Input.
  private pointer = new THREE.Vector2();
  private pointerDown = false;
  private pointerIsMouse = false;
  private dragging = false;
  private downAt = { x: 0, y: 0, t: 0, yaw: 0, pitch: 0 };
  private pointerWorld = new THREE.Vector3();

  private fpsAcc = 0;
  private fpsN = 0;
  private fps = 60;
  private telemetryT = 0;
  private tmp = new THREE.Vector3();
  private tmpC = new THREE.Color();
  private ndc = new THREE.Vector2();
  private vAhead = new THREE.Vector3();
  private vLook = new THREE.Vector3();
  private vSceneLook = new THREE.Vector3();
  private vDir = new THREE.Vector3();
  private static UP = new THREE.Vector3(0, 1, 0);

  constructor(
    private canvas: HTMLCanvasElement,
    defs: SceneDef[],
    private opts: { onTelemetry?: (t: Telemetry) => void; onReady?: () => void } = {},
  ) {
    this.N = defs.length;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
    const r = this.renderer;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Phones start one rung down: no mirror, and the pixel ratio capped.
    // `?q=0..3` pins a rung, for checking a device by hand.
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    this.dprCap = coarse ? 1.5 : 2;
    this.quality = coarse ? 2 : 3;
    const q = new URLSearchParams(window.location.search).get("q");
    if (q !== null && /^[0-3]$/.test(q)) {
      this.quality = Number(q);
      this.locked = true;
    }

    const pmrem = new THREE.PMREMGenerator(r);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.3;
    pmrem.dispose();

    /* ── post ── */
    this.composer = new EffectComposer(r, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }));
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.45, 0.5, 0.9);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    /* ── lights ── */
    this.hemi = new THREE.HemisphereLight(0xffffff, 0xd8d6d0, 0.8);
    this.scene.add(this.hemi);
    this.key = new THREE.DirectionalLight(0xffffff, 1.8);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(1024, 1024);
    this.key.shadow.camera.near = 1;
    this.key.shadow.camera.far = 30;
    const sz = 7;
    this.key.shadow.camera.left = -sz;
    this.key.shadow.camera.right = sz;
    this.key.shadow.camera.top = sz;
    this.key.shadow.camera.bottom = -sz;
    this.key.shadow.bias = -0.0005;
    this.key.shadow.normalBias = 0.03;
    this.key.shadow.radius = 3;
    this.scene.add(this.key, this.key.target);

    /* ── floor: a mirror where we can afford it, gloss where we can't ── */
    this.floorMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.35, metalness: 0.6 });
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), this.floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -0.02;
    this.scene.add(this.floor);
    this.shadowMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), this.shadowMat);
    shadowCatcher.rotation.x = -Math.PI / 2;
    shadowCatcher.receiveShadow = true;
    this.scene.add(shadowCatcher);
    this.gridMat = new THREE.ShaderMaterial({
      vertexShader: GRID_VS,
      fragmentShader: GRID_FS,
      uniforms: { uColor: { value: new THREE.Color("#fff") }, uAlpha: { value: 0.1 }, uEye: { value: new THREE.Vector3() } },
      transparent: true,
      depthWrite: false,
    });
    const grid = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), this.gridMat);
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = 0.003;
    this.scene.add(grid);

    /* ── track ── */
    const pts: THREE.Vector3[] = [];
    for (let i = -1; i <= this.N; i++) pts.push(new THREE.Vector3(2.4 * Math.sin(i * 1.15) + 0.6 * Math.sin(i * 2.3), 0, -i * SPACING));
    this.curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
    this.trackMat = new THREE.MeshBasicMaterial({ color: 0x5a5a5a });
    // Two rails: offset copies of the centreline curve.
    for (const off of [-0.42, 0.42]) {
      const railPts = pts.map((p, k) => {
        const t = this.t(k - 1);
        const tan = this.curve.getTangent(t).setY(0).normalize();
        return new THREE.Vector3(p.x - tan.z * off, 0.03, p.z + tan.x * off);
      });
      const railCurve = new THREE.CatmullRomCurve3(railPts, false, "centripetal");
      this.scene.add(new THREE.Mesh(new THREE.TubeGeometry(railCurve, 50 * this.N, 0.035, 6, false), this.trackMat));
    }
    const ties = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, 0.02, 0.1), this.trackMat, this.N * 16);
    const m4 = new THREE.Matrix4();
    for (let k = 0; k < this.N * 16; k++) {
      const t = this.t(k / 16 - 1);
      const p = this.curve.getPoint(t);
      const tan = this.curve.getTangent(t);
      m4.makeRotationY(Math.atan2(tan.x, tan.z));
      m4.setPosition(p.x, 0.012, p.z);
      ties.setMatrixAt(k, m4);
    }
    this.scene.add(ties);

    /* ── chase lights along both sides of the track ── */
    const chaseN = (this.N + 1) * CHASE_PER_SCENE * 2;
    this.chase = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), chaseN);
    for (let k = 0; k < chaseN; k++) {
      const seg = Math.floor(k / 2);
      const t = this.t(seg / CHASE_PER_SCENE - 1);
      const p = this.curve.getPoint(t);
      const tan = this.curve.getTangent(t).setY(0).normalize();
      const side = k % 2 === 0 ? -1 : 1;
      m4.identity();
      m4.setPosition(p.x - tan.z * side * 0.75, 0.06, p.z + tan.x * side * 0.75);
      this.chase.setMatrixAt(k, m4);
      const sceneIdx = THREE.MathUtils.clamp(Math.round(seg / CHASE_PER_SCENE - 1), 0, this.N - 1);
      this.chaseColor.push(new THREE.Color(defs[sceneIdx].color));
      this.chase.setColorAt(k, this.chaseColor[k]);
    }
    this.scene.add(this.chase);

    /* ── shared materials ── */
    this.platformMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.7, metalness: 0.2 });
    this.archMat = new THREE.MeshStandardMaterial({ color: 0x242424, roughness: 0.6 });

    /* ── archways between scenes ── */
    const archGeo = new THREE.TorusGeometry(2.6, 0.08, 10, 48, Math.PI);
    const lampGeo = new THREE.SphereGeometry(0.08, 12, 8);
    for (let i = 0; i < this.N - 1; i++) {
      const t = this.t(i + 0.5);
      const p = this.curve.getPoint(t);
      const tan = this.curve.getTangent(t);
      const arch = new THREE.Mesh(archGeo, this.archMat);
      arch.position.set(p.x, 0, p.z);
      arch.rotation.y = Math.atan2(tan.x, tan.z);
      arch.castShadow = true;
      this.scene.add(arch);
      const lamp = new THREE.Mesh(lampGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(defs[i + 1].color).multiplyScalar(2.5), toneMapped: false }));
      lamp.position.set(p.x, 2.6, p.z);
      this.scene.add(lamp);
    }

    /* ── scenes ── */
    const platGeo = new THREE.CylinderGeometry(2.7, 2.85, 0.16, 64);
    const ringGeo = new THREE.TorusGeometry(2.72, 0.02, 6, 128);
    const coneGeo = new THREE.ConeGeometry(3.0, 8, 32, 1, true);
    const barGeo = new THREE.BoxGeometry(0.05, 4.2, 0.05);
    defs.forEach((def, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      const show = new THREE.Color(def.color);
      const t = this.t(i);
      const dwell = this.curve.getPoint(t);
      const along = this.curve.getTangent(t).setY(0).normalize();
      const right = new THREE.Vector3().crossVectors(along, RideWorld.UP).normalize();
      const center = dwell.clone().addScaledVector(along, AHEAD).addScaledVector(right, side * LATERAL);
      center.y = 0;
      const f = dwell.clone().sub(center).setY(0).normalize();

      const group = new THREE.Group();
      group.position.copy(center);
      group.rotation.y = Math.atan2(f.x, f.z);
      this.scene.add(group);

      const plat = new THREE.Mesh(platGeo, this.platformMat);
      plat.position.y = 0.08;
      plat.receiveShadow = true;
      plat.castShadow = true;
      group.add(plat);
      const ringMat = new THREE.MeshBasicMaterial({ color: show.clone().multiplyScalar(2.5), toneMapped: false, transparent: true, opacity: 1 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.165;
      group.add(ring);

      // Light bars behind the platform: a theatre's back wall.
      const barMat = new THREE.MeshBasicMaterial({ color: show.clone().multiplyScalar(1.8), toneMapped: false, transparent: true, opacity: 1 });
      for (let b = -2; b <= 2; b++) {
        const bar = new THREE.Mesh(barGeo, barMat);
        bar.position.set(b * 1.1, 2.1, -3.2 - Math.abs(b) * 0.25);
        group.add(bar);
      }

      const spot = new THREE.SpotLight(show, 0, 18, 0.52, 0.75, 1.5);
      spot.position.set(0, 8, 1.2);
      spot.target.position.set(0, 0, 0);
      group.add(spot, spot.target);
      const coneMat = new THREE.MeshBasicMaterial({
        color: show,
        transparent: true,
        opacity: 0.05,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(0, 4.05, 0.6);
      cone.rotation.x = Math.PI;
      group.add(cone);

      const set = makeSet(def.set, LIGHT, show);
      group.add(set.group);
      set.group.scale.setScalar(this.portraitScale());

      this.scenes.push({ i, def, show, center, group, set, spot, cone, ringMat, barMat, near: 0, found: false, bounce: 0 });
    });

    /* ── dust in the beams ── */
    const M = 160 * this.N;
    const mp = new Float32Array(M * 3);
    const len = SPACING * (this.N + 1);
    for (let k = 0; k < M; k++) {
      mp[k * 3] = (Math.random() - 0.5) * 16;
      mp[k * 3 + 1] = Math.random() * 7;
      mp[k * 3 + 2] = -Math.random() * len + SPACING;
    }
    const mg = new THREE.BufferGeometry();
    mg.setAttribute("position", new THREE.BufferAttribute(mp, 3));
    this.moteMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.035, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
    this.motes = new THREE.Points(mg, this.moteMat);
    this.scene.add(this.motes);

    this.applyTheme(document.documentElement.classList.contains("dark"));
    this.observer = new MutationObserver(() => this.applyTheme(document.documentElement.classList.contains("dark")));
    this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.applyQuality();

    window.addEventListener("pointermove", this.onMove, { passive: true });
    window.addEventListener("pointerdown", this.onDown, { passive: true });
    window.addEventListener("pointerup", this.onUp, { passive: true });
    window.addEventListener("pointercancel", this.onUp, { passive: true });
    window.addEventListener("deviceorientation", this.onTilt, { passive: true });

    this.sGoal = this.s = this.readScroll();
    r.setAnimationLoop(this.frame);
    // Reachable from devtools: `__ride.tap()`, `__ride.scenes[2].set.poke()`.
    (window as unknown as { __ride?: RideWorld }).__ride = this;
  }

  private t(i: number) {
    return (i + 1) / (this.N + 1);
  }

  /** Phones see the platforms from the same distance, so the sets shrink a little to fit. */
  private portraitScale() {
    return this.portrait ? 0.82 : 1;
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
    for (const sc of this.scenes) sc.set.dispose();
    this.mirror?.dispose();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Points) {
        o.geometry.dispose();
        const m = o.material as THREE.Material | THREE.Material[];
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m.dispose();
      }
    });
    this.composer.dispose();
    this.renderer.dispose();
  }

  /* ── quality ─────────────────────────────────────────────────────── */

  private applyQuality() {
    const q = this.quality;
    const wantMirror = q >= 3;
    if (wantMirror && !this.mirror) {
      this.mirror = new Reflector(new THREE.PlaneGeometry(400, 400), { clipBias: 0.003, textureWidth: 768, textureHeight: 768, color: 0x2a2a2a });
      this.mirror.rotation.x = -Math.PI / 2;
      this.mirror.position.y = -0.01;
      this.scene.add(this.mirror);
    } else if (!wantMirror && this.mirror) {
      this.scene.remove(this.mirror);
      this.mirror.dispose();
      this.mirror = null;
    }
    this.floor.visible = !wantMirror;
    this.bloom.enabled = q >= 1;
    this.bloom.strength = q >= 2 ? 0.45 : 0.3;
    this.renderer.shadowMap.enabled = q >= 1;
    this.key.castShadow = q >= 1;
    this.resize();
  }

  private stepDown() {
    if (this.quality === 0 || this.locked) return;
    this.quality--;
    this.dprCap = Math.max(1, this.dprCap - 0.5);
    this.applyQuality();
  }

  /* ── theme & framing ─────────────────────────────────────────────── */

  private applyTheme(dark: boolean) {
    this.palette = dark ? DARK : LIGHT;
    const bg = dark ? BG.dark : BG.light;
    this.scene.background = bg;
    this.scene.fog = new THREE.Fog(bg, dark ? 6 : 10, dark ? 30 : 46);
    this.hemi.groundColor.set(dark ? "#0a0a0a" : "#d8d6d0");
    this.hemi.intensity = dark ? 0.1 : 0.8;
    this.key.intensity = dark ? 0.45 : 1.6;
    this.shadowMat.opacity = dark ? 0.5 : 0.2;
    this.gridMat.uniforms.uColor.value.set(dark ? "#ffffff" : "#000000");
    this.gridMat.uniforms.uAlpha.value = dark ? 0.09 : 0.12;
    this.platformMat.color.set(dark ? "#141414" : "#e3e1db");
    this.archMat.color.set(dark ? "#242424" : "#f0eee9");
    this.trackMat.color.set(dark ? "#5a5a5a" : "#b8b6b0");
    this.floorMat.color.set(dark ? "#0a0a0a" : "#e6e4df");
    this.floorMat.metalness = dark ? 0.6 : 0.1;
    this.moteMat.opacity = dark ? 0.35 : 0.0;
    this.bloom.threshold = dark ? 0.9 : 0.97;
    for (const sc of this.scenes) {
      sc.set.retint(this.palette, sc.show);
      sc.cone.visible = dark;
    }
  }

  private resize() {
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    const dpr = Math.min(window.devicePixelRatio || 1, this.dprCap);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
    this.bloom.resolution.set(Math.round(w * dpr * 0.5), Math.round(h * dpr * 0.5));
    this.camera.aspect = w / h;
    this.portrait = w / h < 1;
    this.camera.fov = this.portrait ? 68 : 54;
    this.camera.updateProjectionMatrix();
    for (const sc of this.scenes) sc.set.group.scale.setScalar(this.portraitScale());
  }

  /* ── input ────────────────────────────────────────────────────────── */

  private toNdc(e: PointerEvent) {
    this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  }
  private onMove = (e: PointerEvent) => {
    this.pointerIsMouse = e.pointerType === "mouse";
    if (this.pointerDown) {
      const dx = e.clientX - this.downAt.x;
      const dy = e.clientY - this.downAt.y;
      if (this.dragging || (Math.abs(dx) > 18 && Math.abs(dx) > Math.abs(dy) * 1.2)) {
        this.dragging = true;
        this.headYawGoal = THREE.MathUtils.clamp(this.downAt.yaw - (dx / window.innerWidth) * 1.6, -0.9, 0.9);
        this.headPitchGoal = THREE.MathUtils.clamp(this.downAt.pitch - (dy / window.innerHeight) * 0.5, -0.3, 0.3);
        return;
      }
    } else if (!this.pointerIsMouse) return;
    this.toNdc(e);
    if (this.pointerIsMouse && !this.pointerDown) {
      this.headYawGoal = -this.pointer.x * 0.1;
      this.headPitchGoal = this.pointer.y * 0.04;
    }
  };
  private onDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement | null)?.closest("a, button, input, textarea, select, label")) return;
    this.pointerIsMouse = e.pointerType === "mouse";
    this.toNdc(e);
    this.pointerDown = true;
    this.dragging = false;
    this.downAt = { x: e.clientX, y: e.clientY, t: performance.now(), yaw: this.headYawGoal, pitch: this.headPitchGoal };
  };
  private onUp = (e: PointerEvent) => {
    if (!this.pointerDown) return;
    this.pointerDown = false;
    const wasDrag = this.dragging;
    this.dragging = false;
    this.nearest().set.steer?.(null);
    if (!this.pointerIsMouse || wasDrag) {
      this.headYawGoal = 0;
      this.headPitchGoal = 0;
    }
    if (e.type !== "pointerup" || wasDrag) return;
    const moved = Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y);
    if (moved < 12 && performance.now() - this.downAt.t < 450) this.tap();
  };
  private onTilt = (e: DeviceOrientationEvent) => {
    if (e.gamma == null || this.pointerDown) return;
    this.headYawGoal = THREE.MathUtils.clamp(-e.gamma / 45, -0.5, 0.5);
  };

  private tap() {
    const sc = this.nearest();
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(sc.set.targets, true);
    if (hits.length) {
      sc.found = true;
      sc.bounce = 1;
      sc.set.poke();
    }
  }

  private nearest() {
    return this.scenes[THREE.MathUtils.clamp(Math.round(this.s), 0, this.N - 1)];
  }

  private readScroll() {
    const el = document.scrollingElement ?? document.documentElement;
    const max = el.scrollHeight - window.innerHeight;
    const u = max > 0 ? THREE.MathUtils.clamp(el.scrollTop / max, 0, 1) : 0;
    // Dwell at each scene: ease within every segment so the vehicle slows to
    // a stop at a platform and glides between them.
    const x = u * (this.N - 1);
    const i = Math.floor(x);
    const f = x - i;
    return i + f * f * (3 - 2 * f);
  }

  /** Screen (NDC) → a point on a vertical plane through `through`, facing the camera. */
  private project(ndcX: number, ndcY: number, through: THREE.Vector3, out: THREE.Vector3) {
    const n = this.tmp.copy(this.camera.position).sub(through).setY(0).normalize();
    this.plane.setFromNormalAndCoplanarPoint(n, through);
    this.raycaster.setFromCamera(this.ndc.set(ndcX, ndcY), this.camera);
    if (!this.raycaster.ray.intersectPlane(this.plane, out)) out.copy(through);
    out.y = Math.max(0.3, out.y);
    return out;
  }

  /* ── frame ────────────────────────────────────────────────────────── */

  private frame = () => {
    if (this.disposed) return;
    this.timer.update();
    const raw = this.timer.getDelta();
    const dt = Math.min(raw, 0.05);
    const t = this.timer.getElapsed();
    this.houseLights = Math.min(1, this.houseLights + dt / 2.0);

    // Quality: after a warm-up, if frames keep missing 38 fps, step down.
    this.qualityT += raw;
    if (this.qualityT > 3) {
      if (raw > 1 / 38) this.slowFrames++;
      if (this.slowFrames > 45) {
        this.slowFrames = 0;
        this.qualityT = 0;
        this.stepDown();
      }
    }

    /* vehicle — on the real clock, so a slow device still arrives on time */
    this.sGoal = this.readScroll();
    const w = 12, z = 0.95;
    // Sub-stepped: the spring is only stable for small steps, and a phone
    // that drops to 15 fps must still arrive at the platform, not oscillate.
    let rem = Math.min(raw, 0.25);
    while (rem > 0) {
      const h = Math.min(rem, 1 / 90);
      this.sVel += (w * w * (this.sGoal - this.s) - 2 * z * w * this.sVel) * h;
      this.s += this.sVel * h;
      rem -= h;
    }
    // Buffers at both ends of the track.
    if (this.s < -0.3 || this.s > this.N - 0.7) {
      this.s = THREE.MathUtils.clamp(this.s, -0.3, this.N - 0.7);
      this.sVel = 0;
    }
    const speed = Math.abs(this.sVel);
    const tt = this.t(this.s);
    const pos = this.curve.getPoint(tt);
    const tan = this.curve.getTangent(tt).setY(0).normalize();
    const yaw = Math.atan2(tan.x, tan.z);
    let dyaw = yaw - this.lastYaw;
    if (dyaw > Math.PI) dyaw -= 2 * Math.PI;
    if (dyaw < -Math.PI) dyaw += 2 * Math.PI;
    this.lastYaw = yaw;
    const bankGoal = this.reduced ? 0 : THREE.MathUtils.clamp((-dyaw / Math.max(dt, 1e-3)) * 0.06, -0.06, 0.06);
    this.bank += (bankGoal - this.bank) * Math.min(1, dt * 4);
    const bob = this.reduced ? 0 : 0.012 * Math.min(1, speed * 3) * Math.sin(t * 7);
    this.camera.position.set(pos.x, CAM_H + bob, pos.z);

    this.vAhead.copy(pos).addScaledVector(tan, 8).setY(CAM_H - 0.6);
    this.vLook.copy(this.vAhead);
    const sc = this.nearest();
    const d = Math.abs(this.s - sc.i);
    const wNear = 1 - THREE.MathUtils.smoothstep(d, 0.2, 0.62);
    if (wNear > 0) {
      this.vSceneLook.copy(sc.center);
      this.vSceneLook.y = this.portrait ? 1.65 : 1.7;
      if (!this.portrait) {
        // Look left of the platform so it lands in the right half of the frame.
        const camRight = this.tmp.copy(this.vSceneLook).sub(this.camera.position).setY(0).normalize();
        camRight.set(-camRight.z, 0, camRight.x);
        this.vSceneLook.addScaledVector(camRight, -2.2);
      }
      this.vLook.lerp(this.vSceneLook, wNear);
    }
    this.vDir.copy(this.vLook).sub(this.camera.position).normalize();
    this.headYaw += (this.headYawGoal - this.headYaw) * Math.min(1, dt * 5);
    this.headPitch += (this.headPitchGoal - this.headPitch) * Math.min(1, dt * 5);
    this.vDir.applyAxisAngle(RideWorld.UP, this.headYaw);
    this.vDir.y += this.headPitch;
    this.lookDir.lerp(this.vDir, Math.min(1, dt * 6));
    this.camera.lookAt(this.tmp.copy(this.camera.position).add(this.lookDir));
    this.camera.rotateZ(this.bank);

    this.gridMat.uniforms.uEye.value.copy(this.camera.position);
    this.key.position.set(sc.center.x - 3, 9, sc.center.z + 4);
    this.key.target.position.copy(sc.center);

    /* chase lights: short bright pulses running ahead of the vehicle */
    const head = (this.s + 1) * CHASE_PER_SCENE;
    for (let k = 0; k < this.chaseColor.length; k++) {
      const rel = Math.floor(k / 2) - head;
      if (rel < -24 || rel > 60) continue;
      const wave = 0.5 + 0.5 * Math.sin(rel * 0.9 - t * 5);
      const glow = 0.12 + 2.6 * Math.pow(wave, 6) * (rel > -2 ? 1 : 0.3);
      this.chase.setColorAt(k, this.tmpC.copy(this.chaseColor[k]).multiplyScalar(glow));
    }
    if (this.chase.instanceColor) this.chase.instanceColor.needsUpdate = true;

    /* scenes */
    let steerPoint: THREE.Vector3 | null = null;
    if (this.pointerDown && !this.dragging) {
      this.project(this.pointer.x, this.pointer.y, sc.center, this.pointerWorld);
      steerPoint = this.pointerWorld;
    }
    for (const scn of this.scenes) {
      const dist = Math.abs(this.s - scn.i);
      const near = (1 - THREE.MathUtils.smoothstep(dist, 0.3, 0.9)) * this.houseLights;
      scn.near = near;
      const active = dist < 1.7;
      scn.group.visible = active;
      scn.spot.visible = active;
      if (!active) continue;
      scn.bounce = Math.max(0, scn.bounce - dt * 1.5);
      const lift = 0.25 * Math.sin(scn.bounce * Math.PI);
      scn.spot.intensity = (this.palette.dark ? 75 : 50) * near * (1 + 0.6 * lift);
      (scn.cone.material as THREE.MeshBasicMaterial).opacity = 0.055 * near * (1 + lift);
      scn.ringMat.opacity = 0.2 + 0.8 * near;
      scn.barMat.opacity = (0.15 + 0.85 * near) * (0.8 + 0.2 * Math.sin(t * 2 + scn.i));
      if (scn === sc) scn.set.steer?.(steerPoint);
      scn.set.update(dt, t, near);
    }

    /* dust drifts up through the beams */
    if (this.palette.dark && !this.reduced) {
      const a = this.motes.geometry.attributes.position as THREE.BufferAttribute;
      const arr = a.array as Float32Array;
      const zc = this.camera.position.z;
      const xc = this.camera.position.x;
      for (let k = 0; k < arr.length; k += 3) {
        const dz = arr[k + 2] - zc;
        if (Math.abs(dz) > 24) continue;
        arr[k + 1] += dt * 0.12;
        arr[k] += dt * 0.05 * Math.sin(t + arr[k + 2]);
        if (arr[k + 1] > 7) arr[k + 1] = 0;
        // Nothing right in front of the lens: a mote there is a big square.
        const dx = arr[k] - xc;
        if (dx * dx + dz * dz < 4) arr[k + 2] -= 8;
      }
      a.needsUpdate = true;
    }

    if (this.bloom.enabled) this.composer.render();
    else this.renderer.render(this.scene, this.camera);

    this.fpsAcc += raw;
    this.fpsN++;
    this.telemetryT += dt;
    if (this.telemetryT > 0.15) {
      this.telemetryT = 0;
      if (this.fpsAcc > 0) this.fps = Math.round(this.fpsN / this.fpsAcc);
      this.fpsAcc = 0;
      this.fpsN = 0;
      this.opts.onTelemetry?.({
        scene: sc.i,
        readout: sc.set.readout(),
        fps: this.fps,
        found: this.scenes.filter((x) => x.found).length,
        total: this.scenes.length,
        quality: ["bare", "lite", "phone", "full"][this.quality],
      });
    }
    if (this.opts.onReady) {
      this.opts.onReady();
      this.opts.onReady = undefined;
    }
  };
}
