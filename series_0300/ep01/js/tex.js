import * as THREE from "three";
import { gen, ctex, fbm, vnoise, mix3, hex3, clamp, lerp, rng } from "./util.js";

const S = 512;
const J = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

/* ---- raw pixel textures ------------------------------------------------ */
function parquet() {
  const planks = 8, L = 4; // planks across, boards per column
  return gen(S, S, (x, y, u, v) => {
    const row = Math.floor(v * planks), pv = v * planks - row; const off = ((row * 0.37) % 1);
    const col = Math.floor(u * L + off), pu = (u * L + off) - col; const id = row * 13 + (col % L + L) % L * 7;
    const tone = 0.82 + 0.3 * vnoise(id, 3, 999, 999, 4);
    const g = fbm(u * 2 + id * 0.17, v * 36 + id, 4, 4, 11);
    const ring = 0.5 + 0.5 * Math.sin((g * 9 + pu * 0.4) * 6.28);
    let c = mix3(hex3(0xb27a3d), hex3(0x8a5628), ring * 0.7 + g * 0.3); c = J(c, tone);
    const gap = Math.min(pv, 1 - pv) * planks * 14 < 1 || Math.min(pu, 1 - pu) * L * 14 < 1; // joints
    if (gap) c = J(c, 0.35);
    return [c[0], c[1], c[2], gap ? 0.1 : 0.55 + 0.25 * ring];
  });
}
function tiles() {
  return gen(S, S, (x, y, u, v) => {
    const n = 4, tu = u * n, tv = v * n, iu = Math.floor(tu), iv = Math.floor(tv), fu = tu - iu, fv = tv - iv;
    const chk = (iu + iv) & 1; const base = chk ? hex3(0xc98a4f) : hex3(0xa8652f);
    const sp = vnoise(x * 0.5, y * 0.5, 256, 256, 3) > 0.68 ? 1.12 : 1; const wear = 0.9 + 0.2 * fbm(u * 3 + iu, v * 3 + iv, 4, 3, 6);
    let c = J(base, sp * wear);
    const edge = Math.min(fu, 1 - fu, fv, 1 - fv) * S / n; const grout = edge < 2.2;
    if (grout) c = hex3(0x4a3d33);
    const shine = 0.35 * fbm(u * 6, v * 6, 4, 2, 9);
    return [c[0], c[1], c[2], grout ? 0.1 : 0.6 + shine * 0.3];
  });
}
function wallPanel() { // soviet-school wall: green oil-paint lower, cream plaster upper. v:0 top..1 bottom (3.2m)
  return gen(S, 1024, (x, y, u, v) => {
    const split = 0.50; const n = fbm(u * 6, v * 6, 4, 4, 21), n2 = fbm(u * 40, v * 40, 4, 2, 31);
    let c, h;
    if (v < split) { c = J(hex3(0xe8e1cc), 0.93 + n * 0.14); h = 0.5 + n2 * 0.4; if (v > split - 0.02) { c = J(c, 0.75); } }
    else { c = J(hex3(0x6c8f78), 0.88 + n * 0.22); h = 0.5 + n2 * 0.12; if (v < split + 0.012) c = hex3(0xc9d6c4); }
    const scuff = Math.pow(vnoise(u * 18, v * 40, 18, 40, 5), 4) * (v > split ? 1 : 0.2); c = J(c, 1 - scuff * 0.3);
    return [c[0], c[1], c[2], h];
  }, { rep: true });
}
function plaster() {
  return gen(S, S, (x, y, u, v) => { const n = fbm(u * 5, v * 5, 4, 5, 2); const c = J(hex3(0xdcd6c4), 0.88 + n * 0.22); return [c[0], c[1], c[2], 0.4 + n * 0.5]; });
}
function ceilingTile() {
  return gen(S, S, (x, y, u, v) => {
    const n = 2, fu = (u * n) % 1, fv = (v * n) % 1; const edge = Math.min(fu, 1 - fu, fv, 1 - fv) * S / n; let c = J(hex3(0xe9e7de), 0.94 + 0.08 * fbm(u * 7, v * 7, 4, 3, 9));
    const px = (fu * 12) % 1, py = (fv * 12) % 1; const dot = (Math.hypot(px - 0.5, py - 0.5) < 0.16) && edge > 6;
    if (dot) c = J(c, 0.62); if (edge < 3) c = J(hex3(0x9a9a96), 1);
    return [c[0], c[1], c[2], edge < 3 ? 0.05 : dot ? 0.15 : 0.55];
  });
}
function woodLight() { // desk veneer
  return gen(S, S, (x, y, u, v) => { const g = fbm(u * 1.5, v * 28, 4, 4, 41); const r = 0.5 + 0.5 * Math.sin((g * 8 + u * 0.3) * 6.28); const c = mix3(hex3(0xd4a76a), hex3(0xb48244), r); return [c[0], c[1], c[2], 0.45 + 0.3 * r]; });
}
function woodDark() { // doors / frames
  return gen(S, S, (x, y, u, v) => { const g = fbm(u * 1.2, v * 22, 4, 4, 51); const r = 0.5 + 0.5 * Math.sin((g * 7) * 6.28); const c = mix3(hex3(0x8a5a2f), hex3(0x5c3a1d), r); return [c[0], c[1], c[2], 0.4 + 0.3 * r]; });
}
function brick() {
  return gen(S, S, (x, y, u, v) => {
    const rows = 12, cols = 6; const row = Math.floor(v * rows), fv = v * rows - row; const off = (row & 1) ? 0.5 : 0;
    const cu = u * cols + off, col = Math.floor(cu), fu = cu - col; const id = row * 17 + ((col % cols) + cols) % cols * 5;
    const edge = Math.min(fu, 1 - fu) * (S / cols) < 2.2 || Math.min(fv, 1 - fv) * (S / rows) < 2.2;
    let c = mix3(hex3(0x9c4a32), hex3(0xb8643f), vnoise(id, 1, 999, 999, 3)); c = J(c, 0.85 + 0.3 * fbm(u * 9, v * 9, 4, 3, 7));
    if (vnoise(id, 2, 999, 999, 4) > 0.9) c = hex3(0x6b3322);
    if (edge) c = J(hex3(0xbfb7a6), 0.92 + 0.1 * vnoise(x, y, 512, 512, 5));
    return [c[0], c[1], c[2], edge ? 0.1 : 0.6];
  });
}
function concrete() { return gen(S, S, (x, y, u, v) => { const n = fbm(u * 4, v * 4, 4, 5, 8), m = vnoise(x * 0.8, y * 0.8, 410, 410, 9); const c = J(hex3(0x9b9a95), 0.78 + n * 0.3 + m * 0.07); return [c[0], c[1], c[2], 0.35 + n * 0.5]; }); }
function asphalt() { return gen(S, S, (x, y, u, v) => { const n = fbm(u * 5, v * 5, 4, 4, 12), m = vnoise(x * 1.1, y * 1.1, 560, 560, 13); const c = J(hex3(0x45464a), 0.7 + n * 0.35 + (m > 0.82 ? 0.5 : 0) * 0.4); return [c[0], c[1], c[2], 0.3 + m * 0.6]; }); }
function grass() { return gen(S, S, (x, y, u, v) => { const n = fbm(u * 8, v * 8, 4, 4, 14), m = vnoise(x * 0.7, y * 3, 360, 1536, 15); const c = mix3(hex3(0x39592b), hex3(0x6a8f3d), n * 0.7 + m * 0.4); return [c[0], c[1], c[2], 0.4 + m * 0.5]; }); }
function pavers() { return gen(S, S, (x, y, u, v) => { const n = 8, fu = (u * n) % 1, fv = (v * n) % 1, id = Math.floor(u * n) + Math.floor(v * n) * 11; const e = Math.min(fu, 1 - fu, fv, 1 - fv) * S / n < 1.6; let c = J(hex3(0xa8a49a), 0.85 + 0.25 * vnoise(id, 7, 999, 999, 2) + 0.06 * vnoise(x, y, 512, 512, 3)); if (e) c = hex3(0x5a574f); return [c[0], c[1], c[2], e ? 0.1 : 0.6]; }); }
function skin() { return gen(S, S, (x, y, u, v) => { const n = fbm(u * 6, v * 6, 4, 4, 61), p = vnoise(x * 0.9, y * 0.9, 460, 460, 62); const c = mix3(hex3(0xc98e6c), hex3(0xe0a785), n); return [c[0] * (0.96 + p * 0.06), c[1] * (0.96 + p * 0.06), c[2] * (0.96 + p * 0.06), 0.5 + p * 0.2]; }); }
function knit() { // long-sleeve tight shirt (navy-blue rib)
  return gen(S, S, (x, y, u, v) => { const rib = 0.5 + 0.5 * Math.sin(u * 150), row = 0.5 + 0.5 * Math.sin(v * 140); const n = fbm(u * 12, v * 12, 4, 3, 71); const k = 0.9 + 0.07 * rib * row + 0.14 * n; const c = J(hex3(0x2a4a9c), k); return [c[0], c[1], c[2], 0.35 + 0.4 * rib * row]; });
}
function denim() { return gen(S, S, (x, y, u, v) => { const tw = 0.5 + 0.5 * Math.sin((u + v) * 340); const n = fbm(u * 10, v * 10, 4, 3, 72); const c = J(mix3(hex3(0x5d6b86), hex3(0x7e8aa3), n), 0.85 + 0.2 * tw); return [c[0], c[1], c[2], 0.4 + 0.3 * tw]; }); }
function hairTex() { return gen(S, S, (x, y, u, v) => { const g = vnoise(u * 90, v * 4, 90, 4, 73); const n = fbm(u * 8, v * 8, 4, 3, 74); const c = J(hex3(0x1a1512), 0.5 + g * 1.0 + n * 0.3); return [c[0], c[1], c[2], 0.3 + g * 0.6]; }); }
function sneaker() { return gen(S, S, (x, y, u, v) => { const n = fbm(u * 10, v * 10, 4, 3, 75); const c = J(hex3(0xe9e9e6), 0.82 + n * 0.25); return [c[0], c[1], c[2], 0.5 + n * 0.3]; }); }
function carpetRed() { return gen(S, S, (x, y, u, v) => { const n = vnoise(x * 0.8, y * 0.8, 410, 410, 76); const c = J(hex3(0x7a1f26), 0.8 + n * 0.4); return [c[0], c[1], c[2], 0.3 + n * 0.6]; }); }
function paintRed() { return gen(S, S, (x, y, u, v) => { const n = fbm(u * 6, v * 6, 4, 3, 77); const c = J(hex3(0xc2202b), 0.85 + n * 0.2); return [c[0], c[1], c[2], 0.5]; }); }
function steelBlue() { return gen(S, S, (x, y, u, v) => { const n = fbm(u * 7, v * 7, 4, 3, 78), s = vnoise(x * 1.2, y * 1.2, 600, 600, 79); const c = J(hex3(0x536a86), 0.82 + n * 0.22 + (s > 0.9 ? 0.15 : 0)); return [c[0], c[1], c[2], 0.5]; }); }

