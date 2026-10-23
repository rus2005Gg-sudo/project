import * as THREE from "three";

const W = 1080, H = 1920;
const DUR = window.__DUR || 80;
const CUE = window.CUE; // named time cues from the voice-over (cues.js)

/* ------------------------------------------------------------- utils */
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
const colLerp = (a, b, u) => new THREE.Color(a).lerp(new THREE.Color(b), clamp(u));

/* ----------------------------------------------------------- renderer */
const canvas = document.getElementById("gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x9fd0ff, 120, 380);
const cam = new THREE.PerspectiveCamera(60, W / H, 0.1, 900);
scene.add(cam);

/* ------------------------------------------------------------ lighting */
const sun = new THREE.DirectionalLight(0xffffff, 2.4); sun.position.set(80, 120, 40); scene.add(sun);
const amb = new THREE.AmbientLight(0xbcd2ff, 1.1); scene.add(amb);
const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x5a7a40, 0.6); scene.add(hemi);

/* ----------------------------------------------------------------- sky */
const skyU = { top: new THREE.Color(), bot: new THREE.Color() };
const skyGeo = new THREE.SphereGeometry(600, 24, 16);
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color(0x3c8cf0) }, bot: { value: new THREE.Color(0xbfe0ff) } },
  vertexShader: "varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ",
  fragmentShader: "uniform vec3 top; uniform vec3 bot; varying float h; void main(){ float k = smoothstep(-0.05,0.65,h); gl_FragColor = vec4(mix(bot,top,k),1.0);\n#include <colorspace_fragment>\n}",
});
const sky = new THREE.Mesh(skyGeo, skyMat); scene.add(sky);
// blocky sun
const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff4b0, fog: false });
const sunMesh = new THREE.Mesh(new THREE.BoxGeometry(40, 40, 4), sunMat); scene.add(sunMesh);
// blocky clouds
const clouds = new THREE.Group(); scene.add(clouds);
const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
{
  const r = rng(12);
  for (let i = 0; i < 16; i++) {
    const g = new THREE.Group();
    const n = 3 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(30 + r() * 30, 10 + r() * 6, 20 + r() * 12), cloudMat); b.position.set(k * 24 - n * 12, r() * 5, r() * 8); g.add(b); }
    const a = r() * Math.PI * 2, d = 260 + r() * 120;
    g.position.set(Math.cos(a) * d, 120 + r() * 60, Math.sin(a) * d); g.userData.a = a; g.userData.d = d; clouds.add(g);
  }
}

/* ---------------------------------------------------------- stud tex */
function studTexture(base, topHighlight = 0.2) {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d");
  g.fillStyle = "#" + new THREE.Color(base).getHexString(); g.fillRect(0, 0, 64, 64);
  g.strokeStyle = "rgba(0,0,0,.28)"; g.lineWidth = 2; g.strokeRect(1, 1, 62, 62);
  // stud: lighter top, darker rim
  g.beginPath(); g.arc(32, 32, 17, 0, 7); g.fillStyle = "rgba(0,0,0,.22)"; g.fill();
  g.beginPath(); g.arc(32, 30, 15, 0, 7); g.fillStyle = "rgba(255,255,255," + topHighlight + ")"; g.fill();
  g.beginPath(); g.arc(32, 30, 15, 0, 7); g.fillStyle = "#" + new THREE.Color(base).getHexString(); g.globalAlpha = 0.8; g.fill(); g.globalAlpha = 1;
  g.beginPath(); g.arc(32, 28, 9, Math.PI * 1.1, Math.PI * 1.9); g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 3; g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  t.magFilter = THREE.LinearFilter; return t;
}
const studCache = {};
function studTex(color) { const k = new THREE.Color(color).getHexString(); return studCache[k] || (studCache[k] = studTexture(color)); }
function partMat(color, o = {}) { return new THREE.MeshLambertMaterial({ color, ...o }); }
/** Roblox-style plastic part with studs on the top face (1 stud = 1 unit). */
function part(w, h, d, color, x, y, z, o = {}) {
  const side = new THREE.MeshLambertMaterial({ color });
  const top = new THREE.MeshLambertMaterial({ map: o.noStuds ? null : studTex(0xffffff), color });
  if (top.map) { top.map = top.map.clone(); top.map.repeat.set(w, d); top.map.needsUpdate = true; }
  const mats = [side, side, top, side, side, side];
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
  m.position.set(x, y, z); scene.add(m); m.userData.mats = mats; return m;
}
function neon(w, h, d, color, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color }));
  m.position.set(x, y, z); scene.add(m); return m;
}

