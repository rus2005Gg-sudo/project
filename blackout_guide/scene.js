import * as THREE from "three";

const W = 1080, H = 1920;
const CUE = window.CUE, E = CUE.e, DUR = CUE.dur;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const ease = (u) => u * u * (3 - 2 * u);
const win = (t, a, b) => clamp((t - a) / (b - a));
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const noise1 = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u); };
const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

const canvas = document.getElementById("gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.5;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0a0f1c);
const cam = new THREE.PerspectiveCamera(58, W / H, 0.05, 200); scene.add(cam);

function ctex(w, h, draw, rep) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.userData = { g, w, h }; return t;
}
const speck = (g, w, h, n, seed, cols, sz) => { const r = rng(seed); for (let i = 0; i < n; i++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(r() * w, r() * h, 1 + r() * sz, 1 + r() * sz); } };
const wallTex = ctex(256, 256, (g, w, h) => { g.fillStyle = "#8d877b"; g.fillRect(0, 0, w, h); speck(g, w, h, 3500, 1, ["rgba(0,0,0,.05)", "rgba(255,255,255,.05)"], 3); }, true); wallTex.repeat.set(3, 1.5);
const floorTex = ctex(256, 256, (g, w, h) => { g.fillStyle = "#5a4232"; g.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "rgba(0,0,0,.12)" : "rgba(255,200,150,.05)"; g.fillRect(0, i * 32, w, 32); g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(0, i * 32, w, 2); } speck(g, w, h, 1500, 2, ["rgba(0,0,0,.18)"], 4); }, true); floorTex.repeat.set(2, 3);
const facadeTex = ctex(512, 512, (g, w, h) => { g.fillStyle = "#12151c"; g.fillRect(0, 0, w, h); speck(g, w, h, 2500, 5, ["rgba(255,255,255,.03)", "rgba(0,0,0,.2)"], 3); g.fillStyle = "#0a0c11"; for (let y = 0; y < 14; y++) for (let x = 0; x < 16; x++) g.fillRect(x * 32 + 6, y * 36 + 8, 18, 22); });

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, ...o });
function box(w, h, d, mat, x, y, z, parent = scene) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; }

/* room */
const wallM = std(0xffffff, { map: wallTex }), floorM = std(0xffffff, { map: floorTex, roughness: 0.55 }), ceilM = std(0x9a958c);
box(4.4, 0.1, 7.2, floorM, 0, -0.05, -1.0); box(4.4, 0.1, 7.2, ceilM, 0, 2.65, -1.0);
box(0.1, 2.7, 7.2, wallM, -2.25, 1.3, -1.0); box(0.1, 2.7, 7.2, wallM, 2.25, 1.3, -1.0); box(4.4, 2.7, 0.1, wallM, 0, 1.3, 2.6);
const FW = -4.5;
box(0.9, 2.7, 0.15, wallM, -1.75, 1.3, FW); box(1.8, 0.9, 0.15, wallM, -0.4, 0.45, FW); box(1.8, 0.5, 0.15, wallM, -0.4, 2.45, FW); box(2.0, 2.7, 0.15, wallM, 1.2, 1.3, FW);
const frameM = std(0x2b2926);
box(1.9, 0.06, 0.2, frameM, -0.4, 0.92, FW); box(1.9, 0.06, 0.2, frameM, -0.4, 2.2, FW); box(0.06, 1.34, 0.2, frameM, -1.32, 1.55, FW); box(0.06, 1.34, 0.2, frameM, 0.52, 1.55, FW); box(0.05, 1.3, 0.2, frameM, -0.4, 1.55, FW);
const facade = new THREE.Mesh(new THREE.PlaneGeometry(36, 26), new THREE.MeshBasicMaterial({ map: facadeTex, color: 0x9aa6c0 })); facade.position.set(0, 7, -13.5); scene.add(facade);

