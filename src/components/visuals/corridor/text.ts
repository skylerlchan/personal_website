import * as THREE from "three";

/**
 * Words as objects. Each word is drawn once into a canvas with the page's
 * own typeface, then stretched over a finely subdivided plane so a vertex
 * shader can bend it. The same slow ripple runs through every standing word;
 * words lying on the floor are left to perspective.
 */

const VS = /* glsl */ `
uniform float uTime;
uniform float uRipple;
uniform float uBend;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  // The surface is a gentle cylinder around the viewer: the ends of a long
  // word fall away. Then one slow wave along it, a fainter one across it.
  p.z -= uBend * p.x * p.x;
  p.z += uRipple * (0.5 * sin(p.x * 1.4 + uTime * 0.45) + 0.2 * sin(p.y * 3.0 - uTime * 0.3));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

const FS = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  float a = texture2D(uMap, vUv).a;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor, a * uOpacity);
}`;

export type TextStyle = {
  /** World height of the capital letters. */
  cap: number;
  weight?: number;
  mono?: boolean;
  /** Uppercase with tracking, for labels. */
  label?: boolean;
  color?: number;
  /** Ripple amplitude, world units. 0 for floor text. */
  ripple?: number;
};

let sansFamily = "sans-serif";
let monoFamily = "monospace";

/** Resolve the page's real font families (next/font generates the names). */
export async function readyFonts() {
  const cs = getComputedStyle(document.body);
  sansFamily = cs.getPropertyValue("--font-geist").trim() || cs.fontFamily || sansFamily;
  monoFamily = cs.getPropertyValue("--font-geist-mono").trim() || monoFamily;
  try {
    await document.fonts.ready;
    await Promise.all([document.fonts.load(`500 100px ${sansFamily}`), document.fonts.load(`400 100px ${monoFamily}`)]);
  } catch {
    /* fall back to whatever is loaded */
  }
}

export class Word {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  width: number;
  height: number;
  private tex: THREE.CanvasTexture;

  constructor(text: string, style: TextStyle, anisotropy = 8) {
    const px = 160; // canvas pixels per cap-height unit
    const weight = style.weight ?? 500;
    const family = style.mono ? monoFamily : sansFamily;
    const tracking = style.label ? 0.22 : style.mono ? 0 : -0.035;
    const draw = style.label ? text.toUpperCase() : text;

    const c = document.createElement("canvas");
    const ctx = c.getContext("2d")!;
    ctx.font = `${weight} ${px}px ${family}`;
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${tracking * px}px`;
    const m = ctx.measureText(draw);
    const asc = m.actualBoundingBoxAscent || px * 0.75;
    const desc = m.actualBoundingBoxDescent || px * 0.22;
    const pad = px * 0.15;
    c.width = Math.ceil(m.width + pad * 2 + Math.abs(tracking * px));
    c.height = Math.ceil(asc + desc + pad * 2);
    ctx.font = `${weight} ${px}px ${family}`;
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${tracking * px}px`;
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(draw, pad, pad + asc);

    this.tex = new THREE.CanvasTexture(c);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = anisotropy;
    this.tex.minFilter = THREE.LinearMipmapLinearFilter;
    this.tex.generateMipmaps = true;

    // World size from cap height: the capital letters are ~0.72 of px.
    const scale = style.cap / (px * 0.72);
    this.width = c.width * scale;
    this.height = c.height * scale;
    const geo = new THREE.PlaneGeometry(this.width, this.height, Math.max(8, Math.round(this.width * 16)), 6);
    this.material = new THREE.ShaderMaterial({
      vertexShader: VS,
      fragmentShader: FS,
      uniforms: {
        uMap: { value: this.tex },
        uColor: { value: new THREE.Color(style.color ?? 0xffffff) },
        uOpacity: { value: 1 },
        uTime: { value: 0 },
        uRipple: { value: style.ripple ?? 0 },
        uBend: { value: 0.03 },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(geo, this.material);
  }
  set opacity(v: number) {
    this.material.uniforms.uOpacity.value = v;
  }
  set ripple(v: number) {
    this.material.uniforms.uRipple.value = v;
  }
  tick(t: number) {
    this.material.uniforms.uTime.value = t;
  }
  dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.tex.dispose();
  }
}
