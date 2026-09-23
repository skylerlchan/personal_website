import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { makeProp, type Prop, type PropKind } from "./models";
import { Backdrop } from "./backdrop";

/**
 * The product stage. The page scrolls past it one screen of text at a time,
 * and the scroll position is the animation: between screen i and screen i+1
 * the model turns a little, shrinks away, and the next one grows in its
 * place, with the light behind them crossing from one build's colour to the
 * next. Scrubbed, not played: scroll back and it runs in reverse.
 *
 * The words come first. The models are given their own rectangle of the
 * canvas and are scissored into it, so they can never wander under the copy
 * at any window size: beside the text on a wide screen, above it otherwise.
 * The picture on the first and last screens is the exception, and fills the
 * whole frame from its own pass behind everything.
 *
 * Nothing reacts to the pointer.
 */

export type Slot = { kind: PropKind; color: string };

export class ScrollWorld {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  private timer = new THREE.Timer();
  private ro: ResizeObserver;
  private mo: MutationObserver;
  private disposed = false;
  private reduced = false;
  private models: { prop: Prop; kind: PropKind; color: THREE.Color }[] = [];
  private stage = new THREE.Group();
  private glow: THREE.Mesh;
  private glowMat: THREE.MeshBasicMaterial;
  private backdrop = new Backdrop();
  private backdropScene = new THREE.Scene();
  private backdropCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private region = { x: 0, y: 0, w: 1, h: 1 };
  private portraitAt: number[] = [];
  private key: THREE.DirectionalLight;
  private hemi: THREE.HemisphereLight;
  private fill: THREE.PointLight;
  private x = 0; // smoothed screen index, fractional
  private xGoal = 0;
  private tmpC = new THREE.Color();

