import * as THREE from "three";
import { Reflector } from "./assets/vendor/addons/Reflector.js";

const W = 1080, H = 1920;
const DUR = 104;

/* ---------------------------------------------------------------- utils */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const ease = (u) => u * u * (3 - 2 * u);
const easeOut = (u) => 1 - Math.pow(1 - u, 3);
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const noise1 = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u); };
const rampKeys = (t, keys) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t < keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; return lerp(v0, v1, (t - t0) / (t1 - t0)); }
  }
  return keys[keys.length - 1][1];
};
const rng = (seed) => { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

/* ------------------------------------------------------------- renderer */
const canvas = document.getElementById("gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02050a);
scene.fog = new THREE.FogExp2(0x07121a, 0.05);
const cam = new THREE.PerspectiveCamera(55, W / H, 0.03, 80);
scene.add(cam);
const camFill = new THREE.PointLight(0x9db8c8, 2.2, 7, 1.6); cam.add(camFill);

/* ------------------------------------------------------------- textures */
function ctex(w, h, draw, rep) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d"); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.userData = { c, g };
  return t;
}
function speckle(g, w, h, n, seed, cols, sz = 2) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(r() * w, r() * h, 1 + r() * sz, 1 + r() * sz); }
}
const wallTex = (dusty) => ctex(512, 512, (g, w, h) => {
  g.fillStyle = dusty ? "#7a7f70" : "#8aa09b"; g.fillRect(0, 0, w, h);
  g.fillStyle = dusty ? "#2a3a30" : "#34524b"; g.fillRect(0, h * 0.5, w, h * 0.5);
  g.fillStyle = dusty ? "#5b5f4a" : "#6d8b83"; g.fillRect(0, h * 0.5 - 6, w, 7);
  speckle(g, w, h, 2400, 11, ["rgba(0,0,0,.10)", "rgba(255,255,255,.06)", "rgba(20,30,20,.12)"], 3);
  const r = rng(dusty ? 5 : 4);
  for (let i = 0; i < (dusty ? 40 : 14); i++) { const x = r() * w; g.fillStyle = dusty ? "rgba(40,30,15,.22)" : "rgba(10,20,20,.10)"; g.fillRect(x, 0, 4 + r() * 22, h * (0.3 + r() * 0.7)); }
  if (dusty) for (let i = 0; i < 16; i++) { g.fillStyle = "rgba(190,180,150,.16)"; g.beginPath(); g.ellipse(r() * w, r() * h, 20 + r() * 50, 10 + r() * 30, r() * 3, 0, 7); g.fill(); }
}, true);
const floorTex = (dusty) => ctex(256, 256, (g, w, h) => {
  const a = dusty ? ["#3a3a32", "#31302a"] : ["#34464a", "#2a3a3d"];
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = a[(i + j) % 2]; g.fillRect(i * 128, j * 128, 128, 128); }
  g.strokeStyle = "rgba(0,0,0,.55)"; g.lineWidth = 3; g.strokeRect(1, 1, 126, 126); g.strokeRect(129, 1, 126, 126); g.strokeRect(1, 129, 126, 126); g.strokeRect(129, 129, 126, 126);
  speckle(g, w, h, 1800, 21, ["rgba(0,0,0,.18)", "rgba(255,255,255,.07)"], 2);
  if (dusty) { speckle(g, w, h, 1400, 22, ["rgba(170,160,130,.25)"], 4); g.strokeStyle = "rgba(0,0,0,.5)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(10, 30); g.lineTo(70, 90); g.lineTo(60, 140); g.stroke(); }
}, true);
const woodTex = ctex(256, 256, (g, w, h) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = ["#4a3524", "#3e2b1d", "#523a28"][i % 3]; g.fillRect(0, i * 32, w, 32); g.fillStyle = "rgba(0,0,0,.4)"; g.fillRect(0, i * 32, w, 2); }
  speckle(g, w, h, 1200, 31, ["rgba(0,0,0,.2)", "rgba(255,200,150,.07)"], 3);
}, true);
const paperTex = ctex(256, 256, (g, w, h) => {
  g.fillStyle = "#6a5f4e"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? "rgba(0,0,0,.10)" : "rgba(255,255,255,.04)"; g.fillRect(i * 16, 0, 8, h); }
  speckle(g, w, h, 900, 33, ["rgba(0,0,0,.12)"], 3);
}, true);
const wallN = wallTex(false), wallD = wallTex(true), floorN = floorTex(false), floorD = floorTex(true);

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, flatShading: true, ...o });
const wallMat = new THREE.MeshStandardMaterial({ map: wallN, roughness: 0.92 });
const floorMat = new THREE.MeshStandardMaterial({ map: floorN, roughness: 0.5, metalness: 0.15 });
const ceilMat = std(0x56676a, { roughness: 1 });
const steel = std(0x8a979a, { metalness: 0.45, roughness: 0.42 });
const darkSteel = std(0x39444a, { metalness: 0.4, roughness: 0.5 });

function plane(w, h, mat, ux = 1, uy = 1) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * ux, uv.getY(i) * uy);
  return new THREE.Mesh(g, mat);
}
function box(w, h, d, mat, x, y, z, parent = scene) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); parent.add(m); return m;
}
function put(m, x, y, z, rx = 0, ry = 0, rz = 0, parent = scene) { m.position.set(x, y, z); m.rotation.set(rx, ry, rz); parent.add(m); return m; }

