import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { makeBuild, type Build, type BuildKind, type Result } from "./builds";

/**
 * One bench, one camera, one build at a time.
 *
 * Every chapter plays the same four beats, driven by how far the visitor
 * has scrolled through it:
 *
 *   0.00 – 0.06   empty bench
 *   0.06 – 0.62   the parts arrive, in order
 *   0.62 – 0.78   assembled, unpowered; the switch glows
 *   0.78          it switches on (or earlier, if tapped) and runs
 *   0.90 – 1.00   it sinks into the bench, and the bench is empty again
 *
 * The visitor's only controls: tap the build or the switch to power it, tap
 * again to poke it, hold to steer the one build that can be steered.
 */

export type ChapterDef = { id: string; kind: BuildKind | null; color: string };
export type Phase = "empty" | "assembling" | "dormant" | "on" | "sinking";
export type State = { chapter: number; phase: Phase; p: number; on: boolean; result: Result | null; readout: string; fps: number; quality: string };

const CAM_H = 3.1;

export class StoryWorld {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(46, 1, 0.1, 60);
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private timer = new THREE.Timer();
  private raycaster = new THREE.Raycaster();
  private plane = new THREE.Plane();
  private key: THREE.DirectionalLight;
  private rim: THREE.DirectionalLight;
  private mirror: Reflector | null = null;
  private floor: THREE.Mesh;
  private bench: THREE.Mesh;
  private button: THREE.Group;
  private buttonCap: THREE.Mesh;
  private buttonRing: THREE.Mesh;
  private ringMat: THREE.MeshBasicMaterial;
  private pool: THREE.SpotLight;
  private attractor: THREE.Group;
  private attractorPts: THREE.Points;
  private attractorPos: Float32Array;
  private attractorMat: THREE.PointsMaterial;
  private burnIn = 0;
  private ro: ResizeObserver;
  private disposed = false;

  private chapters: ChapterDef[];
  private builds: (Build | null)[];
  private accents: THREE.Color[];
  private sections: { top: number; height: number }[] = [];
  private sectionEls: HTMLElement[] = [];
  private active = -1;
  private p = 0;
  private lastA = -1;
  private phase: Phase = "empty";
  private portrait = false;
  private reduced = false;
  private houseLights = 0;

  // Quality ladder: 3 = mirror + bloom, 2 = bloom, 1 = shadows, 0 = bare.
  private quality = 3;
  private locked = false;
  private dprCap = 2;
  private slowFrames = 0;
  private qualityT = 0;

  // Input.
  private pointer = new THREE.Vector2();
  private pointerDown = false;
  private downAt = { x: 0, y: 0, t: 0 };
  private held = false;
  private holdTimer = 0;
  private pointerWorld = new THREE.Vector3();
  private lookOffset = new THREE.Vector2();
  private lookGoal = new THREE.Vector2();

  private fpsAcc = 0;
  private fpsN = 0;
  private fps = 60;
  private stateT = 0;
  private tmp = new THREE.Vector3();
  private look = new THREE.Vector3();

