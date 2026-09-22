import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { makeProp, type Prop, type PropKind } from "./models";
import { Backdrop } from "./backdrop";

/**
 * The product stage. The first and last screens are a full-bleed backdrop
 * (him, and the two cities); every screen between them is one model floating
 * in the centre of a fixed canvas; the
 * page scrolls past it one screen of text at a time, and the scroll position
 * is the animation. Between screen i and screen i+1 the model turns a little,
 * shrinks away, and the next one grows in its place, with the light behind
 * them crossing from one build's colour to the next. Scrubbed, not played:
 * scroll back and it runs in reverse.
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

    // The backdrop rides with the camera, so it always fills the frame.
    this.camera.add(this.backdrop.mesh);
    this.scene.add(this.camera);

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
    this.camera.aspect = w / h;
    // The model floats in the upper half on a phone (the copy is below it)
    // and in the right half on a wide screen (the copy is down the left).
    const portrait = w / h < 1;
    this.camera.fov = portrait ? 40 : 32;
    this.camera.position.set(0, portrait ? 2.4 : 2.2, portrait ? 10.2 : 7.6);
    this.camera.lookAt(0, portrait ? -0.35 : 1.05, 0);
    this.camera.updateProjectionMatrix();
    this.backdrop.resize(this.camera);

    // How much world fits across the frame where the models stand.
    const visH = 2 * this.camera.position.z * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2);
    const visW = visH * this.camera.aspect;
    // Landscape: shrink a touch, then slide right until the copy is clear,
    // but never so far that the widest model runs off the frame.
    const scale = portrait ? 1 : 0.92;
    const halfModel = 1.8 * scale;
    const shift = portrait ? 0 : Math.min(visW * 0.22, Math.max(0, visW / 2 - halfModel - 0.2));
    this.stage.scale.setScalar(scale);
    this.stage.position.x = shift;
    this.glow.position.x = shift;
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

    this.renderer.render(this.scene, this.camera);
  };
}