/* ------------------------------------------------------------- world */
// baseplate (grey, studs) and grass
const ground = part(600, 2, 600, 0x6b6e73, 0, -1, 0);
const grass = part(120, 0.4, 120, 0x4f9a3a, 0, 0.2, 0);
const gdark = part(60, 0.4, 60, 0x3f8a2e, 20, 0.45, -10);
// spawn pad
const spawn = part(12, 1, 12, 0x2c2c2c, 0, 0.5, 0);
const spawnPlate = part(10, 0.3, 10, 0x9a9a9a, 0, 1.1, 0);
neon(10.4, 0.1, 0.5, 0xffffff, 0, 1.3, 5.2);
// welcome sign
const signCanvas = document.createElement("canvas"); signCanvas.width = 512; signCanvas.height = 256;
function drawSign(txt) {
  const g = signCanvas.getContext("2d");
  g.fillStyle = "#7a4a22"; g.fillRect(0, 0, 512, 256); g.strokeStyle = "#4a2a10"; g.lineWidth = 12; g.strokeRect(6, 6, 500, 244);
  g.fillStyle = "#fff3c0"; g.textAlign = "center"; g.font = "bold 46px Mont, sans-serif";
  const L = txt.split("\n"); L.forEach((l, i) => g.fillText(l, 256, 96 + i * 60));
  signTex.needsUpdate = true;
}
const signTex = new THREE.CanvasTexture(signCanvas); signTex.colorSpace = THREE.SRGBColorSpace;
const signMesh = new THREE.Mesh(new THREE.BoxGeometry(14, 7, 0.6), [partMat(0x5a3a1a), partMat(0x5a3a1a), partMat(0x5a3a1a), partMat(0x5a3a1a), new THREE.MeshLambertMaterial({ map: signTex }), partMat(0x5a3a1a)]);
signMesh.position.set(0, 7, -10); scene.add(signMesh);
part(1, 6, 1, 0x5a3a1a, -5, 3, -10, { noStuds: true }); part(1, 6, 1, 0x5a3a1a, 5, 3, -10, { noStuds: true });
let signKey = ""; const setSign = (t) => { if (t !== signKey) { signKey = t; drawSign(t); } };

