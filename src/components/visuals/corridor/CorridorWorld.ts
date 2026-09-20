import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { readyFonts, Word } from "./text";
import { makeProp, type Prop, type PropKind } from "./props";

/**
 * A corridor. One straight black hall; the words stand in it in order, the
 * numbers lie painted on the floor, and each chapter's machine waits beside
 * its words under one pool of light. Scrolling is a slow dolly forward.
 * Nothing else moves faster than a breath.
 *
 * The whole view is seen through a faint lens: a little barrel warp, a hair
 * of colour fringing at the edges, a vignette.
 */

export type StationDef = {
  id: string;
  /** Standing words, top to bottom. */
  lines: { text: string; size: "title" | "name" | "label" | "small"; mono?: boolean }[];
  /** A number painted on the floor before the words. */
  floor?: string;
  prop?: PropKind;
};
export type State = { station: number; fps: number; quality: string };

const SPACING = 16; // hall length per station
const EYE = 1.55;

const LENS = {
  uniforms: { tDiffuse: { value: null }, uK: { value: 0.05 }, uCa: { value: 0.0025 }, uVig: { value: 0.55 } },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uK; uniform float uCa; uniform float uVig;
    varying vec2 vUv;
    void main(){
      vec2 c = vUv - 0.5;
      float r2 = dot(c, c);
      vec2 d = c * (1.0 + uK * r2) * (1.0 - uK * 0.25);
      float r = texture2D(tDiffuse, 0.5 + d * (1.0 + uCa)).r;
      float g = texture2D(tDiffuse, 0.5 + d).g;
      float b = texture2D(tDiffuse, 0.5 + d * (1.0 - uCa)).b;
      float vig = 1.0 - uVig * smoothstep(0.15, 0.7, r2);
      gl_FragColor = vec4(vec3(r, g, b) * vig, 1.0);
    }`,
};

const GRID_VS = /* glsl */ `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const GRID_FS = /* glsl */ `
precision highp float; uniform vec3 uEye; varying vec3 vW;
float line(vec2 p, float s){ vec2 g = abs(fract(p / s - 0.5) - 0.5) / fwidth(p / s); return 1.0 - min(min(g.x, g.y), 1.0); }
void main(){
  float a = max(line(vW.xz, 1.0) * 0.5, line(vW.xz, 4.0));
  float d = distance(vW.xz, uEye.xz);
  gl_FragColor = vec4(vec3(1.0), a * 0.09 * (1.0 - smoothstep(6.0, 26.0, d)));
}`;

type Station = {
  i: number;
  def: StationDef;
  z: number;
  group: THREE.Group;
  words: Word[];
  floor: Word | null;
  prop: Prop | null;
  light: THREE.SpotLight | null;
};

export class CorridorWorld {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(50, 1, 0.1, 80);
  private composer: EffectComposer;
  private lens: ShaderPass;
  private timer = new THREE.Timer();
  private mirror: Reflector | null = null;
  private floor: THREE.Mesh;
  private gridMat: THREE.ShaderMaterial;
  private key: THREE.DirectionalLight;
  private ro: ResizeObserver;
  private disposed = false;
  private stations: Station[] = [];
  private N: number;
  private portrait = false;
  private reduced = false;
  private fontsReady = false;

  private z = 0;
  private zGoal = 0;
  private sway = new THREE.Vector2();
  private swayGoal = new THREE.Vector2();
  private houseLights = 0;

  private quality = 3;
  private locked = false;
  private dprCap = 2;
  private slowFrames = 0;
  private qualityT = 0;

  private fpsAcc = 0;
  private fpsN = 0;
  private fps = 60;
  private stateT = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private defs: StationDef[],
    private opts: { onState?: (s: State) => void; onReady?: () => void } = {},
  ) {
    this.N = defs.length;
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
    this.scene.environmentIntensity = 0.25;
    pmrem.dispose();
    this.scene.background = new THREE.Color(0x050505);
    this.scene.fog = new THREE.Fog(0x050505, 7, 24);

    this.composer = new EffectComposer(r, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }));
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.lens = new ShaderPass(LENS);
    this.composer.addPass(this.lens);
    this.composer.addPass(new OutputPass());

    /* light: one cold key from above, and a pool per station */
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x000000, 0.12));
    this.key = new THREE.DirectionalLight(0xffffff, 0.9);
    this.key.position.set(-2, 8, 3);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(1024, 1024);
    this.key.shadow.camera.near = 1;
    this.key.shadow.camera.far = 30;
    const sz = 6;
    this.key.shadow.camera.left = -sz;
    this.key.shadow.camera.right = sz;
    this.key.shadow.camera.top = sz;
    this.key.shadow.camera.bottom = -sz;
    this.key.shadow.bias = -0.0004;
    this.key.shadow.normalBias = 0.03;
    this.scene.add(this.key, this.key.target);

    /* floor */
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 400), new THREE.MeshStandardMaterial({ color: 0x090909, roughness: 0.35, metalness: 0.5 }));
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.set(0, -0.02, -SPACING * this.N * 0.5);
    this.scene.add(this.floor);
    const catcher = new THREE.Mesh(new THREE.PlaneGeometry(60, 400), new THREE.ShadowMaterial({ opacity: 0.5 }));
    catcher.rotation.x = -Math.PI / 2;
    catcher.position.z = this.floor.position.z;
    catcher.receiveShadow = true;
    this.scene.add(catcher);
    this.gridMat = new THREE.ShaderMaterial({ vertexShader: GRID_VS, fragmentShader: GRID_FS, uniforms: { uEye: { value: new THREE.Vector3() } }, transparent: true, depthWrite: false });
    const grid = new THREE.Mesh(new THREE.PlaneGeometry(60, 400), this.gridMat);
    grid.rotation.x = -Math.PI / 2;
    grid.position.set(0, 0.002, this.floor.position.z);
    this.scene.add(grid);
    // Two faint rails the length of the hall, so the eye has a vanishing point.
    const railMat = new THREE.MeshBasicMaterial({ color: 0x2a2a2a });
    for (const x of [-3.2, 3.2]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 400), railMat);
      rail.position.set(x, 0.015, this.floor.position.z);
      this.scene.add(rail);
    }

    /* stations */
    defs.forEach((def, i) => {
      const z = -i * SPACING;
      const group = new THREE.Group();
      group.position.z = z;
      this.scene.add(group);
      let prop: Prop | null = null;
      let light: THREE.SpotLight | null = null;
      if (def.prop) {
        prop = makeProp(def.prop);
        group.add(prop.group);
        light = new THREE.SpotLight(0xffffff, 60, 14, 0.42, 0.9, 1.6);
        group.add(light, light.target);
      }
      this.stations.push({ i, def, z, group, words: [], floor: null, prop, light });
    });

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.applyQuality();
    window.addEventListener("pointermove", this.onMove, { passive: true });
    this.z = this.zGoal = this.readScroll();
    r.setAnimationLoop(this.frame);
    (window as unknown as { __hall?: CorridorWorld }).__hall = this;

    void readyFonts().then(() => {
      if (this.disposed) return;
      this.fontsReady = true;
      this.setWords();
    });
  }

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    window.removeEventListener("pointermove", this.onMove);
    this.ro.disconnect();
    for (const s of this.stations) {
      s.prop?.dispose();
      for (const w of s.words) w.dispose();
      s.floor?.dispose();
    }
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

  /** Machines sit beside the words on a wide screen, behind and below them on a phone. */
  private placeProps() {
    for (const s of this.stations) {
      if (!s.prop || !s.light) continue;
      const side = s.i % 2 === 0 ? 1 : -1;
      if (this.portrait) {
        s.prop.group.position.set(side * 1.25, 0, -3.6);
        s.prop.group.scale.setScalar(0.62);
      } else {
        s.prop.group.position.set(side * 3.7, 0, -2.2);
        s.prop.group.scale.setScalar(1);
      }
      s.light.position.set(s.prop.group.position.x, 7, s.prop.group.position.z + 1);
      s.light.target.position.copy(s.prop.group.position);
    }
  }

  /** Lay the words out. Sizes depend on orientation, so this reruns on resize. */
  private setWords() {
    if (!this.fontsReady) return;
    const aniso = this.renderer.capabilities.getMaxAnisotropy();
    const p = this.portrait;
    const cap = { title: p ? 0.62 : 1.05, name: p ? 0.3 : 0.5, label: p ? 0.11 : 0.15, small: p ? 0.14 : 0.2 };
    const maxW = p ? 2.7 : 7.5;
    for (const s of this.stations) {
      for (const w of s.words) {
        s.group.remove(w.mesh);
        w.dispose();
      }
      s.words = [];
      if (s.floor) {
        s.group.remove(s.floor.mesh);
        s.floor.dispose();
        s.floor = null;
      }
      // Standing words, stacked from the top down, centred on the hall.
      let y = p ? 2.6 : 2.9;
      for (const line of s.def.lines) {
        const isLabel = line.size === "label";
        const w = new Word(line.text, { cap: cap[line.size], weight: isLabel ? 400 : 500, mono: line.mono || isLabel, label: isLabel, ripple: isLabel ? 0.02 : 0.06, color: isLabel ? 0x8c8c8c : 0xffffff }, aniso);
        const k = Math.min(1, maxW / w.width);
        w.mesh.scale.setScalar(k);
        y -= (w.height * k) / 2;
        w.mesh.position.set(0, y, 0);
        y -= (w.height * k) / 2 + (isLabel ? 0.12 : 0.06);
        s.group.add(w.mesh);
        s.words.push(w);
      }
      // The floor number: painted between the viewer and the words, warped by the view.
      if (s.def.floor) {
        const f = new Word(s.def.floor, { cap: p ? 1.4 : 2.4, weight: 500, ripple: 0 }, aniso);
        const k = Math.min(1, (p ? 2.6 : 6.5) / f.width);
        f.mesh.scale.setScalar(k);
        // Flat on the floor, its top away from the approaching viewer.
        f.mesh.rotation.set(-Math.PI / 2, 0, 0);
        f.mesh.position.set(0, 0.01, 4.2);
        s.group.add(f.mesh);
        s.floor = f;
      }
    }
  }

  private applyQuality() {
    const q = this.quality;
    const wantMirror = q >= 3;
    if (wantMirror && !this.mirror) {
      this.mirror = new Reflector(new THREE.PlaneGeometry(60, 400), { clipBias: 0.003, textureWidth: 768, textureHeight: 768, color: 0x1a1a1a });
      this.mirror.rotation.x = -Math.PI / 2;
      this.mirror.position.set(0, -0.01, this.floor.position.z);
      this.scene.add(this.mirror);
    } else if (!wantMirror && this.mirror) {
      this.scene.remove(this.mirror);
      this.mirror.dispose();
      this.mirror = null;
    }
    this.floor.visible = !wantMirror;
    this.lens.enabled = q >= 1;
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
    this.camera.aspect = w / h;
    const wasPortrait = this.portrait;
    this.portrait = w / h < 1;
    this.camera.fov = this.portrait ? 58 : 44;
    this.camera.updateProjectionMatrix();
    this.placeProps();
    if (wasPortrait !== this.portrait) this.setWords();
  }

  private onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    this.swayGoal.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  };

  private readScroll() {
    const el = document.scrollingElement ?? document.documentElement;
    const max = el.scrollHeight - window.innerHeight;
    const u = max > 0 ? THREE.MathUtils.clamp(el.scrollTop / max, 0, 1) : 0;
    return u * (this.N - 1) * SPACING;
  }

  private frame = () => {
    if (this.disposed) return;
    this.timer.update();
    const raw = this.timer.getDelta();
    const dt = Math.min(raw, 0.05);
    const t = this.timer.getElapsed();
    this.houseLights = Math.min(1, this.houseLights + dt / 2.5);

    this.qualityT += raw;
    if (this.qualityT > 3) {
      if (raw > 1 / 38) this.slowFrames++;
      if (this.slowFrames > 45) {
        this.slowFrames = 0;
        this.qualityT = 0;
        this.stepDown();
      }
    }

    /* the dolly: one speed, a little behind the hand */
    this.zGoal = this.readScroll();
    this.z += (this.zGoal - this.z) * Math.min(1, dt * 4);
    this.sway.lerp(this.swayGoal, Math.min(1, dt * 2));
    const camZ = 5.5 - this.z;
    this.camera.position.set(this.sway.x * 0.12, EYE + this.sway.y * 0.06, camZ);
    this.camera.lookAt(this.sway.x * 0.5, EYE - 0.55 + this.sway.y * 0.3, camZ - 9);
    this.key.position.set(-2, 8, camZ - 3);
    this.key.target.position.set(0, 0, camZ - 6);
    (this.gridMat.uniforms.uEye.value as THREE.Vector3).copy(this.camera.position);

    /* stations: fade with distance, sleep when far */
    let nearest = 0, nd = Infinity;
    for (const s of this.stations) {
      const d = camZ - s.z; // positive while ahead of the camera
      const ad = Math.abs(d);
      if (ad < nd) {
        nd = ad;
        nearest = s.i;
      }
      const active = d > -8 && d < 34;
      s.group.visible = active;
      if (!active) continue;
      // Words are solid from 3 to 10 units out, emerge from the dark beyond
      // that, and thin as you reach them.
      const fade = THREE.MathUtils.smoothstep(d, 0.6, 3.0) * (1 - THREE.MathUtils.smoothstep(d, 10, 15.5)) * this.houseLights;
      for (const w of s.words) {
        w.opacity = fade;
        w.tick(this.reduced ? 0 : t);
      }
      if (s.floor) s.floor.opacity = THREE.MathUtils.smoothstep(d + 4.2, 1.2, 3.5) * (1 - THREE.MathUtils.smoothstep(d + 4.2, 12, 18)) * this.houseLights;
      if (s.light) s.light.intensity = 60 * this.houseLights * (1 - THREE.MathUtils.smoothstep(ad, 10, 24));
      s.prop?.update(this.reduced ? 0 : dt, t);
    }

    if (this.lens.enabled) this.composer.render();
    else this.renderer.render(this.scene, this.camera);

    this.fpsAcc += raw;
    this.fpsN++;
    this.stateT += dt;
    if (this.stateT > 0.15) {
      this.stateT = 0;
      if (this.fpsAcc > 0) this.fps = Math.round(this.fpsN / this.fpsAcc);
      this.fpsAcc = 0;
      this.fpsN = 0;
      this.opts.onState?.({ station: nearest, fps: this.fps, quality: ["bare", "lite", "phone", "full"][this.quality] });
    }
    if (this.opts.onReady) {
      this.opts.onReady();
      this.opts.onReady = undefined;
    }
  };
}