/* props */
const couchM = std(0x3a4658), woodM = std(0x4b3626);
box(1.9, 0.45, 0.85, couchM, -1.2, 0.23, 0.5); box(1.9, 0.5, 0.2, couchM, -1.2, 0.62, 0.9);
box(1.4, 0.04, 0.7, woodM, 0.3, 0.42, -2.2); [[-0.35, -1.9], [0.95, -1.9], [-0.35, -2.5], [0.95, -2.5]].forEach(([x, z]) => box(0.05, 0.4, 0.05, woodM, x, 0.2, z));
// fridge
const fridge = new THREE.Group(); fridge.position.set(-1.65, 0, -4.05); scene.add(fridge);
box(0.75, 1.85, 0.7, std(0xdfe3e8, { roughness: 0.4 }), 0, 0.93, 0, fridge); box(0.04, 0.5, 0.05, std(0x555a60), 0.28, 1.3, 0.37, fridge); box(0.7, 0.02, 0.02, std(0x9aa0a8), 0, 1.25, 0.36, fridge);
const fridgeTex = ctex(256, 128, () => {}); const fridgeScr = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.15), new THREE.MeshBasicMaterial({ map: fridgeTex, toneMapped: false })); fridgeScr.position.set(-0.1, 1.6, 0.355); fridge.add(fridgeScr);
// tub
const tubM = std(0xe8ebee, { roughness: 0.35 });
box(1.6, 0.55, 0.8, tubM, 1.4, 0.28, -3.9); const water = new THREE.Mesh(new THREE.BoxGeometry(1.46, 1, 0.66), new THREE.MeshStandardMaterial({ color: 0x4a7896, roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.85 })); water.position.set(1.4, 0.3, -3.9); scene.add(water);
const tap = box(0.05, 0.05, 0.3, std(0xb0b6bd, { metalness: 0.8 }), 1.4, 0.95, -4.3); const stream = box(0.025, 0.6, 0.025, new THREE.MeshBasicMaterial({ color: 0x9fd0ff, toneMapped: false, transparent: true, opacity: 0.7 }), 1.4, 0.62, -4.2);
// phone
const phoneTex = ctex(256, 512, () => {}); const phone = new THREE.Group(); phone.position.set(0.55, 0.45, -2.1); phone.rotation.set(-1.45, 0, 0.35); scene.add(phone);
box(0.075, 0.155, 0.008, std(0x111111), 0, 0, 0, phone); const pscr = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.148), new THREE.MeshBasicMaterial({ map: phoneTex, toneMapped: false })); pscr.position.z = 0.0045; phone.add(pscr);
// candle + flashlight
box(0.06, 0.13, 0.06, std(0xf0e6cc), -0.2, 0.5, -2.35); const flame = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffb03a, toneMapped: false })); flame.scale.set(1, 1.8, 1); flame.position.set(-0.2, 0.595, -2.35); scene.add(flame);
const candleL = new THREE.PointLight(0xffa850, 0, 3, 2); candleL.position.set(-0.2, 0.62, -2.35); scene.add(candleL);
const fl = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.2, 12), std(0x2a2d33, { metalness: 0.6 })); fl.rotation.z = Math.PI / 2; fl.position.set(0.15, 0.48, -2.45); scene.add(fl);
const flBeam = new THREE.SpotLight(0xe8f0ff, 0, 6, 0.5, 0.6, 1.2); flBeam.position.set(0.25, 0.5, -2.45); scene.add(flBeam); const flT = new THREE.Object3D(); flT.position.set(0.9, 1.0, -4.0); scene.add(flT); flBeam.target = flT;
// radio
const radioTex = ctex(256, 128, () => {}); const radio = new THREE.Group(); radio.position.set(-0.65, 0.5, -2.15); radio.rotation.y = 0.2; scene.add(radio);
box(0.32, 0.18, 0.1, std(0x23262b), 0, 0, 0, radio); box(0.006, 0.4, 0.006, std(0xbbbbbb), 0.13, 0.28, 0, radio).rotation.z = -0.3;
const dial = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.08), new THREE.MeshBasicMaterial({ map: radioTex, toneMapped: false })); dial.position.set(-0.03, 0, 0.052); radio.add(dial);
// thermometer on right wall
const thermTex = ctex(256, 512, () => {}); const therm = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.56), new THREE.MeshBasicMaterial({ map: thermTex, toneMapped: false })); therm.position.set(2.19, 1.5, -1.6); therm.rotation.y = -Math.PI / 2; scene.add(therm);
const bundle = box(0.5, 0.26, 0.4, std(0x6b3b3b), 0.0, 0.57, -2.6); bundle.visible = false; // blanket on table for rule 5

/* lights */
const amb = new THREE.AmbientLight(0x6c85b8, 0.9); scene.add(amb);
const moon = new THREE.DirectionalLight(0x7f98c8, 0.8); moon.position.set(0, 3, -10); scene.add(moon);
const torch = new THREE.SpotLight(0xdfe8ff, 10, 9, 0.6, 0.55, 1.2); cam.add(torch); torch.position.set(0.05, -0.05, 0); const tgt = new THREE.Object3D(); tgt.position.set(0, 0, -3); cam.add(tgt); torch.target = tgt;