// trees (cylinder trunk + cube leaves, very Roblox)
const leafMats = [partMat(0x2f8f2f), partMat(0x3aa03a)];
const trunkMat = partMat(0x6a4a2a);
const trees = [];
{
  const r = rng(5);
  for (let i = 0; i < 46; i++) {
    const a = r() * Math.PI * 2, d = 40 + r() * 140; const x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.abs(x) < 22 && z > 10) continue;
    const g = new THREE.Group();
    const th = 8 + r() * 6;
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(2, th, 2), trunkMat); trunk.position.y = th / 2; g.add(trunk);
    for (let k = 0; k < 3; k++) { const s = 9 - k * 2.2; const lf = new THREE.Mesh(new THREE.BoxGeometry(s, 4, s), leafMats[k % 2]); lf.position.y = th + k * 3 - 1; g.add(lf); }
    g.position.set(x, 0, z); scene.add(g); trees.push(g);
  }
}
// obby path: neon / coloured platforms leading away from spawn (z negative is "forward" for the hero)
const obby = [];
const cols = [0xff4a4a, 0xffa31a, 0xffe14a, 0x4acb4a, 0x4aa8ff, 0xb06aff, 0xff6ad5];
{
  const pts = [[-8, 40], [10, 54], [-6, 68], [8, 82], [-10, 96], [6, 110], [-4, 124], [0, 138]];
  pts.forEach(([x, z], i) => { const y = 3 + i * 1.6; const p = part(9, 1.2, 9, cols[i % cols.length], x, y, z); p.userData.i = i; obby.push(p); });
  // neon bridge
  for (let i = 0; i < 6; i++) { const p = neon(3, 0.6, 6, 0x42f0ff, 0, 15 + i * 0.2, 148 + i * 6.5); p.userData.bridge = i; obby.push(p); }
}
// lava
const lava = new THREE.Mesh(new THREE.PlaneGeometry(300, 260), new THREE.MeshBasicMaterial({ color: 0xff5a1a }));
lava.rotation.x = -Math.PI / 2; lava.position.set(0, 0.3, 190); scene.add(lava);
const lavaSq = [];
{
  const r = rng(9);
  for (let i = 0; i < 60; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(6 + r() * 6, 0.2, 6 + r() * 6), new THREE.MeshBasicMaterial({ color: 0xffb02a })); m.position.set((r() - 0.5) * 120, 0.5, 70 + r() * 150); scene.add(m); lavaSq.push(m); }
}
// small decor: checkpoint flags, kill bricks
[-14, 14].forEach((x, i) => { part(1, 8, 1, 0xdddddd, x, 4, -20 + i * 6, { noStuds: true }); neon(4, 2.5, 0.3, i ? 0x4acb4a : 0xff4a4a, x + 2, 7, -20 + i * 6); });
part(10, 4, 4, 0xa24a2a, 26, 2, -4); part(10, 4, 4, 0xa24a2a, 26, 6, -4);