  constructor(private canvas: HTMLCanvasElement, slots: Slot[]) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    const r = this.renderer;
    r.setClearColor(0x000000, 0);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const pmrem = new THREE.PMREMGenerator(r);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.35;
    pmrem.dispose();

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 0.6);
    this.scene.add(this.hemi);
    this.key = new THREE.DirectionalLight(0xffffff, 1.5);
    this.key.position.set(-2.5, 6, 3);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(1024, 1024);
    this.key.shadow.camera.near = 1;
    this.key.shadow.camera.far = 20;
    const sz = 3.5;
    this.key.shadow.camera.left = -sz;
    this.key.shadow.camera.right = sz;
    this.key.shadow.camera.top = sz;
    this.key.shadow.camera.bottom = -sz;
    this.key.shadow.bias = -0.0004;
    this.key.shadow.normalBias = 0.03;
    this.scene.add(this.key);
    // A fill in the build's colour, from behind and below, so the colour
    // reaches the model and not just the backdrop.
    this.fill = new THREE.PointLight(0xffffff, 12, 14, 1.6);
    this.fill.position.set(1.5, 0.6, -2.5);
    this.scene.add(this.fill);

    // The light behind: a soft disc that takes each build's colour.
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, "rgba(255,255,255,0.55)");
    grad.addColorStop(0.45, "rgba(255,255,255,0.16)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    const glowTex = new THREE.CanvasTexture(c);
    this.glowMat = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffffff });
    this.glow = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), this.glowMat);
    this.glow.position.set(0, 1.3, -3);
    this.scene.add(this.glow);

    // The picture gets its own pass, behind everything and across the whole
    // canvas, so confining the models to a rectangle never crops it.
    this.backdrop.mesh.scale.set(2, 2, 1);
    this.backdropScene.add(this.backdrop.mesh);

    this.scene.add(this.stage);
    // Every model is built up front; the scroll decides which one is grown.
    slots.forEach((slot, i) => {
      if (slot.kind === "portrait") this.portraitAt.push(i);
    });
    for (const slot of slots) {
      const color = new THREE.Color(slot.color);
      const prop = makeProp(slot.kind, color);
      prop.group.visible = false;
      this.stage.add(prop.group);
      this.models.push({ prop, kind: slot.kind, color });
    }

    this.applyTheme();
    this.mo = new MutationObserver(() => this.applyTheme());
    this.mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.resize();
    r.setAnimationLoop(this.frame);
  }

  /** Scroll position in screens: 0 is the first text, 1 the second, 1.5 halfway between. */
  setProgress(screens: number) {
    this.xGoal = THREE.MathUtils.clamp(screens, 0, this.models.length - 1);
  }

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.ro.disconnect();
    this.mo.disconnect();
    for (const m of this.models) m.prop.dispose();
    this.backdrop.dispose();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Points) {
        o.geometry.dispose();
        const mat = o.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat.dispose();
      }
    });
    this.renderer.dispose();
  }

  private dark = true;
  private applyTheme() {
    this.dark = document.documentElement.classList.contains("dark");
    this.hemi.intensity = this.dark ? 0.6 : 1.1;
    this.hemi.groundColor.set(this.dark ? 0x222222 : 0xcccccc);
    this.key.intensity = this.dark ? 1.5 : 2.0;
    this.glowMat.blending = this.dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    this.glowMat.opacity = this.dark ? 1 : 0.45;
    this.glowMat.needsUpdate = true;
  }

  private resize() {
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.matchMedia("(pointer: coarse)").matches ? 1.5 : 2));
    this.renderer.setSize(w, h, false);
    this.backdrop.resize(w / h);

    // Where the models are allowed to be. Beside the copy only when the
    // window is genuinely wide; otherwise above it, never over it. This has
    // to agree with the copy's own column in the page (the lg breakpoint).
    const beside = w >= 1024 && w / h >= 1.3;
    if (beside) {
      const x = Math.round(w * 0.46);
      this.region = { x, y: 0, w: w - x, h };
    } else {
      const top = Math.round(h * 0.56);
      this.region = { x: 0, y: h - top, w, h: top };
    }

    const aspect = this.region.w / this.region.h;
    this.camera.aspect = aspect;
    this.camera.fov = aspect < 1 ? 42 : 34;
    this.camera.position.set(0, 2.3, aspect < 1 ? 9.6 : 8.2);
    this.camera.lookAt(0, 1.0, 0);
    this.camera.updateProjectionMatrix();

    // Inside its own rectangle the model is simply centred, and sized so the
    // widest of them still clears the edges.
    const visH = 2 * this.camera.position.z * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2);
    const visW = visH * aspect;
    const scale = Math.min(1, (visW * 0.46) / 1.8, (visH * 0.46) / 1.6);
    this.stage.scale.setScalar(scale);
    this.stage.position.x = 0;
    this.glow.position.x = 0;
  }

  private frame = () => {
    if (this.disposed) return;
    this.timer.update();
    const dt = Math.min(this.timer.getDelta(), 0.05);
    const t = this.timer.getElapsed();

    // Scrub follows the scroll closely, with just enough lag to be smooth.
    this.x += (this.xGoal - this.x) * (this.reduced ? 1 : Math.min(1, dt * 9));
    const x = this.x;


    // The light behind crosses from one build's colour to the next.
    const i0 = Math.floor(x), f = x - i0;
    const c0 = this.models[Math.min(i0, this.models.length - 1)].color;
    const c1 = this.models[Math.min(i0 + 1, this.models.length - 1)].color;
    this.tmpC.copy(c0).lerp(c1, f * f * (3 - 2 * f));
    this.glowMat.color.copy(this.tmpC);
    this.fill.color.copy(this.tmpC);

    // The backdrop is up on the portrait screens, and fades between them.
    let backdropUp = 0;
    for (const i of this.portraitAt) backdropUp = Math.max(backdropUp, 1 - THREE.MathUtils.smoothstep(Math.abs(x - i), 0.2, 0.7));
    this.backdrop.update(t, backdropUp);
    // On those screens the light behind should not glow through the picture.
    this.glowMat.opacity = 1 - backdropUp;

    for (let i = 0; i < this.models.length; i++) {
      const d = x - i; // negative: still ahead; positive: passed
      const ad = Math.abs(d);
      const m = this.models[i];
      // Fully up within ±0.25 of its screen, gone by ±0.6.
      const k = 1 - THREE.MathUtils.smoothstep(ad, 0.25, 0.6);
      const g = m.prop.group;
      g.visible = k > 0.002;
      if (!g.visible) continue;
      const e = k * k * (3 - 2 * k);
      g.scale.setScalar(Math.max(0.001, e));
      // Faces front on its own screen; turns as it arrives and leaves, and
      // drifts down as it goes, up as it comes.
      g.rotation.y = this.reduced ? 0 : d * 0.7;
      g.position.y = (1 - e) * (d > 0 ? -0.5 : 0.5);
      m.prop.update(this.reduced ? 0 : dt, t);
    }

    // The picture first, across the whole canvas, then the models inside
    // their own rectangle and nowhere else.
    const r = this.renderer;
    r.setScissorTest(false);
    r.setViewport(0, 0, this.canvas.clientWidth || 1, this.canvas.clientHeight || 1);
    r.clear();
    r.render(this.backdropScene, this.backdropCam);
    r.autoClear = false;
    r.setViewport(this.region.x, this.region.y, this.region.w, this.region.h);
    r.setScissor(this.region.x, this.region.y, this.region.w, this.region.h);
    r.setScissorTest(true);
    r.render(this.scene, this.camera);
    r.setScissorTest(false);
    r.autoClear = true;
  };
}
