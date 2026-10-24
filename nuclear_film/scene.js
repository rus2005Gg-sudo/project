import * as THREE from "three";

const W = 1080, H = 1920;
const CUE = window.CUE, E = CUE.e;
const DUR = window.__DUR;

/* ------------------------------------------------------------------ utils */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const ease = (u) => u * u * (3 - 2 * u);
const easeOut = (u) => 1 - Math.pow(1 - u, 3);
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const noise1 = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u); };
const rampKeys = (t, keys) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; return lerp(v0, v1, (t - t0) / (t1 - t0)); }
  return keys[keys.length - 1][1];
};
const rng = (seed) => { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const win = (t, a, b) => clamp((t - a) / (b - a));

/* --------------------------------------------------------------- renderer */
const canvas = document.getElementById("gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070d);
scene.fog = new THREE.FogExp2(0x0a1020, 0.00028);
const cam = new THREE.PerspectiveCamera(50, W / H, 0.05, 40000);
scene.add(cam);

/* -------------------------------------------------------------- textures */
function ctex(w, h, draw, rep) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d"); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.userData = { c, g }; return t;
}
const speckle = (g, w, h, n, seed, cols, sz = 2) => { const r = rng(seed); for (let i = 0; i < n; i++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(r() * w, r() * h, 1 + r() * sz, 1 + r() * sz); } };
const sandTex = ctex(256, 256, (g, w, h) => { g.fillStyle = "#4a4132"; g.fillRect(0, 0, w, h); speckle(g, w, h, 4000, 2, ["rgba(0,0,0,.2)", "rgba(255,230,180,.08)", "rgba(90,70,40,.2)"], 3); }, true);
const asphaltTex = ctex(128, 256, (g, w, h) => { g.fillStyle = "#26282b"; g.fillRect(0, 0, w, h); speckle(g, w, h, 2500, 3, ["rgba(255,255,255,.07)", "rgba(0,0,0,.3)"], 2); }, true);
const concreteTex = ctex(128, 128, (g, w, h) => { g.fillStyle = "#6d6e6c"; g.fillRect(0, 0, w, h); speckle(g, w, h, 1800, 4, ["rgba(0,0,0,.16)", "rgba(255,255,255,.08)"], 3); g.fillStyle = "rgba(0,0,0,.2)"; g.fillRect(0, 62, w, 3); }, true);
const winTex = ctex(256, 256, (g, w, h) => { g.fillStyle = "#12141a"; g.fillRect(0, 0, w, h); const r = rng(8); for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) { if (r() < 0.55) { g.fillStyle = r() < 0.25 ? "#ffe9a8" : "#e8a85a"; g.fillRect(x * 32 + 8, y * 16 + 4, 14, 8); } } }, true);
const dustTex = ctex(8, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(180,150,110,0)"); gr.addColorStop(0.35, "rgba(190,160,120,.85)"); gr.addColorStop(1, "rgba(120,95,70,.95)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });

/* --------------------------------------------------------------- helpers */
const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, flatShading: true, ...o });
const matCache = {}; const cm = (c, o) => { const k = c + JSON.stringify(o || {}); return matCache[k] || (matCache[k] = M(c, o)); };
function box(w, h, d, mat, x, y, z, parent = scene) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; }
function put(m, x, y, z, rx = 0, ry = 0, rz = 0, parent = scene) { m.position.set(x, y, z); m.rotation.set(rx, ry, rz); parent.add(m); return m; }
const basic = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false, ...o });