/* --------------------------------------------------------- characters */
function faceTexture(kind) {
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
  const base = kind === "zero" ? "#e9e9e9" : kind === "zeroEvil" ? "#e9e9e9" : "#f5cd30";
  g.fillStyle = base; g.fillRect(0, 0, 128, 128);
  if (kind === "noob") {
    g.fillStyle = "#222"; g.beginPath(); g.ellipse(46, 54, 7, 11, 0, 0, 7); g.ellipse(82, 54, 7, 11, 0, 0, 7); g.fill();
    g.strokeStyle = "#222"; g.lineWidth = 6; g.lineCap = "round"; g.beginPath(); g.arc(64, 70, 30, 0.25 * Math.PI, 0.75 * Math.PI); g.stroke();
  } else if (kind === "scared") {
    g.fillStyle = "#222"; g.beginPath(); g.ellipse(46, 54, 8, 14, 0, 0, 7); g.ellipse(82, 54, 8, 14, 0, 0, 7); g.fill();
    g.fillStyle = "#fff"; g.beginPath(); g.arc(44, 50, 3, 0, 7); g.arc(80, 50, 3, 0, 7); g.fill();
    g.fillStyle = "#222"; g.beginPath(); g.ellipse(64, 92, 10, 14, 0, 0, 7); g.fill();
  } else { // Player_0: hollow eyes + too-wide smile
    g.fillStyle = "#050505"; g.beginPath(); g.ellipse(44, 52, 12, 16, 0, 0, 7); g.ellipse(84, 52, 12, 16, 0, 0, 7); g.fill();
    if (kind === "zeroEvil") { g.fillStyle = "#ff1a1a"; g.beginPath(); g.arc(44, 54, 4, 0, 7); g.arc(84, 54, 4, 0, 7); g.fill(); }
    g.strokeStyle = "#050505"; g.lineWidth = 7; g.lineCap = "round"; g.beginPath(); g.arc(64, 62, 44, 0.12 * Math.PI, 0.88 * Math.PI); g.stroke();
    g.lineWidth = 4; for (let i = -3; i <= 3; i++) { const a = 0.5 * Math.PI + i * 0.12; g.beginPath(); g.moveTo(64 + Math.cos(a) * 44, 62 + Math.sin(a) * 44 - 2); g.lineTo(64 + Math.cos(a) * 44, 62 + Math.sin(a) * 44 + 12); g.stroke(); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function makeAvatar(style) {
  const g = new THREE.Group(); const P = { g };
  const skin = style.skin, torso = style.torso, legs = style.legs;
  const M = (c) => new THREE.MeshLambertMaterial({ color: c });
  const box = (w, h, d, c, x, y, z, parent) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c)); m.position.set(x, y, z); parent.add(m); return m; };
  // R6: legs 1x2x1, torso 2x2x1, arms 1x2x1, head 1x1x1 (cylindrical)
  const legPivot = (sx) => { const p = new THREE.Group(); p.position.set(sx * 0.5, 2, 0); g.add(p); box(1, 2, 1, legs, 0, -1, 0, p); return p; };
  P.legL = legPivot(-1); P.legR = legPivot(1);
  P.body = new THREE.Group(); g.add(P.body);
  P.torso = box(2, 2, 1, torso, 0, 3, 0, P.body);
  const armPivot = (sx) => { const p = new THREE.Group(); p.position.set(sx * 1.5, 4, 0); P.body.add(p); box(1, 2, 1, skin, 0, -1, 0, p); return p; };
  P.armL = armPivot(-1); P.armR = armPivot(1);
  const headM = [M(skin), M(skin), M(skin)];
  P.head = new THREE.Group(); P.head.position.set(0, 5.2, 0); P.body.add(P.head);
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.2, 14), M(skin)); P.head.add(cyl);
  P.faceMat = new THREE.MeshBasicMaterial({ map: faceTexture(style.face), transparent: false, color: 0xffffff });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), P.faceMat); face.position.set(0, 0, 0.625); P.head.add(face);
  if (style.hat) box(1.35, 0.35, 1.35, style.hat, 0, 0.7, 0, P.head);
  if (style.glow) { P.glow = new THREE.PointLight(style.glow, 0, 14, 1.5); P.head.add(P.glow); }
  // name tag
  const nc = document.createElement("canvas"); nc.width = 512; nc.height = 96; P.nameCanvas = nc;
  P.nameTex = new THREE.CanvasTexture(nc); P.nameTex.colorSpace = THREE.SRGBColorSpace;
  P.name = new THREE.Sprite(new THREE.SpriteMaterial({ map: P.nameTex, transparent: true, depthTest: false, fog: false, sizeAttenuation: false }));
  P.name.scale.set(0.224, 0.042, 1); P.name.position.set(0, 8.2, 0); P.name.renderOrder = 10; g.add(P.name);
  P.setName = (txt, col = "#ffffff") => { const k = txt + col; if (P._nk === k) return; P._nk = k; const x = nc.getContext("2d"); x.clearRect(0, 0, 512, 96); x.font = "bold 54px Mont, sans-serif"; x.textAlign = "center"; x.lineWidth = 10; x.strokeStyle = "rgba(0,0,0,.85)"; x.strokeText(txt, 256, 62); x.fillStyle = col; x.fillText(txt, 256, 62); P.nameTex.needsUpdate = true; };
  P.setFace = (kind) => { if (P._fk === kind) return; P._fk = kind; P.faceMat.map = faceTexture(kind); P.faceMat.needsUpdate = true; };
  scene.add(g); return P;
}
const hero = makeAvatar({ skin: 0xf5cd30, torso: 0x0d69ac, legs: 0x4b974b, face: "noob" });
hero.setName("YOU_2012");
const zero = makeAvatar({ skin: 0xe9e9e9, torso: 0x111111, legs: 0x111111, face: "zero", glow: 0xff1a1a });
zero.setName("Player_0", "#ff4a4a");
const newbie = makeAvatar({ skin: 0xe9e9e9, torso: 0x111111, legs: 0x111111, face: "zero" });
newbie.setName("Player_0", "#ff4a4a");