/* ---------------------------------------------------------------- HALL */
const hall = new THREE.Group(); scene.add(hall);
// floor / ceiling / left wall
put(plane(3.2, 16.4, floorMat, 3.2 / 1.6, 16.4 / 1.6), 0, 0, 1, -Math.PI / 2, 0, 0, hall);
put(plane(3.2, 16.4, ceilMat), 0, 2.8, 1, Math.PI / 2, 0, 0, hall);
put(plane(16.4, 2.8, wallMat, 16.4 / 2.8, 1), -1.6, 1.4, 1, 0, Math.PI / 2, 0, hall);
// right wall (faces -x) with a gap for door #42 (z 1.55..2.45)
put(plane(6.75, 2.8, wallMat, 6.75 / 2.8, 1), 1.6, 1.4, 5.825, 0, -Math.PI / 2, 0, hall);
put(plane(8.75, 2.8, wallMat, 8.75 / 2.8, 1), 1.6, 1.4, -2.825, 0, -Math.PI / 2, 0, hall);
put(plane(0.9, 0.75, wallMat, 0.3, 0.3), 1.6, 2.425, 2.0, 0, -Math.PI / 2, 0, hall);
// far wall + elevator opening
put(plane(1.0, 2.8, wallMat, 0.4, 1), -1.1, 1.4, -7.0, 0, 0, 0, hall);
put(plane(1.0, 2.8, wallMat, 0.4, 1), 1.1, 1.4, -7.0, 0, 0, 0, hall);
put(plane(1.2, 0.7, wallMat, 0.4, 0.3), 0, 2.45, -7.0, 0, 0, 0, hall);
put(plane(3.2, 2.8, wallMat, 1.1, 1), 0, 1.4, 9.2, 0, Math.PI, 0, hall);
// elevator frame
box(0.08, 2.14, 0.1, steel, -0.64, 1.07, -6.98, hall); box(0.08, 2.14, 0.1, steel, 0.64, 1.07, -6.98, hall); box(1.36, 0.08, 0.1, steel, 0, 2.14, -6.98, hall);
// door panels
const doorL = box(0.6, 2.08, 0.04, steel, -0.3, 1.04, -6.95, hall);
const doorR = box(0.6, 2.08, 0.04, steel, 0.3, 1.04, -6.95, hall);
[doorL, doorR].forEach((d) => { box(0.02, 1.9, 0.01, darkSteel, 0, 0, 0.025, d); box(0.5, 0.02, 0.01, darkSteel, 0, 0.5, 0.025, d); box(0.5, 0.02, 0.01, darkSteel, 0, -0.5, 0.025, d); });
// clock over door
function drawClock(tex, txt, colonOn) {
  const g = tex.userData.g, w = 256, h = 96;
  g.fillStyle = "#0a0505"; g.fillRect(0, 0, w, h);
  g.font = "bold 76px monospace"; g.textAlign = "center"; g.textBaseline = "middle";
  const shown = colonOn ? txt : txt.replace(":", " ");
  g.shadowColor = "#ff3a1a"; g.shadowBlur = 18; g.fillStyle = "#ff4a24"; g.fillText(shown, w / 2, h / 2 + 4);
  g.shadowBlur = 0; tex.needsUpdate = true;
}
const clockTex = ctex(256, 96, () => {});
const clock = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.17), new THREE.MeshBasicMaterial({ map: clockTex, toneMapped: false }));
put(clock, 0, 2.5, -6.93, 0, 0, 0, hall);
box(0.5, 0.21, 0.04, darkSteel, 0, 2.5, -6.955, hall);
// call panel outside the lift
const callTex = ctex(128, 256, () => {});
function drawCall(lit0) {
  const g = callTex.userData.g; g.fillStyle = "#14191b"; g.fillRect(0, 0, 128, 256);
  g.font = "bold 34px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  const labels = ["5", "4", "3", "2", "1", "0"];
  labels.forEach((l, i) => {
    const y = 28 + i * 40, is0 = l === "0";
    g.beginPath(); g.arc(64, y, 15, 0, 7);
    g.fillStyle = is0 ? (lit0 ? "#ff2a1a" : "#1b1010") : "#2b3236"; g.shadowColor = is0 && lit0 ? "#ff3a2a" : "transparent"; g.shadowBlur = is0 && lit0 ? 22 : 0; g.fill(); g.shadowBlur = 0;
    g.strokeStyle = "#7d8a8c"; g.lineWidth = 2; g.stroke();
    g.fillStyle = is0 && lit0 ? "#fff" : "#9aa7a8"; g.fillText(l, 64, y + 1);
  });
  callTex.needsUpdate = true;
}
const callMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.4), new THREE.MeshBasicMaterial({ map: callTex, toneMapped: false }));
put(callMesh, 0.97, 1.25, -6.972, 0, 0, 0, hall);
box(0.24, 0.44, 0.03, darkSteel, 0.97, 1.25, -6.995, hall);
// ceiling lamps
const lampMat = new THREE.MeshBasicMaterial({ color: 0xcfe6ff, toneMapped: false });
[6.2, 2.2, -1.8, -5.4].forEach((z) => { box(0.5, 0.05, 0.22, lampMat, 0, 2.77, z, hall); });
const hallLights = [5.0, 0.4, -4.2].map((z) => { const l = new THREE.PointLight(0xaed0ff, 9, 9, 1.6); l.position.set(0, 2.5, z); hall.add(l); return l; });
const hemi = new THREE.HemisphereLight(0x2a4552, 0x07090c, 0.55); scene.add(hemi);
// left wall decor: mailboxes, extinguisher, stair door, notice board
{
  const mb = std(0x4a5d63, { metalness: 0.3, roughness: 0.55 });
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) box(0.06, 0.22, 0.26, mb, -1.57, 1.0 + j * 0.27, 3.9 + (i - 1.5) * 0.3, hall);
  const ext = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.38, 7), std(0xb3171c)); put(ext, -1.5, 1.0, -4.6, 0, 0, 0, hall);
  box(0.05, 2.05, 0.95, std(0x3b4a45, { metalness: 0.3 }), -1.58, 1.02, -2.4, hall);
  box(0.03, 0.55, 0.8, std(0x7a6a3c), -1.58, 1.55, 1.4, hall);
  const r = rng(77); for (let i = 0; i < 5; i++) box(0.01, 0.16, 0.12, std([0xdedede, 0xe8d77a, 0xb6c9d6][i % 3]), -1.555, 1.55 + (r() - 0.5) * 0.3, 1.4 + (r() - 0.5) * 0.65, hall);
}
// right wall doors
function doorNumber(n, parent, x, y, z) {
  const t = ctex(64, 32, (g) => { g.fillStyle = "#b19a52"; g.fillRect(0, 0, 64, 32); g.fillStyle = "#222"; g.font = "bold 22px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(n, 32, 17); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.055), new THREE.MeshBasicMaterial({ map: t })); put(m, x, y, z, 0, -Math.PI / 2, 0, parent);
}
const doorWood = std(0x4d3b30, { roughness: 0.7 });
[[6.0, "41"], [-1.5, "43"], [-4.5, "44"]].forEach(([z, n]) => {
  box(0.05, 2.05, 0.9, doorWood, 1.575, 1.02, z, hall); box(0.07, 2.12, 0.05, darkSteel, 1.57, 1.06, z + 0.48, hall); box(0.07, 2.12, 0.05, darkSteel, 1.57, 1.06, z - 0.48, hall);
  doorNumber(n, hall, 1.545, 1.6, z);
});
// hero's door #42 (hinge at z=2.45, swings into the flat)
const heroDoor = new THREE.Group(); heroDoor.position.set(1.6, 0, 2.45); hall.add(heroDoor);
box(0.05, 2.05, 0.9, doorWood, 0, 1.02, -0.45, heroDoor);
box(0.06, 0.04, 0.12, steel, -0.04, 1.0, -0.82, heroDoor);
doorNumber("42", heroDoor, -0.03, 1.6, -0.45);
box(0.1, 2.12, 0.05, darkSteel, 1.6, 1.06, 2.5, hall); box(0.1, 2.12, 0.05, darkSteel, 1.6, 1.06, 1.5, hall); box(0.1, 0.06, 1.0, darkSteel, 1.6, 2.1, 2.0, hall);

/* --------------------------------------------------------------- CABIN */
const cabin = new THREE.Group(); scene.add(cabin);
const cabWall = std(0x7d8a8d, { metalness: 0.35, roughness: 0.5 });
put(plane(1.7, 2.3, cabWall), -0.7, 1.15, -8.05, 0, Math.PI / 2, 0, cabin);
put(plane(1.7, 2.3, cabWall), 0.7, 1.15, -8.05, 0, -Math.PI / 2, 0, cabin);
put(plane(1.4, 2.3, cabWall), 0, 1.15, -8.9, 0, 0, 0, cabin);
put(plane(1.4, 1.7, std(0x363c40, { roughness: 0.7 })), 0, 0.0, -8.05, -Math.PI / 2, 0, 0, cabin);
put(plane(1.4, 1.7, std(0x2b3234)), 0, 2.3, -8.05, Math.PI / 2, 0, 0, cabin);
put(plane(1.4, 0.5, cabWall), 0, 2.05, -7.2, 0, Math.PI, 0, cabin);
put(plane(0.1, 2.3, cabWall), -0.65, 1.15, -7.2, 0, Math.PI, 0, cabin);
put(plane(0.1, 2.3, cabWall), 0.65, 1.15, -7.2, 0, Math.PI, 0, cabin);
const cabLampMat = new THREE.MeshBasicMaterial({ color: 0xff2a1c, toneMapped: false });
const cabLamp = box(0.7, 0.03, 0.5, cabLampMat, 0, 2.28, -8.05, cabin);
const redLight = new THREE.PointLight(0xff2418, 9, 6, 1.4); redLight.position.set(0, 2.1, -8.0); cabin.add(redLight);
const mirrorFill = new THREE.PointLight(0xb0c0ff, 0, 3.2, 1.4); mirrorFill.position.set(0, 1.75, -8.55); cabin.add(mirrorFill);
const coldLight = new THREE.PointLight(0xa8d4ff, 0, 6, 1.5); coldLight.position.set(0, 2.1, -7.6); cabin.add(coldLight);
// hatch on the ceiling
const hatch = box(0.5, 0.025, 0.5, darkSteel, 0, 2.285, -8.4, cabin);
// handrail
box(0.03, 0.03, 1.2, steel, -0.66, 1.0, -8.05, cabin);
// mirror
const mirror = new Reflector(new THREE.PlaneGeometry(1.2, 1.75), { clipBias: 0.003, textureWidth: 720, textureHeight: 1260, color: 0x9fb2b4 });
mirror.position.set(0, 1.25, -8.88); cabin.add(mirror);
box(1.3, 0.05, 0.04, darkSteel, 0, 2.15, -8.88, cabin); box(1.3, 0.05, 0.04, darkSteel, 0, 0.36, -8.88, cabin);
box(0.05, 1.8, 0.04, darkSteel, -0.63, 1.25, -8.88, cabin); box(0.05, 1.8, 0.04, darkSteel, 0.63, 1.25, -8.88, cabin);
// inside panel + display
const panelTex = ctex(160, 448, () => {});
function drawPanel(lit0, pressed1) {
  const g = panelTex.userData.g; g.fillStyle = "#151a1c"; g.fillRect(0, 0, 160, 448);
  g.font = "bold 40px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  ["5", "4", "3", "2", "1", "0"].forEach((l, i) => {
    const y = 40 + i * 64, is0 = l === "0", lit = is0 && lit0;
    g.beginPath(); g.arc(80, y, 24, 0, 7); g.fillStyle = lit ? "#ff2a1a" : "#2a3235"; g.shadowColor = lit ? "#ff3a2a" : "transparent"; g.shadowBlur = lit ? 26 : 0; g.fill(); g.shadowBlur = 0;
    g.strokeStyle = l === "1" && pressed1 ? "#ffffff" : "#7d8a8c"; g.lineWidth = 3; g.stroke();
    g.fillStyle = lit ? "#fff" : "#9aa7a8"; g.fillText(l, 80, y + 2);
  });
  panelTex.needsUpdate = true;
}
const panelMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.62), new THREE.MeshBasicMaterial({ map: panelTex, toneMapped: false }));
put(panelMesh, 0.684, 1.15, -7.85, 0, -Math.PI / 2, 0, cabin);
const dispTex = ctex(256, 128, () => {});
let dispKey = "";
function drawDisp(txt, glitch) {
  const k = txt + "|" + glitch; if (k === dispKey) return; dispKey = k;
  const g = dispTex.userData.g; g.fillStyle = "#080303"; g.fillRect(0, 0, 256, 128);
  g.textAlign = "center"; g.textBaseline = "middle"; g.shadowColor = "#ff2a1a"; g.shadowBlur = 16; g.fillStyle = glitch ? "#ff3b30" : "#ff6a3a";
  const lines = txt.split("\n");
  if (lines.length === 1) { g.font = "bold 92px monospace"; g.fillText(txt, 128, 68); } else { g.font = "bold 52px sans-serif"; lines.forEach((l, i) => g.fillText(l, 128, 38 + i * 56)); }
  g.shadowBlur = 0; dispTex.needsUpdate = true;
}
const dispMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.11), new THREE.MeshBasicMaterial({ map: dispTex, toneMapped: false }));
put(dispMesh, 0.684, 1.62, -7.85, 0, -Math.PI / 2, 0, cabin);
box(0.02, 0.26, 0.26, darkSteel, 0.7, 1.62, -7.85, cabin); box(0.02, 0.7, 0.26, darkSteel, 0.7, 1.15, -7.85, cabin);

