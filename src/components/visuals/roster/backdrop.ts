import * as THREE from "three";
import { skylineTexture } from "./skyline";

/**
 * The first and last screens: him on one side, in black and white, and the
 * cities on the other, with the two dissolving into each other where they
 * meet rather than butting up against a line.
 *
 * On a wide screen he holds the right third and the city runs off to the
 * left behind the copy; on a phone he holds the top and the city the middle.
 * The seam is the whole point: across a wide band, his photo thins out as
 * the skyline comes up through it, torn a few pixels at a time, so it reads
 * as one image that cannot quite decide what it is.
 *
 * It lives as a child of the camera, so it always fills the frame.
 */

const VS = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const FS = /* glsl */ `
precision highp float;
uniform sampler2D uPhoto;
uniform sampler2D uCity;
uniform float uTime;
uniform float uOpacity;
uniform float uStrength;
uniform float uLight;      // 1 in the light theme
uniform vec2  uCover;      // how much of the photo is visible, per axis
uniform vec2  uFocus;      // where in the photo to centre
uniform vec2  uBand;       // where the city stands: base and top, in screen uv
uniform vec3  uWarm;
uniform vec3  uCool;
uniform float uDimLeft;    // 1 where the copy sits down the left
uniform sampler2D uScene; // the generated city, when there is one
uniform float uHasScene;
uniform vec2  uSceneCover;
uniform vec2  uSceneFocus;
uniform vec4  uHim;        // where he sits: begin, full, end of the dissolve, axis
varying vec2 vUv;

float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

void main() {
  /* him, black and white */
  vec2 puv = (vUv - 0.5) * uCover + uFocus;
  float g = dot(texture2D(uPhoto, clamp(puv, 0.001, 0.999)).rgb, vec3(0.299, 0.587, 0.114));
  g = clamp((g - 0.46) * (1.3 + 0.35 * uLight) + 0.4 - 0.16 * uLight, 0.0, 1.0);

  // How much of him is left here. 1 on his side, 0 past the dissolve, and
  // in between it tears: whole rows of him drop out at a time.
  float axis = mix(vUv.y, vUv.x, uHim.w);
  float him = smoothstep(uHim.x, uHim.y, axis);
  float band = 1.0 - abs(him - 0.5) * 2.0;
  float row = floor(mix(vUv.x, vUv.y, uHim.w) * 70.0);
  float tear = step(0.45, hash21(vec2(row, floor(uTime * 0.6))));
  him = clamp(him + band * band * (tear - 0.5) * 0.7, 0.0, 1.0);

  /* the two cities */
  vec3 city = vec3(0.0);
  float cy = (vUv.y - uBand.x) / (uBand.y - uBand.x);
  if (cy > 0.0 && cy < 1.0) {
    // Where the cities meet, the feed tears: whole rows slip sideways.
    float seam = 1.0 - smoothstep(0.0, 0.18, abs(vUv.x - 0.5));
    float row = floor(cy * 40.0);
    float slip = (hash21(vec2(row, floor(uTime * 1.6))) - 0.5) * 0.06 * seam;
    vec2 cuv = vec2(vUv.x * 0.94 + 0.03 + slip + 0.004 * sin(uTime * 0.09), cy);
    vec4 tex = texture2D(uCity, cuv);
    float fill = tex.r, edge = tex.g;
    // Windows: a fine grid, most of them lit, each with its own slow flicker.
    vec2 cell = vec2(cuv.x * 300.0, cy * 150.0);
    vec2 id = floor(cell), f = fract(cell);
    float lit = step(0.44, hash21(id));
    float flicker = 0.5 + 0.5 * sin(uTime * 1.2 + hash21(id + 11.0) * 6.2831);
    float shape = step(0.28, f.x) * step(f.x, 0.72) * step(0.32, f.y) * step(f.y, 0.76);
    float windows = fill * lit * shape * flicker;
    vec3 tint = mix(uWarm, uCool, smoothstep(0.28, 0.72, vUv.x));
    city = tint * (1.35 * edge + 0.10 * fill + 1.15 * windows);
    city *= 1.0 - 0.72 * uHasScene;
    city *= smoothstep(0.0, 0.14, cy) * (1.0 - smoothstep(0.62, 1.0, cy) * 0.9);
  }

  /* the generated city, where there is one, standing behind everything */
  vec3 scene = vec3(0.0);
  float hasScene = 0.0;
  if (uHasScene > 0.5) {
    vec2 suv = (vUv - 0.5) * uSceneCover + uSceneFocus;
    // Only inside the picture: past its edges it feathers out to nothing
    // rather than smearing the last row of pixels across the frame.
    vec2 fe = smoothstep(vec2(0.0), vec2(0.035), suv) * smoothstep(vec2(0.0), vec2(0.035), 1.0 - suv);
    hasScene = fe.x * fe.y;
    float sg = dot(texture2D(uScene, clamp(suv, 0.001, 0.999)).rgb, vec3(0.299, 0.587, 0.114));
    scene = vec3(clamp((sg - 0.5) * (1.2 + 0.4 * uLight) + 0.36 - 0.14 * uLight, 0.0, 1.0)) * hasScene;
  }

  /* him on his side, the city on the other, dissolving through the middle */
  vec3 base = mix(scene, vec3(g), him);
  float lum = mix(dot(scene, vec3(0.333)), g, him);

  /* the drawn city burns in the shadows, never over his lit face */
  float w = uStrength * (1.0 - smoothstep(0.10, 0.44, lum));
  vec3 col = 1.0 - (1.0 - base) * (1.0 - city * w);

  /* the screen it is shown on */
  float scan = 1.0 - 0.055 * step(0.5, fract(gl_FragCoord.y * 0.25 + uTime * 0.04));
  col *= scan;
  vec2 grid = fract(vUv * vec2(48.0, 27.0));
  col += vec3(0.5, 0.6, 0.8) * (step(0.985, grid.x) + step(0.985, grid.y)) * 0.025;

  /* the copy needs a quiet corner to sit in */
  col *= mix(1.0, mix(0.42, 1.0, smoothstep(0.04, 0.52, vUv.x)), uDimLeft);

  /* the header lives up there */
  col *= 1.0 - 0.45 * smoothstep(0.86, 1.0, vUv.y);

  /* it fades out at the edges rather than ending on a hard line */
  float d = length((vUv - 0.5) * vec2(1.05, 1.0));
  float edgeFade = 1.0 - smoothstep(0.40, 0.72, d);
  col *= 1.0 - 0.5 * smoothstep(0.30, 0.85, d);

  /* On paper the copy is nearly black, so the photo clears out from under
     it: off the left on a wide screen, off the bottom on a phone, and away
     from the top where the header sits. Dark keeps the whole frame. */
  float clear = mix(smoothstep(0.14, 0.46, vUv.y), smoothstep(0.28, 0.62, vUv.x), uDimLeft);
  clear = min(clear, 1.0 - smoothstep(0.86, 0.98, vUv.y));
  float a = uOpacity * edgeFade * mix(1.0, clear, uLight);

  gl_FragColor = vec4(col, a);
}`;