function poseAvatar(P, s) {
  P.g.position.set(s.x, s.y || 0, s.z); P.g.rotation.y = s.ry || 0;
  const w = Math.sin(s.walk || 0), a = s.walk ? 0.8 : 0;
  P.legL.rotation.x = w * a; P.legR.rotation.x = -w * a;
  P.armL.rotation.x = s.tpose ? 0 : -w * a * 0.9 + (s.armL || 0); P.armR.rotation.x = s.tpose ? 0 : w * a * 0.9 + (s.armR || 0);
  P.armL.rotation.z = s.tpose ? -Math.PI / 2 : 0; P.armR.rotation.z = s.tpose ? Math.PI / 2 : 0;
  P.body.rotation.x = s.lean || 0; P.head.rotation.y = s.yaw || 0; P.head.rotation.x = s.pitch || 0;
  P.body.position.y = s.jump || 0;
}

/* --------------------------------------------------------- scene state */
// phases of the sky (driven by CUE times)
const SKY = [
  [0, 0x3c8cf0, 0xbfe0ff, 0xcfe6ff, 0xfff4b0],
];
function skyState(t) {
  const dusk = clamp((t - CUE.musicSlow) / (CUE.sky_red - CUE.musicSlow + 6));
  const red = clamp((t - CUE.sky_red) / 4);
  const dark = clamp((t - CUE.sky_red - 2) / 10);
  return { dusk, red, dark };
}

/* camera shots: functions of the shot-local values; positions in studs */

const PATH = [[0, 24, 0.45], [-8, 40, 3.6], [10, 54, 5.2], [-6, 68, 6.8], [8, 82, 8.4], [-10, 96, 10], [6, 110, 11.6], [-4, 124, 13.2], [0, 138, 14.8], [0, 148, 15.4], [0, 178, 16.3]];
function heroPath(t) {
  const p = { x: 0, y: 0.45, z: 24, ry: Math.PI, walk: 0, run: false };
  if (t >= CUE.run) {
    const u = clamp((t - CUE.run) / (CUE.skyRedEnd - CUE.run));
    const k = u * (PATH.length - 1), i = Math.min(PATH.length - 2, Math.floor(k)), f = k - i;
    p.x = lerp(PATH[i][0], PATH[i + 1][0], f); p.z = lerp(PATH[i][1], PATH[i + 1][1], f);
    p.y = lerp(PATH[i][2], PATH[i + 1][2], f) + (i < 8 ? Math.sin(f * Math.PI) * 2.6 : 0);
    const dx = PATH[i + 1][0] - PATH[i][0], dz = PATH[i + 1][1] - PATH[i][1];
    p.ry = u >= 1 ? Math.PI : Math.atan2(dx, dz); p.walk = u >= 1 ? 0 : (t - CUE.run) * 9; p.run = u < 1;
  }
  return p;
}
/* the entity: weeping-angel behaviour driven by explicit keyframes */
function zeroPose(t, heroP) {
  const s = { x: 0, z: 0, y: 0.45, ry: 0, walk: 0 };
  if (t < CUE.run) {
    const K = CUE.zeroKeys;
    s.x = rampKeys(t, K.map((k) => [k[0], k[1]])); s.z = rampKeys(t, K.map((k) => [k[0], k[2]]));
    s.y = lerp(1.25, 0.45, clamp((s.z - 5) / 3));
  } else {
    const d = rampKeys(t, CUE.zeroFollow);
    const tp = Math.max(CUE.run, t - d * 0.1);
    const hp2 = heroPath(tp);
    const back = tp > t - d * 0.1 + 1e-6 ? 0 : 0;
    s.x = hp2.x; s.z = hp2.z; s.y = hp2.y;
    if (t - d * 0.1 < CUE.run) { s.x = 0; s.z = 18; s.y = 0.45; }
    if (t >= CUE.skyRedEnd) { s.x = 0; s.z = heroP.z - d; s.y = heroP.y; }
    s.walk = (t - CUE.run) * 9 * (t < CUE.skyRedEnd ? 1 : 0);
  }
  s.ry = Math.atan2(heroP.x - s.x, heroP.z - s.z);
  return s;
}