/* ------------------------------------------------------- ABANDONED SET */
const ab = new THREE.Group(); scene.add(ab);
{
  const r = rng(404);
  const web = new THREE.MeshBasicMaterial({ color: 0xbfc9c4, transparent: true, opacity: 0.22, side: THREE.DoubleSide });
  [[-1.55, 2.75, 7], [1.55, 2.75, 3.4], [-1.55, 2.75, -1.2], [1.55, 2.75, -5.6], [-1.55, 2.75, -6.8]].forEach(([x, y, z]) => {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.7, 0.1), new THREE.Vector3(x > 0 ? -0.8 : 0.8, -0.1, 0.1)]);
    g.computeVertexNormals(); const m = new THREE.Mesh(g, web); put(m, x, y, z, 0, 0, 0, ab);
  });
  const deb = std(0x3a342b);
  for (let i = 0; i < 26; i++) { const s = 0.05 + r() * 0.18; box(s, s * 0.6, s * 1.4, deb, (r() - 0.5) * 2.6, s * 0.3, 8 - r() * 15, ab).rotation.y = r() * 3; }
  // portraits on the left wall
  const faces = [[0, "#a8553a", "#d4a889", "#3b2a20"], [1, "#4a5a6a", "#cdb69a", "#6a5a48"], [2, "#2c4c55", "#d9a98a", "#3a2a22"], [3, "#6a4a5a", "#e0c2a6", "#bbb"], [4, "#4a6a52", "#c99d7c", "#2b2b2b"], [5, "#5a5a3a", "#d8b799", "#7a4a28"]];
  const zs = [3.4, 2.0, 0.2, -1.3, -2.6, 4.6];
  const frameMat = std(0x2a1d14);
  faces.forEach(([k, jacket, skin, hair], i) => {
    const t = ctex(160, 220, (g, w, h) => {
      g.fillStyle = k === 2 ? "#6f7a76" : ["#8a7d62", "#6f7a76", "#7c6f60"][k % 3]; g.fillRect(0, 0, w, h);
      g.fillStyle = jacket; g.beginPath(); g.moveTo(10, h); g.lineTo(26, 150); g.lineTo(w - 26, 150); g.lineTo(w - 10, h); g.fill();
      g.fillStyle = skin; g.fillRect(66, 120, 28, 34);
      g.beginPath(); g.moveTo(80, 36); g.lineTo(114, 56); g.lineTo(112, 100); g.lineTo(92, 132); g.lineTo(68, 132); g.lineTo(48, 100); g.lineTo(46, 56); g.closePath(); g.fill();
      g.fillStyle = hair; g.beginPath(); g.moveTo(44, 62); g.lineTo(80, 24); g.lineTo(116, 62); g.lineTo(110, 48); g.lineTo(80, 30); g.lineTo(50, 48); g.fill();
      g.fillStyle = "#fff"; g.fillRect(62, 78, 14, 8); g.fillRect(86, 78, 14, 8);
      g.fillStyle = k === 2 ? "#111" : "#2a2a2a"; g.fillRect(67, 79, 6, 6); g.fillRect(91, 79, 6, 6);
      g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(72, 112, 18, 3);
      g.fillStyle = "rgba(0,0,0,.25)"; speckle(g, w, h, 500, 90 + k, ["rgba(0,0,0,.3)", "rgba(255,255,255,.1)"], 3);
      if (k === 2) { g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 20); g.lineTo(40, 80); g.lineTo(30, 130); g.stroke(); }
    });
    const grp = new THREE.Group(); put(grp, -1.55, 1.5, zs[i], 0, Math.PI / 2, 0, ab);
    box(0.5, 0.66, 0.04, frameMat, 0, 0, -0.01, grp);
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.55), new THREE.MeshBasicMaterial({ map: t, color: 0xb8c4c0 })); pm.position.z = 0.015; grp.add(pm);
    box(0.2, 0.05, 0.01, std(0xb19a52), 0, -0.4, 0, grp);
    if (k === 2) ab.userData.heroPhoto = grp;
  });
}
ab.visible = false;

