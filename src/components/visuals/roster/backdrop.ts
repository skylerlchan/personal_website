import * as THREE from "three";

/**
 * The first and last screens: one city, made of two. San Francisco and New
 * York fused into a single bright skyline, the Golden Gate running straight
 * into the Brooklyn Bridge, every landmark from both cities standing in the
 * same block.
 *
 * The picture carries it, so the shader stays out of the way: it frames the
 * image, drifts it slowly so the frame is never quite still, and softens the
 * edges into the page. It lives as a child of the camera, so it always
 * fills the frame.
 */

const VS = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const FS = /* glsl */ `
precision highp float;
uniform sampler2D uScene;
uniform float uTime;
uniform float uOpacity;
uniform float uHasScene;
uniform vec2  uCover;
uniform vec2  uFocus;
uniform vec3  uPaper;
varying vec2 vUv;

void main() {
  if (uHasScene < 0.5) discard;

  // A slow drift in and out, so the city is never quite still. Half a minute
  // each way, and small enough that you only notice it if you look.
  float breathe = 0.5 + 0.5 * sin(uTime * 0.045);
  vec2 cover = uCover * (1.0 - 0.05 * breathe);
  vec2 focus = uFocus + vec2(0.012 * breathe, 0.006 * breathe);
  vec2 suv = (vUv - 0.5) * cover + focus;

  vec3 col = texture2D(uScene, clamp(suv, 0.001, 0.999)).rgb;

  // Lift it a touch toward the paper so the dark copy sits on it comfortably,
  // and let the corners go soft rather than ending on a cut line.
  col = mix(col, uPaper, 0.1);
  float d = length((vUv - 0.5) * vec2(1.04, 1.0));
  float edge = 1.0 - smoothstep(0.42, 0.78, d);
  col = mix(uPaper, col, edge);

  gl_FragColor = vec4(col, uOpacity);
}`;

export class Backdrop {
  readonly mesh: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  private scene: THREE.Texture | null = null;
  private frameAspect = 1.6;
  private imgAspect = 1600 / 893;

  constructor() {
    const blank = new THREE.DataTexture(new Uint8Array([245, 244, 240, 255]), 1, 1);
    blank.needsUpdate = true;
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VS,
      fragmentShader: FS,
      uniforms: {
        uScene: { value: blank },
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uHasScene: { value: 0 },
        uCover: { value: new THREE.Vector2(1, 1) },
        uFocus: { value: new THREE.Vector2(0.5, 0.5) },
        uPaper: { value: new THREE.Color(0xf5f4f0) },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.mat);
    this.mesh.frustumCulled = false;

    new THREE.TextureLoader().load(
      "/images/cities.jpg",
      (tx) => {
        tx.colorSpace = THREE.SRGBColorSpace;
        tx.anisotropy = 8;
        this.scene = tx;
        this.imgAspect = tx.image.width / tx.image.height;
        this.mat.uniforms.uScene.value = tx;
        this.mat.uniforms.uHasScene.value = 1;
        this.frame();
      },
      undefined,
      () => {},
    );
  }

  /** The plane fills its own orthographic pass; only the framing changes. */
  resize(aspect: number) {
    this.frameAspect = aspect;
    this.frame();
  }

  /**
   * Cover the frame, sitting the horizon high so the sky reads as sky and
   * the water at the bottom is where the copy can sit. On a phone the city
   * is the whole point, so it crops in rather than shrinking to a stripe.
   */
  private frame() {
    const img = this.imgAspect;
    const frame = this.frameAspect;
    const cover = this.mat.uniforms.uCover.value as THREE.Vector2;
    const focus = this.mat.uniforms.uFocus.value as THREE.Vector2;
    if (frame > img) cover.set(1, img / frame);
    else cover.set(frame / img, 1);
    // A little in from the top: the skyline and the bridge, not the empty sky.
    focus.set(0.5, THREE.MathUtils.clamp(0.46, cover.y / 2, 1 - cover.y / 2));
  }

  update(t: number, opacity: number) {
    this.mat.uniforms.uTime.value = t;
    this.mat.uniforms.uOpacity.value = opacity;
    this.mesh.visible = opacity > 0.002;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mat.dispose();
    this.scene?.dispose();
  }
}