/* ------------------------------------------------------------ overlays */
const el = (id) => document.getElementById(id);
const elFlash = el("flash"), elRed = el("redtint"), elDip = el("dip"), elGlitch = el("glitch"), elGrain = el("grain");
const pulse = (t, c, w) => Math.max(0, 1 - Math.abs(t - c) / w);
function overlays(tt, sk) {
  let f = 0;
  for (const c of CUE.flashes || []) f += 0.8 * pulse(tt, c, 0.07);
  elFlash.style.opacity = clamp(f).toFixed(3);
  elRed.style.opacity = clamp(sk.red * 0.2 + (tt > CUE.finalMsg ? 0.1 : 0)).toFixed(3);
  let d = clamp(1 - tt / 0.3);
  for (const c of CUE.dips || []) d += 0.9 * pulse(tt, c, 0.12);
  d += clamp((tt - CUE.endBlack) / 0.15);
  elDip.style.opacity = clamp(d).toFixed(3);
  let gl = 0;
  for (const [a, b] of CUE.glitchWin || []) if (tt >= a && tt < b) gl = hash(Math.floor(tt * 24)) < 0.45 ? 1 : 0;
  elGlitch.style.opacity = gl;
  elGlitch.style.transform = gl ? `translate(${(hash(Math.floor(tt * 24) + 3) - 0.5) * 60}px, 0)` : "none";
  elGrain.style.backgroundPosition = `${Math.floor(hash(Math.floor(tt * 30)) * 300)}px ${Math.floor(hash(Math.floor(tt * 30) + 7) * 300)}px`;
}