/* --------------------------------------------------------------- FLAT */
const flat = new THREE.Group(); scene.add(flat);
{
  const wp = std(0x5b5446), wpMat = new THREE.MeshStandardMaterial({ map: paperTex, roughness: 0.95 });
  const fl = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.6 });
  // entry corridor x 1.7..8.5, z 1.0..3.0
  put(plane(6.8, 2.0, fl, 6.8 / 1.2, 2.0 / 1.2), 5.1, 0.001, 2.0, -Math.PI / 2, 0, 0, flat);
  put(plane(6.8, 2.0, ceilMat), 5.1, 2.6, 2.0, Math.PI / 2, 0, 0, flat);
  put(plane(6.8, 2.6, wpMat, 3, 1), 5.1, 1.3, 3.0, 0, Math.PI, 0, flat);
  put(plane(2.0, 2.6, wpMat, 1, 1), 8.5, 1.3, 2.0, 0, -Math.PI / 2, 0, flat);
  put(plane(2.6, 2.6, wpMat, 1, 1), 1.6, 1.3, 2.0, 0, Math.PI / 2, 0, flat); // inner side of the hall wall (visible when door open)
  put(plane(2.45, 2.6, wpMat, 1, 1), 2.925, 1.3, 1.0, 0, 0, 0, flat);
  put(plane(1.45, 2.6, wpMat, 1, 1), 5.775, 1.3, 1.0, 0, 0, 0, flat);
  put(plane(2.0, 2.6, wpMat, 1, 1), 7.5, 1.3, 1.0, 0, 0, 0, flat);
  put(plane(0.9, 0.6, wpMat, 1, 1), 4.6, 2.3, 1.0, 0, 0, 0, flat);
  // bedroom x 3.2..6.6 (z -3.5..1.0)
  put(plane(3.4, 4.5, fl, 3, 4), 4.9, 0.001, -1.25, -Math.PI / 2, 0, 0, flat);
  put(plane(3.4, 4.5, ceilMat), 4.9, 2.6, -1.25, Math.PI / 2, 0, 0, flat);
  put(plane(3.4, 2.6, wpMat, 2, 1), 4.9, 1.3, -3.5, 0, 0, 0, flat);
  put(plane(4.5, 2.6, wpMat, 2, 1), 3.2, 1.3, -1.25, 0, Math.PI / 2, 0, flat);
  put(plane(4.5, 2.6, wpMat, 2, 1), 6.6, 1.3, -1.25, 0, -Math.PI / 2, 0, flat);
  const bedM = std(0x3a4650), blanket = std(0x5a6a74);
  box(1.5, 0.35, 2.1, bedM, 4.6, 0.2, -2.45, flat); box(1.46, 0.14, 2.05, blanket, 4.6, 0.46, -2.45, flat); box(1.6, 0.9, 0.08, std(0x2c211a), 4.6, 0.6, -3.5, flat);
  box(0.4, 0.45, 0.4, std(0x2c211a), 3.55, 0.23, -3.0, flat);
  const lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false })); put(lampBulb, 3.55, 0.6, -3.0, 0, 0, 0, flat);
  // kitchen nook: table, chairs, hanging bulb
  box(0.9, 0.05, 0.9, std(0x6a5a46), 7.6, 0.75, 2.0, flat); box(0.06, 0.75, 0.06, std(0x3a2e24), 7.6, 0.38, 2.0, flat);
  box(0.4, 0.05, 0.4, std(0x3a2e24), 7.0, 0.45, 2.0, flat); box(0.4, 0.5, 0.05, std(0x3a2e24), 6.82, 0.7, 2.0, flat);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), new THREE.MeshBasicMaterial({ color: 0xfff0c8, toneMapped: false })); put(bulb, 7.6, 2.1, 2.0, 0, 0, 0, flat);
  box(0.01, 0.45, 0.01, std(0x111111), 7.6, 2.35, 2.0, flat);
  box(0.9, 1.0, 0.4, std(0x6d6a60), 8.2, 0.5, 2.7, flat); // kitchen counter
}
const kitchenLight = new THREE.PointLight(0xffd9a6, 11, 9, 1.5); kitchenLight.position.set(7.6, 2.0, 2.0); flat.add(kitchenLight);
const bedLamp = new THREE.PointLight(0xffc98a, 0, 5, 1.6); bedLamp.position.set(3.7, 0.9, -3.0); flat.add(bedLamp);
const roomCold = new THREE.PointLight(0x9cc6ff, 0, 6, 1.4); roomCold.position.set(4.8, 2.3, -1.4); flat.add(roomCold);
const underDoor = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.05), new THREE.MeshBasicMaterial({ color: 0xcfe6ff, toneMapped: false })); put(underDoor, 4.6, 0.03, 0.93, -Math.PI / 2, 0, 0, flat);
const bedDoor = new THREE.Group(); bedDoor.position.set(4.15, 0, 1.0); flat.add(bedDoor);
box(0.9, 2.05, 0.05, doorWood, 0.45, 1.02, 0, bedDoor); box(0.05, 0.05, 0.1, steel, 0.8, 1.0, 0.05, bedDoor);
box(0.05, 2.15, 0.1, darkSteel, 4.12, 1.07, 1.0, flat); box(0.05, 2.15, 0.1, darkSteel, 5.08, 1.07, 1.0, flat); box(1.0, 0.07, 0.1, darkSteel, 4.6, 2.12, 1.0, flat);
flat.userData.hemi = new THREE.PointLight(0x4a6a88, 1.2, 8, 1.2); flat.userData.hemi.position.set(3.0, 2.2, 2.0); flat.add(flat.userData.hemi);

/* ------------------------------------------------------------- FIGURES */
function makeFigure(o) {
  const mats = [];
  const M = (c, r = 0.8, extra = {}) => { const m = new THREE.MeshStandardMaterial({ color: c, roughness: r, flatShading: true, transparent: !!o.fade, ...extra }); mats.push(m); return m; };
  const g = new THREE.Group();
  const P = { g, mats };
  const pivot = (parent, x, y, z) => { const p = new THREE.Group(); p.position.set(x, y, z); parent.add(p); return p; };
  const skin = M(o.skin, 0.7), jacket = M(o.jacket, 0.9), pants = M(o.pants, 0.9), shoe = M(0x0c0c0c, 0.6), hair = M(o.hair, 0.9);
  const leg = (sx) => {
    const hip = pivot(g, sx * 0.1, 0.9, 0); box(0.17, 0.45, 0.19, pants, 0, -0.225, 0, hip);
    const knee = pivot(hip, 0, -0.45, 0); box(0.15, 0.45, 0.17, pants, 0, -0.225, 0, knee); box(0.17, 0.08, 0.3, shoe, 0, -0.43, 0.06, knee);
    return { hip, knee };
  };
  P.legL = leg(1); P.legR = leg(-1);
  const torso = pivot(g, 0, 0, 0); P.torso = torso;
  box(0.46, 0.62, 0.27, jacket, 0, 1.2, 0, torso); box(0.34, 0.12, 0.2, jacket, 0, 1.53, 0, torso);
  box(0.46, 0.2, 0.28, pants, 0, 0.92, 0, torso);
  const arm = (sx) => {
    const sh = pivot(torso, sx * 0.3, 1.46, 0); box(0.12, 0.32, 0.13, jacket, 0, -0.16, 0, sh);
    const el = pivot(sh, 0, -0.32, 0); box(0.11, 0.3, 0.12, jacket, 0, -0.15, 0, el);
    const hand = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 0), skin); hand.position.y = -0.34; el.add(hand);
    return { sh, el, hand };
  };
  P.armL = arm(1); P.armR = arm(-1);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.1, 6), skin); neck.position.set(0, 1.6, 0); torso.add(neck);
  const head = pivot(torso, 0, 1.7, 0); P.head = head;
  const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), skin); skull.scale.set(0.95, 1.1, 1.0); head.add(skull);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.168, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.52), hair); cap.scale.set(0.97, 1.12, 1.03); cap.position.set(0, 0.015, -0.01); cap.rotation.x = -0.22; head.add(cap);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.06, 4), skin); nose.rotation.x = Math.PI / 2; nose.position.set(0, -0.015, 0.17); head.add(nose);
  const eyeW = M(o.eyeWhite ?? 0xf4f4ee, 0.4), eyeP = M(o.pupil ?? 0x080808, 0.3);
  P.eyes = [];
  [-1, 1].forEach((s) => {
    const e = pivot(head, s * 0.062, 0.03, 0.14); const w = new THREE.Mesh(new THREE.SphereGeometry(o.eyeR ?? 0.027, 12, 9), eyeW); e.add(w);
    const p = new THREE.Mesh(new THREE.SphereGeometry((o.eyeR ?? 0.027) * 0.6, 12, 9), eyeP); p.position.z = (o.eyeR ?? 0.027) * 0.7; e.add(p);
    box(0.07, 0.014, 0.02, hair, 0, 0.045, 0.01, e);
    P.eyes.push(e);
  });
  box(0.06, 0.012, 0.02, M(0x6a3030, 0.8), 0, -0.07, 0.15, head);
  [-1, 1].forEach((s) => { const ear = new THREE.Mesh(new THREE.IcosahedronGeometry(0.03, 0), skin); ear.position.set(s * 0.15, 0, 0); head.add(ear); });
  if (o.scale) g.scale.set(o.scale[0], o.scale[1], o.scale[2]);
  return P;
}
const heroFig = makeFigure({ skin: 0xd9a98a, jacket: 0x2e5560, pants: 0x1b2230, hair: 0x3a2a22 });
scene.add(heroFig.g);
// phone on the left hand
const phoneTex = ctex(128, 256, () => {});
let phoneKey = "";
function drawPhone(ring) {
  if (phoneKey === ring + "") return; phoneKey = ring + "";
  const g = phoneTex.userData.g; g.fillStyle = ring ? "#0d2a14" : "#06090b"; g.fillRect(0, 0, 128, 256);
  g.textAlign = "center"; g.fillStyle = "#e9f0f0"; g.font = "bold 15px sans-serif"; g.fillText("ВХОДЯЩИЙ ВЫЗОВ", 64, 36);
  g.font = "bold 26px sans-serif"; g.fillText("МОЙ НОМЕР", 64, 78);
  g.font = "bold 17px sans-serif"; g.fillStyle = "#9fd3ff"; g.fillText("+7 900 031-70-17", 64, 104);
  g.fillStyle = "#2ecc40"; g.beginPath(); g.arc(34, 212, 20, 0, 7); g.fill();
  g.fillStyle = "#ff3b30"; g.beginPath(); g.arc(94, 212, 20, 0, 7); g.fill();
  g.fillStyle = "#fff"; g.font = "bold 20px sans-serif"; g.fillText("✓", 34, 219); g.fillText("✕", 94, 219);
  phoneTex.needsUpdate = true;
}
const phone = new THREE.Group();
box(0.075, 0.15, 0.01, std(0x0a0a0a), 0, 0, 0, phone);
const phScr = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.132), new THREE.MeshBasicMaterial({ map: phoneTex, toneMapped: false })); phScr.position.z = 0.0056; phone.add(phScr);
const phoneGlow = new THREE.PointLight(0x9fe8b0, 0.0, 2, 2); phone.add(phoneGlow);
heroFig.armL.el.add(phone); phone.position.set(0, -0.36, 0.05); phone.rotation.set(-0.3, 0, Math.PI);
phone.visible = false;