  constructor(
    private canvas: HTMLCanvasElement,
    chapters: ChapterDef[],
    private opts: { onState?: (s: State) => void; onReady?: () => void } = {},
  ) {
    this.chapters = chapters;
    this.accents = chapters.map((c) => new THREE.Color(c.color));
    this.builds = chapters.map(() => null);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
    const r = this.renderer;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
    this.scene.environmentIntensity = 0.35;
    pmrem.dispose();
    this.scene.background = new THREE.Color(0x070707);
    this.scene.fog = new THREE.Fog(0x070707, 9, 26);

    this.composer = new EffectComposer(r, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }));
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.32, 0.5, 0.96);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    /* ── light ── */
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x101010, 0.18));
    this.key = new THREE.DirectionalLight(0xfff0dc, 1.5);
    this.key.position.set(-3.5, 7, 4);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(1536, 1536);
    this.key.shadow.camera.near = 1;
    this.key.shadow.camera.far = 24;
    const sz = 5;
    this.key.shadow.camera.left = -sz;
    this.key.shadow.camera.right = sz;
    this.key.shadow.camera.top = sz;
    this.key.shadow.camera.bottom = -sz;
    this.key.shadow.bias = -0.0004;
    this.key.shadow.normalBias = 0.03;
    this.key.shadow.radius = 3;
    this.scene.add(this.key);
    this.rim = new THREE.DirectionalLight(0xffffff, 0.8);
    this.rim.position.set(3, 4, -5);
    this.scene.add(this.rim);
    // A pool of light on the bench, in the chapter's colour.
    this.pool = new THREE.SpotLight(0xffffff, 40, 20, 0.6, 0.8, 1.4);
    this.pool.position.set(0, 8, 2);
    this.pool.target.position.set(0, 0, 0);
    this.scene.add(this.pool, this.pool.target);

    /* ── floor and bench ── */
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.3, metalness: 0.5 }));
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -0.02;
    this.scene.add(this.floor);
    const catcher = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.45 }));
    catcher.rotation.x = -Math.PI / 2;
    catcher.receiveShadow = true;
    this.scene.add(catcher);
    this.bench = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.18, 3.8), new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.55, metalness: 0.2 }));
    this.bench.position.y = -0.09;
    this.bench.receiveShadow = true;
    this.bench.castShadow = true;
    this.scene.add(this.bench);

    /* ── the switch ── */
    this.button = new THREE.Group();
    this.button.position.set(2.55, 0, 1.45);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.08, 32), new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.5 }));
    base.position.y = 0.04;
    base.castShadow = true;
    this.button.add(base);
    this.buttonCap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.1, 32), new THREE.MeshStandardMaterial({ color: 0xe9e6df, roughness: 0.4 }));
    this.buttonCap.position.y = 0.13;
    this.buttonCap.castShadow = true;
    this.button.add(this.buttonCap);
    this.ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: true, opacity: 1 });
    this.buttonRing = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.012, 8, 48), this.ringMat);
    this.buttonRing.rotation.x = Math.PI / 2;
    this.buttonRing.position.y = 0.085;
    this.button.add(this.buttonRing);
    this.scene.add(this.button);

    /* ── the intro: chaos resolving into structure ── */
    const N = 14000;
    this.attractorPos = new Float32Array(N * 3);
    this.scatter();
    const ag = new THREE.BufferGeometry();
    ag.setAttribute("position", new THREE.BufferAttribute(this.attractorPos, 3));
    this.attractorMat = new THREE.PointsMaterial({ color: new THREE.Color(0xffd2a0).multiplyScalar(1.1), size: 0.018, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    this.attractorPts = new THREE.Points(ag, this.attractorMat);
    // The system lives in z ∈ [0, 50]; centre it over the bench.
    this.attractorPts.position.z = -26;
    this.attractor = new THREE.Group();
    this.attractor.position.set(0, 2.1, 0);
    this.attractor.rotation.x = -Math.PI / 2 + 0.3;
    this.attractor.scale.setScalar(0.07);
    this.attractor.add(this.attractorPts);
    this.scene.add(this.attractor);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.applyQuality();
    this.measure();
    window.addEventListener("resize", this.measure, { passive: true });
    window.addEventListener("pointermove", this.onMove, { passive: true });
    window.addEventListener("pointerdown", this.onDown, { passive: true });
    window.addEventListener("pointerup", this.onUp, { passive: true });
    window.addEventListener("pointercancel", this.onUp, { passive: true });
    // Once a long press has armed steering, keep the browser from turning
    // the rest of the gesture into a scroll.
    window.addEventListener("touchmove", this.onTouchMove, { passive: false });
    r.setAnimationLoop(this.frame);
    (window as unknown as { __story?: StoryWorld }).__story = this;
  }

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    window.removeEventListener("resize", this.measure);
    window.removeEventListener("pointermove", this.onMove);
    window.removeEventListener("pointerdown", this.onDown);
    window.removeEventListener("pointerup", this.onUp);
    window.removeEventListener("pointercancel", this.onUp);
    window.removeEventListener("touchmove", this.onTouchMove);
    clearTimeout(this.holdTimer);
    this.ro.disconnect();
    for (const b of this.builds) b?.dispose();
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
      this.mirror = new Reflector(new THREE.PlaneGeometry(200, 200), { clipBias: 0.003, textureWidth: 768, textureHeight: 768, color: 0x333333 });
      this.mirror.rotation.x = -Math.PI / 2;
      this.mirror.position.y = -0.01;
      this.scene.add(this.mirror);
    } else if (!wantMirror && this.mirror) {
      this.scene.remove(this.mirror);
      this.mirror.dispose();
      this.mirror = null;
    }
    this.floor.visible = !wantMirror;
    this.bloom.enabled = q >= 2;
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
    this.camera.fov = this.portrait ? 50 : 40;
    this.camera.updateProjectionMatrix();
  }

  /** Cache where each chapter section sits; scroll reads against this. */
  private measure = () => {
    this.sectionEls = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]"));
    this.sections = this.sectionEls.map((el) => ({ top: el.offsetTop, height: el.offsetHeight }));
  };

  /* ── input ────────────────────────────────────────────────────────── */

  private toNdc(e: PointerEvent) {
    this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  }
  private onMove = (e: PointerEvent) => {
    if (e.pointerType === "mouse" || this.pointerDown) this.toNdc(e);
    if (e.pointerType === "mouse") {
      this.lookGoal.set(this.pointer.x * 0.35, this.pointer.y * 0.2);
      // A mouse steers as soon as it drags.
      if (this.pointerDown && !this.held && Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y) > 6) this.held = true;
    }
  };
  private onTouchMove = (e: TouchEvent) => {
    if (this.pointerDown && this.held && e.cancelable) e.preventDefault();
  };
  private onDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement | null)?.closest("a, button, input, textarea, select, label")) return;
    this.toNdc(e);
    this.pointerDown = true;
    this.held = false;
    this.downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
    clearTimeout(this.holdTimer);
    if (e.pointerType !== "mouse") {
      // A still press arms steering; a swipe that starts sooner is a scroll.
      const b = this.builds[this.active];
      if (b?.steer && b.on) this.holdTimer = window.setTimeout(() => {
        if (this.pointerDown) this.held = true;
      }, 220);
    }
  };
  private onUp = (e: PointerEvent) => {
    if (!this.pointerDown) return;
    this.pointerDown = false;
    clearTimeout(this.holdTimer);
    const b = this.builds[this.active];
    b?.steer?.(null);
    if (e.type !== "pointerup") return;
    const moved = Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y);
    if (moved < 12 && performance.now() - this.downAt.t < 450) this.tap();
  };

  /** Public, so the page's own switch can flip it too. */
  toggle() {
    const b = this.builds[this.active];
    if (!b || this.phase === "empty" || this.phase === "assembling") return;
    b.power(!b.on);
  }

  private tap() {
    const b = this.builds[this.active];
    if (!b) return;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    if (this.raycaster.intersectObject(this.button, true).length) {
      this.toggle();
      return;
    }
    if (this.phase === "empty" || this.phase === "assembling") return;
    if (!this.raycaster.intersectObjects(b.targets, true).length) return;
    if (!b.on) b.power(true);
    else b.poke();
  }

  private project(out: THREE.Vector3) {
    const through = this.tmp.set(0, 1.4, 0);
    const n = this.look.copy(this.camera.position).sub(through).setY(0).normalize();
    this.plane.setFromNormalAndCoplanarPoint(n, through);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    if (!this.raycaster.ray.intersectPlane(this.plane, out)) out.copy(through);
    return out;
  }

  private scatter() {
    const p = this.attractorPos;
    for (let i = 0; i < p.length; i += 3) {
      p[i] = (Math.random() - 0.5) * 60;
      p[i + 1] = (Math.random() - 0.5) * 60;
      p[i + 2] = (Math.random() - 0.5) * 60 + 25;
    }
    this.burnIn = 0;
  }
  private lorenz(h: number) {
    const p = this.attractorPos;
    const s = 10, r = 28, b = 8 / 3;
    for (let i = 0; i < p.length; i += 3) {
      const x = p[i], y = p[i + 1], z = p[i + 2];
      const dx = s * (y - x), dy = x * (r - z) - y, dz = x * y - b * z;
      const xm = x + dx * h * 0.5, ym = y + dy * h * 0.5, zm = z + dz * h * 0.5;
      p[i] = x + s * (ym - xm) * h;
      p[i + 1] = y + (xm * (r - zm) - ym) * h;
      p[i + 2] = z + (xm * ym - b * zm) * h;
    }
  }

  /* ── frame ────────────────────────────────────────────────────────── */

  private frame = () => {
    if (this.disposed) return;
    this.timer.update();
    const raw = this.timer.getDelta();
    const dt = Math.min(raw, 0.05);
    const t = this.timer.getElapsed();
    this.houseLights = Math.min(1, this.houseLights + dt / 1.5);

    this.qualityT += raw;
    if (this.qualityT > 3) {
      if (raw > 1 / 38) this.slowFrames++;
      if (this.slowFrames > 45) {
        this.slowFrames = 0;
        this.qualityT = 0;
        this.stepDown();
      }
    }

    /* which chapter, how far through it */
    const y = window.scrollY;
    const vh = window.innerHeight;
    let active = -1, p = 0;
    for (let i = 0; i < this.sections.length; i++) {
      const s = this.sections[i];
      if (y >= s.top - vh * 0.5 && y < s.top + s.height - vh * 0.5) {
        active = i;
        p = THREE.MathUtils.clamp((y - s.top) / Math.max(1, s.height - vh), 0, 1);
        break;
      }
    }
    if (active !== this.active) {
      const prev = this.builds[this.active];
      if (prev) {
        prev.power(false);
        prev.group.visible = false;
      }
      this.active = active;
      this.lastA = -1;
      const def = this.chapters[active];
      if (def?.kind && !this.builds[active]) {
        const b = makeBuild(def.kind, this.accents[active]);
        b.group.position.set(0, 0, 0);
        this.scene.add(b.group);
        this.builds[active] = b;
      }
      const b = this.builds[active];
      if (b) b.group.visible = true;
    }
    this.p = p;
    const b = this.builds[this.active];
    const accent = this.accents[this.active] ?? new THREE.Color(0xffd2a0);

    /* beats */
    let phase: Phase = "empty";
    if (b) {
      const a = THREE.MathUtils.smoothstep(p, 0.06, 0.62);
      if (a !== this.lastA) {
        b.assemble(a);
        this.lastA = a;
      }
      if (p < 0.06) phase = "empty";
      else if (a < 0.999) phase = "assembling";
      else if (!b.on && p < 0.78) phase = "dormant";
      else phase = p > 0.9 ? "sinking" : "on";
      if (phase === "on" && !b.on) b.power(true);
      if (phase === "assembling" || phase === "empty") b.power(false);
      // Sink into the bench at the end of the chapter.
      const sink = p > 0.9 ? (p - 0.9) / 0.1 : 0;
      b.group.position.y = -sink * sink * 3.2;
      if (this.pointerDown && this.held && b.steer && b.on) b.steer(this.project(this.pointerWorld));
      b.update(dt, t);
    }
    this.phase = phase;

    /* the switch */
    const armed = phase === "dormant";
    const on = !!b?.on;
    this.buttonCap.position.y += ((on ? 0.09 : 0.13) - this.buttonCap.position.y) * Math.min(1, dt * 10);
    const pulse = armed ? 0.55 + 0.45 * Math.sin(t * 5) : on ? 1 : 0.12;
    this.ringMat.color.copy(accent).multiplyScalar(0.3 + 2.4 * pulse);
    this.button.visible = !!b && phase !== "empty";
    this.pool.color.copy(accent);
    this.pool.intensity = (phase === "on" || phase === "sinking" ? 26 : 12) * this.houseLights;
    this.rim.color.copy(accent).lerp(new THREE.Color(0xffffff), 0.5);

    /* the intro attractor: from dust to structure, once */
    const intro = this.active === 0;
    this.attractor.visible = intro || this.active === this.chapters.length - 1;
    if (this.attractor.visible) {
      if (this.burnIn < 1) this.burnIn += dt / 4;
      const h = 0.004 + 0.008 * Math.min(1, this.burnIn);
      this.lorenz(h);
      (this.attractorPts.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      this.attractor.rotation.z = t * 0.06;
      this.attractorMat.opacity = 0.55 * Math.min(1, this.houseLights);
    }

    /* camera: fixed, with a breath of parallax */
    this.lookOffset.lerp(this.lookGoal, Math.min(1, dt * 3));
    const az = 0.34 + this.lookOffset.x * 0.08;
    const dist = this.portrait ? 9.8 : 9.4;
    this.camera.position.set(Math.sin(az) * dist, (this.portrait ? CAM_H + 0.5 : CAM_H - 0.3) + this.lookOffset.y * 0.3, Math.cos(az) * dist);
    // Portrait: bench mid-screen, build above it, copy below. Landscape: the
    // bench in the right two-thirds, looked at a touch from the left.
    this.look.set(0, this.portrait ? 0.35 : 1.0, 0);
    if (!this.portrait) {
      // Shift the view so the bench sits right of the copy column.
      this.tmp.copy(this.look).sub(this.camera.position).setY(0).normalize();
      this.look.addScaledVector(this.tmp.set(-this.tmp.z, 0, this.tmp.x), -1.9);
    }
    this.camera.lookAt(this.look);

    if (this.bloom.enabled) this.composer.render();
    else this.renderer.render(this.scene, this.camera);

    this.fpsAcc += raw;
    this.fpsN++;
    this.stateT += dt;
    if (this.stateT > 0.12) {
      this.stateT = 0;
      if (this.fpsAcc > 0) this.fps = Math.round(this.fpsN / this.fpsAcc);
      this.fpsAcc = 0;
      this.fpsN = 0;
      this.opts.onState?.({
        chapter: this.active,
        phase,
        p,
        on,
        result: b && (phase === "on" || phase === "sinking") ? b.result() : null,
        readout: b ? b.readout() : intro ? "lorenz · σ 10 ρ 28 β 8⁄3 · 14,000 pts" : "",
        fps: this.fps,
        quality: ["bare", "lite", "phone", "full"][this.quality],
      });
    }
    if (this.opts.onReady) {
      this.opts.onReady();
      this.opts.onReady = undefined;
    }
  };
}
