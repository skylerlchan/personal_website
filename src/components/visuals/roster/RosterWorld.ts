import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { makeProp, type Prop, type PropKind } from "./models";

/**
 * A character-select screen. One platform, one light, one model on it at a
 * time, idling. Choose another and the current one drops away and the next
 * one pops up in its place, the way a roster works in a game: quick, the
 * same every time, and then still.
 *
 * Nothing here reacts to the pointer. The page says which model is up.
 */

export class RosterWorld {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  private timer = new THREE.Timer();
  private ro: ResizeObserver;
  private io: IntersectionObserver;
  private mo: MutationObserver;
  private disposed = false;
  private visible = true;
  private reduced = false;
  private models = new Map<PropKind, { prop: Prop; k: number }>();
  private active: PropKind;
  private pedestal: THREE.Mesh;
  private ring: THREE.Mesh;
  private ringMat: THREE.MeshBasicMaterial;
  private key: THREE.DirectionalLight;
  private hemi: THREE.HemisphereLight;
  private pool: THREE.SpotLight;
  private shadowMat: THREE.ShadowMaterial;
  private turn = 0;

  constructor(private canvas: HTMLCanvasElement, first: PropKind) {
    this.active = first;
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

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 0.5);
    this.scene.add(this.hemi);
    this.key = new THREE.DirectionalLight(0xffffff, 1.6);
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
    this.key.shadow.radius = 3;
    this.scene.add(this.key);
    this.pool = new THREE.SpotLight(0xffffff, 30, 16, 0.5, 0.8, 1.5);
    this.pool.position.set(0, 7, 1.5);
    this.pool.target.position.set(0, 0, 0);
    this.scene.add(this.pool, this.pool.target);

    // The platform.
    this.pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.0, 0.12, 64), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6, metalness: 0.2 }));
    this.pedestal.position.y = -0.06;
    this.pedestal.receiveShadow = true;
    this.pedestal.castShadow = true;
    this.scene.add(this.pedestal);
    this.ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
    this.ring = new THREE.Mesh(new THREE.TorusGeometry(1.92, 0.012, 6, 96), this.ringMat);
    this.ring.rotation.x = Math.PI / 2;
    this.ring.position.y = 0.005;
    this.scene.add(this.ring);
    this.shadowMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const catcher = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), this.shadowMat);
    catcher.rotation.x = -Math.PI / 2;
    catcher.position.y = 0.001;
    catcher.receiveShadow = true;
    this.scene.add(catcher);

    this.applyTheme();
    this.mo = new MutationObserver(() => this.applyTheme());
    this.mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.resize();
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; }, { threshold: 0 });
    this.io.observe(canvas);

    this.select(first);
    this.models.get(first)!.k = 1;
    r.setAnimationLoop(this.frame);
  }

  /** Put a model on the platform. Built on first use, kept after. */
  select(kind: PropKind) {
    this.active = kind;
    if (!this.models.has(kind)) {
      const prop = makeProp(kind);
      prop.group.visible = false;
      this.scene.add(prop.group);
      this.models.set(kind, { prop, k: 0 });
    }
  }

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.ro.disconnect();
    this.io.disconnect();
    this.mo.disconnect();
    for (const m of this.models.values()) m.prop.dispose();
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

  private applyTheme() {
    const dark = document.documentElement.classList.contains("dark");
    (this.pedestal.material as THREE.MeshStandardMaterial).color.set(dark ? 0x1a1a1a : 0xdedcd6);
    this.ringMat.color.set(dark ? 0xffffff : 0x0a0a0a);
    this.ringMat.opacity = dark ? 0.35 : 0.25;
    this.hemi.intensity = dark ? 0.5 : 1.0;
    this.hemi.groundColor.set(dark ? 0x222222 : 0xcccccc);
    this.key.intensity = dark ? 1.6 : 2.0;
    this.pool.intensity = dark ? 30 : 12;
    this.shadowMat.opacity = dark ? 0.35 : 0.18;
    for (const m of this.models.values()) {
      m.prop.group.traverse((o) => {
        if (o instanceof THREE.Points) (o.material as THREE.PointsMaterial).color.set(dark ? 0xffffff : 0x0a0a0a);
      });
    }
  }

  private resize() {
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.matchMedia("(pointer: coarse)").matches ? 1.5 : 2));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Frame a ~3.2-unit-tall model from slightly above, in either shape.
    const portrait = w / h < 1;
    this.camera.fov = portrait ? 40 : 32;
    const dist = portrait ? 8.2 : 8.6;
    this.camera.position.set(0, 2.6, dist);
    this.camera.lookAt(0, 1.05, 0);
    this.camera.updateProjectionMatrix();
  }

  private frame = () => {
    if (this.disposed) return;
    this.timer.update();
    const dt = Math.min(this.timer.getDelta(), 0.05);
    const t = this.timer.getElapsed();
    if (!this.visible) return;

    // The swap: leaving drops fast, arriving pops with a little overshoot.
    for (const [kind, m] of this.models) {
      const want = kind === this.active ? 1 : 0;
      const rate = this.reduced ? 20 : want ? 4.5 : 7;
      m.k = THREE.MathUtils.clamp(m.k + (want - m.k) * Math.min(1, dt * rate) + (want > m.k ? dt * 0.4 : -dt * 0.6), 0, 1);
      const g = m.prop.group;
      g.visible = m.k > 0.01;
      if (!g.visible) continue;
      const over = want ? 1 + 0.08 * Math.sin(m.k * Math.PI) : 1;
      g.scale.setScalar(m.k * over);
      g.position.y = (1 - m.k) * (want ? 0.3 : -0.5);
      m.prop.update(this.reduced ? 0 : dt, t);
    }
    // A slow half-turn each way, so nothing ever faces away for long.
    this.turn = this.reduced ? 0 : Math.sin(t * 0.18) * 0.35;
    for (const m of this.models.values()) m.prop.group.rotation.y = this.turn;
    this.pedestal.rotation.y = this.turn;

    this.renderer.render(this.scene, this.camera);
  };
}