const dblMain = makeFigure({ skin: 0xc3cfcc, jacket: 0x2e5560, pants: 0x1b2230, hair: 0x2c211b, eyeWhite: 0x050505, pupil: 0x000000, eyeR: 0.036, fade: true });
const dblRefl = makeFigure({ skin: 0xc3cfcc, jacket: 0x2e5560, pants: 0x1b2230, hair: 0x2c211b, eyeWhite: 0x050505, pupil: 0x000000, eyeR: 0.036, fade: true });
const shadowFig = makeFigure({ skin: 0x050607, jacket: 0x050607, pants: 0x050607, hair: 0x050607, eyeWhite: 0xe6fbff, pupil: 0xe6fbff, eyeR: 0.026, scale: [1.0, 1.2, 0.9] });
[dblMain, dblRefl, shadowFig].forEach((f) => scene.add(f.g));
shadowFig.eyes.forEach((e) => e.children.forEach((c) => (c.material = new THREE.MeshBasicMaterial({ color: 0xe6fbff, toneMapped: false }))));

/* -------------------------------------------------------- dust motes */
const DN = 260;
const dustBase = new Float32Array(DN * 3);
{ const r = rng(9); for (let i = 0; i < DN; i++) { dustBase[i * 3] = (r() - 0.5) * 2.8; dustBase[i * 3 + 1] = 0.2 + r() * 2.4; dustBase[i * 3 + 2] = -8.5 + r() * 16; } }
const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(DN * 3), 3));
const dustMat = new THREE.PointsMaterial({ color: 0xb4c6d0, size: 0.018, transparent: true, opacity: 0.5, depthWrite: false });
const dust = new THREE.Points(dustGeo, dustMat); dust.frustumCulled = false; scene.add(dust);

/* ============================ SCRIPTED STATE ============================ */
const FREEZES = [[0.0, 0.0], [23.74, 0.1], [39.76, 0.1], [58.72, 0.1], [73.74, 0.1], [93.35, 0.1]];
function worldT(tt) {
  let sub = 0;
  for (const [f, d] of FREEZES) { if (d > 0 && tt >= f) sub += Math.min(d, tt - f); }
  return tt - sub;
}
const DOOR_KEYS = [[0, 0], [2.4, 0], [3.5, 1], [5.1, 1], [5.5, 0], [17.6, 0], [18.7, 1], [31.2, 1], [31.6, 0], [48.5, 0], [49.6, 1], [75.1, 1], [75.9, 0], [93.4, 0], [94.7, 1]];
const doorOpen = (t) => rampKeys(t, DOOR_KEYS);
const FLICKERS = [[31.4, 36.5, 0.5], [43.6, 47.5, 0.6], [62.2, 75.2, 1.0], [24.0, 24.5, 0.4]];
function flick(t, rate = 14) {
  let f = 1;
  for (const [a, b, s] of FLICKERS) if (t >= a && t < b) { const n = hash(Math.floor(t * rate)); f = n < 0.35 * s ? 0.06 : n < 0.55 * s ? 0.4 : 1; }
  return f;
}
function hallFlicker(t, abandoned) {
  const n = hash(Math.floor(t * 11) + 9); let f = 1;
  if (abandoned) f = n < 0.2 ? 0.1 : n < 0.4 ? 0.5 : 1;
  if (t >= 62.2 && t < 75.2) f = hash(Math.floor(t * 13) + 3) < 0.4 ? 0.08 : 1;
  if (t >= 91.0 && t < 92.2) f = hash(Math.floor(t * 16)) < 0.4 ? 0.12 : 1;
  return f;
}
const isAbandoned = (t) => t >= 46.9 && t < 75.5;
const inApt = (t) => t >= 75.5 && t < 89.25;

/* hero pose: returns {x,z,ry,walk,pitch,yaw,visible, ...} */
function heroPose(t) {
  const p = { x: 0, z: 0, ry: Math.PI, walk: 0, pitch: 0, yaw: 0, vis: false, sit: 0, armRx: 0, armRz: 0, armLx: 0, armLz: 0, phone: false, eyes: 1, breathe: 1 };
  if (t < 5.8 || t >= 89.25) return p;
  p.vis = true;
  if (t < 17.6) { // walk to the lift
    const u = clamp((t - 5.8) / (15.6 - 5.8)); p.z = lerp(8.0, -5.6, u); p.walk = u < 1 ? (t - 5.8) * 3.4 : 0;
    p.ry = Math.PI; p.x = 0.1 * Math.sin(t * 0.7);
    if (t > 11.0 && t < 12.6) p.yaw = -0.35 * Math.sin(clamp((t - 11.0) / 1.6) * Math.PI);
    if (t > 14.2 && t < 15.6) p.pitch = 0.2 * Math.sin(clamp((t - 14.2) / 1.4) * Math.PI);
  } else if (t < 62.0) {
    if (t < 18.9) { p.z = -5.6; }
    else if (t < 21.0) { const u = (t - 18.9) / 2.1; p.z = lerp(-5.6, -8.05, ease(u)); p.walk = (t - 18.9) * 3.0; }
    else { p.z = -8.05; }
    p.x = 0; p.ry = Math.PI;
    if (t >= 23.84 && t < 31.6) p.pitch = 0.55 * ease(clamp((t - 23.84) / 0.8));
    if (t >= 31.6 && t < 46.9) { p.pitch = lerp(0.55, 0.0, ease(clamp((t - 31.6) / 1.2))); p.sway = 1; }
    if (t >= 36.3 && t < 43.6) { p.phone = true; p.armLx = -0.9; p.armLz = -0.1; p.pitch = 0.25; }
        if (t >= 43.6 && t < 46.9) p.pitch = -0.3 * ease(clamp((t - 43.6) / 1.5));
    if (t >= 46.9) { // lift stopped: step towards the door and turn
      const u = ease(clamp((t - 47.0) / 1.0)); p.ry = lerp(Math.PI, 0, u); p.z = lerp(-8.05, -7.6, u); p.x = lerp(0, -0.3, u); p.pitch = 0;
      if (t >= 58.8) { p.z = -7.45; p.pitch = 0.1; }
    }
  }
  if (t >= 62.0 && t < 75.1) { // back at the mirror
    p.z = -8.05; p.ry = Math.PI; p.x = 0; p.pitch = 0;
    if (t >= 64.0 && t < 66.4) p.pitch = -0.05;
    if (t >= 70.0 && t < 71.6) { const u = ease(clamp((t - 70.0) / 0.7)); p.armRx = -0.6 * u; p.armRz = 0.9 * u; if (t > 70.9) { p.armRx = lerp(-0.6, 0, ease(clamp((t - 70.9) / 0.5))); p.armRz = lerp(0.9, 0, ease(clamp((t - 70.9) / 0.5))); } }
  }
  if (t >= 75.1 && t < 89.25) { // the flat
    if (t < 81.5) { p.x = 2.3; p.z = 2.0; p.ry = Math.PI / 2; p.pitch = t > 77.7 && t < 79.6 ? 0.3 * Math.sin(clamp((t - 77.7) / 1.9) * Math.PI) : 0; p.armRx = 0; }
    else if (t < 85.2) { const u = clamp((t - 81.8) / (85.0 - 81.8)); p.x = lerp(2.3, 4.6, ease(u)); p.z = 2.0; p.ry = Math.PI / 2; p.walk = u > 0 && u < 1 ? (t - 81.8) * 2.6 : 0; }
    else { p.x = 4.6; p.z = 2.0; p.ry = lerp(Math.PI / 2, Math.PI, ease(clamp((t - 85.0) / 0.6))); if (t > 85.7 && t < 87.0) { p.armRx = -1.1 * ease(clamp((t - 85.7) / 0.5)); } }
  }
  return p;
}
function applyFigure(P, s, t, idle = 1) {
  P.g.position.set(s.x, s.sit ? -0.4 + 0.0 : 0, s.z); P.g.rotation.y = s.ry;
  const w = Math.sin(s.walk), a = s.walk ? 0.55 : 0;
  P.legL.hip.rotation.x = s.sit ? -1.5 : w * a; P.legR.hip.rotation.x = s.sit ? -1.5 : -w * a;
  P.legL.knee.rotation.x = s.sit ? 1.5 : Math.max(0, -w) * 0.5 * (s.walk ? 1 : 0); P.legR.knee.rotation.x = s.sit ? 1.5 : Math.max(0, w) * 0.5 * (s.walk ? 1 : 0);
  const br = Math.sin(t * 2.2) * 0.012 * idle;
  P.torso.position.y = br + (s.walk ? Math.abs(Math.cos(s.walk)) * 0.02 : 0);
  P.armL.sh.rotation.set((s.walk ? -w * 0.4 : 0) + (s.armLx || 0), 0, (s.armLz || 0));
  P.armR.sh.rotation.set((s.walk ? w * 0.4 : 0) + (s.armRx || 0), 0, (s.armRz || 0));
  P.armL.el.rotation.x = s.armLx ? -1.3 : 0; P.armR.el.rotation.x = s.armRx < -0.5 ? -0.5 : 0;
  P.head.rotation.set(s.pitch || 0, s.yaw || 0, 0);
  const e = s.eyes || 1; P.eyes.forEach((m) => m.scale.set(1, e, 1));
}

