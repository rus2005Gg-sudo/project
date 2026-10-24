import * as THREE from "three";

const W = 1080, H = 1920;
const CUE = window.CUE, TT = CUE.t;
const DUR = window.__DUR;

/* ------------------------------------------------------------------ utils */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const ease = (u) => u * u * (3 - 2 * u);
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const noise1 = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u); };
const rampKeys = (t, keys) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; return lerp(v0, v1, (t - t0) / (t1 - t0)); }
  return keys[keys.length - 1][1];
};
const rng = (seed) => { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const win = (t, a, b) => clamp((t - a) / (b - a));

/* ---------------------------------------------------------------- renderer */
const canvas = document.getElementById("gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x120505);
scene.fog = new THREE.FogExp2(0x1a0a08, 0.018);
const cam = new THREE.PerspectiveCamera(55, W / H, 0.03, 300);
scene.add(cam);
const camFill = new THREE.PointLight(0xffc29a, 2.5, 7, 1.3); cam.add(camFill);

/* ---------------------------------------------------------------- textures */
function ctex(w, h, draw, rep) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d"); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.userData = { c, g }; return t;
}
const speckle = (g, w, h, n, seed, cols, sz = 2) => { const r = rng(seed); for (let i = 0; i < n; i++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(r() * w, r() * h, 1 + r() * sz, 1 + r() * sz); } };
const woodTex = ctex(256, 256, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = ["#6b4a30", "#5d3f28", "#74523a"][i % 3]; g.fillRect(0, i * 32, w, 32); g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(0, i * 32, w, 2); } speckle(g, w, h, 1500, 3, ["rgba(0,0,0,.18)", "rgba(255,210,160,.07)"], 3); }, true);
const paperTex = ctex(256, 256, (g, w, h) => { g.fillStyle = "#b9ab8e"; g.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? "rgba(0,0,0,.07)" : "rgba(255,255,255,.05)"; g.fillRect(i * 16, 0, 8, h); } speckle(g, w, h, 900, 4, ["rgba(0,0,0,.1)"], 3); }, true);
const tileTex = ctex(128, 128, (g, w, h) => { g.fillStyle = "#c9d3d6"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 3; g.strokeRect(0, 0, 64, 64); g.strokeRect(64, 0, 64, 64); g.strokeRect(0, 64, 64, 64); g.strokeRect(64, 64, 64, 64); }, true);
const asphaltTex = ctex(256, 256, (g, w, h) => { g.fillStyle = "#26282b"; g.fillRect(0, 0, w, h); speckle(g, w, h, 3000, 5, ["rgba(255,255,255,.07)", "rgba(0,0,0,.25)"], 3); }, true);
const facadeTex = ctex(512, 512, (g, w, h) => {
  g.fillStyle = "#2b2420"; g.fillRect(0, 0, w, h); const r = rng(8);
  for (let y = 0; y < 10; y++) for (let x = 0; x < 8; x++) { const on = r() < 0.38; g.fillStyle = on ? (r() < 0.2 ? "#ffd88a" : "#e8a85a") : "#120d0c"; g.fillRect(x * 64 + 12, y * 51 + 10, 40, 32); }
}, true);

/* ------------------------------------------------------------------ helpers */
const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, flatShading: true, ...o });
const matCache = {}; const cm = (c, o) => { const k = c + JSON.stringify(o || {}); return matCache[k] || (matCache[k] = M(c, o)); };
function box(w, h, d, mat, x, y, z, parent = scene) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; }
function plane(w, h, mat, ux = 1, uy = 1) { const g = new THREE.PlaneGeometry(w, h); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * ux, uv.getY(i) * uy); return new THREE.Mesh(g, mat); }
function put(m, x, y, z, rx = 0, ry = 0, rz = 0, parent = scene) { m.position.set(x, y, z); m.rotation.set(rx, ry, rz); parent.add(m); return m; }
const emissive = (c) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });

/* ============================== APARTMENT ============================== */
const wallMat = new THREE.MeshStandardMaterial({ map: paperTex, roughness: 0.95 });
const floorMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.6 });
const ceilMat = M(0xd8d2c8, { roughness: 1 });
const room = new THREE.Group(); scene.add(room);
put(plane(8, 7, floorMat, 8 / 1.0, 7 / 1.0), 4, 0, 3.5, -Math.PI / 2, 0, 0, room);
put(plane(8, 7, ceilMat), 4, 2.6, 3.5, Math.PI / 2, 0, 0, room);
// north wall (z=0) with window x 1.4..3.6, y 0.9..2.3
const wmat = wallMat;
box(1.4, 2.6, 0.2, wmat, 0.7, 1.3, -0.1, room); box(4.4, 2.6, 0.2, wmat, 5.8, 1.3, -0.1, room);
box(2.2, 0.9, 0.2, wmat, 2.5, 0.45, -0.1, room); box(2.2, 0.3, 0.2, wmat, 2.5, 2.45, -0.1, room);
box(2.4, 0.05, 0.3, cm(0xe8e0d0), 2.5, 0.92, -0.1, room); // sill
const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.4), new THREE.MeshBasicMaterial({ color: 0x8aa0b0, transparent: true, opacity: 0.1, depthWrite: false }));
put(glass, 2.5, 1.6, -0.02, 0, 0, 0, room);
box(0.05, 1.4, 0.05, cm(0xdddddd), 2.5, 1.6, -0.03, room); box(2.3, 0.05, 0.05, cm(0xdddddd), 2.5, 1.6, -0.03, room);
// south wall + west wall
put(plane(8, 2.6, wmat, 3, 1), 4, 1.3, 7, 0, Math.PI, 0, room);
put(plane(7, 2.6, wmat, 3, 1), 0, 1.3, 3.5, 0, Math.PI / 2, 0, room);
// east wall (x=8) with door opening z 2.9..4.1, h 2.1
box(0.2, 2.6, 2.9, wmat, 8.1, 1.3, 1.45, room); box(0.2, 2.6, 2.9, wmat, 8.1, 1.3, 5.55, room); box(0.2, 0.5, 1.2, wmat, 8.1, 2.35, 3.5, room);
box(0.08, 2.15, 0.08, cm(0x2a1d14), 7.97, 1.07, 2.9, room); box(0.08, 2.15, 0.08, cm(0x2a1d14), 7.97, 1.07, 4.1, room); box(0.08, 0.08, 1.28, cm(0x2a1d14), 7.97, 2.14, 3.5, room);
// front door (hinged at z=4.1, swings into the flat)
const doorG = new THREE.Group(); doorG.position.set(7.98, 0, 4.1); room.add(doorG);
box(0.05, 2.1, 1.2, cm(0x4a3626, { roughness: 0.6 }), 0, 1.05, -0.6, doorG);
box(0.055, 0.12, 0.12, cm(0xcfcfcf, { metalness: 0.6, roughness: 0.3 }), -0.04, 1.0, -1.05, doorG); // handle
const lockCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 10), cm(0xd0b050, { metalness: 0.7, roughness: 0.3 })); lockCyl.rotation.z = Math.PI / 2; lockCyl.position.set(-0.04, 1.12, -1.0); doorG.add(lockCyl);
const keyBar = box(0.02, 0.06, 0.015, cm(0xd9d9d9, { metalness: 0.8 }), -0.07, 1.12, -1.0, doorG);
const peep = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.06, 8), cm(0x888888, { metalness: 0.8 })); peep.rotation.z = Math.PI / 2; peep.position.set(0.0, 1.55, -0.6); doorG.add(peep);
// chain: fixed link on frame + slider on door
const chainA = box(0.02, 0.02, 0.06, cm(0xbfbfbf, { metalness: 0.8 }), -0.06, 1.45, -0.18, doorG);
const chainFrame = box(0.03, 0.03, 0.05, cm(0xbfbfbf, { metalness: 0.8 }), 7.93, 1.45, 3.95, room);
const chainLine = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 6), cm(0xcfcfcf, { metalness: 0.9 })); room.add(chainLine);

