import * as THREE from "three";

const W = 1080, H = 1920, DUR = 28;
/* cue times (s) */
const K = { black: 0.7, win: 9.85, z0: 10.2, z1: 12.8, back: 19.9, turnA: 20.2, turnB: 22.4, hit: 23.3 };

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const ease = (u) => u * u * (3 - 2 * u);
const win = (t, a, b) => clamp((t - a) / (b - a));
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const noise1 = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u); };
const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

const canvas = document.getElementById("gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070a12);
const cam = new THREE.PerspectiveCamera(62, W / H, 0.05, 200);
scene.add(cam);

/* ---------------------------------------------------------------- textures */
function ctex(w, h, draw, rep) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const speck = (g, w, h, n, seed, cols, sz) => { const r = rng(seed); for (let i = 0; i < n; i++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(r() * w, r() * h, 1 + r() * sz, 1 + r() * sz); } };
const wallTex = ctex(256, 256, (g, w, h) => { g.fillStyle = "#8d877b"; g.fillRect(0, 0, w, h); speck(g, w, h, 3500, 1, ["rgba(0,0,0,.05)", "rgba(255,255,255,.05)"], 3); }, true);
const floorTex = ctex(256, 256, (g, w, h) => { g.fillStyle = "#5a4232"; g.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "rgba(0,0,0,.12)" : "rgba(255,200,150,.05)"; g.fillRect(0, i * 32, w, 32); g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(0, i * 32, w, 2); } speck(g, w, h, 1500, 2, ["rgba(0,0,0,.18)"], 4); }, true);
wallTex.repeat.set(3, 1.5); floorTex.repeat.set(2, 3);

function facadeTexture(lit) {
  return ctex(512, 512, (g, w, h) => {
    g.fillStyle = "#12151c"; g.fillRect(0, 0, w, h); speck(g, w, h, 2500, 5, ["rgba(255,255,255,.03)", "rgba(0,0,0,.2)"], 3);
    const r = rng(11);
    for (let y = 0; y < 14; y++) for (let x = 0; x < 16; x++) {
      const on = lit && r() < 0.5; g.fillStyle = on ? (r() < 0.25 ? "#bfd8ff" : "#ffd9a0") : "#0a0c11";
      if (!on) r();
      g.fillRect(x * 32 + 6, y * 36 + 8, 18, 22);
    }
  }, false);
}
const facadeLit = facadeTexture(true), facadeDark = facadeTexture(false);

/* --------------------------------------------------------------- materials */
const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.92, ...o });
function box(w, h, d, mat, x, y, z, parent = scene) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; }

/* -------------------------------------------------------------------- room */
const wallM = std(0xffffff, { map: wallTex });
const floorM = std(0xffffff, { map: floorTex, roughness: 0.55 });
const ceilM = std(0x9a958c);
box(4.4, 0.1, 7.2, floorM, 0, -0.05, -1.0);
box(4.4, 0.1, 7.2, ceilM, 0, 2.65, -1.0);
box(0.1, 2.7, 7.2, wallM, -2.25, 1.3, -1.0); box(0.1, 2.7, 7.2, wallM, 2.25, 1.3, -1.0);
box(4.4, 2.7, 0.1, wallM, 0, 1.3, 2.6);
// far wall with window (x -1.3..0.5, y 0.9..2.2) and doorway (x 0.9..1.5, y 0..2.1)
const FW = -4.5;
box(0.9, 2.7, 0.15, wallM, -1.75, 1.3, FW);                  // left of window  (x -2.2..-1.3)
box(1.8, 0.9, 0.15, wallM, -0.4, 0.45, FW);                  // under window
box(1.8, 0.5, 0.15, wallM, -0.4, 2.45, FW);                  // over window
box(0.4, 2.7, 0.15, wallM, 0.7, 1.3, FW);                    // pier between window and door
box(0.6, 0.6, 0.15, wallM, 1.2, 2.4, FW);                    // over door
box(0.75, 2.7, 0.15, wallM, 1.875, 1.3, FW);                 // right of door
// window frame
const frameM = std(0x2b2926);
box(1.9, 0.06, 0.2, frameM, -0.4, 0.92, FW); box(1.9, 0.06, 0.2, frameM, -0.4, 2.2, FW);
box(0.06, 1.34, 0.2, frameM, -1.32, 1.55, FW); box(0.06, 1.34, 0.2, frameM, 0.52, 1.55, FW); box(0.05, 1.3, 0.2, frameM, -0.4, 1.55, FW);
// hallway behind door
const hallM = std(0x2a2824);
box(1.4, 2.6, 0.1, hallM, 1.2, 1.3, FW - 2.6); box(0.1, 2.6, 2.6, hallM, 0.5, 1.3, FW - 1.3); box(0.1, 2.6, 2.6, hallM, 1.9, 1.3, FW - 1.3); box(1.4, 0.1, 2.6, floorM, 1.2, 0, FW - 1.3);