/* ---------------------------------------------------------- camera rigs */
const V = (x, y, z) => [x, y, z];
function headPos(h, off = [0, 0, 0]) { const c = Math.cos(h.ry), s = Math.sin(h.ry); return V(h.x + off[0] * c + off[2] * s, 1.62 + off[1], h.z - off[0] * s + off[2] * c); }
const SHOTS = [
  // ---------- S1 hook
  { a: 0, b: 1.25, f: 62, shake: 0.004, c: (t, u, h) => [lerp3(V(0, 1.55, 8.3), V(0, 1.5, 6.6), u), V(0, 1.7, -7.5)] },
  { a: 1.25, b: 2.55, f: 34, shake: 0.006, c: (t, u, h) => [lerp3(V(0.04, 2.48, -5.4), V(0, 2.5, -5.95), ease(u)), V(0, 2.5, -7)] },
  { a: 2.55, b: 5.8, f: 58, shake: 0.006, c: (t, u, h) => [lerp3(V(0, 1.45, 3.4), V(0, 1.38, -5.7), u * u), V(0, 1.3, -9)] },
  // ---------- S2 return home
  { a: 5.8, b: 8.6, f: 56, shake: 0.012, c: (t, u, h) => [V(h.x * 0.5, 1.38, h.z + 2.5), V(h.x, 1.3, h.z - 2.0)] },
  { a: 8.6, b: 10.8, f: 50, shake: 0.008, c: (t, u, h) => [V(h.x - 0.8, 0.38, h.z - 1.3), V(h.x, 0.32, h.z)] },
  { a: 10.8, b: 13.0, f: 38, shake: 0.01, c: (t, u, h) => [V(h.x + 0.04, 1.66, h.z - 0.95), V(h.x, 1.68, h.z)] },
  { a: 13.0, b: 15.3, f: 40, shake: 0.004, c: (t, u, h) => [lerp3(V(0.42, 1.3, -5.75), V(0.7, 1.24, -6.35), ease(u)), V(0.97, 1.12, -7)] },
  { a: 15.3, b: 17.2, f: 52, shake: 0.007, c: (t, u, h) => [lerp3(V(-1.1, 1.5, -2.6), V(-0.8, 1.45, -3.6), u), V(0, 1.45, -7)] },
  // ---------- S3 rule 1
  { a: 17.2, b: 19.0, f: 52, shake: 0.006, c: (t, u, h) => [lerp3(V(0.1, 1.5, -3.7), V(0.05, 1.45, -4.4), u), V(0, 1.4, -8)] },
  { a: 19.0, b: 21.9, f: 60, shake: 0.007, c: (t, u, h) => [V(0, 1.55, h.z + 2.5), V(0, 1.4, h.z - 1.2)] },
  { a: 21.9, b: 24.0, f: 46, shake: 0.003, noHero: true, c: (t, u, h) => [lerp3(V(0.12, 1.6, -7.35), V(0.06, 1.6, -7.55), ease(u)), V(0, 1.45, -8.9)] },
  { a: 24.0, b: 26.6, f: 50, shake: 0.004, c: (t, u, h) => [lerp3(V(0.5, 1.62, -8.6), V(0.42, 1.62, -8.5), u), V(0.0, 1.66, -8.05)] },
  { a: 26.6, b: 28.2, f: 62, shake: 0.006, pov: true, c: (t, u, h) => [V(0, 1.64, -8.14), lerp3(V(0, 0.32, -8.84), V(0, 0.4, -8.88), u)] },
  { a: 28.2, b: 31.3, f: 62, shake: 0.007, pov: true, c: (t, u, h) => [V(0, 1.64, -8.14), lerp3(V(0, 0.4, -8.88), V(0, 1.2, -8.9), ease(u))] },
  // ---------- S4 rule 2
  { a: 31.3, b: 33.0, f: 34, shake: 0.016, c: (t, u, h) => [lerp3(V(-0.05, 1.7, -7.4), V(0.05, 1.66, -7.65), u), V(0.69, 1.64, -7.85)] },
  { a: 33.0, b: 36.2, f: 78, shake: 0.016, c: (t, u, h) => [V(0.38, 2.05, -7.25), V(-0.1, 1.1, -8.4)] },
  { a: 36.2, b: 38.4, f: 38, shake: 0.008, c: (t, u, h) => [lerp3(V(0.1, 1.65, -8.72), V(0.07, 1.66, -8.62), u), V(0, 1.68, -8.05)] },
  { a: 38.4, b: 40.8, f: 36, shake: 0.006, c: (t, u, h) => [lerp3(V(-0.7, 1.6, -8.0), V(-0.62, 1.6, -8.1), ease(u)), V(-0.3, 1.45, -8.52)] },
  { a: 40.8, b: 43.4, f: 38, shake: 0.012, c: (t, u, h) => [lerp3(V(0.28, 1.65, -8.72), V(0.2, 1.66, -8.6), u), V(0, 1.66, -8.05)] },
  { a: 43.4, b: 46.9, f: 64, shake: 0.02, c: (t, u, h) => [V(0, 1.3, -7.6), lerp3(V(0, 2.3, -8.4), V(0, 2.3, -8.3), u)] },
  // ---------- S5 rule 3
  { a: 46.9, b: 49.8, f: 64, shake: 0.012, c: (t, u, h) => [V(0.55, 1.6, -8.75), V(-0.1, 1.4, -7.2)] },
  { a: 49.8, b: 52.5, f: 56, shake: 0.007, c: (t, u, h) => [lerp3(V(-1.0, 1.5, -4.0), V(-0.4, 1.5, -4.6), ease(u)), lerp3(V(0.4, 1.4, 3.0), V(0.6, 1.4, 2.0), u)] },
  { a: 52.5, b: 56.4, f: 48, shake: 0.006, c: (t, u, h) => { const z = lerp(4.4, -1.8, u); return [V(0.55, 1.45, z), V(-1.58, 1.45, z - 0.55)]; } },
  { a: 56.4, b: 58.8, f: 44, shake: 0.004, c: (t, u, h) => [lerp3(V(0.2, 1.46, 1.35), V(-0.95, 1.48, 0.55), ease(u)), V(-1.58, 1.5, 0.2)] },
  { a: 58.8, b: 62.0, f: 50, shake: 0.008, c: (t, u, h) => [lerp3(V(0.25, 1.5, -5.0), V(0.12, 1.5, -5.8), u), V(0, 1.55, -7.4)] },
  // ---------- S6 escalation
  { a: 62.0, b: 63.9, f: 78, shake: 0.012, c: (t, u, h) => [V(0.38, 2.05, -7.25), V(-0.1, 1.1, -8.4)] },
  { a: 63.9, b: 66.0, f: 46, shake: 0.008, noHero: true, c: (t, u, h) => [lerp3(V(0.12, 1.6, -7.35), V(0.06, 1.6, -7.55), u), V(0, 1.45, -8.9)] },
  { a: 66.0, b: 68.2, f: 36, shake: 0.016, c: (t, u, h) => [V(0.06, 1.66, -8.76), V(0, 1.68, -8.05)] },
  { a: 68.2, b: 70.0, f: 46, shake: 0.008, noHero: true, c: (t, u, h) => [lerp3(V(0.12, 1.6, -7.35), V(0.06, 1.6, -7.55), u), V(0, 1.4, -8.9)] },
  { a: 70.0, b: 71.3, f: 40, shake: 0.01, c: (t, u, h) => [V(-0.28, 1.5, -7.6), V(0.62, 1.3, -7.85)] },
  { a: 71.3, b: 73.0, f: 30, shake: 0.008, c: (t, u, h) => [lerp3(V(0.1, 1.2, -7.7), V(0.25, 1.15, -7.78), u), V(0.69, 1.12, -7.85)] },
  { a: 73.0, b: 75.1, f: 30, shake: 0.014, c: (t, u, h) => [lerp3(V(-0.25, 1.64, -7.5), V(-0.18, 1.64, -7.6), u), V(0.69, 1.62, -7.85)] },
  // ---------- S7 twist
  { a: 75.1, b: 77.5, f: 46, shake: 0.006, c: (t, u, h) => [lerp3(V(5.2, 1.52, 2.15), V(4.2, 1.5, 2.1), u), V(2.3, 1.45, 2.0)] },
  { a: 77.5, b: 80.3, f: 36, shake: 0.005, c: (t, u, h) => [lerp3(V(3.35, 1.6, 2.45), V(3.1, 1.6, 2.35), u), V(2.3, 1.58, 2.0)] },
  { a: 80.3, b: 82.0, f: 52, shake: 0.006, c: (t, u, h) => [lerp3(V(3.6, 1.5, 2.0), V(5.4, 1.48, 2.0), u), V(8.4, 1.6, 2.0)] },
  { a: 82.0, b: 85.0, f: 54, shake: 0.01, c: (t, u, h) => [V(h.x - 1.5, 1.52, 2.35), V(h.x + 1.0, 1.45, 1.6)] },
  { a: 85.0, b: 87.2, f: 36, shake: 0.008, c: (t, u, h) => [lerp3(V(5.4, 1.35, 2.3), V(5.15, 1.3, 1.95), u), V(4.85, 1.05, 1.0)] },
  { a: 87.2, b: 89.25, f: 52, shake: 0.007, c: (t, u, h) => [lerp3(V(4.6, 1.5, 1.7), V(4.6, 1.5, 0.9), ease(u)), V(4.6, 1.0, -2.0)] },
  // ---------- S8 cliffhanger
  { a: 89.25, b: 91.2, f: 56, shake: 0.008, c: (t, u, h) => { const e = ease(u); return [lerp3(V(4.2, 1.5, 2.0), V(-1.2, 1.5, 2.1), e), lerp3(V(4.6, 1.2, 1.0), V(2.0, 1.5, 1.4), e)]; } },
  { a: 91.2, b: 93.4, f: 36, shake: 0.006, c: (t, u, h) => [lerp3(V(0.02, 2.46, -4.7), V(0, 2.5, -5.2), u), V(0, 2.5, -7)] },
  { a: 93.4, b: 101.6, f: 56, shake: 0.007, c: (t, u, h) => [lerp3(V(0, 1.5, 3.2), V(0, 1.5, -3.4), ease(u * 0.9 + 0.1 * u)), V(0, 1.45, -8.2)] },
];
const SHAKE_EVENTS = [[1.62, 0.03, 0.2], [2.4, 0.02, 0.3], [23.84, 0.035, 0.25], [29.5, 0.02, 0.25], [31.5, 0.03, 0.5], [39.86, 0.03, 0.25], [44.0, 0.02, 0.2], [46.3, 0.06, 0.35], [46.95, 0.05, 0.4], [48.55, 0.02, 0.3], [58.82, 0.04, 0.3], [68.72, 0.02, 0.3], [73.84, 0.07, 0.5], [75.2, 0.04, 0.3], [88.64, 0.05, 0.4], [91.0, 0.07, 0.35], [93.45, 0.04, 0.4]];