/* dynamic canvases */
const font = (g, px, w = 800) => { g.font = w + " " + px + "px Mont, sans-serif"; };
function drawFridge(t) { const { g, w, h } = fridgeTex.userData; g.fillStyle = "#0a1a10"; g.fillRect(0, 0, w, h); g.fillStyle = "#7dff9f"; font(g, 70, 900); g.textAlign = "center"; g.fillText("+4°C", w / 2, 85); fridgeTex.needsUpdate = true; }
function drawPhone(t) {
  const { g, w, h } = phoneTex.userData; const k = win(t, E.r3, E.r4); g.fillStyle = "#06090f"; g.fillRect(0, 0, w, h);
  const pct = Math.round(lerp(34, 33, k)); g.textAlign = "center"; g.fillStyle = "#fff"; font(g, 120, 900); g.fillText("03:47", w / 2, 150);
  g.fillStyle = k > 0.25 ? "#ffd60a" : "#ffffff"; font(g, 56, 800); g.fillText(k > 0.25 ? "✈ АВИАРЕЖИМ" : "НЕТ СЕТИ", w / 2, 235);
  g.strokeStyle = "#fff"; g.lineWidth = 6; g.strokeRect(46, 300, 150, 76); g.fillStyle = "#fff"; g.fillRect(196, 322, 12, 32); g.fillStyle = pct > 20 ? "#7dff9f" : "#ff3b30"; g.fillRect(52, 306, 138 * pct / 100, 64);
  g.fillStyle = "#fff"; font(g, 50, 900); g.textAlign = "left"; g.fillText(pct + "%", 60, 440); g.textAlign = "center";
  g.fillStyle = "rgba(255,255,255," + lerp(0.9, 0.1, k) + ")"; g.fillRect(40, 470, 176, 20); g.fillStyle = "#ffd60a"; g.fillRect(40, 470, 176 * lerp(1, 0.08, k), 20); phoneTex.needsUpdate = true;
}
function drawRadio(t) {
  const { g, w, h } = radioTex.userData; const on = t >= E.r6 + 1.0; g.fillStyle = on ? "#1a2a1c" : "#0b0c0d"; g.fillRect(0, 0, w, h);
  if (on) { g.fillStyle = "#9dff7a"; font(g, 54, 900); g.textAlign = "center"; g.fillText("FM 98.4", w / 2, 60); const r = rng(Math.floor(t * 12)); g.fillStyle = "rgba(157,255,122,.7)"; for (let i = 0; i < 24; i++) g.fillRect(14 + i * 10, h - 14 - r() * 44, 6, 6 + r() * 44); }
  radioTex.needsUpdate = true;
}
function drawTherm(t) {
  const { g, w, h } = thermTex.userData; g.fillStyle = "#101418"; g.fillRect(0, 0, w, h); const k = win(t, E.r5 + 1.2, E.r5 + 6.5), T = lerp(11, 18, k);
  g.fillStyle = "#222a30"; g.fillRect(100, 40, 56, 360); g.fillStyle = T < 14 ? "#6fb7ff" : "#ffb86f"; const hh = 360 * (T - 5) / 25; g.fillRect(100, 40 + 360 - hh, 56, hh); g.beginPath(); g.arc(128, 430, 52, 0, 7); g.fill();
  g.fillStyle = "#fff"; font(g, 56, 900); g.textAlign = "center"; g.fillText(Math.round(T) + "°", 128, 508); thermTex.needsUpdate = true;
}