/* ---- hand-drawn 2d textures -------------------------------------------- */
function chalkboard() {
  return ctex(1024, 512, (g, w, h) => {
    const r = rng(5); g.fillStyle = "#24392f"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { g.fillStyle = "rgba(210,220,210," + (0.02 + r() * 0.05) + ")"; g.beginPath(); g.ellipse(r() * w, r() * h, 20 + r() * 80, 4 + r() * 16, (r() - 0.5) * 0.6, 0, 7); g.fill(); }
    g.fillStyle = "rgba(235,240,230,.88)"; g.font = "700 64px 'Mont', sans-serif"; g.fillText("12 × 8 = 96", 70, 120); g.font = "700 54px 'Mont', sans-serif"; g.fillText("x² + 5x + 6 = 0", 70, 215);
    g.font = "700 44px 'Mont', sans-serif"; g.fillText("Литература · §14", 70, 300); g.font = "700 40px 'Mont', sans-serif"; g.fillText("Домашнее задание: упр. 7, 9", 70, 380);
    g.strokeStyle = "rgba(235,240,230,.8)"; g.lineWidth = 4; g.beginPath(); g.moveTo(640, 120); g.lineTo(940, 120); g.lineTo(790, 330); g.closePath(); g.stroke();
    g.strokeStyle = "#6e4a28"; g.lineWidth = 16; g.strokeRect(0, 0, w, h);
  }, { rep: false });
}
function lockerTex() {
  return ctex(256, 512, (g, w, h) => {
    g.fillStyle = "#4f6a88"; g.fillRect(0, 0, w, h); const r = rng(3); for (let i = 0; i < 700; i++) { g.fillStyle = "rgba(0,0,0," + r() * 0.07 + ")"; g.fillRect(r() * w, r() * h, 1 + r() * 4, 1 + r() * 20); }
    g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(0, 0, 3, h); g.fillRect(w - 3, 0, 3, h); g.fillRect(0, h * 0.5, w, 3);
    g.fillStyle = "rgba(0,0,0,.55)"; for (let i = 0; i < 5; i++) g.fillRect(70, 30 + i * 12, 116, 5); for (let i = 0; i < 5; i++) g.fillRect(70, h * 0.5 + 24 + i * 12, 116, 5);
    g.fillStyle = "#c9ced4"; g.fillRect(w - 60, h * 0.26, 34, 12); g.fillStyle = "#ffe9a3"; g.fillRect(34, 110, 60, 22); g.fillStyle = "#222"; g.font = "700 15px Mont, sans-serif"; g.fillText(String(7 + Math.floor(r() * 23)) + "А", 40, 126);
  }, { rep: false });
}
function doorTex(glass) {
  return ctex(256, 512, (g, w, h) => {
    g.fillStyle = "#7a4d26"; g.fillRect(0, 0, w, h); const r = rng(8);
    for (let i = 0; i < 420; i++) { g.fillStyle = "rgba(40,20,5," + r() * 0.12 + ")"; g.fillRect(r() * w, r() * h, 1 + r() * 2, 20 + r() * 80); }
    g.strokeStyle = "rgba(0,0,0,.4)"; g.lineWidth = 4; g.strokeRect(14, 14, w - 28, h - 28);
    if (glass) { const gg = g.createLinearGradient(0, 60, 0, 210); gg.addColorStop(0, "#5d6f7c"); gg.addColorStop(0.6, "#7e8d95"); gg.addColorStop(1, "#c9773a"); g.fillStyle = gg; g.fillRect(60, 60, w - 120, 150); g.strokeStyle = "rgba(20,25,30,.55)"; g.lineWidth = 2; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(60 + i * (w - 120) / 6, 60); g.lineTo(60 + i * (w - 120) / 6, 210); g.stroke(); } for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(60, 60 + i * 37); g.lineTo(w - 60, 60 + i * 37); g.stroke(); } g.strokeStyle = "#3b2410"; g.lineWidth = 8; g.strokeRect(60, 60, w - 120, 150); } else { g.strokeStyle = "rgba(0,0,0,.35)"; g.strokeRect(40, 60, w - 80, 150); g.strokeRect(40, 260, w - 80, 180); }
    g.fillStyle = "#e8eaec"; g.beginPath(); g.ellipse(w - 36, h * 0.52, 10, 22, 0, 0, 7); g.fill();
  }, { rep: false });
}
function fireplan() { // evacuation plan poster
  return ctex(512, 720, (g, w, h) => {
    g.fillStyle = "#f4f1e4"; g.fillRect(0, 0, w, h); g.fillStyle = "#1d8a3c"; g.fillRect(0, 0, w, 90); g.fillStyle = "#fff"; g.font = "900 40px Mont, sans-serif"; g.textAlign = "center"; g.fillText("ПЛАН ЭВАКУАЦИИ", w / 2, 60);
    g.strokeStyle = "#333"; g.lineWidth = 6; g.strokeRect(36, 140, w - 72, 400);
    g.lineWidth = 4; g.strokeRect(60, 170, 150, 110); g.strokeRect(236, 170, 150, 110); g.strokeRect(60, 400, 150, 110); g.strokeRect(236, 400, 150, 110); g.strokeRect(410, 170, 54, 340);
    g.fillStyle = "#cfd9e6"; g.fillRect(60, 300, 330, 80);
    g.strokeStyle = "#1d8a3c"; g.fillStyle = "#1d8a3c"; g.lineWidth = 10; g.setLineDash([22, 14]); g.beginPath(); g.moveTo(110, 340); g.lineTo(350, 340); g.lineTo(436, 340); g.lineTo(436, 470); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.moveTo(436, 520); g.lineTo(412, 470); g.lineTo(460, 470); g.closePath(); g.fill();
    g.fillStyle = "#c2202b"; g.beginPath(); g.arc(110, 340, 16, 0, 7); g.fill(); g.fillStyle = "#222"; g.font = "800 22px Mont, sans-serif"; g.fillText("ВЫ ЗДЕСЬ", 118, 322);
    g.fillStyle = "#1d8a3c"; g.fillRect(40, 590, 36, 36); g.fillStyle = "#222"; g.textAlign = "left"; g.font = "800 24px Mont, sans-serif"; g.fillText("— путь эвакуации", 92, 618);
    g.fillStyle = "#c2202b"; g.fillRect(40, 640, 36, 36); g.fillStyle = "#222"; g.fillText("— огнетушитель  112", 92, 668);
  }, { rep: false });
}
function exitSign() {
  return ctex(512, 192, (g, w, h) => {
    g.fillStyle = "#0d7a35"; g.fillRect(0, 0, w, h); g.fillStyle = "#fff"; g.font = "900 96px Mont, sans-serif"; g.textAlign = "left"; g.fillText("ВЫХОД", 150, 130);
    g.strokeStyle = "#fff"; g.lineWidth = 12; g.beginPath(); g.moveTo(40, 140); g.lineTo(100, 140); g.stroke(); g.fillStyle = "#fff"; g.beginPath(); g.moveTo(20, 140); g.lineTo(54, 108); g.lineTo(54, 172); g.closePath(); g.fill();
  }, { rep: false });
}
function noElevator() {
  return ctex(256, 256, (g, w, h) => {
    g.fillStyle = "#f2f2f2"; g.fillRect(0, 0, w, h); g.strokeStyle = "#d4161d"; g.lineWidth = 18; g.beginPath(); g.arc(128, 128, 100, 0, 7); g.stroke(); g.beginPath(); g.moveTo(58, 58); g.lineTo(198, 198); g.stroke();
    g.fillStyle = "#222"; g.fillRect(96, 84, 64, 88); g.fillStyle = "#f2f2f2"; g.fillRect(124, 84, 8, 88);
  }, { rep: false });
}
function room(txt, col = "#1a4f8f") {
  return ctex(256, 128, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); g.fillStyle = "#fff"; g.font = "900 56px Mont, sans-serif"; g.textAlign = "center"; g.fillText(txt, w / 2, 82); g.strokeStyle = "#fff"; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12); }, { rep: false });
}
function poster(seed) {
  return ctex(256, 360, (g, w, h) => {
    const r = rng(seed); const hue = Math.floor(r() * 360); g.fillStyle = "hsl(" + hue + ",55%,82%)"; g.fillRect(0, 0, w, h);
    g.fillStyle = "hsl(" + ((hue + 160) % 360) + ",60%,45%)"; g.fillRect(20, 20, w - 40, 150); for (let i = 0; i < 6; i++) { g.fillStyle = "rgba(255,255,255," + (0.2 + r() * 0.4) + ")"; g.fillRect(20 + r() * 150, 40 + r() * 100, 30 + r() * 60, 6 + r() * 14); }
    g.fillStyle = "#222"; for (let i = 0; i < 7; i++) g.fillRect(24, 200 + i * 20, 80 + r() * 130, 8);
  }, { rep: false });
}
function clockFace() {
  return ctex(256, 256, (g, w, h) => {
    g.fillStyle = "#f6f3ea"; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill(); g.strokeStyle = "#222"; g.lineWidth = 10; g.stroke();
    g.fillStyle = "#222"; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.save(); g.translate(128, 128); g.rotate(a); g.fillRect(-4, -112, 8, i % 3 === 0 ? 26 : 14); g.restore(); }
    g.strokeStyle = "#222"; g.lineCap = "round"; g.lineWidth = 9; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.sin(0.6) * 62, 128 - Math.cos(0.6) * 62); g.stroke(); g.lineWidth = 6; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.sin(3.7) * 92, 128 - Math.cos(3.7) * 92); g.stroke();
  }, { rep: false });
}

export function buildTextures() {
  const T = {};
  const defs = { parquet, tiles, wallPanel, plaster, ceilingTile, woodLight, woodDark, brick, concrete, asphalt, grass, pavers, skin, knit, denim, hairTex, sneaker, carpetRed, paintRed, steelBlue };
  for (const k in defs) T[k] = defs[k]();
  T.chalkboard = chalkboard(); T.locker = lockerTex(); T.door = doorTex(false); T.doorGlass = doorTex(true); T.fireplan = fireplan(); T.exitSign = exitSign(); T.noElevator = noElevator(); T.clock = clockFace();
  T.room1 = room("7А"); T.room2 = room("8Б", "#8f2a1a"); T.room3 = room("Каб. 12", "#1a6f4f");
  T.poster = [poster(1), poster(2), poster(3), poster(4)];
  return T;
}

export function stdMat(tex, o = {}, bumpScale = 1.0) {
  const m = new THREE.MeshStandardMaterial({ map: tex.map || tex, roughness: 0.85, metalness: 0, ...o });
  if (tex.bump) { m.bumpMap = tex.bump; m.bumpScale = bumpScale; }
  return m;
}
