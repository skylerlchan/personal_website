import * as THREE from "three";
import { skylineTexture } from "./skyline";

/**
 * The first and last screens: him, full bleed, in black and white, with San
 * Francisco and New York merged into the dark of the frame.
 *
 * It is a double exposure. The photo is desaturated and pushed for contrast;
 * the city is a neon wireframe with its windows lit, screen-blended into the
 * shadows only, so his lit face stays his face. Warm light on the left is San
 * Francisco, cool light on the right is New York, and where they meet in the
 * middle the two feeds tear into each other a few pixels at a time.
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
varying vec2 vUv;

float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

void main() {
  /* him, black and white */
  vec2 puv = (vUv - 0.5) * uCover + uFocus;
  float g = dot(texture2D(uPhoto, clamp(puv, 0.001, 0.999)).rgb, vec3(0.299, 0.587, 0.114));
  g = clamp((g - 0.46) * 1.3 + 0.4, 0.0, 1.0);

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
    city *= smoothstep(0.0, 0.14, cy) * (1.0 - smoothstep(0.62, 1.0, cy) * 0.9);
  }

  /* the city burns in the shadows, never over his lit face */
  float w = uStrength * (1.0 - smoothstep(0.10, 0.44, g));
  vec3 col = 1.0 - (1.0 - vec3(g)) * (1.0 - city * w);

  /* the screen it is shown on */
  float scan = 1.0 - 0.055 * step(0.5, fract(gl_FragCoord.y * 0.25 + uTime * 0.04));
  col *= scan;
  vec2 grid = fract(vUv * vec2(48.0, 27.0));
  col += vec3(0.5, 0.6, 0.8) * (step(0.985, grid.x) + step(0.985, grid.y)) * 0.025;

  /* the copy needs a quiet corner to sit in */
  col *= mix(1.0, mix(0.42, 1.0, smoothstep(0.04, 0.52, vUv.x)), uDimLeft);

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
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.mat);
    this.mesh.position.z = -distance;
    this.mesh.renderOrder = -10;
    this.mesh.frustumCulled = false;

    new THREE.TextureLoader().load("/images/skyler.jpg", (tx) => {
      tx.colorSpace = THREE.SRGBColorSpace;
      this.mat.uniforms.uPhoto.value = tx;
      this.tex = tx;
    });
  }

  /** Size the plane to fill the camera's frustum, and frame the face. */
  resize(camera: THREE.PerspectiveCamera, portrait: boolean) {
    const h = 2 * this.distance * Math.tan((camera.fov * Math.PI) / 360);
    const w = h * camera.aspect;
    this.mesh.scale.set(w, h, 1);
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
  }
}
