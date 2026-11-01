import * as THREE from "three";

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, u) => a + (b - a) * u;
export const ease = (u) => u * u * (3 - 2 * u);
export const win = (t, a, b) => clamp((t - a) / (b - a));
export const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export const noise1 = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u); };
export const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

/* tileable value noise on an integer lattice */
const ih = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export function vnoise(x, y, px, py, s = 0) {
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const w = (v, p) => ((v % p) + p) % p;
  const a = ih(w(x0, px), w(y0, py), s), b = ih(w(x0 + 1, px), w(y0, py), s), c = ih(w(x0, px), w(y0 + 1, py), s), d = ih(w(x0 + 1, px), w(y0 + 1, py), s);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
}
export function fbm(u, v, base = 4, oct = 4, s = 0) {
  let a = 0.5, sum = 0, f = base;
  for (let o = 0; o < oct; o++) { sum += a * vnoise(u * f, v * f, f, f, s + o * 17); f *= 2; a *= 0.5; }
  return sum;
}

/* canvas texture from a 2d draw callback */
export function ctex(w, h, draw, { rep = true, srgb = true, aniso = 8 } = {}) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso;
  if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.userData = { g, w, h }; return t;
}

/* per-pixel generator -> { map, bump }; fn(x,y,u,v) -> [r,g,b,height] with 0..255 colours, 0..1 height */
export function gen(w, h, fn, { rep = true } = {}) {
  const cc = document.createElement("canvas"); cc.width = w; cc.height = h; const cg = cc.getContext("2d"); const ci = cg.createImageData(w, h);
  const bc = document.createElement("canvas"); bc.width = w; bc.height = h; const bg = bc.getContext("2d"); const bi = bg.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const r = fn(x, y, x / w, y / h), i = (y * w + x) * 4;
    ci.data[i] = r[0]; ci.data[i + 1] = r[1]; ci.data[i + 2] = r[2]; ci.data[i + 3] = 255;
    const hv = clamp(r[3] === undefined ? 0.5 : r[3]) * 255; bi.data[i] = bi.data[i + 1] = bi.data[i + 2] = hv; bi.data[i + 3] = 255;
  }
  cg.putImageData(ci, 0, 0); bg.putImageData(bi, 0, 0);
  const map = new THREE.CanvasTexture(cc); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  const bump = new THREE.CanvasTexture(bc); bump.anisotropy = 8;
  if (rep) { map.wrapS = map.wrapT = bump.wrapS = bump.wrapT = THREE.RepeatWrapping; }
  map.userData = { g: cg, w, h }; return { map, bump };
}

export const mix3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export const hex3 = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