/* ------------------------------------------------------------ flash/dip */
const elFlash = document.getElementById("flash"), elRed = document.getElementById("redflash"), elDip = document.getElementById("dip"), elGrain = document.getElementById("grain");
const pulse = (t, c, w) => Math.max(0, 1 - Math.abs(t - c) / w);
function overlays(tt) {
  let f = 0;
  f += 0.9 * pulse(tt, 1.62, 0.1) + 0.5 * pulse(tt, 92.48, 0.1) + 0.6 * pulse(tt, 29.5, 0.06) + 0.5 * pulse(tt, 91.0, 0.05) + 0.35 * pulse(tt, 88.64, 0.06);
  const lt = tt; if (lt >= 62.2 && lt < 75.2) f += hash(Math.floor(lt * 17)) < 0.08 ? 0.35 : 0;
  elFlash.style.opacity = clamp(f).toFixed(3);
  let r = 0;
  if (tt >= 17.8 && tt < 75.1) r = 0.05; if (tt >= 73.84 && tt < 75) r = 0.25; r += 0.4 * pulse(tt, 39.9, 0.12) + 0.3 * pulse(tt, 46.3, 0.1);
  elRed.style.opacity = clamp(r).toFixed(3);
  let d = 0;
  d += clamp(1 - tt / 0.35);
  [[23.74, 0.12], [39.76, 0.12], [58.72, 0.12], [73.74, 0.12], [93.35, 0.14]].forEach(([c, w]) => { d += 0.85 * pulse(tt, c - 0.02, w); });
  [[5.8], [17.2], [31.3], [46.9], [62.0], [75.1], [89.25]].forEach(([c]) => { d += 0.55 * pulse(tt, c, 0.06); });
  d += clamp((tt - 101.55) / 0.12);
  elDip.style.opacity = clamp(d).toFixed(3);
  elGrain.style.backgroundPosition = `${Math.floor(hash(Math.floor(tt * 30)) * 300)}px ${Math.floor(hash(Math.floor(tt * 30) + 7) * 300)}px`;
}

/* ------------------------------------------------------------- the frame */
let S = { pov: false, inMirror: false };
function applyVis(pass, t, hp) {
  const mirrorPass = pass === "mirror";
  const dblOn = t >= 63.95 && t < 75.1;
  heroFig.g.visible = (hp.vis && !(mirrorPass && dblOn) && t < 75.1 || (hp.vis && t >= 75.1)) && !(S.noHero && !mirrorPass);
  heroFig.head.visible = !(S.pov && !mirrorPass);
  dblRefl.g.visible = mirrorPass && dblOn;
  const bedOn = t >= 75.1 && t < 89.25 && t >= 86.5;
  dblMain.g.visible = bedOn;
  shadowFig.g.visible = mirrorPass ? (t >= 29.4 && t < 31.6) : (t >= 93.4 && t < 101.7);
  phone.visible = hp.phone;
}
const origMirror = mirror.onBeforeRender.bind(mirror);
let curT = 0, curHP = null;
mirror.onBeforeRender = function (r, s, c) { S.inMirror = true; applyVis("mirror", curT, curHP); origMirror(r, s, c); S.inMirror = false; applyVis("main", curT, curHP); };