// opposite building
const facadeMat = new THREE.MeshBasicMaterial({ map: facadeLit });
const facade = new THREE.Mesh(new THREE.PlaneGeometry(36, 26), facadeMat); facade.position.set(0, 7, -13.5); scene.add(facade);
const farMat = new THREE.MeshBasicMaterial({ map: facadeLit, color: 0x777777 });
const far = new THREE.Mesh(new THREE.PlaneGeometry(70, 40), farMat); far.position.set(-8, 14, -34); scene.add(far);
const WINX = -0.6, WINY = 1.9, WINZ = -13.46;
const lampWin = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.0), new THREE.MeshBasicMaterial({ color: 0xffe3b0, toneMapped: false })); lampWin.position.set(WINX, WINY, WINZ); lampWin.visible = false; scene.add(lampWin);

// furniture
const couchM = std(0x3a4658), woodM = std(0x4b3626);
box(1.9, 0.45, 0.85, couchM, -1.2, 0.23, -0.4); box(1.9, 0.5, 0.2, couchM, -1.2, 0.62, -0.78); box(0.2, 0.3, 0.85, couchM, -2.05, 0.5, -0.4); box(0.2, 0.3, 0.85, couchM, -0.35, 0.5, -0.4);
box(1.0, 0.04, 0.6, woodM, 0.3, 0.42, -2.2); [[-0.15, -1.95], [0.75, -1.95], [-0.15, -2.45], [0.75, -2.45]].forEach(([x, z]) => box(0.05, 0.4, 0.05, woodM, x, 0.2, z));
box(0.2, 0.2, 0.2, std(0xd8d2c4), 0.15, 0.54, -2.2); // cup-ish
box(0.08, 1.0, 0.08, std(0x222222), -1.9, 0.5, -3.6); const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 0.3, 12), new THREE.MeshBasicMaterial({ color: 0xffd7a0, toneMapped: false })); shade.position.set(-1.9, 1.15, -3.6); scene.add(shade);
box(1.0, 0.7, 0.04, std(0x7a6a58), 1.4, 1.5, 1.2).rotation.y = 0;

/* ------------------------------------------------------------------ lights */
const amb = new THREE.AmbientLight(0xffe2c0, 0.75); scene.add(amb);
const lamp = new THREE.PointLight(0xffc98a, 14, 12, 1.6); lamp.position.set(-1.9, 1.15, -3.4); scene.add(lamp);
const ceilL = new THREE.PointLight(0xffe2bd, 8, 10, 1.7); ceilL.position.set(0, 2.4, -1.5); scene.add(ceilL);
const hallL = new THREE.PointLight(0xffcf9a, 1.6, 4, 2); hallL.position.set(1.2, 1.9, FW - 1.0); scene.add(hallL);
const moon = new THREE.DirectionalLight(0x7f98c8, 0.0); moon.position.set(0, 3, -10); scene.add(moon);
const torch = new THREE.SpotLight(0xdfe8ff, 0, 9, 0.55, 0.55, 1.3); cam.add(torch); torch.position.set(0.05, -0.05, 0); const tgt = new THREE.Object3D(); tgt.position.set(0, 0, -3); cam.add(tgt); torch.target = tgt;

/* ----------------------------------------------------------------- figures */
function makeFigure(o = {}) {
  const cloth = o.black ? new THREE.MeshBasicMaterial({ color: 0x030304 }) : std(0x15171c);
  const skin = o.black ? cloth : std(0xa9a49b, { roughness: 0.8 });
  const g = new THREE.Group();
  const leg = (x) => box(0.15, 0.86, 0.17, cloth, x, 0.43, 0, g);
  leg(-0.11); leg(0.11);
  box(0.44, 0.62, 0.24, cloth, 0, 1.17, 0, g);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.125, 14, 12), skin); head.scale.set(0.9, 1.15, 0.95); head.position.set(0, 1.6, 0); g.add(head);
  if (!o.black) {
    const eye = new THREE.MeshBasicMaterial({ color: 0x000000 });
    [-0.045, 0.045].forEach((x) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), eye); e.scale.set(1.2, 1.7, 0.6); e.position.set(x, 1.62, 0.115); g.add(e); });
    const m = box(0.06, 0.008, 0.01, eye, 0, 1.54, 0.12, g);
  }
  const arm = (x) => { const p = new THREE.Group(); p.position.set(x, 1.43, 0); g.add(p); box(0.1, 0.62, 0.1, cloth, 0, -0.3, 0, p); return p; };
  const armL = arm(-0.27), armR = arm(0.27);
  return { g, head, armL, armR };
}
const doorFig = makeFigure(); doorFig.g.position.set(1.2, 0, FW - 1.1); doorFig.g.rotation.y = 0; scene.add(doorFig.g);
const behindFig = makeFigure(); behindFig.g.position.set(0.12, 0, 1.55); behindFig.g.rotation.y = Math.PI; behindFig.head.rotation.z = 0.12; scene.add(behindFig.g);
const oppFig = makeFigure({ black: true }); oppFig.g.position.set(WINX, WINY - 1.45, WINZ + 0.15); oppFig.g.scale.setScalar(1.15); oppFig.g.visible = false; scene.add(oppFig.g);