export class Backdrop {
  readonly mesh: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  private tex: THREE.Texture;
  private city: THREE.Texture;
  private scene: THREE.Texture | null = null;
  private frameAspect = 1.6;

  constructor(private distance = 25) {
    this.city = skylineTexture();
    const blank = new THREE.DataTexture(new Uint8Array([10, 10, 10, 255]), 1, 1);
    blank.needsUpdate = true;
    this.tex = blank;
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VS,
      fragmentShader: FS,
      uniforms: {
        uPhoto: { value: blank },
        uCity: { value: this.city },
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uStrength: { value: 1 },
        uLight: { value: 0 },
        uCover: { value: new THREE.Vector2(1, 1) },
        uFocus: { value: new THREE.Vector2(0.52, 0.6) },
        uBand: { value: new THREE.Vector2(0.02, 0.62) },
        uWarm: { value: new THREE.Color(0xffa24d) },
        uCool: { value: new THREE.Color(0x8ec8ff) },
        uDimLeft: { value: 1 },
        uScene: { value: blank },
        uHasScene: { value: 0 },
        uSceneCover: { value: new THREE.Vector2(1, 1) },
        uSceneFocus: { value: new THREE.Vector2(0.5, 0.5) },
        uHim: { value: new THREE.Vector4(0.34, 0.72, 0, 1) },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.mat);
    this.mesh.position.z = -distance;
    this.mesh.renderOrder = -10;
    this.mesh.frustumCulled = false;

    const loader = new THREE.TextureLoader();
    loader.load("/images/skyler.jpg", (tx) => {
      tx.colorSpace = THREE.SRGBColorSpace;
      this.mat.uniforms.uPhoto.value = tx;
      this.tex = tx;
    });
    // The generated city, if it has been added to the project. Optional on
    // purpose: without it the drawn skyline still carries the frame.
    loader.load(
      "/images/cities.jpg",
      (tx) => {
        tx.colorSpace = THREE.SRGBColorSpace;
        this.scene = tx;
        this.setScene(tx);
      },
      undefined,
      () => {},
    );
  }