function renderAt(tt) {
  tt = clamp(tt, 0, DUR);
  const t = worldT(tt);
  curT = t;
  const abandoned = isAbandoned(tt), apt = inApt(tt);
  // textures / materials by state
  wallMat.map = abandoned ? wallD : wallN; floorMat.map = abandoned ? floorD : floorN;
  ab.visible = abandoned;
  scene.fog.color.set(abandoned ? 0x0b1510 : apt ? 0x0a0806 : 0x07121a); scene.fog.density = abandoned ? 0.045 : apt ? 0.05 : 0.052;
  hemi.color.set(abandoned ? 0x34493c : 0x2a4552); hemi.intensity = apt ? 0.0 : abandoned ? 1.1 : 0.62;
  const hf = hallFlicker(t, abandoned);
  hallLights.forEach((l, i) => { l.color.set(abandoned ? 0x9fc9a8 : 0xaed0ff); l.intensity = (abandoned ? 14 : 10) * hf * (i === 1 && abandoned ? 0.6 : 1); });
  lampMat.color.set(0xcfe6ff).multiplyScalar(abandoned ? 0.35 * hf : 1 * (hf < 0.5 ? 0.2 : 1));
  // elevator
  const o = doorOpen(tt);
  doorL.position.x = -0.3 - 0.58 * o; doorR.position.x = 0.3 + 0.58 * o;
  const fl = flick(t);
  const redOn = tt >= 17.5 && tt < 75.5 ? 1 : 0;
  redLight.intensity = 9 * redOn * fl; cabLampMat.color.set(0xff2a1c).multiplyScalar(redOn * fl);
  mirrorFill.intensity = tt >= 17.5 && tt < 75.5 ? 1.1 : 0;
  coldLight.intensity = tt >= 93.4 ? 2.5 * clamp((tt - 93.4) / 1.2) : tt >= 2.4 && tt < 5.6 ? 0.0 : 0;
  hatch.position.y = 2.285 + (tt > 46.25 && tt < 46.6 ? 0.04 * Math.sin((tt - 46.25) * 60) : 0);
  // clock
  const blink = Math.floor(tt * 2) % 2 === 0;
  const txt = tt < 1.62 ? "03:16" : tt < 89 ? "03:17" : tt < 92.48 ? "03:16" : "03:17";
  drawClock(clockTex, txt, blink || tt > 89);
  clock.visible = true;
  drawCall(tt >= 14.38 && tt < 17.2 || tt >= 17.2 && tt < 75.1);
  drawPanel(tt >= 17.5 && tt < 75.1, false);
  // display
  let dtxt = "0";
  if (tt >= 33.54) dtxt = "-1"; if (tt >= 34.44) dtxt = "-2"; if (tt >= 35.28) dtxt = "-3";
  if (tt < 17.5) dtxt = "";
  let glitch = false;
  if (tt >= 62.2 && tt < 73.84) glitch = hash(Math.floor(tt * 9)) < 0.3;
  if (tt >= 73.84 && tt < 75.1) dtxt = "ТЫ УЖЕ\nВЫШЕЛ";
  drawDisp(dtxt, glitch || (tt >= 73.84 && Math.floor(tt * 14) % 3 === 0));
  dispMesh.visible = !(glitch && hash(Math.floor(tt * 21)) < 0.25);
  // flat
  const heroDoorOpen = (tt >= 89.3 && tt < 90.6) ? easeOut(clamp((tt - 89.3) / 0.5)) : (tt >= 90.6 && tt < 91.0) ? 1 - ease((tt - 90.6) / 0.4) : 0;
  heroDoor.rotation.y = -Math.PI / 2 * 0.95 * heroDoorOpen;
  const bedOpen = ease(clamp((tt - 85.9) / 1.0));
  bedDoor.rotation.y = Math.PI / 2 * 0.92 * bedOpen;
  underDoor.visible = tt >= 80 && tt < 87.2;
  flat.visible = apt || (tt >= 89.25 && tt < 91.3);
  kitchenLight.intensity = 11 * (hash(Math.floor(tt * 10) + 5) < 0.04 && tt > 79 ? 0.3 : 1);
  bedLamp.intensity = tt >= 86.5 ? 3.2 : 0; roomCold.intensity = tt >= 86.4 ? 6 : tt >= 82 ? 0.5 * Math.min(1, (tt - 82) / 4) : 0;
  flat.userData.hemi.intensity = apt || tt >= 89.25 ? 1.2 : 0;
  hall.visible = !apt;
  cabin.visible = !apt;
  // figures
  const hp = heroPose(tt); curHP = hp;
  applyFigure(heroFig, hp, tt);
  // double in the mirror: hand goes up with a delay
  const dpa = clamp((tt - 63.95) / 2.0);
  dblRefl.mats.forEach((m) => { m.opacity = dpa; });
  const dp = { ...hp, pitch: 0, armRx: 0, armRz: 0 };
  if (tt >= 68.72) { const u = ease(clamp((tt - 68.72) / 0.8)); dp.armRx = -2.7 * u; dp.armRz = 0.15 * u; dp.pitch = -0.05; }
  dp.x = 0; dp.z = -8.05; dp.ry = Math.PI; dp.eyes = 1;
  applyFigure(dblRefl, dp, tt - 0.45);
  // double on the bed
  const bp = { x: 4.6, z: -1.8, ry: Math.PI, sit: 1, pitch: 0.35, yaw: 0, walk: 0, armRx: 0, armLx: 0, armRz: 0, armLz: 0 };
  const turn = ease(clamp((tt - 87.6) / 1.4)); bp.pitch = lerp(0.4, 0, turn); bp.yaw = lerp(-0.9, 0, turn);
  bp.armRx = -0.6; bp.armLx = -0.6;
  applyFigure(dblMain, bp, tt);
  dblMain.g.position.y = 0.46 - 0.9 + 0.0; // hips on the mattress
  dblMain.mats.forEach((m) => { m.opacity = 1; });
  // black figure
  const spx = tt >= 93.4 ? { x: 0, z: -8.0, ry: 0, walk: 0, pitch: 0, armRx: 0, armLx: 0 } : { x: 0, z: -7.35, ry: Math.PI, walk: 0, pitch: 0.1, armRx: 0, armLx: 0 };
  applyFigure(shadowFig, spx, tt);
  // dust
  const pa = dustGeo.attributes.position.array;
  for (let i = 0; i < DN; i++) {
    pa[i * 3] = dustBase[i * 3] + Math.sin(t * 0.3 + i) * 0.15;
    pa[i * 3 + 1] = dustBase[i * 3 + 1] + Math.sin(t * 0.22 + i * 1.7) * 0.12 - (t * 0.02 % 0.3);
    pa[i * 3 + 2] = dustBase[i * 3 + 2] + Math.cos(t * 0.25 + i * 0.7) * 0.15;
  }
  dustGeo.attributes.position.needsUpdate = true;
  dust.visible = !apt; dustMat.opacity = abandoned ? 0.85 : 0.4; dustMat.size = abandoned ? 0.016 : 0.011;
  // phone ring
  const ringing = tt >= 36.3 && tt < 43.4 && (((tt - 36.3) % 1.7) < 0.9);
  drawPhone(ringing); phoneGlow.intensity = ringing ? 0.5 : 0.15;
  // camera
  let shot = SHOTS[SHOTS.length - 1];
  for (const s of SHOTS) if (tt >= s.a && tt < s.b) { shot = s; break; }
  S.pov = !!shot.pov; S.noHero = !!shot.noHero;
  const u = clamp((tt - shot.a) / (shot.b - shot.a));
  const [p, l] = shot.c(t, u, hp);
  let sx = 0, sy = 0, sz = 0, roll = 0;
  const amp = shot.shake;
  sx = (noise1(tt * 6) - 0.5) * 2 * amp; sy = (noise1(tt * 6 + 40) - 0.5) * 2 * amp; sz = (noise1(tt * 6 + 80) - 0.5) * 2 * amp;
  roll = (noise1(tt * 3 + 120) - 0.5) * amp * 1.2;
  for (const [te, a, dc] of SHAKE_EVENTS) if (tt >= te) { const k = a * Math.exp(-(tt - te) / dc); sx += (noise1(tt * 28) - 0.5) * k; sy += (noise1(tt * 28 + 30) - 0.5) * k * 1.4; roll += (noise1(tt * 22 + 60) - 0.5) * k * 1.2; }
  if (tt >= 62.5 && tt < 75) { sx += (noise1(tt * 14) - 0.5) * 0.02; sy += (noise1(tt * 14 + 9) - 0.5) * 0.02; }
  cam.fov = shot.f; cam.updateProjectionMatrix();
  cam.position.set(p[0] + sx, p[1] + sy, p[2] + sz);
  cam.up.set(Math.sin(roll), Math.cos(roll), 0);
  cam.lookAt(l[0], l[1], l[2]);
  camFill.intensity = apt ? 1.6 : tt >= 17.5 && tt < 75.5 ? 0.5 : 2.4;
  applyVis("main", t, hp);
  overlays(tt);
  renderer.render(scene, cam);
}

window.__sceneRender = renderAt;
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(window.__hfThreeTime || 0);
