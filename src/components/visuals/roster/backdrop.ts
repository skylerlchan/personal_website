import * as THREE from "three";
import { skylineTexture } from "./skyline";

/**
 * The first and last screens: one impossible city, where San Francisco and
 * New York have grown into each other. The photograph does the work; the
 * drawn skyline sits faintly on top of it with its windows lit, and the
 * whole thing is shown on a screen that is not quite clean.
 *
 * It lives as a child of the camera, so it always fills the frame.
 */

const VS = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const FS = /* glsl */ `
precision highp float;
uniform sampler2D uCity;   // the drawn skyline: fill in red, outline in green
uniform sampler2D uScene;  // the photographed city
uniform float uTime;
uniform float uOpacity;
uniform float uHasScene;
uniform vec2  uSceneCover;
uniform vec2  uSceneFocus;
uniform vec2  uBand;       // where the drawn skyline stands, in screen uv
uniform vec3  uWarm;
uniform vec3  uCool;
varying vec2 vUv;

float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

void main() {
  /* the photograph */
  vec3 base = vec3(0.0);
  if (uHasScene > 0.5) {
    vec2 suv = (vUv - 0.5) * uSceneCover + uSceneFocus;
    // Only inside the picture: past its edges it feathers away to nothing
    // rather than smearing the last row of pixels across the frame.
    vec2 fe = smoothstep(vec2(0.0), vec2(0.04), suv) * smoothstep(vec2(0.0), vec2(0.04), 1.0 - suv);
    float sg = dot(texture2D(uScene, clamp(suv, 0.001, 0.999)).rgb, vec3(0.299, 0.587, 0.114));
    base = vec3(clamp((sg - 0.5) * 1.25 + 0.34, 0.0, 1.0)) * fe.x * fe.y;
  }

  /* the drawn city, lit, laid faintly over it */
  vec3 city = vec3(0.0);
  float cy = (vUv.y - uBand.x) / (uBand.y - uBand.x);
  if (cy > 0.0 && cy < 1.0) {
    vec2 cuv = vec2(vUv.x * 0.94 + 0.03 + 0.004 * sin(uTime * 0.09), cy);
    vec4 tex = texture2D(uCity, cuv);
    float fill = tex.r, edge = tex.g;
    vec2 cell = vec2(cuv.x * 300.0, cy * 150.0);
    vec2 id = floor(cell), f = fract(cell);
    float lit = step(0.44, hash21(id));
    float flicker = 0.5 + 0.5 * sin(uTime * 1.2 + hash21(id + 11.0) * 6.2831);
    float shape = step(0.28, f.x) * step(f.x, 0.72) * step(0.32, f.y) * step(f.y, 0.76);
    float windows = fill * lit * shape * flicker;
    vec3 tint = mix(uWarm, uCool, smoothstep(0.28, 0.72, vUv.x));
    city = tint * (0.85 * edge + 0.06 * fill + 0.9 * windows) * (1.0 - 0.55 * uHasScene);
    city *= smoothstep(0.0, 0.14, cy) * (1.0 - smoothstep(0.62, 1.0, cy) * 0.9);
  }

  /* it burns in the shadows, never across what is already lit */
  float lum = dot(base, vec3(0.333));
  vec3 col = 1.0 - (1.0 - base) * (1.0 - city * (1.0 - smoothstep(0.10, 0.5, lum)));

  /* the screen it is shown on */
  col *= 1.0 - 0.055 * step(0.5, fract(gl_FragCoord.y * 0.25 + uTime * 0.04));
  vec2 grid = fract(vUv * vec2(48.0, 27.0));
  col += vec3(0.5, 0.6, 0.8) * (step(0.985, grid.x) + step(0.985, grid.y)) * 0.025;

  /* the header lives up there */
  col *= 1.0 - 0.45 * smoothstep(0.86, 1.0, vUv.y);

  /* it fades out at the edges rather than ending on a hard line */
  float d = length((vUv - 0.5) * vec2(1.05, 1.0));
  col *= 1.0 - 0.5 * smoothstep(0.30, 0.85, d);
  gl_FragColor = vec4(col, uOpacity * (1.0 - smoothstep(0.42, 0.74, d)));
}`;

export class Backdrop {
  readonly mesh: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  private city: THREE.Texture;
  private scene: THREE.Texture | null = null;
  private frameAspect = 1.6;

  constructor(private distance = 25) {
    this.city = skylineTexture();
    const blank = new THREE.DataTexture(new Uint8Array([10, 10, 10, 255]), 1, 1);
    blank.needsUpdate = true;
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VS,
      fragmentShader: FS,
      uniforms: {
        uCity: { value: this.city },
        uScene: { value: blank },
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uHasScene: { value: 0 },
        uSceneCover: { value: new THREE.Vector2(1, 1) },
        uSceneFocus: { value: new THREE.Vector2(0.5, 0.5) },
        uBand: { value: new THREE.Vector2(0.05, 0.64) },
        uWarm: { value: new THREE.Color(0xffa24d) },
        uCool: { value: new THREE.Color(0x8ec8ff) },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.mat);
    this.mesh.position.z = -distance;
    this.mesh.renderOrder = -10;
    this.mesh.frustumCulled = false;

    // The generated city. Optional on purpose: without it the drawn skyline
    // carries the frame on its own.
    new THREE.TextureLoader().load(
      "/images/cities.jpg",
      (tx) => {
        tx.colorSpace = THREE.SRGBColorSpace;
        this.scene = tx;
        this.mat.uniforms.uScene.value = tx;
        this.mat.uniforms.uHasScene.value = 1;
        this.frameScene(this.frameAspect < 1);
      },
      undefined,
      () => {},
    );
  }

  /** Size the plane to fill the camera's frustum. */
  resize(camera: THREE.PerspectiveCamera, portrait: boolean) {
    const h = 2 * this.distance * Math.tan((camera.fov * Math.PI) / 360);
    this.mesh.scale.set(h * camera.aspect, h, 1);
    this.frameAspect = camera.aspect;
    this.mat.uniforms.uBand.value.set(portrait ? 0.3 : 0.05, portrait ? 0.88 : 0.64);
    this.frameScene(portrait);
  }

  /**
   * Frame the photograph. On a wide screen it covers the frame; on a phone
   * the whole panorama is shown across the width and sits as a band, because
   * cropping a 16:9 city into a tall strip leaves three buildings.
   */
  private frameScene(portrait: boolean) {
    const img = 1024 / 572;
    const frame = this.frameAspect;
    const cover = this.mat.uniforms.uSceneCover.value as THREE.Vector2;
    const focus = this.mat.uniforms.uSceneFocus.value as THREE.Vector2;
    if (portrait) {
      const fit = 0.9;
      cover.set(fit, (img / frame) * fit);
      const centre = 0.56;
      focus.set(0.5, 0.5 + (0.5 - centre) * cover.y);
    } else {
      const zoom = 1.04;
      if (frame > img) cover.set(1 / zoom, img / frame / zoom);
      else cover.set(frame / img / zoom, 1 / zoom);
      focus.set(0.5, THREE.MathUtils.clamp(0.54, cover.y / 2, 1 - cover.y / 2));
    }
  }

  update(t: number, opacity: number) {
    this.mat.uniforms.uTime.value = t;
    this.mat.uniforms.uOpacity.value = opacity;
    this.mesh.visible = opacity > 0.002;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mat.dispose();
    this.city.dispose();
    this.scene?.dispose();
  }
}