/* shots: [t0, camPos(u), lookAt(u), fov] */
const P = (a, b) => (u) => [lerp(a[0], b[0], ease(u)), lerp(a[1], b[1], ease(u)), lerp(a[2], b[2], ease(u))];
const SHOTS = [
  [0, P([0, 1.45, 0.4], [0, 1.45, 0.1]), P([-0.2, 1.5, -4.5], [-0.2, 1.5, -4.5]), 62],
  [E.r1, P([-0.6, 1.35, -1.8], [-1.0, 1.35, -2.5]), P([-1.65, 1.35, -4.1], [-1.65, 1.5, -4.1]), 56],
  [E.r2, P([0.4, 1.5, -2.2], [0.9, 1.35, -2.6]), P([1.4, 0.3, -3.9], [1.4, 0.4, -3.9]), 58],
  [E.r3, P([0.3, 0.95, -1.6], [0.45, 0.78, -1.75]), P([0.55, 0.45, -2.1], [0.55, 0.45, -2.1]), 46],
  [E.r4, P([-0.15, 0.95, -1.5], [-0.1, 0.9, -1.7]), P([-0.02, 0.52, -2.4], [-0.02, 0.52, -2.4]), 52],
  [E.r5, P([0.4, 1.4, -0.3], [1.0, 1.4, -0.5]), P([2.19, 1.5, -1.6], [2.19, 1.5, -1.6]), 54],
  [E.r6, P([-0.1, 0.95, -1.5], [-0.4, 0.85, -1.7]), P([-0.65, 0.5, -2.15], [-0.65, 0.5, -2.15]), 46],
  [E.chk, P([0.3, 1.5, -1.8], [1.0, 1.35, -2.4]), P([1.4, 0.35, -3.9], [1.4, 0.2, -3.9]), 56],
];

/* breath puffs */
const puffs = []; const puffM = new THREE.SpriteMaterial({ color: 0xcfe2ff, transparent: true, opacity: 0.0, depthWrite: false });
for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(puffM.clone()); scene.add(s); puffs.push(s); }

function renderAt(t) {
  drawFridge(t); drawPhone(t); drawRadio(t); drawTherm(t);
  // tub: fills during r2, drains at the end
  const fill = win(t, E.r2 + 0.5, E.r3 - 1.0), drain = ease(win(t, E.twist, E.twist + 1.6));
  const lvl = Math.max(0.02, 0.5 * fill * (1 - drain) + 0.03);
  water.scale.y = lvl; water.position.y = 0.0 + lvl / 2 + 0.03 + 0.0; water.visible = lvl > 0.04;
  const run = t > E.r2 + 0.3 && t < E.r3 - 0.8; stream.visible = run; tap.visible = true;
  // candle + flashlight
  const cOn = t >= E.r4 && t < E.r4 + 3.0; flame.visible = cOn; candleL.intensity = cOn ? 1.2 + 0.4 * Math.sin(t * 17) + 0.3 * Math.sin(t * 29) : 0;
  flame.scale.set(1 + 0.15 * Math.sin(t * 19), 1.8 + 0.4 * Math.sin(t * 23), 1);
  flBeam.intensity = t >= E.r4 + 2.4 && t < E.r5 ? 12 : 0; torch.intensity = 9;
  bundle.visible = t >= E.r5 + 2.0 && t < E.r6;
  // breath puffs near the camera during r5
  puffs.forEach((s, i) => { const k = ((t * 0.7 + i / puffs.length) % 1), on = t >= E.r5 && t < E.r6 - 0.5; s.material.opacity = on ? 0.35 * Math.sin(k * Math.PI) : 0; const f = new THREE.Vector3(0.0, -0.12, -0.7).applyMatrix4(cam.matrixWorld); s.position.set(f.x + (k - 0.5) * 0.1, f.y + k * 0.25, f.z - k * 0.1); s.scale.setScalar(0.12 + k * 0.5); });
  // camera
  let si = 0; for (let i = 0; i < SHOTS.length; i++) if (t >= SHOTS[i][0]) si = i;
  const t0 = SHOTS[si][0], t1 = si + 1 < SHOTS.length ? SHOTS[si + 1][0] : DUR, u = clamp((t - t0) / (t1 - t0));
  const pos = SHOTS[si][1](u), look = SHOTS[si][2](u);
  const sh = 0.006 * (0.6 + noise1(t * 2)); pos[0] += (noise1(t * 6) - 0.5) * sh * 2; pos[1] += (noise1(t * 6 + 20) - 0.5) * sh * 2;
  const roll = (noise1(t * 3 + 70) - 0.5) * 0.012;
  cam.fov = SHOTS[si][3]; cam.updateProjectionMatrix(); cam.position.set(pos[0], pos[1], pos[2]); cam.up.set(Math.sin(roll), Math.cos(roll), 0); cam.lookAt(look[0], look[1], look[2]); cam.updateMatrixWorld(true);
  window.__ui && window.__ui(t);
  renderer.render(scene, cam);
}
const safeRender = (t) => { try { renderAt(t); } catch (e) { console.error("RENDERFAIL t=" + t + " " + e.stack); } };
window.addEventListener("hf-seek", (e) => safeRender(e.detail.time));
safeRender(window.__hfThreeTime || 0);
