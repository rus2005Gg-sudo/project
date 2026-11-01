import * as THREE from "three";
import { ctex, fbm, rng, clamp, lerp, hash, win } from "./util.js";

/* ---- textures ---------------------------------------------------------- */
export function smokeTex() {
  return ctex(128, 128, (g, w, h) => {
    const id = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (x - 64) / 64, dy = (y - 64) / 64, d = Math.sqrt(dx * dx + dy * dy); const n = fbm(x / w + 0.3, y / h + 0.7, 4, 4, 3);
      let a = Math.max(0, 1 - d) ; a = Math.pow(a, 1.1) * (0.55 + n * 0.9); a = Math.min(1, a);
      const i = (y * w + x) * 4; id.data[i] = 255; id.data[i + 1] = 255; id.data[i + 2] = 255; id.data[i + 3] = a * 255;
    }
    g.putImageData(id, 0, 0);
  }, { rep: false });
}
export function flameTex() {
  return ctex(128, 256, (g, w, h) => {
    const id = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const u = (x / w - 0.5) * 2, v = y / h; // v 0 top (tip) .. 1 bottom
      const wid = Math.pow(Math.sin(Math.min(1, v * 1.05) * Math.PI * 0.9 + 0.1), 0.8) * 0.85 * (0.25 + 0.75 * v);
      const n = fbm(x / w * 2 + 1.7, y / h * 3 + 0.4, 4, 4, 5);
      const d = Math.abs(u) / Math.max(0.05, wid + (n - 0.5) * 0.35); let a = clamp(1 - d); a = Math.pow(a, 0.9) * (0.2 + 0.8 * Math.pow(v, 0.4));
      const core = clamp(1 - d * 1.5) * v; // yellow-white inside
      const i = (y * w + x) * 4; id.data[i] = 255; id.data[i + 1] = lerp(70, 250, core * 1.1); id.data[i + 2] = lerp(10, 190, core * core); id.data[i + 3] = a * 255;
    }
    g.putImageData(id, 0, 0);
  }, { rep: false });
}
export function glowTex() {
  return ctex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,.45)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, { rep: false });
}
export function sparkTex() { return ctex(32, 32, (g, w, h) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "rgba(255,240,200,1)"); gr.addColorStop(0.4, "rgba(255,150,40,.8)"); gr.addColorStop(1, "rgba(255,80,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, { rep: false }); }

/* ---- emitters (all pure functions of time, so seeking is exact) --------- */
export class Fire {
  constructor(scene, flame, glow, spark, { pos = [0, 0, 0], width = 1, height = 1.5, n = 34, seed = 1, intensity = 1 } = {}) {
    this.g = new THREE.Group(); this.g.position.set(...pos); scene.add(this.g); this.n = n; this.w = width; this.h = height; this.seed = seed; this.I = intensity;
    this.f = []; this.s = [];
    for (let i = 0; i < n; i++) { const m = new THREE.SpriteMaterial({ map: flame, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }); const sp = new THREE.Sprite(m); this.g.add(sp); this.f.push(sp); }
    for (let i = 0; i < 18; i++) { const m = new THREE.SpriteMaterial({ map: spark, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }); const sp = new THREE.Sprite(m); this.g.add(sp); this.s.push(sp); }
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xff7a22, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); this.g.add(this.glow);
    this.light = { intensity: 0 };
  }
  update(t, k = 1) { // k: overall 0..1 strength
    const K = k * this.I; this.g.visible = K > 0.01;
    for (let i = 0; i < this.n; i++) {
      const sp = this.f[i], r1 = hash(i * 3.1 + this.seed), r2 = hash(i * 7.7 + this.seed * 2), ph = ((t * (0.7 + r1 * 0.7) + r2) % 1);
      const life = ph, rise = Math.pow(life, 0.85) * this.h * (0.6 + 0.6 * r1);
      const sway = Math.sin(t * (3 + r2 * 4) + i) * 0.12 * life * this.w;
      sp.position.set((r1 - 0.5) * this.w * (1 - life * 0.55) + sway, rise * K + 0.05, (r2 - 0.5) * 0.3);
      const sc = (0.55 + r2 * 0.6) * this.w * 0.75 * (1 - life * 0.55) * (0.5 + 0.5 * K); sp.scale.set(sc, sc * 2.0 * (0.8 + 0.4 * r1), 1);
      sp.material.opacity = Math.sin(life * Math.PI) * 0.95 * Math.min(1, K * 1.3); sp.material.rotation = Math.sin(t * 2 + i) * 0.08;
    }
    for (let i = 0; i < this.s.length; i++) {
      const sp = this.s[i], r1 = hash(i * 5.3 + this.seed), r2 = hash(i * 9.1 + this.seed), ph = ((t * (0.35 + r1 * 0.5) + r2) % 1);
      sp.position.set((r1 - 0.5) * this.w * 1.4 + Math.sin(t * 3 + i * 2) * 0.2 * ph, ph * this.h * (1.4 + r2) * K, (r2 - 0.5) * 0.6);
      const sc = 0.05 + 0.05 * r1; sp.scale.set(sc, sc, 1); sp.material.opacity = (1 - ph) * K * 0.9;
    }
    const fl = 0.85 + 0.15 * Math.sin(t * 13 + this.seed) + 0.1 * Math.sin(t * 31.3) + 0.08 * Math.sin(t * 7.7 + 2);
    this.light.intensity = K * 28 * fl * this.w; this.glow.material.opacity = K * 0.55 * fl; this.glow.scale.set(this.w * 5.5, this.h * 3.2, 1); this.glow.position.set(0, this.h * 0.45, 0.1);
  }
}

export class Smoke {
  /* volume box [x0,x1]x[y0,y1]x[z0,z1]; level(t) 0..1 controls density + how low it hangs; tint toward orange near source x */
  constructor(scene, tex, { box, n = 90, seed = 1, size = [1.6, 3.2], src = null, color = 0x2a2724 } = {}) {
    this.box = box; this.n = n; this.seed = seed; this.size = size; this.src = src; this.p = [];
    this.g = new THREE.Group(); scene.add(this.g);
    for (let i = 0; i < n; i++) { const m = new THREE.SpriteMaterial({ map: tex, color, transparent: true, depthWrite: false, opacity: 0, fog: false }); const sp = new THREE.Sprite(m); sp.renderOrder = 5; this.g.add(sp); this.p.push(sp); }
  }
  update(t, level, drop = 0, cp = null) { // drop: 0..1 how far the layer descends toward the floor
    const [x0, x1, y0, y1, z0, z1] = this.box;
    for (let i = 0; i < this.n; i++) {
      const sp = this.p[i], r1 = hash(i * 1.7 + this.seed), r2 = hash(i * 4.9 + this.seed), r3 = hash(i * 8.3 + this.seed), r4 = hash(i * 2.9 + this.seed * 3);
      // x position biased toward source and advancing with level
      const adv = clamp(level * 1.4 - 0.1); const xx = this.src != null ? lerp(this.src, lerp(this.src, r1 > 0.5 ? x0 : x1, 1), 1) : 0;
      let x = lerp(x0, x1, r1); if (this.src != null) { const d = Math.abs(x - this.src) / Math.abs((r1 > 0.5 ? x1 : x0) - this.src + 1e-6); x = lerp(this.src, x, clamp(adv * 1.3 - 0.0)); }
      const ceil = y1, floorY = lerp(y1 - (y1 - y0) * 0.55, y0 + 0.5, drop); const band = lerp(floorY, ceil, Math.pow(r2, 0.7));
      const y = band + Math.sin(t * 0.5 + i) * 0.12; const z = lerp(z0, z1, r3) + Math.sin(t * 0.37 + i * 1.3) * 0.2;
      sp.position.set(x + Math.sin(t * 0.3 + i * 0.7) * 0.4 + t * 0.0, y, z);
      const sc = lerp(this.size[0], this.size[1], r4) * (0.8 + 0.2 * Math.sin(t * 0.6 + i)); sp.scale.set(sc, sc * 0.8, 1);
      const dens = clamp(level * 1.6 - (1 - r2) * 0.25 - 0.03); const dc = cp ? sp.position.distanceTo(cp) : 99, fd = clamp((dc - 0.9) / 2.6); sp.material.opacity = dens * 0.7 * (0.55 + 0.45 * r4) * fd * fd * (3 - 2 * fd);
      sp.material.rotation = t * 0.04 * (r1 - 0.5) * 4 + i;
      // warm tint near the fire end
      const hot = this.src != null ? clamp(1 - Math.abs(x - this.src) / 7) : 0; sp.material.color.setRGB(lerp(0.1, 0.5, hot * 0.9), lerp(0.095, 0.24, hot * 0.7), lerp(0.095, 0.08, hot));
    }
  }
}

/* rising smoke plume for the exterior: sprites that drift up and to +x */
export class Plume {
  constructor(scene, tex, { pos = [0, 0, 0], n = 60, seed = 1, height = 26, drift = 8 } = {}) {
    this.g = new THREE.Group(); this.g.position.set(...pos); scene.add(this.g); this.n = n; this.seed = seed; this.h = height; this.d = drift; this.p = [];
    for (let i = 0; i < n; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0x1f1d1b, transparent: true, depthWrite: false, opacity: 0 })); sp.renderOrder = 6; this.g.add(sp); this.p.push(sp); }
  }
  update(t, k = 1) {
    for (let i = 0; i < this.n; i++) {
      const sp = this.p[i], r1 = hash(i * 1.3 + this.seed), r2 = hash(i * 6.1 + this.seed), ph = (t * 0.12 + i / this.n + r1 * 0.05) % 1;
      sp.position.set(Math.pow(ph, 1.3) * this.d + (r1 - 0.5) * 2 * (1 + ph * 4), ph * this.h, (r2 - 0.5) * 3 + ph * 4);
      const sc = 2 + ph * 14 * (0.7 + r2 * 0.6); sp.scale.set(sc, sc, 1); sp.material.opacity = Math.sin(Math.min(1, ph * 1.15) * Math.PI) * 0.7 * k;
      sp.material.color.setRGB(lerp(0.32, 0.1, Math.min(1, ph * 2)), lerp(0.22, 0.095, Math.min(1, ph * 2)), lerp(0.16, 0.09, Math.min(1, ph * 2))); sp.material.rotation = i + t * 0.05;
    }
  }
}