// corridor behind the door
const hallMat = M(0x6a6a5a), hallFloor = M(0x3a3a38);
put(plane(5, 3.6, hallFloor), 10.5, 0, 3.5, -Math.PI / 2, 0, 0, room); put(plane(5, 3.6, ceilMat), 10.5, 2.6, 3.5, Math.PI / 2, 0, 0, room);
put(plane(5, 2.6, hallMat), 10.5, 1.3, 1.7, 0, 0, 0, room); put(plane(5, 2.6, hallMat), 10.5, 1.3, 5.3, 0, Math.PI, 0, room);
put(plane(3.6, 2.6, hallMat), 13, 1.3, 3.5, 0, -Math.PI / 2, 0, room);
const hallLamp = new THREE.PointLight(0xcfe8d0, 0, 7, 1.6); hallLamp.position.set(9.6, 2.3, 3.5); room.add(hallLamp);
box(0.5, 0.05, 0.2, emissive(0xdff5e0), 9.6, 2.57, 3.5, room);

// furniture
const fab = cm(0x4b5b6a), fabD = cm(0x3a4756), wood = cm(0x5c4030), whiteM = cm(0xe8e8e8), dark = cm(0x1e1f22);
const sofa = new THREE.Group(); room.add(sofa);
box(0.9, 0.42, 2.2, fab, 0, 0.21, 0, sofa); box(0.25, 0.55, 2.2, fabD, 0.32, 0.55, 0, sofa); box(0.9, 0.25, 0.2, fabD, 0, 0.5, -1.1, sofa); box(0.9, 0.25, 0.2, fabD, 0, 0.5, 1.1, sofa); box(0.6, 0.18, 0.9, cm(0xb44a3a), -0.1, 0.5, -0.4, sofa);
sofa.position.set(2.5, 0, 3.4);
const wardrobe = new THREE.Group(); room.add(wardrobe);
box(1.2, 2.1, 0.6, wood, 0, 1.05, 0, wardrobe); box(0.02, 1.9, 0.02, dark, 0, 1.05, 0.31, wardrobe); box(0.04, 0.2, 0.03, cm(0xcfcfcf), 0.1, 1.0, 0.32, wardrobe);
wardrobe.position.set(6.8, 0, 1.2);
const table = new THREE.Group(); room.add(table);
box(1.1, 0.04, 0.6, wood, 0, 0.42, 0, table); [[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]].forEach(([x, z]) => box(0.05, 0.4, 0.05, wood, x, 0.2, z, table));
table.position.set(1.15, 0, 3.4);
const rug = box(2.4, 0.01, 1.8, cm(0x6a3a3a), 1.7, 0.006, 3.4, room);
const shelf = box(0.35, 1.8, 1.0, wood, 0.2, 0.9, 5.0, room);
// TV
const tvTex = ctex(256, 144, () => {});
function drawTV(t) {
  const g = tvTex.userData.g, w = 256, h = 144, f = Math.floor(t * 6);
  g.fillStyle = "#101820"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.04 + hash(f + i) * 0.1})`; g.fillRect(0, hash(f * 3 + i) * h, w, 1 + hash(i + f) * 2); }
  g.fillStyle = "#c4141c"; g.fillRect(0, 96, w, 30); g.fillStyle = "#fff"; g.font = "bold 18px sans-serif"; g.textAlign = "center";
  g.fillText(Math.floor(t * 2) % 2 ? "ЭКСТРЕННО" : "ВНИМАНИЕ!", w / 2, 112);
  g.font = "bold 13px sans-serif"; g.fillText("ОСТАВАЙТЕСЬ В КВАРТИРАХ", w / 2, 122 - 0.0);
  g.fillStyle = "#ffffff"; g.beginPath(); g.arc(46, 46, 22, 0, 7); g.fill(); g.fillStyle = "#101820"; g.fillRect(40, 30, 12, 20); g.fillRect(40, 54, 12, 10);
  g.fillStyle = "#fff"; g.font = "bold 20px sans-serif"; g.textAlign = "left"; g.fillText("ТРЕВОГА", 84, 52);
  g.font = "13px sans-serif"; g.fillStyle = "#ffcccc"; g.fillText("Не открывайте двери", 84, 70);
  tvTex.needsUpdate = true;
}
const tvBody = box(0.06, 0.7, 1.25, dark, 0.04, 1.55, 2.9, room);
const tvScr = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.65), new THREE.MeshBasicMaterial({ map: tvTex, toneMapped: false })); put(tvScr, 0.08, 1.55, 2.9, 0, Math.PI / 2, 0, room);
box(0.5, 0.5, 1.4, dark, 0.25, 0.25, 2.9, room);
// lamps
const floorLamp = new THREE.Group(); room.add(floorLamp); floorLamp.position.set(0.5, 0, 0.8);
box(0.03, 1.5, 0.03, cm(0x222222), 0, 0.75, 0, floorLamp); box(0.25, 0.03, 0.25, cm(0x222222), 0, 0.02, 0, floorLamp);
const shadeMat = new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false });
const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, 0.3, 10, 1, true), shadeMat); shade.position.y = 1.55; floorLamp.add(shade);
const tableLamp = new THREE.Group(); room.add(tableLamp); tableLamp.position.set(1.0, 0.44, 3.0);
box(0.12, 0.02, 0.12, cm(0x222222), 0, 0.01, 0, tableLamp); box(0.02, 0.25, 0.02, cm(0x222222), 0, 0.14, 0, tableLamp);
const tShade = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, 0.14, 8), shadeMat); tShade.position.y = 0.3; tableLamp.add(tShade);
const ceilingLamp = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 12), shadeMat); ceilingLamp.position.set(4, 2.57, 3.5); room.add(ceilingLamp);
const lights = {
  ceil: new THREE.PointLight(0xffd9a6, 12, 12, 1.4), floor: new THREE.PointLight(0xffc88a, 5, 6, 1.6), tbl: new THREE.PointLight(0xffc88a, 3, 4, 1.6),
  tv: new THREE.PointLight(0x9cc8ff, 2.2, 8, 1.6), moon: new THREE.PointLight(0xff6a3a, 6, 10, 1.4), fill: new THREE.PointLight(0xffe6c8, 0.0, 12, 1.2),
};
lights.ceil.position.set(4, 2.4, 3.5); lights.floor.position.set(0.7, 1.6, 0.9); lights.tbl.position.set(1.0, 0.8, 3.0); lights.tv.position.set(0.8, 1.55, 2.9); lights.moon.position.set(2.5, 1.8, -1.2); lights.fill.position.set(4, 2.0, 3.5);
Object.values(lights).forEach((l) => room.add(l));
const amb = new THREE.AmbientLight(0x3a2a2a, 0.5); scene.add(amb);
// curtains
const curtMat = cm(0x6e2f3a, { roughness: 1 });
const curL = box(1.3, 1.9, 0.06, curtMat, 0.9, 1.5, 0.16, room), curR = box(1.3, 1.9, 0.06, curtMat, 4.1, 1.5, 0.16, room);
box(3.2, 0.04, 0.04, cm(0x999999), 2.5, 2.48, 0.15, room);
// kitchen alcove
const cab = cm(0x8a8f94), cab2 = cm(0xd8d4c8);
box(2.4, 0.9, 0.6, cab, 1.2, 0.45, 6.7, room); box(2.4, 0.04, 0.62, cm(0x333333), 1.2, 0.92, 6.7, room); box(2.2, 0.7, 0.35, cab2, 1.2, 1.95, 6.82, room);
box(0.7, 1.8, 0.7, whiteM, 2.7, 0.9, 6.62, room);
const bottles = []; const pots = [];
for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.28, 8), cm([0x6cc0ff, 0xb8e8ff, 0x7fd0a0][i % 3], { transparent: true, opacity: 0.8 })); b.position.set(0.3 + i * 0.16, 1.08, 6.55); room.add(b); bottles.push(b); }
for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.16, 12), cm(0x777f88, { metalness: 0.5 })); p.position.set(1.2 + i * 0.35, 0.99, 6.7); room.add(p); pots.push(p); }
// bathroom niche + tub
const tile = new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.4 });
put(plane(2.8, 2.6, tile, 3, 3), 6.6, 1.3, 6.99, 0, Math.PI, 0, room);
put(plane(2.0, 2.6, tile, 2, 3), 5.2, 1.3, 6.0, 0, Math.PI / 2, 0, room);
box(2.8, 1.0, 0.1, cm(0xd5d9db), 6.6, 0.5, 5.05, room);
box(0.8, 0.55, 1.7, whiteM, 7.55, 0.275, 6.1, room); // tub
const waterMat = new THREE.MeshStandardMaterial({ color: 0x4aa8d8, roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.85 });
const water = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 1.56), waterMat); water.rotation.x = -Math.PI / 2; water.position.set(7.55, 0.2, 6.1); room.add(water);
box(0.05, 0.2, 0.05, cm(0xcccccc, { metalness: 0.8 }), 7.55, 0.65, 6.95, room);
const stream = box(0.03, 0.4, 0.03, cm(0x9fd8ff, { transparent: true, opacity: 0.7 }), 7.55, 0.45, 6.88, room);
// backpack + items on table
const pack = new THREE.Group(); room.add(pack); pack.position.set(1.15, 0.44, 3.45);
box(0.34, 0.45, 0.2, cm(0x3a5a3a), 0, 0.22, 0, pack); box(0.3, 0.2, 0.06, cm(0x2c442c), 0, 0.15, 0.13, pack);
const itemDefs = [
  ["docs", () => box(0.21, 0.01, 0.3, whiteM, 0, 0, 0), [0.05, 0.45, 0.35]],
  ["charger", () => box(0.07, 0.05, 0.07, dark, 0, 0, 0), [0.28, 0.455, 0.2]],
  ["kit", () => { const g = new THREE.Group(); box(0.22, 0.1, 0.15, whiteM, 0, 0, 0, g); box(0.1, 0.02, 0.04, cm(0xd4202a), 0, 0.055, 0, g); box(0.04, 0.02, 0.1, cm(0xd4202a), 0, 0.055, 0, g); return g; }, [0.0, 0.5, 0.3]],
  ["cans", () => { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 10), cm(0xc9a63a, { metalness: 0.5 })); c.position.set(i * 0.09, 0, 0); g.add(c); } return g; }, [-0.28, 0.5, 0.15]],
  ["knife", () => { const g = new THREE.Group(); box(0.26, 0.01, 0.035, cm(0xd0d4d8, { metalness: 0.9, roughness: 0.2 }), 0.09, 0, 0, g); box(0.1, 0.025, 0.04, dark, -0.09, 0, 0, g); return g; }, [-0.05, 0.455, -0.2]],
];
const items = itemDefs.map(([name, mk, pos]) => { const o = mk(); o.position.set(pos[0], pos[1], pos[2]); pack.add(o); return o; });
// small props
const phoneProp = new THREE.Group();
box(0.07, 0.14, 0.01, dark, 0, 0, 0, phoneProp);

/* =============================== OUTSIDE ================================ */
const world = new THREE.Group(); scene.add(world);
put(plane(300, 40, new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: 0.9 }), 60, 8), 20, -0.02, -14, -Math.PI / 2, 0, 0, world);
asphaltTex.repeat.set(1, 1);
put(plane(300, 4, M(0x55524e)), 20, 0.0, -2.5, -Math.PI / 2, 0, 0, world); // courtyard / pavement under the window
for (let i = 0; i < 40; i++) box(2.2, 0.01, 0.15, emissive(0x998a55), -40 + i * 4.5, 0.0, -9, world);
// buildings across the street
const facMat = new THREE.MeshStandardMaterial({ map: facadeTex, roughness: 0.9, emissive: 0xffffff, emissiveMap: facadeTex, emissiveIntensity: 0.55 });
facadeTex.repeat.set(6, 3);
const bld = [[-12, 34, 46], [22, 26, 30], [50, 30, 40]];
bld.forEach(([x, w, h], i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 8), facMat); b.position.set(x, h / 2, -30); world.add(b); });
// street lights
const lampHeads = [];
for (let i = 0; i < 7; i++) { const x = -18 + i * 12; box(0.12, 6, 0.12, cm(0x222222), x, 3, -5, world); const hd = box(0.8, 0.15, 0.3, emissive(0xffb066), x, 6, -4.8, world); lampHeads.push(hd); }
const streetLights = [3, 15, 27].map((x) => { const l = new THREE.PointLight(0xffa860, 6, 14, 1.6); l.position.set(x, 5.6, -4.5); world.add(l); return l; });
// burning cars
const fireMats = [];
function car(x, z, ry) {
  const g = new THREE.Group(); box(4, 0.8, 1.8, cm(0x7a2a2a), 0, 0.6, 0, g); box(2.2, 0.7, 1.7, cm(0x222a30), -0.2, 1.35, 0, g);
  [[-1.3, -0.9], [1.3, -0.9], [-1.3, 0.9], [1.3, 0.9]].forEach(([a, b]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 10), cm(0x111111)); w.rotation.x = Math.PI / 2; w.position.set(a, 0.35, b); g.add(w); });
  g.position.set(x, 0, z); g.rotation.y = ry; world.add(g); return g;
}
car(16, -8, 0.2); car(-6, -6.5, -0.15); car(34, -7, 0.1);
const fireLight = new THREE.PointLight(0xff7a2a, 25, 40, 1.4); fireLight.position.set(16, 2, -7); world.add(fireLight);
const fireLight2 = new THREE.PointLight(0xff6a22, 18, 36, 1.4); fireLight2.position.set(-6, 2, -6); world.add(fireLight2);
const flames = [];
[[16, -8], [-6, -6.5], [34, -7]].forEach(([x, z]) => { for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.6, 5), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xff9a2a : 0xff5a1a, toneMapped: false })); f.position.set(x + (i - 1.5) * 0.5, 2 + i * 0.1, z); world.add(f); flames.push(f); } });
// sky
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color(0x080309) }, bot: { value: new THREE.Color(0x7a2412) } },
  vertexShader: "varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ",
  fragmentShader: "uniform vec3 top; uniform vec3 bot; varying float h; void main(){ float k = smoothstep(-0.02,0.7,h); gl_FragColor = vec4(mix(bot,top,k),1.0);\n#include <colorspace_fragment>\n}",
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(250, 20, 14), skyMat); scene.add(sky);
const moon = new THREE.Mesh(new THREE.CircleGeometry(7, 20), new THREE.MeshBasicMaterial({ color: 0xffd6c2, fog: false })); moon.position.set(-40, 70, -180); moon.lookAt(0, 0, 0); scene.add(moon);

/* ------------------------------------------------------------- figures */
function makeFigure(o) {
  const g = new THREE.Group(); const P = { g };
  const skin = cm(o.skin, { roughness: 0.7 }), jacket = cm(o.jacket, { roughness: 0.9 }), pants = cm(o.pants, { roughness: 0.9 }), shoe = cm(0x111111), hair = cm(o.hair, { roughness: 0.9 });
  const piv = (parent, x, y, z) => { const p = new THREE.Group(); p.position.set(x, y, z); parent.add(p); return p; };
  const leg = (sx) => { const hip = piv(g, sx * 0.1, 0.9, 0); box(0.17, 0.45, 0.19, pants, 0, -0.225, 0, hip); const knee = piv(hip, 0, -0.45, 0); box(0.15, 0.45, 0.17, pants, 0, -0.225, 0, knee); box(0.17, 0.08, 0.3, shoe, 0, -0.43, 0.06, knee); return { hip, knee }; };
  P.legL = leg(1); P.legR = leg(-1);
  const torso = piv(g, 0, 0, 0); P.torso = torso;
  box(0.46, 0.62, 0.27, jacket, 0, 1.2, 0, torso); box(0.34, 0.12, 0.2, jacket, 0, 1.53, 0, torso); box(0.46, 0.2, 0.28, pants, 0, 0.92, 0, torso);
  const arm = (sx) => { const sh = piv(torso, sx * 0.3, 1.46, 0); box(0.12, 0.32, 0.13, jacket, 0, -0.16, 0, sh); const el = piv(sh, 0, -0.32, 0); box(0.11, 0.3, 0.12, jacket, 0, -0.15, 0, el); const hand = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 0), skin); hand.position.y = -0.34; el.add(hand); return { sh, el, hand }; };
  P.armL = arm(1); P.armR = arm(-1);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.1, 6), skin); neck.position.set(0, 1.6, 0); torso.add(neck);
  const head = piv(torso, 0, 1.7, 0); P.head = head;
  const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), skin); skull.scale.set(0.95, 1.1, 1.0); head.add(skull);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.168, 8, 5, 0, Math.PI * 2, 0, Math.PI * (o.bald ? 0.3 : 0.52)), hair); cap.scale.set(0.97, 1.12, 1.03); cap.position.set(0, 0.015, -0.01); cap.rotation.x = -0.22; head.add(cap);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.06, 4), skin); nose.rotation.x = Math.PI / 2; nose.position.set(0, -0.015, 0.17); head.add(nose);
  const ew = cm(o.eyeW ?? 0xf4f4ee, { roughness: 0.4 }), ep = cm(o.eyeP ?? 0x080808, { roughness: 0.3 });
  P.eyes = [];
  [-1, 1].forEach((s) => { const e = piv(head, s * 0.062, 0.03, 0.14); e.add(new THREE.Mesh(new THREE.SphereGeometry(o.eyeR ?? 0.027, 12, 9), ew)); const p = new THREE.Mesh(new THREE.SphereGeometry((o.eyeR ?? 0.027) * 0.6, 12, 9), ep); p.position.z = (o.eyeR ?? 0.027) * 0.7; e.add(p); box(0.07, 0.014, 0.02, hair, 0, 0.045, 0.01, e); P.eyes.push(e); });
  box(0.06, o.mouthH ?? 0.012, 0.02, cm(o.mouth ?? 0x6a3030), 0, -0.07, 0.15, head);
  [-1, 1].forEach((s) => { const ear = new THREE.Mesh(new THREE.IcosahedronGeometry(0.03, 0), skin); ear.position.set(s * 0.15, 0, 0); head.add(ear); });
  if (o.blood) { box(0.12, 0.2, 0.01, cm(0x6a0a10), 0, 1.15, 0.14, torso); box(0.06, 0.1, 0.01, cm(0x6a0a10), 0.1, -0.12, 0.15, head); }
  if (o.scale) g.scale.set(o.scale[0], o.scale[1], o.scale[2]);
  scene.add(g); return P;
}
function applyFigure(P, s, t) {
  P.g.position.set(s.x, s.y || 0, s.z); P.g.rotation.y = s.ry || 0;
  const w = Math.sin(s.walk || 0), a = s.walk ? (s.stride ?? 0.5) : 0;
  P.legL.hip.rotation.x = w * a; P.legR.hip.rotation.x = -w * a;
  P.legL.knee.rotation.x = Math.max(0, -w) * 0.5 * (s.walk ? 1 : 0); P.legR.knee.rotation.x = Math.max(0, w) * 0.5 * (s.walk ? 1 : 0);
  P.torso.position.y = Math.sin(t * 2.2) * 0.012 + (s.walk ? Math.abs(Math.cos(s.walk)) * 0.02 : 0);
  P.torso.rotation.x = s.lean || 0; P.torso.rotation.z = s.tilt || 0;
  P.armL.sh.rotation.set((s.walk && !s.armsFwd ? -w * 0.4 : 0) + (s.armL || 0), 0, s.armLz || 0);
  P.armR.sh.rotation.set((s.walk && !s.armsFwd ? w * 0.4 : 0) + (s.armR || 0), 0, s.armRz || 0);
  P.armL.el.rotation.x = s.elL || 0; P.armR.el.rotation.x = s.elR || 0;
  P.head.rotation.set(s.pitch || 0, s.yaw || 0, s.roll || 0);
  const e = s.eyes || 1; P.eyes.forEach((m) => m.scale.set(1, e, 1));
}
const hero = makeFigure({ skin: 0xd9a98a, jacket: 0x55606c, pants: 0x242c3a, hair: 0x3a2a22 });
hero.g.add((() => { const p = new THREE.Group(); box(0.07, 0.14, 0.01, dark, 0, 0, 0, p); const sc = box(0.06, 0.12, 0.012, emissive(0x6aa8ff), 0, 0, 0.006, p); p.position.set(0, -0.36, 0.05); p.rotation.set(-0.3, 0, Math.PI); hero.armL.el.add(p); hero.phone = p; return new THREE.Group(); })());
hero.phone.visible = false;
const zSkins = [0x7fa06a, 0x8aa87a, 0x6c8f62, 0x9ab08a], zJackets = [0x6a2a2a, 0x3a4a5a, 0x4a3a2a, 0x2a3a2a, 0x8a8a7a, 0x5a2a4a], zPants = [0x232a3a, 0x3a3328, 0x2a2a2a];
function makeZombie(i, big) {
  const r = rng(100 + i);
  return makeFigure({ skin: zSkins[Math.floor(r() * 4)], jacket: zJackets[Math.floor(r() * 6)], pants: zPants[Math.floor(r() * 3)], hair: [0x1a1a1a, 0x3a2a1a, 0x666666][Math.floor(r() * 3)], bald: r() < 0.25, eyeW: 0xe0e6a0, eyeP: 0x111100, mouth: 0x300808, mouthH: 0.03, blood: r() < 0.6, scale: [1, 0.92 + r() * 0.2, 1] });
}
const crowd = [];
for (let i = 0; i < 26; i++) {
  const r = rng(300 + i); const z = makeZombie(i);
  crowd.push({ f: z, x0: -30 + r() * 80, z0: -9 + r() * 6.5, dir: r() < 0.55 ? 1 : -1, sp: 0.35 + r() * 0.55, ph: r() * 6.28, lean: 0.1 + r() * 0.2 });
}
for (let i = 0; i < 5; i++) { const r = rng(500 + i); crowd.push({ f: makeZombie(40 + i), x0: 0.5 + i * 1.5, z0: -3.6 + r() * 1.0, dir: 1, sp: 0.1, ph: r() * 6.28, lean: 0.2, still: true }); }
const runner = makeZombie(80); const runner2 = makeZombie(81);
const visitor = makeFigure({ skin: 0xa8b09a, jacket: 0x8a3a4a, pants: 0x2a2a30, hair: 0x9a9a9a, eyeW: 0xd8e8b0, eyeP: 0x100800, mouth: 0x300808, mouthH: 0.03, blood: false });
const inZombie = makeZombie(90);
const handG = new THREE.Group(); room.add(handG);
box(0.1, 0.09, 0.03, cm(0xa8b09a), 0, 0, 0, handG); [-0.035, -0.012, 0.012, 0.035].forEach((x, i) => { box(0.014, 0.1 + (i % 2) * 0.02, 0.016, cm(0xa8b09a), x, 0.09, 0, handG); });
box(0.07, 0.3, 0.07, cm(0x8a3a4a), 0, -0.2, 0, handG);

/* dust */
const DN = 120; const dustBase = new Float32Array(DN * 3);
{ const r = rng(9); for (let i = 0; i < DN; i++) { dustBase[i * 3] = r() * 8; dustBase[i * 3 + 1] = 0.2 + r() * 2.3; dustBase[i * 3 + 2] = r() * 7; } }
const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(DN * 3), 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xffd8b0, size: 0.012, transparent: true, opacity: 0.4, depthWrite: false })); dust.frustumCulled = false; scene.add(dust);

/* ============================ SCRIPTED STATE ============================ */
const lightsOn = (t) => t < TT.lightsOff + 0.12;
const curtainC = (t) => ease(win(t, TT.curtains, TT.curtains + 0.9));
const wardrobeP = (t) => ease(win(t, TT.wardrobe, TT.sofa - 0.3));
const sofaP = (t) => ease(win(t, TT.sofa, TT.peephole - 0.4));
const waterL = (t) => rampKeys(t, [[TT.water, 0], [TT.hour + 1.5, 0.3], [TT.rule3, 0.36]]);
const knockT = [TT.knock, TT.knock + 0.75, TT.knock + 1.5];

function heroPose(t) {
  const p = { x: 1.6, z: 3.4, ry: -Math.PI / 2, walk: 0, pitch: 0, yaw: 0, lean: 0, armL: 0, armR: 0, elL: 0, elR: 0, eyes: 1, phone: false };
  const goto = (a, b, t0, t1, ry, spd = 3.4) => { const u = win(t, t0, t1); p.x = lerp(a[0], b[0], ease(u)); p.z = lerp(a[1], b[1], ease(u)); p.walk = u > 0 && u < 1 ? (t - t0) * spd * 3.2 : 0; p.ry = ry; return u; };
  if (t < TT.five + 0.6) { p.x = 1.6 + Math.sin(t * 0.6) * 0.03; if (t > TT.hookB) { p.pitch = 0.05; } }
  else if (t < TT.yard) { goto([1.6, 3.4], [6.3, 3.5], TT.five + 0.6, TT.yard - 0.4, Math.PI / 2); }
  else if (t < TT.rule1) { goto([6.3, 3.5], [2.5, 1.2], TT.yard, TT.rule1 - 0.3, Math.PI); }
  else if (t < TT.lightsOff + 0.6) { goto([2.5, 1.2], [1.3, 1.5], TT.rule1, TT.lightsOff - 0.4, -Math.PI / 2); if (t > TT.lightsOff - 0.3) { p.armR = -1.2; p.elR = -0.3; } }
  else if (t < TT.phone) { goto([1.3, 1.5], [2.5, 0.95], TT.lightsOff + 0.6, TT.curtains - 0.1, Math.PI); if (t > TT.curtains) { p.armL = -2.5; p.armR = -2.5; p.armLz = -0.25; p.armRz = 0.25; } }
  else if (t < TT.rule2) { goto([2.5, 0.95], [3.2, 2.4], TT.phone, TT.phone + 1.2, Math.PI / 2); if (t > TT.phone + 1.0) { p.armL = -0.9; p.elL = -1.3; p.pitch = 0.25; p.phone = true; } }
  else if (t < TT.rule2) { goto([2.5, 0.95], [3.2, 2.4], TT.phone - 0.8, TT.phone, Math.PI / 2); if (t > TT.phone - 0.2) { p.armL = -0.9; p.elL = -1.3; p.pitch = 0.25; p.phone = true; } }
  else if (t < TT.rule3) { goto([3.2, 2.4], [6.5, 4.8], TT.rule2, TT.water + 1.2, 0); if (t > TT.water + 1.5) { p.armR = -0.9; p.lean = 0.1; } }
  else if (t < TT.sofa) { const w = wardrobeP(t); const wx = lerp(6.8, 7.4, w), wz = lerp(1.2, 3.5, w); if (t < TT.wardrobe) { goto([6.5, 4.8], [6.8, 0.35], TT.rule3, TT.wardrobe - 0.1, Math.PI, 3); } else { p.x = wx; p.z = wz - 0.85; p.ry = 0; p.walk = w > 0 && w < 1 ? (t - TT.wardrobe) * 9 : 0; p.armL = -1.2; p.armR = -1.2; p.armsFwd = true; p.lean = 0.2; } }
  else if (t < TT.peephole) { const s = sofaP(t); p.x = lerp(2.5, 6.3, s) - 1.1; p.z = 3.4; p.ry = Math.PI / 2; p.walk = s > 0 && s < 1 ? (t - TT.sofa) * 9 : 0; p.armL = -1.2; p.armR = -1.2; p.armsFwd = true; p.lean = 0.2; }
  else if (t < TT.rule4) { goto([5.2, 3.4], [7.2, 3.5], TT.peephole - 0.5, TT.peephole + 0.4, Math.PI / 2); }
  else if (t < TT.heard) { goto([7.2, 3.5], [2.2, 3.4], TT.rule4, TT.rule4 + 2.4, -Math.PI / 2); if (t > TT.rule4 + 2.4) { p.lean = 0.45; p.armL = -0.9; p.armR = -0.9; } }
  else if (t < TT.notOpen) { goto([2.2, 3.4], [4.2, 3.5], TT.heard - 0.1, TT.heard + 1.6, Math.PI / 2); p.eyes = 1.25; }
  else if (t < TT.stepBack) { const u = win(t, TT.notOpen, TT.notOpen + 1.4); p.x = lerp(4.2, 3.4, ease(u)); p.z = 3.5; p.ry = Math.PI / 2; p.walk = u > 0 && u < 1 ? -(t - TT.notOpen) * 7 : 0; p.eyes = 1.3; p.pitch = -0.05; }
  else { const k = win(t, TT.stepBack, TT.behind); p.x = lerp(3.4, 2.7, ease(k)); p.z = 3.2; p.ry = lerp(Math.PI / 2, -Math.PI / 2, ease(win(t, TT.stepBack, TT.stepBack + 0.9))); p.walk = k > 0 && k < 1 ? (t - TT.stepBack) * 6 : 0; p.eyes = 1.35; }
  return p;
}

function zombiePose(c, t) {
  const x = c.still ? c.x0 + Math.sin(t * 0.4 + c.ph) * 0.2 : ((c.x0 + c.dir * c.sp * t + 40) % 100) - 40;
  const walk = c.still ? 0 : t * c.sp * 4.5 + c.ph;
  return { x, z: c.z0 + (c.still ? 0 : Math.sin(t * 0.3 + c.ph) * 0.3), ry: c.still ? Math.PI : (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2), walk, stride: 0.38, armL: -1.35, armR: -1.2 + Math.sin(t * 1.3 + c.ph) * 0.15, lean: c.lean, pitch: 0.25 + Math.sin(t * 0.9 + c.ph) * 0.1, tilt: Math.sin(t * 1.1 + c.ph) * 0.07, roll: 0.18, armsFwd: true };
}

/* ------------------------------------------------------------ shots */
const hp = (S) => S.h;
const SHOTS = [
  // hook: outside street, crowd + burning cars
  [0, 62, 0.05, (u, S) => [lerp3([9, 2.2, -14], [5.2, 1.9, -9.5], ease(u)), [3.5, 2.6, 0]]],
  [TT.hookB, 55, 0.04, (u, S) => [lerp3([4.3, 1.6, 3.2], [3.4, 1.55, 3.3], u), [0.3, 1.45, 3.1]]],
  [TT.minutes, 38, 0.04, (u, S) => [lerp3([0.95, 1.62, 3.8], [1.05, 1.64, 3.55], u), [1.6, 1.64, 3.4]]],
  [TT.five, 38, 0.04, (u, S) => [lerp3([1.7, 1.5, 3.2], [1.2, 1.5, 3.1], u), [0, 1.5, 2.9]]],
  [TT.stairs, 52, 0.07, (u, S) => [lerp3([5.2, 1.65, 1.9], [6.3, 1.65, 2.5], u), [8, 1.5, 3.5]]],
  [TT.yard, 58, 0.03, (u, S) => [lerp3([2.5, 1.6, 0.75], [2.5, 1.45, 0.45], u), [3.2, 0.4, -7]]],
  [TT.rule1, 48, 0.04, (u, S) => [[2.8, 1.5, 2.3], [0.8, 1.15, 1.0]]],
  [TT.lightsOff + 0.9, 52, 0.04, (u, S) => [lerp3([2.4, 1.6, 1.6], [2.5, 1.6, 1.2], u), [2.5, 1.5, -6]]],
  [TT.curtains, 48, 0.03, (u, S) => [lerp3([2.5, 1.5, 2.9], [2.5, 1.5, 2.3], u), [2.5, 1.5, 0]]],
  [TT.phone, 36, 0.04, (u, S) => [lerp3([2.7, 1.62, 2.0], [2.9, 1.58, 2.15], u), [3.6, 1.5, 2.4]]],
  [TT.rule2, 50, 0.03, (u, S) => [lerp3([5.7, 1.5, 4.3], [6.0, 1.4, 4.4], u), [7.2, 0.5, 6.1]]],
  [TT.hour, 50, 0.03, (u, S) => [lerp3([2.8, 1.3, 5.0], [2.3, 1.3, 5.2], u), [1.2, 1.0, 6.8]]],
  [TT.rule3, 58, 0.06, (u, S) => [lerp3([5.2, 1.7, 0.4], [5.8, 1.7, 0.9], u), [7.0, 1.2, 2.5]]],
  [TT.sofa, 55, 0.06, (u, S) => [lerp3([4.2, 1.8, 5.2], [4.6, 1.7, 5.0], u), [7, 0.8, 3.5]]],
  [TT.peephole, 105, 0.015, (u, S) => [[7.95, 1.55, 3.5], [10, 1.5, 3.5]]],
  [TT.rule4, 50, 0.04, (u, S) => [lerp3([3.1, 2.0, 2.3], [2.8, 1.8, 2.5], u), [1.2, 0.5, 3.4]]],
  [TT.heard, 55, 0.05, (u, S) => [lerp3([1.9, 1.62, 3.5], [2.8, 1.6, 3.5], ease(u)), [8, 1.5, 3.5]]],
  [TT.voice, 36, 0.05, (u, S) => [lerp3([6.9, 1.62, 3.3], [7.2, 1.6, 3.45], u), [8, 1.55, 3.5]]],
  [TT.momCalled, 40, 0.03, (u, S) => { const h = hp(S); return [lerp3([h.x + 1.7, 1.66, h.z - 1.0], [h.x + 1.4, 1.66, h.z - 0.8], u), [h.x, 1.64, h.z]]; }],
  [TT.notOpen, 58, 0.06, (u, S) => [lerp3([1.4, 1.8, 1.2], [1.8, 1.7, 1.6], u), [6, 1.2, 3.5]]],
  [TT.key, 34, 0.015, (u, S) => [lerp3([7.35, 1.25, 3.2], [7.5, 1.2, 3.3], u), [8, 1.1, 3.0]]],
  [TT.chain, 34, 0.012, (u, S) => [lerp3([7.35, 1.55, 3.4], [7.45, 1.5, 3.6], u), [7.95, 1.45, 3.98]]],
  [TT.rule5, 40, 0.04, (u, S) => { const h = hp(S); return [lerp3([h.x + 1.1, 1.62, h.z - 0.5], [h.x + 0.9, 1.62, h.z - 0.4], u), [h.x, 1.64, h.z]]; }],
  [TT.stepBack, 52, 0.05, (u, S) => [lerp3([0.7, 1.55, 2.4], [0.8, 1.55, 2.8], u), [3.4, 1.45, 3.6]]],
  [TT.steps, 44, 0.05, (u, S) => { const h = hp(S); return [lerp3([0.9, 1.62, 3.0], [1.3, 1.62, 3.1], ease(u)), [h.x + 0.7, 1.55, 3.7]]; }],
];
const SHOT_LIST = SHOTS.map((s, i) => ({ a: s[0], b: i + 1 < SHOTS.length ? SHOTS[i + 1][0] : 1e9, f: s[1], shake: s[2], c: s[3] }));
const SHAKES = [[knockT[0], 0.05, 0.25], [knockT[1], 0.05, 0.25], [knockT[2], 0.06, 0.25], [TT.lightsOff, 0.04, 0.3], [TT.key, 0.03, 0.3], [TT.chain, 0.05, 0.4], [TT.behind, 0.06, 0.5], [TT.stairs + 0.5, 0.05, 0.4]];

/* ----------------------------------------------------------- overlays */
const el = (id) => document.getElementById(id);
const elFlash = el("flash"), elDip = el("dip"), elGrain = el("grain"), elPeep = el("peep"), elRed = el("redtint"), elGlitch = el("glitch");
const pulse = (t, c, w) => Math.max(0, 1 - Math.abs(t - c) / w);
function overlays(t) {
  let f = pulse(t, TT.lightsOff + 0.1, 0.1) * 0.7 + pulse(t, knockT[0], 0.05) * 0.4 + pulse(t, knockT[1], 0.05) * 0.4 + pulse(t, knockT[2], 0.05) * 0.5 + pulse(t, TT.behind, 0.08) * 0.6;
  elFlash.style.opacity = clamp(f).toFixed(3);
  let d = clamp(1 - t / 0.3);
  [TT.rule1, TT.rule2, TT.rule3, TT.rule4, TT.rule5, TT.heard].forEach((c) => { d += 0.6 * pulse(t, c - 0.04, 0.1); });
  d += clamp((t - CUE.endBlack) / 0.15);
  elDip.style.opacity = clamp(d).toFixed(3);
  elPeep.style.opacity = t >= TT.peephole && t < TT.peephole + (TT.rule4 - TT.peephole) ? 1 : 0;
  elRed.style.opacity = (t > TT.heard ? 0.2 + 0.1 * Math.sin(t * 6) : 0.0).toFixed(3);
  elGlitch.style.opacity = ((t > TT.behind - 0.6 && hash(Math.floor(t * 20)) < 0.3) ? 1 : 0);
  elGrain.style.backgroundPosition = `${Math.floor(hash(Math.floor(t * 30)) * 300)}px ${Math.floor(hash(Math.floor(t * 30) + 7) * 300)}px`;
}

/* -------------------------------------------------------------- frame */
function renderAt(t) {
  t = clamp(t, 0, DUR);
  const on = lightsOn(t);
  // lights
  const fl = hash(Math.floor(t * 9)) < 0.05 && t > 2 ? 0.5 : 1;
  lights.ceil.intensity = on ? 12 * fl : 0; lights.floor.intensity = on ? 5 : 0; lights.tbl.intensity = on ? 3 : 0;
  shadeMat.color.setHex(on ? 0xffd9a0 : 0x3a3028); ceilingLamp.visible = true;
  lights.tv.intensity = 2.0 * (0.7 + 0.5 * hash(Math.floor(t * 12))) * (on ? 0.6 : 1.5);
  lights.moon.intensity = on ? 3 : 8 + Math.sin(t * 7) * 1.2;
  lights.fill.intensity = on ? 0 : (t > TT.rule4 ? 0.0 : 0.0);
  amb.intensity = on ? 0.55 : 0.28;
  hallLamp.intensity = t > TT.peephole - 2 ? 2.5 * (hash(Math.floor(t * 13)) < 0.18 ? 0.1 : 1) : 0;
  fireLight.intensity = 25 * (0.8 + 0.4 * hash(Math.floor(t * 14)));
  fireLight2.intensity = 18 * (0.8 + 0.4 * hash(Math.floor(t * 14) + 4));
  flames.forEach((f, i) => { f.scale.set(1, 0.8 + hash(Math.floor(t * 12) + i) * 0.7, 1); f.rotation.y = t * 2 + i; });
  streetLights.forEach((l, i) => { l.intensity = 6 * (hash(Math.floor(t * 8) + i * 3) < 0.07 ? 0.2 : 1); });
  skyMat.uniforms.bot.value.setHex(0x7a2412); sky.position.copy(cam.position);
  drawTV(t); tvScr.visible = true;
  // curtains
  const c = curtainC(t);
  curL.position.x = lerp(0.9, 2.05, c); curR.position.x = lerp(4.1, 2.95, c); curL.scale.x = lerp(1, 1.05, c); curR.scale.x = lerp(1, 1.05, c);
  // water
  const wl = waterL(t); water.position.y = 0.12 + wl; water.visible = t > TT.water - 0.1; stream.visible = t > TT.water && t < TT.rule3; stream.scale.y = 1 + Math.sin(t * 30) * 0.05;
  // barricade
  const wp = wardrobeP(t); wardrobe.position.set(lerp(6.8, 7.45, wp), 0, lerp(1.2, 3.5, wp)); wardrobe.rotation.y = lerp(0, Math.PI / 2, wp) + 0 * 1;
  const sp = sofaP(t); sofa.position.set(lerp(2.5, 6.4, sp), 0, 3.4); sofa.rotation.y = 0;
  // items
  const itemT = [TT.docs, TT.charger, TT.kit, TT.cans, TT.knife];
  items.forEach((it, i) => { const k = ease(win(t, itemT[i], itemT[i] + 0.3)); it.visible = k > 0; it.scale.setScalar(Math.max(0.001, k)); });
  pack.visible = t > TT.rule4 - 0.1; table.visible = true;
  // door: knocks, key, chain
  let shake = 0; knockT.forEach((k) => { const d = t - k; if (d > 0 && d < 0.35) shake += Math.sin(d * 90) * Math.exp(-d * 14) * 0.02; });
  const gap = t >= TT.chain - 0.2 ? ease(win(t, TT.chain - 0.2, TT.chain + 0.5)) * 0.1 : 0;
  doorG.rotation.y = -(shake + gap);
  keyBar.rotation.z = t >= TT.key ? ease(win(t, TT.key, TT.key + 0.7)) * Math.PI / 2 : 0;
  keyBar.visible = t >= TT.key - 0.2;
  // chain
  const a = new THREE.Vector3(7.98 - 0.06 * Math.cos(gap) , 1.45, 4.1 - 0.18 - 0.0), b = new THREE.Vector3(7.93, 1.45, 3.95);
  const ca = new THREE.Vector3(); chainA.getWorldPosition(ca); const dv = new THREE.Vector3().subVectors(chainFrame.position, ca); chainLine.position.copy(ca).addScaledVector(dv, 0.5); chainLine.scale.y = Math.max(0.02, dv.length()); chainLine.lookAt(chainFrame.position); chainLine.rotateX(Math.PI / 2);
  // hand through the gap
  handG.visible = t >= TT.chain + 0.1; handG.position.set(7.99 + Math.sin(t * 5) * 0.003, 1.25 + 0.06 * Math.sin(t * 6), 4.06 - gap * 0.4); handG.rotation.set(0, Math.PI / 2, 0.4 + Math.sin(t * 7) * 0.12);
  // figures
  const hpz = heroPose(t); applyFigure(hero, hpz, t); hero.phone.visible = !!hpz.phone; hero.g.visible = true;
  crowd.forEach((cz) => { const s = zombiePose(cz, t); applyFigure(cz.f, s, t); });
  { const u = win(t, 0.2, 3.2); const s = { x: lerp(-6, 16, u), z: -4.4, ry: Math.PI / 2, walk: t * 14, stride: 0.9, armL: -1.2, armR: -0.8, lean: 0.35, pitch: 0.2, armsFwd: true }; applyFigure(runner, s, t); runner.g.visible = t < 3.4;
    const u2 = win(t, TT.yard + 0.2, TT.yard + 2.6); const s2 = { x: lerp(8, 1, u2), z: -3.2, ry: -Math.PI / 2, walk: t * 14, stride: 0.9, armL: -1.2, armR: -0.8, lean: 0.35, pitch: 0.2, armsFwd: true }; applyFigure(runner2, s2, t); runner2.g.visible = t > TT.yard - 0.1 && t < TT.yard + 3; }
  visitor.g.visible = t >= TT.knock - 0.5; applyFigure(visitor, { x: 8.75, z: 3.5, ry: -Math.PI / 2, pitch: 0.3, armL: -0.2, armR: -0.2, tilt: Math.sin(t * 0.8) * 0.05 }, t);
  // zombie inside the flat: emerges from the bathroom niche, then looms behind the hero
  const zu = win(t, TT.steps - 0.4, TT.behind);
  inZombie.g.visible = t > TT.steps - 0.4 && t < CUE.endBlack;
  applyFigure(inZombie, { x: lerp(6.9, hpz.x + 0.95, ease(zu)), z: lerp(5.8, 4.05, ease(zu)), ry: -Math.PI / 2, walk: zu > 0 && zu < 1 ? t * 5 : 0, stride: 0.35, armL: -1.3, armR: -1.3, lean: 0.2, pitch: 0.3, tilt: Math.sin(t * 1.4) * 0.06, armsFwd: true }, t);
  // dust
  const pa = dustGeo.attributes.position.array;
  for (let i = 0; i < DN; i++) { pa[i * 3] = dustBase[i * 3] + Math.sin(t * 0.3 + i) * 0.1; pa[i * 3 + 1] = dustBase[i * 3 + 1] + Math.sin(t * 0.2 + i * 1.7) * 0.08; pa[i * 3 + 2] = dustBase[i * 3 + 2] + Math.cos(t * 0.25 + i * 0.7) * 0.1; }
  dustGeo.attributes.position.needsUpdate = true;
  // camera
  let shot = SHOT_LIST[SHOT_LIST.length - 1];
  for (const s of SHOT_LIST) if (t >= s.a && t < s.b) { shot = s; break; }
  const u = clamp((t - shot.a) / (Math.min(shot.b, DUR) - shot.a));
  const [p, l] = shot.c(u, { h: hpz, t });
  const amp = shot.shake;
  let sx = (noise1(t * 6) - 0.5) * 2 * amp * 0.5, sy = (noise1(t * 6 + 40) - 0.5) * 2 * amp * 0.5, sz = (noise1(t * 6 + 80) - 0.5) * 2 * amp * 0.5, roll = (noise1(t * 3 + 120) - 0.5) * amp * 0.4;
  for (const [te, am, dc] of SHAKES) if (t >= te) { const k = am * Math.exp(-(t - te) / dc); sx += (noise1(t * 28) - 0.5) * k; sy += (noise1(t * 28 + 30) - 0.5) * k; roll += (noise1(t * 22 + 60) - 0.5) * k * 0.5; }
  cam.fov = shot.f; cam.updateProjectionMatrix();
  cam.position.set(p[0] + sx, p[1] + sy, p[2] + sz); cam.up.set(Math.sin(roll), Math.cos(roll), 0); cam.lookAt(l[0], l[1], l[2]);
  camFill.intensity = t < TT.hookB ? 30 : (on ? 1.2 : 3.2); camFill.distance = t < TT.hookB ? 40 : 7;
  overlays(t); window.__ui && window.__ui(t);
  renderer.render(scene, cam);
}
const safeRender = (t) => { try { renderAt(t); } catch (e) { console.error("RENDERFAIL t=" + t + " " + e.stack); } };
window.addEventListener("hf-seek", (e) => safeRender(e.detail.time));
safeRender(window.__hfThreeTime || 0);