/* =============================== SKY ===================================== */
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color(0x070a18) }, mid: { value: new THREE.Color(0x1b2548) }, hor: { value: new THREE.Color(0x7a4a3a) }, blast: { value: 0 }, ang: { value: new THREE.Vector3(0, 0, -1) } },
  vertexShader: "varying vec3 d; void main(){ d = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ",
  fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 hor; uniform float blast; uniform vec3 ang; varying vec3 d;
  float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  void main(){ float h = d.y; vec3 c = mix(hor, mid, smoothstep(-0.02, 0.28, h)); c = mix(c, top, smoothstep(0.2, 0.9, h));
    vec2 sp = floor(vec2(atan(d.x,d.z)*180.0, d.y*320.0)); float s = step(0.9975, h21(sp)) * smoothstep(0.12, 0.5, h); c += vec3(s)*0.9;
    float g = pow(max(dot(normalize(d), normalize(ang)), 0.0), 6.0); c += vec3(1.0,0.55,0.25) * g * blast * 1.4 * (1.0 - smoothstep(0.0, 0.8, h));
    c = mix(c, vec3(0.55,0.2,0.12), blast*0.35*(1.0-smoothstep(0.0,0.6,h)));
    gl_FragColor = vec4(c,1.0);
#include <colorspace_fragment>
  }`,
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(20000, 24, 16), skyMat); scene.add(sky);
const moon = new THREE.Mesh(new THREE.CircleGeometry(260, 24), basic(0xdfe6ff, { fog: false })); moon.position.set(-9000, 9000, 6000); moon.lookAt(0, 0, 0); scene.add(moon);

/* =============================== WORLD =================================== */
const world = new THREE.Group(); scene.add(world);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(30000, 30000), new THREE.MeshStandardMaterial({ map: sandTex, roughness: 1 }));
sandTex.repeat.set(3000, 3000); ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.02, -3000); world.add(ground);
const road = new THREE.Mesh(new THREE.PlaneGeometry(8, 8000), new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: 0.75 }));
asphaltTex.repeat.set(1, 1000); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.0, -3200); world.add(road);
box(0.15, 0.02, 8000, basic(0xc9c9bd), -3.6, 0.03, -3200, world); box(0.15, 0.02, 8000, basic(0xc9c9bd), 3.6, 0.03, -3200, world);
{ const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.02, 3.2), basic(0xd8b44a), 800); const d = new THREE.Object3D(); for (let i = 0; i < 800; i++) { d.position.set(0, 0.035, 400 - i * 9); d.updateMatrix(); im.setMatrixAt(i, d.matrix); } world.add(im); }
// roadside poles + wires
const poles = []; const POLE_X = 8.5;
for (let i = 0; i < 70; i++) { const z = 300 - i * 70; const g = new THREE.Group(); g.position.set(POLE_X, 0, z); world.add(g); box(0.28, 9, 0.28, cm(0x3a2c20), 0, 4.5, 0, g); box(3.2, 0.2, 0.2, cm(0x3a2c20), 0, 8.4, 0, g); [-1.3, 0, 1.3].forEach((x) => box(0.1, 0.25, 0.1, cm(0xaaaaaa), x, 8.7, 0, g)); poles.push({ g, z }); }
const wireMat = new THREE.LineBasicMaterial({ color: 0x16120e });
for (let i = 0; i < poles.length - 1; i++) [-1.3, 0, 1.3].forEach((dx) => { const a = poles[i], b = poles[i + 1]; const pts = []; for (let k = 0; k <= 8; k++) { const u = k / 8; pts.push(new THREE.Vector3(POLE_X + dx, 8.6 - Math.sin(Math.PI * u) * 0.9, lerp(a.z, b.z, u))); } const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireMat); world.add(ln); a.wires = (a.wires || []).concat(ln); });
// mountains
{ const r = rng(21); const mm = M(0x1a1f2c, { flatShading: true });
  for (let i = 0; i < 26; i++) { const side = i % 2 ? 1 : -1; const h = 500 + r() * 1400; const c = new THREE.Mesh(new THREE.ConeGeometry(1500 + r() * 2500, h, 6 + Math.floor(r() * 3)), mm); c.position.set(side * (3500 + r() * 6500), h / 2 - 20, -1500 - r() * 7500); c.rotation.y = r() * 3; world.add(c); } }
// the city on the horizon
const city = new THREE.Group(); world.add(city); city.position.set(0, 0, -7000);
{ const r = rng(33); const dm = new THREE.MeshStandardMaterial({ color: 0x20242e, roughness: 1, map: winTex, emissive: 0xffffff, emissiveMap: winTex, emissiveIntensity: 0.9 });
  for (let i = 0; i < 90; i++) { const w = 30 + r() * 60, h = 20 + Math.pow(r(), 2) * 220; const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 30 + r() * 40), dm); b.position.set((r() - 0.5) * 1700, h / 2, (r() - 0.5) * 300); city.add(b); } }
const cityGlow = new THREE.Mesh(new THREE.PlaneGeometry(2400, 260), new THREE.MeshBasicMaterial({ color: 0xff9a4a, transparent: true, opacity: 0.18, fog: false, depthWrite: false })); cityGlow.position.set(0, 120, -6800); world.add(cityGlow);
// overpass (concrete) ahead of the stop point
const conc = new THREE.MeshStandardMaterial({ map: concreteTex, roughness: 1 }); concreteTex.repeat.set(4, 2);
const OP_Z = -285;
const overpass = new THREE.Group(); overpass.position.set(0, 0, OP_Z); world.add(overpass);
box(40, 1.4, 14, conc, 5, 6.4, 0, overpass); box(40, 1.0, 0.5, conc, 5, 7.6, 7, overpass); box(40, 1.0, 0.5, conc, 5, 7.6, -7, overpass);
[-8, 8].forEach((x) => { box(1.6, 6, 3.2, conc, x, 3, 0, overpass); });
[-1, 1].forEach((s) => { const e = box(14, 6.2, 16, conc, s * 22, 3.1, 0, overpass); e.rotation.z = s * 0.0; });
const bunkerDoorG = new THREE.Group(); bunkerDoorG.position.set(7.2, 0, OP_Z + 1.62); world.add(bunkerDoorG);
box(0.1, 2.1, 1.1, cm(0x4b5a52, { metalness: 0.5, roughness: 0.5 }), 0, 1.05, 0.55, bunkerDoorG); box(0.14, 0.12, 0.3, cm(0xb0b0a0, { metalness: 0.8 }), 0.04, 1.0, 0.9, bunkerDoorG);
box(0.12, 2.2, 1.2, cm(0x222222), 7.18, 1.1, OP_Z + 1.62 + 0.55, world);
const ovLight = new THREE.PointLight(0xff9a50, 0, 18, 1.6); ovLight.position.set(7.0, 2.6, OP_Z + 2); world.add(ovLight);

/* ============================== THE CAR ================================== */
const car = new THREE.Group(); scene.add(car);
const bodyC = cm(0x8f2a2a, { roughness: 0.5, metalness: 0.25 }), glassC = basic(0x0a0e14);
box(1.85, 0.6, 4.5, bodyC, 0, 0.6, 0, car); box(1.65, 0.9, 2.3, bodyC, 0, 1.3, 0.35, car);
[[-0.8, -1.4], [0.8, -1.4], [-0.8, 1.45], [0.8, 1.45]].forEach(([x, z]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 14), cm(0x111111)); w.rotation.z = Math.PI / 2; w.position.set(x * 1.18, 0.34, z); car.add(w); });
const hl = [-0.6, 0.6].map((x) => box(0.4, 0.14, 0.05, basic(0xfff2c8), x, 0.7, -2.27, car));
const tl = [-0.65, 0.65].map((x) => box(0.4, 0.12, 0.05, basic(0xff2a1a), x, 0.72, 2.27, car));
const headSpot = new THREE.SpotLight(0xfff0d0, 90, 120, 0.42, 0.6, 1.2); headSpot.position.set(0, 0.8, -2.0); headSpot.target.position.set(0, 0, -40); car.add(headSpot); car.add(headSpot.target);
// interior
const dashM = cm(0x15171a, { roughness: 0.7 }), seatM = cm(0x2a2b2e);
box(1.65, 0.3, 0.55, dashM, 0, 0.86, -0.7, car); box(1.6, 0.05, 1.2, cm(0x1c1d20), 0, 0.33, 0.0, car);
box(0.55, 0.12, 0.5, seatM, -0.4, 0.5, 0.45, car); box(0.55, 0.62, 0.12, seatM, -0.4, 0.8, 0.72, car); box(0.55, 0.12, 0.5, seatM, 0.4, 0.5, 0.45, car); box(0.55, 0.62, 0.12, seatM, 0.4, 0.8, 0.72, car);
box(0.08, 0.55, 0.12, dashM, -0.82, 1.28, -0.5, car); box(0.08, 0.55, 0.12, dashM, 0.82, 1.28, -0.5, car);

box(0.04, 1.0, 2.2, cm(0x1b1c1f), -0.83, 0.95, 0.3, car).visible = true; box(0.04, 1.0, 2.2, cm(0x1b1c1f), 0.83, 0.95, 0.3, car);
const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.022, 8, 22), cm(0x0e0e10)); put(wheel, -0.4, 0.95, -0.2, -0.9, 0, 0, car);
const mirror = box(0.26, 0.07, 0.03, cm(0x222222), 0, 1.38, -0.62, car);
// radio + cluster displays
const radioTex = ctex(256, 96, () => {}); let radioKey = "";
function drawRadio(mode, t) {
  const k = mode + "|" + Math.floor(t * 8); if (k === radioKey) return; radioKey = k;
  const g = radioTex.userData.g; g.fillStyle = "#05100a"; g.fillRect(0, 0, 256, 96);
  g.textAlign = "center"; g.textBaseline = "middle";
  if (mode === "alert") { const on = Math.floor(t * 3) % 2 === 0; g.fillStyle = on ? "#ff3a2a" : "#601008"; g.font = "bold 34px monospace"; g.fillText("ТРЕВОГА", 128, 34); g.fillStyle = "#ffd27a"; g.font = "bold 20px monospace"; g.fillText("ЭКСТР. СООБЩЕНИЕ", 128, 70); }
  else if (mode === "static") { g.fillStyle = "#7affc4"; g.font = "bold 40px monospace"; g.fillText("FM --.-", 128, 34); for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(122,255,196,.5)"; g.fillRect(i * 6.4, 52 + hash(Math.floor(t * 20) + i) * 36, 3, 6); } }
  else { g.fillStyle = "#7affc4"; g.font = "bold 40px monospace"; g.fillText("FM 101.7", 128, 34); g.fillStyle = "rgba(122,255,196,.6)"; for (let i = 0; i < 40; i++) g.fillRect(i * 6.4, 90 - (10 + 30 * hash(Math.floor(t * 6) + i * 3)), 3, 10 + 30 * hash(Math.floor(t * 6) + i * 3)); }
  radioTex.needsUpdate = true;
}
const radioMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.105), new THREE.MeshBasicMaterial({ map: radioTex, toneMapped: false })); put(radioMesh, 0.0, 0.9, -0.43, -0.25, 0, 0, car);
box(0.34, 0.2, 0.06, cm(0x0c0d0f), 0, 0.9, -0.46, car);
[-0.1, 0.1].forEach((x) => { const kn = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 10), cm(0x888888, { metalness: 0.8 })); kn.rotation.x = Math.PI / 2; kn.position.set(x, 0.82, -0.42); car.add(kn); });
const clusterTex = ctex(128, 64, (g) => { g.fillStyle = "#04080c"; g.fillRect(0, 0, 128, 64); g.strokeStyle = "#7affc4"; g.lineWidth = 2; g.beginPath(); g.arc(34, 38, 22, Math.PI * 0.8, Math.PI * 2.2); g.stroke(); g.beginPath(); g.arc(94, 38, 22, Math.PI * 0.8, Math.PI * 2.2); g.stroke(); g.fillStyle = "#ffb34a"; g.font = "bold 14px monospace"; g.fillText("77", 28, 44); });
const cluster = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.12), new THREE.MeshBasicMaterial({ map: clusterTex, toneMapped: false })); put(cluster, -0.4, 0.99, -0.38, -0.5, 0, 0, car);
const dashLight = new THREE.PointLight(0x5affc0, 0.9, 2.5, 1.6); dashLight.position.set(-0.2, 1.0, -0.2); car.add(dashLight);
const glowLight = new THREE.PointLight(0xff8a3a, 0, 6, 1.4); glowLight.position.set(-0.4, 1.3, -0.3); car.add(glowLight);

/* ============================ FIGURES ==================================== */
function makeFigure(o) {
  const g = new THREE.Group(); const P = { g };
  const mk = (c, r = 0.9) => new THREE.MeshStandardMaterial({ color: c, roughness: r, flatShading: true });
  const skin = mk(o.skin, 0.7), jacket = mk(o.jacket), pants = mk(o.pants), shoe = mk(0x111111, 0.6), hair = mk(o.hair);
  P.jacketMat = jacket; P.skinMat = skin;
  const piv = (parent, x, y, z) => { const p = new THREE.Group(); p.position.set(x, y, z); parent.add(p); return p; };
  const leg = (sx) => { const hip = piv(g, sx * 0.1, 0.9, 0); box(0.17, 0.45, 0.19, pants, 0, -0.225, 0, hip); const knee = piv(hip, 0, -0.45, 0); box(0.15, 0.45, 0.17, pants, 0, -0.225, 0, knee); box(0.17, 0.08, 0.3, shoe, 0, -0.43, 0.06, knee); return { hip, knee }; };
  P.legL = leg(1); P.legR = leg(-1);
  const torso = piv(g, 0, 0, 0); P.torso = torso;
  box(0.46, 0.62, 0.27, jacket, 0, 1.2, 0, torso); box(0.34, 0.12, 0.2, jacket, 0, 1.53, 0, torso); box(0.46, 0.2, 0.28, pants, 0, 0.92, 0, torso);
  const arm = (sx) => { const sh = piv(torso, sx * 0.3, 1.46, 0); const ua = box(0.12, 0.32, 0.13, jacket, 0, -0.16, 0, sh); const el = piv(sh, 0, -0.32, 0); const la = box(0.11, 0.3, 0.12, jacket, 0, -0.15, 0, el); const hand = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 0), skin); hand.position.y = -0.34; el.add(hand); return { sh, el, hand, ua, la }; };
  P.armL = arm(1); P.armR = arm(-1);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.1, 6), skin); neck.position.set(0, 1.6, 0); torso.add(neck);
  const head = piv(torso, 0, 1.7, 0); P.head = head;
  const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), skin); skull.scale.set(0.95, 1.1, 1.0); head.add(skull);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.168, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.5), hair); cap.scale.set(0.97, 1.12, 1.03); cap.position.set(0, 0.015, -0.01); cap.rotation.x = -0.22; head.add(cap);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.06, 4), skin); nose.rotation.x = Math.PI / 2; nose.position.set(0, -0.015, 0.17); head.add(nose);
  const ew = mk(0xf4f4ee, 0.4), ep = mk(0x0a0a0a, 0.3); P.eyes = [];
  [-1, 1].forEach((s) => { const e = piv(head, s * 0.062, 0.03, 0.14); e.add(new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 9), ew)); const p = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 9), ep); p.position.z = 0.019; e.add(p); box(0.07, 0.014, 0.02, hair, 0, 0.045, 0.01, e); P.eyes.push(e); });
  box(0.06, 0.012, 0.02, mk(0x6a3030), 0, -0.07, 0.15, head);
  if (o.stubble) box(0.2, 0.09, 0.02, mk(0x2a211c), 0, -0.07, 0.13, head);
  [-1, 1].forEach((s) => { const ear = new THREE.Mesh(new THREE.IcosahedronGeometry(0.03, 0), skin); ear.position.set(s * 0.15, 0, 0); head.add(ear); });
  scene.add(g); return P;
}
function applyFigure(P, s, t) {
  P.g.position.set(s.x, s.y || 0, s.z); P.g.rotation.set(s.rx || 0, s.ry || 0, 0);
  const w = Math.sin(s.walk || 0), a = s.walk ? (s.stride ?? 0.5) : 0;
  P.legL.hip.rotation.x = s.sit ? -1.5 : w * a; P.legR.hip.rotation.x = s.sit ? -1.5 : -w * a;
  P.legL.knee.rotation.x = s.sit ? 1.4 : Math.max(0, -w) * 0.6 * (s.walk ? 1 : 0); P.legR.knee.rotation.x = s.sit ? 1.4 : Math.max(0, w) * 0.6 * (s.walk ? 1 : 0);
  P.torso.position.y = Math.sin(t * 2.2) * 0.01 + (s.walk ? Math.abs(Math.cos(s.walk)) * 0.03 : 0); P.torso.rotation.x = s.lean || 0;
  P.armL.sh.rotation.set((s.walk && !s.noSwing ? -w * 0.5 : 0) + (s.armL || 0), 0, s.armLz || 0);
  P.armR.sh.rotation.set((s.walk && !s.noSwing ? w * 0.5 : 0) + (s.armR || 0), 0, s.armRz || 0);
  P.armL.el.rotation.x = s.elL || 0; P.armR.el.rotation.x = s.elR || 0;
  P.head.rotation.set(s.pitch || 0, s.yaw || 0, s.roll || 0);
  const e = s.eyes ?? 1; P.eyes.forEach((m) => m.scale.set(1, e, 1));
}
const hero = makeFigure({ skin: 0xd2a285, jacket: 0x3d4a3c, pants: 0x23262e, hair: 0x2a2018 });
const byA = makeFigure({ skin: 0xc9a080, jacket: 0x2a2f3a, pants: 0x1e1e22, hair: 0x15110e });
const byB = makeFigure({ skin: 0xb98f70, jacket: 0x6a3a3a, pants: 0x23262e, hair: 0x3a2a1a });
const byC = makeFigure({ skin: 0xd8b090, jacket: 0x4a4a5a, pants: 0x1e222a, hair: 0x6a5a3a });
const bottle = box(0.07, 0.2, 0.07, cm(0x6cc0ff, { transparent: true, opacity: 0.75 }), 0, -0.4, 0, hero.armR.el); bottle.visible = false;

// extra stopped cars with bystanders
function stoppedCar(x, z, ry, color) { const g = new THREE.Group(); box(1.8, 0.6, 4.3, cm(color, { roughness: 0.5, metalness: 0.3 }), 0, 0.6, 0, g); box(1.6, 0.5, 2.1, cm(color, { roughness: 0.5, metalness: 0.3 }), 0, 1.1, 0.3, g); [[-0.8, -1.4], [0.8, -1.4], [-0.8, 1.4], [0.8, 1.4]].forEach(([a, b]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.24, 12), cm(0x111111)); w.rotation.z = Math.PI / 2; w.position.set(a * 1.15, 0.33, b); g.add(w); }); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); return g; }
const carB = stoppedCar(-2.6, -338, 0.04, 0x2a3a5a), carC = stoppedCar(3.0, -352, -0.06, 0x8a8a7a);

/* =================== MISSILE + CONTRAIL ================================== */
const MS = E.mStart, MF = E.flash;
const mA = new THREE.Vector3(-3200, 5200, -3200), mB = new THREE.Vector3(120, 400, -6950), mC = new THREE.Vector3(-1400, 6200, -4600);
function mPos(u, out) { // quadratic bezier, u 0..1
  const a = 1 - u; return out.set(a * a * mA.x + 2 * a * u * mC.x + u * u * mB.x, a * a * mA.y + 2 * a * u * mC.y + u * u * mB.y, a * a * mA.z + 2 * a * u * mC.z + u * u * mB.z);
}
const MN = 90; const trailGeo = new THREE.BufferGeometry(); trailGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MN * 2 * 3), 3)); trailGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(MN * 2 * 3), 3));
{ const idx = []; for (let i = 0; i < MN - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } trailGeo.setIndex(idx); }
const trail = new THREE.Mesh(trailGeo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95, fog: false, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); trail.frustumCulled = false; scene.add(trail);
const mHeadGlow = new THREE.Mesh(new THREE.SphereGeometry(26, 10, 8), basic(0xffeccc, { fog: false })); scene.add(mHeadGlow);
const mHeadHalo = new THREE.Mesh(new THREE.SphereGeometry(90, 10, 8), basic(0xff8a3a, { fog: false, transparent: true, opacity: 0.35, depthWrite: false })); scene.add(mHeadHalo);
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _d = new THREE.Vector3();
function updateMissile(t) {
  const u = clamp((t - MS) / (MF - MS)), vis = t > MS && t < MF + 0.1;
  trail.visible = mHeadGlow.visible = mHeadHalo.visible = vis; if (!vis) return;
  const e = u; const head = mPos(e, _v); mHeadGlow.position.copy(head); mHeadHalo.position.copy(head);
  const pa = trailGeo.attributes.position.array, ca = trailGeo.attributes.color.array;
  const L = Math.min(0.55, e + 0.02);
  for (let i = 0; i < MN; i++) {
    const f = i / (MN - 1), ui = clamp(e - f * L, 0, 1); mPos(ui, _w); mPos(Math.min(1, ui + 0.002), _d); _d.sub(_w).normalize();
    const toCam = new THREE.Vector3().subVectors(cam.position, _w).normalize(); const side = new THREE.Vector3().crossVectors(_d, toCam).normalize();
    const wd = lerp(9, 90, Math.pow(f, 0.8)) * (0.6 + 0.4 * Math.min(1, e * 3)); const wob = Math.sin(t * 2 + i * 0.7) * 6 * f;
    pa.set([_w.x + side.x * wd + wob, _w.y + side.y * wd, _w.z + side.z * wd, _w.x - side.x * wd + wob, _w.y - side.y * wd, _w.z - side.z * wd], i * 6);
    const k = Math.pow(1 - f, 1.6); const r = 1.0 * k + 0.12, gc = 0.62 * k * (1 - f * 0.3) + 0.1, b = 0.3 * k + 0.12;
    ca.set([r, gc, b, r, gc, b], i * 6);
  }
  trailGeo.attributes.position.needsUpdate = true; trailGeo.attributes.color.needsUpdate = true;
}

/* ====================== THE BLAST =========================================== */
const blast = new THREE.Group(); blast.position.set(0, 0, -7000); scene.add(blast);
const FB = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), basic(0xfff4cc, { fog: false })); blast.add(FB);
const cloud = new THREE.Group(); blast.add(cloud);
function cloudMat(c) { return new THREE.MeshBasicMaterial({ color: c, fog: false }); }
const stemM = cloudMat(0xb5651e), capM = cloudMat(0xc9722a), skirtM = cloudMat(0x6a4a3a), baseM = cloudMat(0x8a5a30);
const stem = new THREE.Mesh(new THREE.CylinderGeometry(260, 520, 1, 14, 1, true), stemM); cloud.add(stem);
const capBits = []; { const r = rng(4); for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), capM.clone()); const a = r() * 6.28, rr = Math.sqrt(r()); m.userData = { a, rr, h: r(), s: 0.55 + r() * 0.5 }; cloud.add(m); capBits.push(m); } }
const skirt = new THREE.Mesh(new THREE.TorusGeometry(1, 0.22, 8, 22), skirtM); skirt.rotation.x = Math.PI / 2; cloud.add(skirt);
const baseBits = []; { const r = rng(5); for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), baseM.clone()); m.userData = { a: r() * 6.28, rr: 0.4 + r() * 0.6, s: 0.5 + r() * 0.5 }; cloud.add(m); baseBits.push(m); } }
cloud.visible = FB.visible = false;
const blastLight = new THREE.DirectionalLight(0xff8a3a, 0); blastLight.position.set(0, 400, -7000); scene.add(blastLight);
const shock = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 72, 1, true), new THREE.MeshBasicMaterial({ map: dustTex, transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: false, opacity: 0.9 }));
shock.position.set(0, 0, -7000); scene.add(shock); shock.visible = false;
const SHOCK_SPEED = 340;
const dustBox = new THREE.Group(); scene.add(dustBox);
{ const r = rng(88); for (let i = 0; i < 60; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.1 + r() * 0.5, 0.08 + r() * 0.3, 0.1 + r() * 0.5), cm(0x4a3a2a)); m.userData = { x: (r() - 0.5) * 30, y: r() * 6, z: (r() - 0.5) * 30, s: 40 + r() * 70, p: r() * 6 }; dustBox.add(m); } dustBox.visible = false; }

/* ============================== BUNKER ==================================== */
const bunker = new THREE.Group(); bunker.position.set(400, 0, 0); scene.add(bunker);
{
  const bw = new THREE.MeshStandardMaterial({ map: concreteTex, roughness: 1, side: THREE.DoubleSide });
  box(4.4, 0.1, 4.4, cm(0x2a2b2b), 0, 0, 0, bunker); box(4.4, 0.1, 4.4, bw, 0, 2.6, 0, bunker);
  [[0, 1.3, -2.2, 4.4, 2.6, 0.12], [0, 1.3, 2.2, 4.4, 2.6, 0.12], [-2.2, 1.3, 0, 0.12, 2.6, 4.4], [2.2, 1.3, 0, 0.12, 2.6, 4.4]].forEach(([x, y, z, w, h, d]) => box(w, h, d, bw, x, y, z, bunker));
  box(0.5, 0.9, 3.2, cm(0x4a4540), -1.9, 0.45, 0, bunker); box(0.1, 1.9, 0.5, cm(0x3a3a3a), -1.9, 1.0, -1.7, bunker);
  [0, 1, 2].forEach((i) => box(0.35, 0.25, 0.35, cm(0x7a8a3a), -1.9, 1.05 + 0.26 * i, -0.4 + i * 0.3, bunker));
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.9, 12), cm(0x2a5a8a, { metalness: 0.3 })); barrel.position.set(1.6, 0.5, -1.4); bunker.add(barrel);
  box(1.4, 0.45, 0.5, cm(0x5a4a3a), 0.2, 0.25, 1.8, bunker);
  const shelfBox = box(0.9, 0.06, 0.4, cm(0x4a3f35), 1.7, 1.2, 1.0, bunker);
  box(0.9, 0.1, 0.5, cm(0x1d1f22), 0, 1.05, -2.1, bunker); // lower shelf
  const lamp = box(0.5, 0.08, 0.14, basic(0xff3a1a), 0, 2.52, 0, bunker);
  const steel = cm(0x4b5a52, { metalness: 0.5, roughness: 0.5 }); box(1.2, 2.1, 0.08, steel, 1.5, 1.05, 2.12, bunker);
}
const radioG = new THREE.Group(); radioG.position.set(-1.75, 0.92, 0.4); bunker.add(radioG);
box(0.34, 0.2, 0.14, cm(0x1a1a1c), 0, 0.1, 0, radioG); box(0.02, 0.28, 0.02, cm(0xaaaaaa, { metalness: 0.8 }), 0.12, 0.3, 0, radioG);
const bRadioTex = ctex(128, 40, () => {}); let bRadioKey = "";
function drawBRadio(on) { const k = String(on); if (k === bRadioKey) return; bRadioKey = k; const g = bRadioTex.userData.g; g.fillStyle = on ? "#7affc4" : "#06120c"; g.fillRect(0, 0, 128, 40); if (on) { g.fillStyle = "#04140c"; g.font = "bold 24px monospace"; g.textAlign = "center"; g.fillText("101.7 FM", 64, 28); } bRadioTex.needsUpdate = true; }
const bRadioScr = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.06), new THREE.MeshBasicMaterial({ map: bRadioTex, toneMapped: false })); put(bRadioScr, -0.02, 0.12, 0.072, 0, 0, 0, radioG);
const bunkerRed = new THREE.PointLight(0xff4a22, 6, 10, 1.3); bunkerRed.position.set(0, 2.3, 0); bunker.add(bunkerRed);
const bunkerFill = new THREE.PointLight(0xc8d8e8, 3.0, 9, 1.2); bunkerFill.position.set(0, 1.5, -0.5); bunker.add(bunkerFill);

/* ============================== LIGHTS ==================================== */
const amb = new THREE.AmbientLight(0x3a4c80, 1.0); scene.add(amb);
const cabinFill = new THREE.PointLight(0xbcd4ff, 2.4, 6, 1.3); cabinFill.position.set(0.15, 1.5, 0.1); car.add(cabinFill);
const moonLight = new THREE.DirectionalLight(0x9ab0e8, 1.7); moonLight.position.set(-300, 500, 200); scene.add(moonLight);
const camFill = new THREE.PointLight(0xffc8a0, 0, 6, 1.6); cam.add(camFill);

/* ============================ STATE FUNCTIONS ============================== */
const V = 17; // m/s
function carZ(t) {
  const tb = E.brake, ts = E.stop; if (t < tb) return -V * t;
  const u = clamp((t - tb) / (ts - tb)); const d = V * (ts - tb) * 0.5; return -V * tb - d * (2 * u - u * u);
}
const carFlip = (t) => easeOut(win(t, E.shock, E.shock + 3.2));
function heroState(t) {
  const s = { x: 0, y: 0, z: 0, ry: Math.PI, rx: 0, walk: 0, sit: false, loc: "road", pitch: 0, lean: 0, armL: 0, armR: 0, elL: 0, elR: 0, eyes: 1, stride: 0.5, armLz: 0, armRz: 0 };
  const cz = carZ(t), stopZ = carZ(E.stop);
  if (t < E.exit) { s.loc = "car"; s.sit = true; s.x = -0.4; s.z = cz + 0.45; s.y = -0.22; s.ry = Math.PI; s.armL = -1.15; s.armR = -1.15; s.elL = -0.5; s.elR = -0.5; if (t > MS + 0.6) s.pitch = -0.3; if (t > E.brake) s.eyes = 1.2; return s; }
  const px = -3.3, pz = stopZ - 0.5;
  if (t < E.exit + 2.0) { const u = win(t, E.exit, E.exit + 2.0); s.x = lerp(-2.4, px, ease(u)); s.z = lerp(stopZ + 0.3, pz, ease(u)); s.ry = Math.PI; s.walk = u < 1 ? (t - E.exit) * 7 : 0; return s; }
  s.x = px; s.z = pz; s.ry = Math.PI;
  if (t < E.turn) { s.pitch = -0.42 - 0.05 * Math.sin(t * 0.7); s.eyes = 1.2; return s; }
  if (t < E.run) { const u = ease(win(t, E.turn, E.turn + 0.35)); s.ry = lerp(Math.PI, 0.0, u); s.pitch = lerp(-0.4, 0.5, u); s.armL = -2.3 * u; s.armR = -2.3 * u; s.elL = -2.0 * u; s.elR = -2.0 * u; s.armLz = -0.15 * u; s.armRz = 0.15 * u; return s; }
  const ox = 7.2, oz = OP_Z - 0.6 + 4.0;
  if (t < E.lie) { const u = clamp((t - E.run) / (E.lie - E.run - 0.6)); const e = u; s.x = lerp(px, ox, e); s.z = lerp(pz, oz, e); s.ry = Math.atan2(ox - px, oz - pz); s.walk = u < 1 ? (t - E.run) * 9 : 0; s.stride = 0.8; s.lean = 0.28; s.armL = -0.7; s.armR = -0.7; s.elL = -1.2; s.elR = -1.2; s.pitch = 0.1; return s; }
  s.x = ox; s.z = oz;
  if (t < E.get) { const u = ease(win(t, E.lie, E.lie + 0.9)); s.ry = 0; s.rx = u * Math.PI / 2; s.y = lerp(0, 0.2, u); s.armL = -2.6 * u; s.armR = -2.6 * u; s.elL = -1.4 * u; s.elR = -1.4 * u; s.pitch = 0.4 * u; if (u < 1) return s; return s; }
  if (t < E.door) { const u = ease(win(t, E.get, E.get + 1.4)); s.ry = lerp(0, -Math.PI / 2, u); s.rx = (1 - u) * Math.PI / 2; s.y = lerp(0.2, 0, u); const v = win(t, E.get + 1.4, E.door - 0.2); s.x = lerp(ox, 6.5, v); s.z = oz + (OP_Z + 2.0 - oz) * v; s.ry = lerp(s.ry, Math.PI, v * 0.7); s.walk = v > 0 && v < 1 ? (t - E.get) * 6 : 0; s.lean = 0.12; s.pitch = 0.2; return s; }
  // inside the bunker
  s.loc = "bunker"; s.x = 400 + 0.3; s.z = 0.2; s.ry = -Math.PI / 2 + 0.3; s.y = 0; s.pitch = 0.1;
  const dres = win(t, E.undress, E.undress + 1.6);
  if (t >= E.undress && t < E.radioOn) { s.armR = -1.2 - 0.6 * Math.sin(t * 3); s.elR = -1.6; s.pitch = 0.3 + 0.1 * Math.sin(t * 3); if (t > E.undress + 2.4) { s.armR = -1.9; s.elR = -1.1; s.pitch = -0.35; } }
  if (t >= E.radioOn) { s.armR = -1.0; s.elR = -0.8; s.pitch = 0.08; s.ry = -Math.PI / 2; }
  return s;
}
function bystander(t, which) {
  const base = [{ x: carB.position.x - 1.3, z: carB.position.z + 0.5 }, { x: carC.position.x + 1.3, z: carC.position.z - 0.5 }, { x: 0.0, z: carZ(E.stop) - 7 }][which];
  const s = { x: base.x, y: 0, z: base.z, ry: Math.PI, walk: 0, pitch: -0.4, armL: 0, armR: 0, eyes: 1.15 };
  if (t > E.turn) { const u = win(t, E.turn, E.turn + 0.4); s.ry = lerp(Math.PI, 0, u); s.armL = -2.2 * u; s.armR = -2.2 * u; s.elL = -2 * u; s.elR = -2 * u; s.pitch = 0.4 * u; }
  if (t > E.turn + 1.2) { const v = t - (E.turn + 1.2); s.x = base.x + (which === 0 ? -1 : which === 1 ? 1 : -0.3) * v * 1.2; s.z = base.z + v * 6.4; s.walk = v * 10; s.stride = 0.8; s.ry = Math.atan2(which === 0 ? -1 : which === 1 ? 1 : -0.3, 5.3); s.lean = 0.25; s.armL = -0.7; s.armR = -0.7; s.elL = -1.2; s.elR = -1.2; if (v > 12) { s.visible = false; } }
  return s;
}

/* ---------------------------------------------------------------- shots */
const SHOTS = [];
const _mm = new THREE.Vector3();
function lookMissile(p, t, maxEl = 24) { const u = clamp((t - MS) / (MF - MS)); const m = mPos(u, _mm); const dx = m.x - p[0], dz = m.z - p[2], hd = Math.hypot(dx, dz) || 1; const el = Math.min(Math.atan2(m.y - p[1], hd), maxEl * Math.PI / 180); return [p[0] + dx / hd * 100 * Math.cos(el), p[1] + Math.sin(el) * 100, p[2] + dz / hd * 100 * Math.cos(el)]; }
const C = (x, y, z, t) => [x, y, carZ(t) + z]; // car-local offset in world
function def(a, f, shake, fn) { SHOTS.push({ a, f, shake, c: fn }); }
const t = E;
// ---- act 1: the drive (car local: driver eye x=-0.4,y=1.25,z=+0.35; forward is -z)
def(0, 52, 0.02, (u, S) => { const z = carZ(S.t); return [[-4.8 + u * 1.2, 0.95, z - 7.5 + u * 2.0], [0, 0.8, z - 0.5]]; });
def(t.s2, 34, 0.01, (u, S) => { const z = carZ(S.t); return [[0.65 - 0.05 * u, 1.5, z + 0.45], [-0.4, 1.48, z + 0.4]]; });
def(t.s3, 40, 0.008, (u, S) => { const z = carZ(S.t); return [[0.15, 1.05, z - 0.0], [0.0, 0.9, z - 0.5]]; });
def(t.radioStart, 36, 0.008, (u, S) => { const z = carZ(S.t); return [lerp3([-0.05, 1.44, z - 0.5], [-0.12, 1.46, z - 0.42], u), [-0.4, 1.5, z + 0.45]]; });
def(t.s5, 50, 0.01, (u, S) => { const z = carZ(S.t); return [[0.2, 1.62, z + 1.3], [-0.3, 1.45, z - 1.0]]; });
def(t.s6, 56, 0.012, (u, S) => { const z = carZ(S.t); const p = [-0.4, 1.52, z + 0.22]; return [p, lookMissile(p, S.t, 38)]; });
def(t.s7, 56, 0.02, (u, S) => { const z = carZ(S.t); const p = [-15, 1.5, z - 30 + u * 8]; return [p, lookMissile(p, S.t, 20)]; });
def(t.brake, 50, 0.025, (u, S) => { const z = carZ(S.t); return [lerp3([5.8, 0.9, z - 6.5], [5.0, 0.9, z - 5.0], u), [0, 0.7, z]]; });
def(t.stop - 1.0, 50, 0.02, (u, S) => { const z = carZ(S.t); return [lerp3([-6, 1.2, z - 8], [-5, 1.1, z - 6], u), [0, 0.8, z]]; });
def(t.exit, 56, 0.015, (u, S) => { const z = carZ(S.t); return [lerp3([-1.8, 0.55, z + 1.5], [-2.0, 0.6, z - 0.4], u), [-2.9, 0.3, z - 0.9]]; });
def(t.exit + 2.0, 55, 0.02, (u, S) => { const h = S.h; const p = [h.x + 4.2, 1.5, h.z + 8.5]; return [p, lookMissile(p, S.t, 20)]; });
// ---- the pause: slow push to his face, light of the missile on his skin
def(t.pause, 38, 0.006, (u, S) => { const h = S.h; return [lerp3([h.x - 0.2, 1.9, h.z - 3.2], [h.x - 0.1, 1.84, h.z - 1.5], ease(u)), [h.x, 1.72, h.z]]; });
// ---- the narrator: five rules
def(t.ns, 55, 0.01, (u, S) => { const h = S.h; const p = lerp3([h.x + 6, 1.6, h.z - 5.5], [h.x + 5, 1.7, h.z - 3.5], u); return [p, lookMissile(p, S.t, 22)]; });
def(t.rule1, 46, 0.012, (u, S) => { const h = S.h; const p = lerp3([h.x + 2.2, 1.6, h.z + 3.5], [h.x + 2.0, 1.6, h.z + 2.8], u); return [p, lookMissile(p, S.t, 14)]; });
def(t.turn - 0.1, 36, 0.05, (u, S) => { const h = S.h; return [[h.x - 0.5, 1.72, h.z - 1.5], [h.x, 1.72, h.z]]; });
def(t.turn + 2.2, 56, 0.035, (u, S) => { const h = S.h; return [lerp3([h.x + 4, 2.0, h.z + 5], [h.x + 3, 2.4, h.z + 8], u), [h.x - 20, 160 + u * 160, h.z - 700]]; });
def(t.rule2, 54, 0.03, (u, S) => { const h = S.h; return [[h.x - 0.8 + Math.sin(S.t) * 0.2, 1.6, h.z - 6.5], [h.x, 1.4, h.z]]; });
def(t.run, 60, 0.05, (u, S) => { const h = S.h; return [[h.x + 7, 1.2, h.z - 3], [h.x, 1.4, h.z + 4]]; });
def(t.run + 4.5, 52, 0.04, (u, S) => { const h = S.h; return [[h.x - 6, 1.7, h.z + 14], [h.x, 3.0, h.z - 9]]; });
def(t.rule3, 52, 0.012, (u, S) => [lerp3([4.8, 0.5, OP_Z + 16], [4.6, 0.5, OP_Z + 14], u), [8, 1.2, OP_Z + 3.5]]);
def(t.lie, 54, 0.02, (u, S) => { const h = S.h; return [lerp3([h.x - 1.6, 0.35, h.z - 3.8], [h.x - 1.2, 0.3, h.z - 2.8], u), [h.x, 0.25, h.z]]; });
def(t.shock - 4.0, 58, 0.02, (u, S) => [[0.5, 1.8, OP_Z + 4], [0, 14, -900]]);
def(t.shock - 0.6, 46, 0.2, (u, S) => { const h = S.h; return [[h.x - 1.2, 0.4, h.z - 2.2], [h.x, 0.25, h.z]]; });
def(t.get, 50, 0.03, (u, S) => { const h = S.h; return [[h.x - 3.5, 1.4, h.z - 4], [h.x - 1, 1.0, h.z]]; });
def(t.rule4, 48, 0.012, (u, S) => [lerp3([3.4, 1.4, OP_Z + 8], [4.3, 1.3, OP_Z + 6.5], u), [7.2, 1.2, OP_Z + 1.8]]);
def(t.door - 0.5, 50, 0.012, (u, S) => [lerp3([398.4, 1.55, -1.7], [398.8, 1.55, -1.5], u), [401.5, 1.2, 2.1]]);
def(t.rule5, 42, 0.01, (u, S) => [lerp3([398.3, 1.6, 1.8], [398.6, 1.55, 1.5], u), [400.3, 1.45, 0.2]]);
def(t.undress, 38, 0.01, (u, S) => [[398.5, 1.55, 1.7], [400.3, 1.45, 0.15]]);
def(t.undress + 1.9, 38, 0.01, (u, S) => [lerp3([398.2, 1.1, 0.9], [398.5, 1.1, 0.7], u), [398.6, 1.0, 0.4]]);
def(t.radioOn, 30, 0.008, (u, S) => [lerp3([398.6, 1.18, 1.2], [398.5, 1.12, 0.9], u), [398.25, 1.02, 0.4]]);
def(t.fin, 34, 0.006, (u, S) => [lerp3([398.9, 1.55, 0.7], [399.0, 1.55, 0.5], u), [400.3, 1.52, 0.2]]);

const SHAKES = [[E.flash, 0.1, 0.4], [E.shock, 0.5, 1.6], [E.stop, 0.03, 0.4], [E.shock + 1.5, 0.3, 1.0]];

/* ------------------------------------------------------------ overlays */
const el = (id) => document.getElementById(id);
const elFlash = el("flash"), elDip = el("dip"), elGrain = el("grain"), elDust = el("dustov"), elFlare = el("flare"), elHeat = el("heat");
const pulse = (t, c, w) => Math.max(0, 1 - Math.abs(t - c) / w);
function overlays(t) {
  const fl = clamp(win(t, E.flash - 0.02, E.flash + 0.06) * (1 - win(t, E.flash + 0.5, E.flash + 2.6)) * 1.0);
  elFlash.style.opacity = fl.toFixed(3);
  elFlare.style.opacity = clamp(fl * 1.2 + pulse(t, MS + 0.3, 0.5) * 0.15).toFixed(3);
  const dustPhase = win(t, E.shock - 0.4, E.shock + 0.7) * (1 - win(t, E.shock + 1.8, E.shock + 5.5));
  elDust.style.opacity = clamp(dustPhase * 0.95).toFixed(3);
  let d = clamp(1 - t / 1.2);
  [E.turn - 0.02].forEach((c) => d += 0.0 * pulse(t, c, 0.1));
  d += clamp((t - CUE.endBlack) / 0.4) + 0.9 * pulse(t, E.door + 0.5, 0.08) + 0.9 * pulse(t, E.lie + 0.2, 0.06) + 0.9 * pulse(t, E.get - 0.1, 0.12) + 0.9 * pulse(t, E.pause, 0.06);
  elDip.style.opacity = clamp(d).toFixed(3);
  elHeat.style.opacity = clamp(win(t, E.flash, E.flash + 1.5) * 0.25 * (1 - win(t, E.flash + 4, E.flash + 12))).toFixed(3);
  elGrain.style.backgroundPosition = `${Math.floor(hash(Math.floor(t * 24)) * 300)}px ${Math.floor(hash(Math.floor(t * 24) + 7) * 300)}px`;
}

/* ---------------------------------------------------------------- frame */
const _c = new THREE.Vector3();
function renderAt(tt) {
  const t = clamp(tt, 0, DUR);
  const fz = carZ(t);
  const inBunker = t >= E.door + 0.05;
  // car
  const cf = carFlip(t);
  car.position.set(0 + cf * 18, cf * 0.9, fz + cf * 34); car.rotation.set(0, cf * 2.2, cf * 2.6);
  const braking = t > E.brake && t < E.stop + 0.5;
  tl.forEach((m) => { m.material.color.setHex(braking ? 0xff1a0a : 0x9a1a0e); });
  headSpot.visible = t < E.shock + 0.2; hl.forEach((m) => (m.visible = t < E.shock + 0.2));
  // radio display
  const mode = t < E.radioStart - 0.5 ? "music" : t < E.radioStart ? "static" : t < E.radioEnd + 0.2 ? "alert" : "static";
  drawRadio(mode, t);
  dashLight.intensity = t < E.stop ? 0.9 : 0.5;
  glowLight.intensity = t > MS && t < E.stop ? 1.2 * win(t, MS, MS + 4) : 0;
  // world state: sky, fog, lights
  const sinceF = t - E.flash, fPhase = t >= E.flash;
  const heatDecay = fPhase ? Math.exp(-sinceF / 16) : 0;
  skyMat.uniforms.blast.value = fPhase ? 0.4 + 0.6 * heatDecay : 0;
  skyMat.uniforms.hor.value.setHex(0x5a3f3a).lerp(new THREE.Color(0xff7a2a), fPhase ? clamp(win(t, E.flash, E.flash + 3) * 0.9) : 0);
  skyMat.uniforms.mid.value.setHex(0x1b2548).lerp(new THREE.Color(0x5a2a22), fPhase ? win(t, E.flash, E.flash + 10) * 0.8 : 0);
  scene.fog.color.setHex(0x0b1226).lerp(new THREE.Color(0x4a2a1c), fPhase ? win(t, E.flash, E.flash + 8) : 0);
  scene.fog.density = 0.00028 + (fPhase ? 0.00018 * win(t, E.flash, E.flash + 20) : 0);
  amb.color.setHex(0x3a4c80).lerp(new THREE.Color(0x7a3a28), fPhase ? win(t, E.flash, E.flash + 4) : 0); amb.intensity = fPhase ? lerp(1.0, 0.7, win(t, E.flash, E.flash + 4)) : 1.0;
  moonLight.intensity = fPhase ? 0.5 : 1.7; cabinFill.intensity = t < E.exit ? 2.4 : 0;
  blastLight.intensity = fPhase ? (0.4 + 7 * Math.exp(-sinceF / 1.1) + 1.8 * heatDecay) : 0;
  const duskGlow = win(t, MS, E.flash);
  ovLight.intensity = 0;
  // blast objects
  FB.visible = fPhase && sinceF < 9; if (FB.visible) { const r = lerp(120, 1100, easeOut(win(t, E.flash, E.flash + 6))); FB.scale.setScalar(r); FB.position.set(0, r * 0.5, 0); FB.material.color.setHex(0xfff4cc).lerp(new THREE.Color(0xff6a1a), win(t, E.flash + 0.5, E.flash + 7)); }
  cloud.visible = fPhase;
  if (fPhase) {
    const g = easeOut(win(t, E.flash + 0.3, E.flash + 36)), hh = 6200 * g + 20, cr = lerp(300, 2300, g);
    const cool = win(t, E.flash + 2, E.flash + 40);
    stem.scale.set(1, hh, 1); stem.position.y = hh / 2; stem.scale.x = stem.scale.z = lerp(0.8, 1.4, g);
    stemM.color.setHex(0xe0782a).lerp(new THREE.Color(0x6a5a50), cool);
    capBits.forEach((m) => { const u = m.userData; const r = cr * (0.55 + 0.45 * u.rr); m.position.set(Math.cos(u.a) * r * 0.8, hh + (u.h - 0.4) * cr * 0.7, Math.sin(u.a) * r * 0.8); m.scale.setScalar(cr * 0.5 * u.s * (0.5 + 0.5 * g)); m.material.color.setHex(0xf09a3a).lerp(new THREE.Color(0x7a625a), cool * (0.5 + 0.5 * u.h)); });
    skirt.position.y = hh * 0.93; skirt.scale.setScalar(cr * 0.9); skirtM.color.setHex(0xb0582a).lerp(new THREE.Color(0x5a4a44), cool);
    baseBits.forEach((m) => { const u = m.userData; const r = lerp(400, 2200, g) * u.rr; m.position.set(Math.cos(u.a) * r, 180 * u.s, Math.sin(u.a) * r * 0.5); m.scale.setScalar(lerp(250, 900, g) * u.s); m.material.color.setHex(0xd88a40).lerp(new THREE.Color(0x4a3a30), cool * 0.9); });
  }
  city.visible = !(fPhase && sinceF > 0.1);
  cityGlow.material.opacity = fPhase ? 0.5 * heatDecay + 0.1 : 0.15 + 0.2 * duskGlow;
  // shockwave
  const r = SHOCK_SPEED * (t - E.flash); shock.visible = fPhase && r > 10 && r < 8600; if (shock.visible) { shock.scale.set(r, 260, r); shock.position.y = 130; }
  // poles + other objects get pushed once the front passes them
  poles.forEach((p, i) => { const dist = Math.abs(-7000 - p.z); const over = fPhase ? clamp((r - dist) / 18) : 0; p.g.rotation.x = over * 1.35; p.g.position.y = over * -0.4; p.g.visible = over < 0.99 || t < E.shock + 6; if (p.wires) p.wires.forEach((w) => (w.visible = over < 0.15)); });
  [carB, carC].forEach((cc, i) => { const dist = Math.abs(-7000 - cc.position.z); const over = fPhase ? easeOut(clamp((r - dist) / 60)) : 0; cc.position.z = (i ? -352 : -338) + over * 30; cc.rotation.y = (i ? -0.06 : 0.04) + over * 1.4 * (i ? -1 : 1); cc.rotation.z = over * 1.2 * (i ? -1 : 1); });
  // debris around the hero while the wave passes
  const dz = win(t, E.shock - 0.4, E.shock + 4.5); dustBox.visible = dz > 0 && dz < 1 && !inBunker;
  if (dustBox.visible) { const hz = OP_Z + 3.4; dustBox.children.forEach((m) => { const u = m.userData; m.position.set(7.2 + u.x * 0.6, 0.4 + u.y * (0.5 + 0.5 * Math.abs(Math.sin(t * 3 + u.p))), hz + u.z - (t - E.shock) * u.s * 0.25 + 8); m.rotation.set(t * 3 + u.p, t * 4, 0); }); }
  // water bottle in the bunker scene
  bottle.visible = t >= E.undress + 1.8 && t < E.radioOn;
  // the bunker door swings shut at the cue
  const doorU = win(t, E.door - 1.5, E.door - 0.3); bunkerDoorG.rotation.y = -1.6 * (1 - doorU) * (t > E.get ? 1 : 0);
  // figures
  const hs = heroState(t); const loc = hs.loc;
  const jk = win(t, E.undress + 0.3, E.undress + 1.8); hero.jacketMat.color.setHex(0x3d4a3c).lerp(new THREE.Color(0xcfd2d0), jk * (t >= E.undress ? 1 : 0));
  applyFigure(hero, hs, t);
  [byA, byB, byC].forEach((f, i) => { const s = bystander(t, i); applyFigure(f, s, t); f.g.visible = s.visible !== false && !inBunker; });
  hero.g.visible = true; hero.head.visible = !(t >= E.s6 && t < E.s7);
  // bunker radio
  drawBRadio(t >= E.radioOn); bunkerRed.intensity = 5.5 + 1.0 * Math.sin(t * 2);
  bunkerFill.intensity = t >= E.radioOn ? 2.2 : 3.0;
  // missile
  updateMissile(t);
  // camera
  let shot = SHOTS[SHOTS.length - 1], idx = SHOTS.length - 1;
  for (let i = 0; i < SHOTS.length; i++) if (t >= SHOTS[i].a && (i + 1 >= SHOTS.length || t < SHOTS[i + 1].a)) { shot = SHOTS[i]; idx = i; break; }
  const bEnd = idx + 1 < SHOTS.length ? SHOTS[idx + 1].a : DUR;
  const u = clamp((t - shot.a) / (bEnd - shot.a));
  const [p, l] = shot.c(u, { h: hs, t });
  const amp = shot.shake;
  let sx = (noise1(t * 5) - 0.5) * 2 * amp * 0.5, sy = (noise1(t * 5 + 40) - 0.5) * 2 * amp * 0.5, sz = (noise1(t * 5 + 80) - 0.5) * 2 * amp * 0.5, roll = (noise1(t * 3 + 120) - 0.5) * amp * 0.1;
  for (const [te, am, dc] of SHAKES) if (t >= te) { const k = am * Math.exp(-(t - te) / dc); sx += (noise1(t * 30) - 0.5) * k; sy += (noise1(t * 30 + 30) - 0.5) * k; roll += (noise1(t * 24 + 60) - 0.5) * k * 0.06; }
  cam.fov = shot.f; cam.updateProjectionMatrix();
  cam.position.set(p[0] + sx, p[1] + sy, p[2] + sz); cam.up.set(Math.sin(roll), Math.cos(roll), 0); cam.lookAt(l[0], l[1], l[2]);
  sky.position.copy(cam.position); moon.position.set(cam.position.x - 9000, 9000, cam.position.z + 6000);
  // camera fill light (cinematic key on faces)
  camFill.intensity = inBunker ? 0.0 : (t < E.exit ? 0.0 : 1.6); if (!inBunker && t < E.exit && !(t >= E.s2 && t < E.s7)) { camFill.intensity = 5; camFill.distance = 24; } else camFill.distance = 6; camFill.color.setHex(fPhase ? 0xffa06a : 0xb0c4ff);
  overlays(t); window.__ui && window.__ui(t);
  renderer.render(scene, cam);
}
const safeRender = (t) => { try { renderAt(t); } catch (e) { console.error("RENDERFAIL t=" + t + " " + e.stack); } };
window.addEventListener("hf-seek", (e) => safeRender(e.detail.time));
safeRender(window.__hfThreeTime || 0);