  /** Size the plane to fill the camera's frustum, and frame the face. */
  resize(camera: THREE.PerspectiveCamera, portrait: boolean) {
    const h = 2 * this.distance * Math.tan((camera.fov * Math.PI) / 360);
    const w = h * camera.aspect;
    this.mesh.scale.set(w, h, 1);
    this.frameAspect = camera.aspect;
    // Cover: the photo is square, so the long side of the frame is the one
    // that shows in full. A little zoom leaves room to sit the face high.
    const planeAspect = camera.aspect;
    const zoom = portrait ? 1.3 : 1.1;
    const cover = planeAspect > 1 ? new THREE.Vector2(1, 1 / planeAspect) : new THREE.Vector2(planeAspect, 1);
    cover.multiplyScalar(1 / zoom);
    this.mat.uniforms.uCover.value.copy(cover);
    // Sit him right of centre on a wide screen, so the copy has the left to
    // itself; centred and high on a phone, where the copy takes the bottom.
    // The window is kept inside the photo, or the edge pixel smears.
    const focus = new THREE.Vector2(portrait ? 0.52 : 0.4, portrait ? 0.55 : 0.62);
    focus.x = THREE.MathUtils.clamp(focus.x, cover.x / 2 - 0.06, 1 - cover.x / 2 + 0.06);
    focus.y = THREE.MathUtils.clamp(focus.y, cover.y / 2, 1 - cover.y / 2);
    this.mat.uniforms.uFocus.value.copy(focus);
    // The skyline stands across the lower half, higher on a phone where the
    // copy takes the bottom third.
    this.mat.uniforms.uBand.value.set(portrait ? 0.3 : 0.05, portrait ? 0.88 : 0.64);
    this.mat.uniforms.uDimLeft.value = portrait ? 0 : 1;
    // Where he ends and the city begins. Wide: he holds the right, dissolving
    // leftward across the middle. Phone: he holds the top, dissolving down.
    this.mat.uniforms.uHim.value.set(portrait ? 0.33 : 0.28, portrait ? 0.6 : 0.62, 0, portrait ? 0 : 1);
    this.frameScene(portrait);
  }

  /**
   * Frame the generated city. On a wide screen it covers the frame; on a
   * phone the whole panorama is shown across the width and sits as a band in
   * the middle, because cropping a 16:9 city into a tall strip leaves three
   * buildings and no city.
   */
  private frameScene(portrait: boolean) {
    const img = 1024 / 572;
    const frame = this.frameAspect;
    const cover = this.mat.uniforms.uSceneCover.value as THREE.Vector2;
    const focus = this.mat.uniforms.uSceneFocus.value as THREE.Vector2;
    if (portrait) {
      // The whole panorama across the width, as a band in the middle: the
      // window in image space is taller than the image, and everything
      // outside it feathers away to nothing.
      // A little narrower than the full panorama, so the band has some height.
      const fit = 0.78;
      cover.set(fit, (img / frame) * fit);
      const bandCentre = 0.44;
      focus.set(0.5, 0.5 + (0.5 - bandCentre) * cover.y);
    } else {
      // Cover, with a little zoom, sitting the skyline just below centre.
      const zoom = 1.06;
      if (frame > img) cover.set(1 / zoom, img / frame / zoom);
      else cover.set(frame / img / zoom, 1 / zoom);
      focus.set(0.5, THREE.MathUtils.clamp(0.52, cover.y / 2, 1 - cover.y / 2));
    }
  }

  /** Hang a generated cityscape behind him. */
  setScene(tex: THREE.Texture) {
    this.mat.uniforms.uScene.value = tex;
    this.mat.uniforms.uHasScene.value = 1;
    this.frameScene(this.frameAspect < 1);
  }

  update(t: number, opacity: number, dark: boolean) {
    const u = this.mat.uniforms;
    u.uTime.value = t;
    u.uOpacity.value = opacity;
    u.uStrength.value = dark ? 1.0 : 0.72;
    u.uLight.value = dark ? 0 : 1;
    this.mesh.visible = opacity > 0.002;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mat.dispose();
    this.city.dispose();
    this.tex.dispose();
    this.scene?.dispose();
  }
}