/* ------------------------------------------------------------- frame */
const SHOT_LIST = window.SHOTS_DEF; // from shots.js: array of {a,b,f,shake,c:(t,u,S)=>[pos,look]}
function renderAt(tt) {
  tt = clamp(tt, 0, DUR);
  const t = tt;
  const sk = skyState(t);
  // sky / lighting colour grade: bright Roblox day -> dusk -> blood red -> black
  const topC = colLerp(colLerp(0x3c8cf0, 0xf0803a, sk.dusk), 0x7a0a0a, sk.red).lerp(new THREE.Color(0x050000), sk.dark);
  const botC = colLerp(colLerp(0xbfe0ff, 0xffc27a, sk.dusk), 0xff3a1a, sk.red).lerp(new THREE.Color(0x120000), sk.dark);
  skyMat.uniforms.top.value.copy(topC); skyMat.uniforms.bot.value.copy(botC);
  scene.fog.color.copy(botC); scene.fog.near = lerp(120, 40, sk.dusk); scene.fog.far = lerp(380, 170, sk.dusk);
  sun.color.copy(colLerp(0xffffff, 0xff6a3a, sk.dusk)); sun.intensity = lerp(2.4, 1.0, sk.dusk) * (1 - sk.dark * 0.7);
  amb.color.copy(colLerp(0xbcd2ff, 0xff7a6a, sk.dusk)); amb.intensity = lerp(1.1, 0.7, sk.dusk) * (1 - sk.dark * 0.45);
  hemi.intensity = lerp(0.6, 0.25, sk.dusk);
  sunMat.color.copy(colLerp(0xfff4b0, 0xff4a1a, sk.dusk)).lerp(new THREE.Color(0x000000), sk.red);
  sunMesh.position.set(lerp(140, 200, sk.dusk), lerp(260, 80, sk.dusk), -300); sunMesh.lookAt(0, 0, 0);
  clouds.children.forEach((c) => { const a = c.userData.a + t * 0.004; c.position.x = Math.cos(a) * c.userData.d; c.position.z = Math.sin(a) * c.userData.d; });
  cloudMat.color.copy(colLerp(0xffffff, 0xffb08a, sk.dusk)).lerp(new THREE.Color(0x400000), sk.red * 0.8);
  lava.material.color.setHex(0xff5a1a).lerp(new THREE.Color(0xff1a00), sk.red);
  lavaSq.forEach((m, i) => { m.position.y = 0.5 + Math.sin(t * 2 + i) * 0.08; });
  trees.forEach((g) => { g.children.forEach((c, i) => { if (i > 0) c.material.color.copy(colLerp(i % 2 ? 0x3aa03a : 0x2f8f2f, 0x2a1a10, sk.red)); }); });
  // platforms vanish after the sky turns red
  obby.forEach((p) => { if (p.userData.i === undefined) return; const k = Math.max(CUE.vanishFrom, CUE.run + ((p.userData.i + 1) / (PATH.length - 1)) * (CUE.skyRedEnd - CUE.run) + 0.4); p.visible = !((t > k && hash(Math.floor(t * 12) + p.userData.i) < 0.7) || t > k + 0.9); });
  // sign text
  setSign(t < CUE.musicSlow ? "WELCOME TO\nSUNNY OBBY!" : t < CUE.sky_red ? "WELCOME TO\nSUNNY OBBY!" : "WELC0ME\nB4CK");

  // avatars
  const hp = heroPath(t);
    const hs = { x: hp.x, z: hp.z, y: hp.y, ry: hp.ry, walk: hp.walk, jump: 0 };
  
  // hero looks around / scared faces
  hero.setFace(t >= CUE.scaredFrom && t < CUE.numbFrom ? "scared" : t >= CUE.numbFrom ? "zero" : "noob");
  hero.setName(t >= CUE.nameSwap ? "Player_0" : "YOU_2012", t >= CUE.nameSwap ? "#ff4a4a" : "#ffffff");
  hs.armL = 0; hs.armR = 0;
  poseAvatar(hero, hs);
  hero.g.visible = !(t >= CUE.heroGone);
  const zp = zeroPose(t, hp);
  zero.setFace(t >= CUE.zeroEvil ? "zeroEvil" : "zero");
  zero.glow.intensity = t >= CUE.zeroEvil ? 6 : 0;
  poseAvatar(zero, zp);
  zero.g.visible = t >= CUE.zeroAppear && t < CUE.zeroGone;
  // the newcomer on the spawn pad at the very end
  newbie.g.visible = t >= CUE.newPlayer;
  poseAvatar(newbie, { x: 0, y: 1.25, z: 0, ry: 0 });
  // billboard names: keep size reasonable
  // camera
  let shot = SHOT_LIST[SHOT_LIST.length - 1];
  for (const s of SHOT_LIST) if (t >= s.a && t < s.b) { shot = s; break; }
  const u = clamp((t - shot.a) / (shot.b - shot.a));
  const S = { hp, hs, zp, t, u };
  const [p, l] = shot.c(t, u, S);
  const amp = shot.shake || 0.05;
  let sx = (noise1(t * 6) - 0.5) * 2 * amp, sy = (noise1(t * 6 + 40) - 0.5) * 2 * amp, sz = (noise1(t * 6 + 80) - 0.5) * 2 * amp;
  let roll = (noise1(t * 3 + 120) - 0.5) * amp * 0.02;
  for (const [te, a, dc] of CUE.shakes || []) if (t >= te) { const k = a * Math.exp(-(t - te) / dc); sx += (noise1(t * 28) - 0.5) * k; sy += (noise1(t * 28 + 30) - 0.5) * k; roll += (noise1(t * 22 + 60) - 0.5) * k * 0.03; }
  cam.fov = shot.f; cam.updateProjectionMatrix();
  cam.position.set(p[0] + sx, p[1] + sy, p[2] + sz);
  cam.up.set(Math.sin(roll), Math.cos(roll), 0);
  cam.lookAt(l[0], l[1], l[2]);
  sky.position.copy(cam.position);
  overlays(t, sk);
  window.__ui && window.__ui(t);
  renderer.render(scene, cam);
}
window.__sceneRender = renderAt;
const safeRender = (t) => { try { renderAt(t); } catch (e) { console.error("RENDERFAIL t=" + t + " " + e.stack); } };
window.addEventListener("hf-seek", (e) => safeRender(e.detail.time));
safeRender(window.__hfThreeTime || 0);