/* ------------------------------------------------------------------ render */
const CAM0 = [0, 1.45, 0.5];
function renderAt(t) {
  const dark = t >= K.black;
  const lampFlick = t < K.black ? 1 - (t > K.black - 0.12 ? 0.5 * Math.sin(t * 90) ** 2 : 0) : 0;
  amb.color.setHex(dark ? 0x6c85b8 : 0xffe2c0); amb.intensity = dark ? 0.55 : 0.75;
  lamp.intensity = 14 * lampFlick; ceilL.intensity = 8 * lampFlick; shade.visible = !dark; hallL.intensity = dark ? 0 : 1.6; moon.intensity = dark ? 0.55 : 0;
  facadeMat.map = dark ? facadeDark : facadeLit; farMat.map = dark ? facadeDark : facadeLit; facadeMat.color.setHex(dark ? 0x9aa6c0 : 0xffffff); farMat.color.setHex(dark ? 0x667799 : 0x777777);
  scene.background.setHex(dark ? 0x0a0f1c : 0x131a2a);
  // opposite window: flickers on
  const fl = t >= K.win && (t > K.win + 0.55 || Math.sin((t - K.win) * 60) > -0.2) && !(t > K.win + 0.18 && t < K.win + 0.3);
  lampWin.visible = fl; oppFig.g.visible = fl && t > K.win + 0.8;
  const pk = ease(win(t, 17.5, 18.3));
  oppFig.armR.rotation.z = lerp(0.1, -1.55, pk); oppFig.armR.rotation.x = 0; oppFig.armL.rotation.z = -0.05;
  oppFig.g.position.x = WINX + 0.35 * pk * 0.5; oppFig.head.rotation.y = 0;
  // figures
  doorFig.g.visible = t < K.black + 0.02; behindFig.g.visible = dark;
  torch.intensity = t >= K.turnA ? (t > 21.3 && t < 21.38 ? 0 : 9) : 0;
  // camera
  let pos = CAM0.slice(), fov = 62, yaw = 0, pitch = 0, look = null;
  const wob = (s, a) => (noise1(t * s) - 0.5) * a;
  if (t < K.z0) { pitch = -0.01 + wob(0.7, 0.01); yaw = ease(win(t, 0, 10)) * 0.06 - 0.03 * (1 - win(t, 0, 3)); }
  else if (t < K.back) {
    const u = ease(win(t, K.z0, K.z1)); fov = lerp(62, lerp(22, 19.5, win(t, K.z1, 19.0)), u);
    yaw = lerp(0.06, 0.0, u); pitch = lerp(-0.01, 0.07, u);
    if (t > 19.0) { const v = ease(win(t, 19.0, K.back)); fov = lerp(19.5, 62, v); pitch = lerp(0.07, -0.02, v); }
  } else {
    fov = 62; const v = ease(win(t, K.turnA, K.turnB)); yaw = lerp(0.0, Math.PI, v) + (noise1(t * 3) - 0.5) * 0.04 * v; pitch = lerp(-0.02, 0.0, v);
    if (t > 21.4 && t < 21.6) yaw -= 0.05; // hesitation
    if (t >= K.turnB) { fov = lerp(62, 54, win(t, K.turnB, K.hit)); pos[2] = lerp(0.5, 0.35, win(t, K.turnB, K.hit)); }
  }
  const shk = (t >= K.turnA ? 0.012 : 0.004) * (0.6 + 0.8 * noise1(t * 2));
  pos[0] += (noise1(t * 6) - 0.5) * shk * 2; pos[1] += (noise1(t * 6 + 20) - 0.5) * shk * 2;
  const rollA = (noise1(t * 3 + 70) - 0.5) * (t >= K.turnA ? 0.04 : 0.012);
  if (t >= K.hit) { const k = Math.exp(-(t - K.hit) * 14); pos[0] += (noise1(t * 40) - 0.5) * 0.1 * k; pos[1] += (noise1(t * 40 + 9) - 0.5) * 0.1 * k; }
  cam.fov = fov; cam.updateProjectionMatrix(); cam.position.set(pos[0], pos[1], pos[2]);
  cam.up.set(Math.sin(rollA), Math.cos(rollA), 0);
  cam.lookAt(pos[0] + Math.sin(yaw) * Math.cos(pitch), pos[1] + Math.sin(pitch), pos[2] - Math.cos(yaw) * Math.cos(pitch));
  // phone auto exposure: dips after blackout, creeps up
  renderer.toneMappingExposure = t < K.black ? 1.0 : 0.75 + 1.05 * ease(win(t, K.black + 0.1, K.black + 2.2)) + (t >= K.z0 && t < K.z1 ? -0.1 * ease(win(t, K.z0, K.z0 + 0.5)) : 0);
  window.__ui && window.__ui(t, { dark });
  renderer.render(scene, cam);
}
const safeRender = (t) => { try { renderAt(t); } catch (e) { console.error("RENDERFAIL t=" + t + " " + e.stack); } };
window.addEventListener("hf-seek", (e) => safeRender(e.detail.time));
safeRender(window.__hfThreeTime || 0);
