import * as THREE from "three";
import { clamp, lerp, ease, win, hash, noise1, rng, ctex } from "./util.js";
import { buildTextures } from "./tex.js";
import { buildWorld } from "./world.js";
import { makeHuman } from "./human.js";
import { Fire, Smoke, Plume, smokeTex, flameTex, glowTex, sparkTex } from "./fx.js";
import { GLTFLoader } from "../assets/vendor/addons/loaders/GLTFLoader.js";
import { prepareModel, makeRetarget, restAttach } from "./retarget.js";
import { furnish } from "./props.js";

const params = new URLSearchParams(location.search);
const PW = +(params.get("w") || 1080), PH = Math.round(PW * 16 / 9);
const CUE = window.CUE, E = CUE.e, DUR = CUE.dur;

/* ---------- renderer / lights ---------- */
const canvas = document.getElementById("gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(PW, PH, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b0d12);
const cam = new THREE.PerspectiveCamera(55, PW / PH, 0.05, 600); scene.add(cam);
const hemi = new THREE.HemisphereLight(0xbcd2ff, 0x4a3a2a, 1.0); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffd9a8, 3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; scene.add(sun); scene.add(sun.target);
const camL = new THREE.PointLight(0xfff1dc, 0, 12, 1.6); cam.add(camL); camL.position.set(0.2, 0.3, 0);
const fillA = new THREE.PointLight(0xfff4e0, 0, 14, 1.5); scene.add(fillA);
const fillB = new THREE.PointLight(0xfff4e0, 0, 14, 1.5); scene.add(fillB);
const fireL = new THREE.PointLight(0xff7a2a, 0, 40, 1.6); scene.add(fireL);
const alarmL = new THREE.PointLight(0xff2a1a, 0, 9, 1.6); scene.add(alarmL);
const accL = new THREE.PointLight(0xffffff, 0, 14, 1.6); scene.add(accL);

const T = buildTextures(); const W = buildWorld(scene, T); await furnish(W); const H = makeHuman(T); scene.add(H.root);
H.root.traverse((o) => { if (o.isMesh) o.visible = false; }); // procedural rig only drives the skinned character
const gltf = await new GLTFLoader().loadAsync("assets/chars/Casual_Hoodie.glb");
const model = gltf.scene; prepareModel(model, { Cube008_1: 0x2b4ea8, Cube000: 0x23252b, Cube000_1: 0xe8e8e8, Cube005_1: 0x3b4458 }); H.root.add(model);
const RT = makeRetarget(H, model);
const sTex = smokeTex(), fTex = flameTex(), gTex = glowTex(), spTex = sparkTex();

/* ---------- fx ---------- */
const fireEnd = [new Fire(scene, fTex, gTex, spTex, { pos: [12.4, 0, 5.2], width: 1.5, height: 2.6, n: 40, seed: 3 }), new Fire(scene, fTex, gTex, spTex, { pos: [12.6, 0, 6.6], width: 1.4, height: 2.3, n: 36, seed: 9 }), new Fire(scene, fTex, gTex, spTex, { pos: [13.3, 0, 5.9], width: 1.2, height: 3.0, n: 30, seed: 5 })];
const extFires = [-8, -4].map((x, i) => new Fire(scene, fTex, gTex, spTex, { pos: [x, 4.9, -119.3], width: 1.5, height: 2.4, n: 30, seed: 20 + i }));
const stairGlowFire = new Fire(scene, fTex, gTex, spTex, { pos: [0.3, 0, 63.6], width: 1.8, height: 2.4, n: 26, seed: 33 }); // seen through door glass
const smokeCorr = new Smoke(scene, sTex, { box: [-13, 13.5, 0.3, 3.1, 4.8, 7.4], n: 190, seed: 1, size: [2.0, 4.2], src: 13 });
const smokeDoor = new Smoke(scene, sTex, { box: [1.4, 2.8, 0.05, 0.9, 3.4, 4.4], n: 26, seed: 4, size: [0.7, 1.4], src: 2.1 });
const smokeStair = new Smoke(scene, sTex, { box: [-0.9, 1.9, 0.5, 3.0, 61.0, 64.8], n: 40, seed: 6, size: [1.2, 2.4], src: 0.5 });
const plume = [0, 1].map((i) => new Plume(scene, sTex, { pos: [-8 + i * 4, 6.2, -119], n: 55, seed: 50 + i * 7, height: 38, drift: 18 }));
const smokeExtWin = new Plume(scene, sTex, { pos: [-6, 5.8, -118.7], n: 36, seed: 71, height: 14, drift: 4 });

/* ---------- props ---------- */
const packTex = ctex(128, 128, (g, w, h) => { g.fillStyle = "#c2381f"; g.fillRect(0, 0, w, h); const r = rng(3); for (let i = 0; i < 400; i++) { g.fillStyle = "rgba(0,0,0," + r() * 0.12 + ")"; g.fillRect(r() * w, r() * h, 2, 2 + r() * 8); } g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(0, 70, w, 4); }, { rep: false });
const packM = new THREE.MeshStandardMaterial({ map: packTex, roughness: 0.8 }), strapM = new THREE.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.9 });
const pack = new THREE.Group(); scene.add(pack);
{ const body = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.44, 0.17), packM); body.castShadow = true; pack.add(body); const pk = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.06), packM); pk.position.set(0, -0.08, 0.1); pack.add(pk);
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.02), strapM); top.position.set(0, 0.23, 0); pack.add(top); const s1 = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 6, 16, Math.PI), strapM); s1.position.set(0, 0.22, 0); pack.add(s1); }
const clothM = new THREE.MeshStandardMaterial({ color: 0x5f84a0, roughness: 1, side: THREE.DoubleSide });
const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.12, 4, 3), clothM); scene.add(cloth); cloth.visible = false; const glueCloth = restAttach(RT, cloth, "Head", [0, 0.07, 0.13]);
const drops = []; for (let i = 0; i < 5; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6), new THREE.MeshStandardMaterial({ color: 0x9fd0ff, roughness: 0.1, metalness: 0.2 })); scene.add(d); drops.push(d); }
const phoneTex = ctex(128, 256, () => {}, { rep: false });
const phone = new THREE.Group(); { const body = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.15, 0.009), new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.3 })); phone.add(body); const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.062, 0.138), new THREE.MeshBasicMaterial({ map: phoneTex, toneMapped: false })); scr.position.z = 0.0051; phone.add(scr); }
scene.add(phone); phone.visible = false; const gluePhone = restAttach(RT, phone, "WristR", [-0.02, -0.08, 0.03], new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)));
const gluePack = restAttach(RT, pack, "WristR", [0, -0.3, 0.0], new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)));
function drawPhone(t) { const { g, w, h } = phoneTex.userData; g.fillStyle = "#07120b"; g.fillRect(0, 0, w, h); g.fillStyle = "#4dff88"; g.textAlign = "center"; g.font = "900 54px Mont, sans-serif"; g.fillText("112", w / 2, 108); g.font = "800 22px Mont, sans-serif"; g.fillStyle = "#fff"; g.fillText("ВЫЗОВ…", w / 2, 150); g.fillStyle = "#c2201b"; g.beginPath(); g.arc(w / 2, 214, 20, 0, 7); g.fill(); phoneTex.needsUpdate = true; }
drawPhone(0);

/* ---------- character animation ---------- */
const Z = [0, 0, 0];
const mir = (p) => { const o = {}; const sw = { L: "R", R: "L" }; for (const k in p) { const m = k.match(/^([sehkwa])([LR])$/); if (m) { const v = p[k]; o[m[1] + sw[m[2]]] = [v[0], -v[1], -v[2]]; } else if (Array.isArray(p[k])) o[k] = [p[k][0], -p[k][1], -p[k][2]]; else o[k] = p[k]; } return o; };
const sym = (p) => ({ ...p, ...mir(p) });
const PS = {
  stand: { sL: [0.04, 0, 0.1], eL: [-0.2, 0, 0], sR: [0.04, 0, -0.1], eR: [-0.2, 0, 0], hL: [0, 0, 0.025], hR: [0, 0, -0.025], spine: [0.02, 0, 0] },
  sitWrite: { hipY: -0.455, hipZ: -0.02, hL: [-1.5, 0, 0.03], kL: [1.5, 0, 0], hR: [-1.5, 0, -0.03], kR: [1.5, 0, 0], spine: [0.16, 0, 0], chest: [0.1, 0, 0], neck: [0.2, 0, 0], head: [0.25, 0, 0], sR: [-0.95, 0, -0.12], eR: [-1.3, 0, 0], sL: [-0.8, 0, 0.18], eL: [-1.15, 0, 0] },
  sitAlert: { hipY: -0.455, hipZ: -0.02, hL: [-1.5, 0, 0.03], kL: [1.5, 0, 0], hR: [-1.5, 0, -0.03], kR: [1.5, 0, 0], spine: [-0.02, 0, 0], chest: [-0.05, 0, 0], neck: [-0.1, 0, 0], head: [-0.12, 0.35, 0], sR: [-0.5, 0, -0.25], eR: [-0.9, 0, 0], sL: [-0.45, 0, 0.25], eL: [-0.9, 0, 0] },
  sitRise: { hipY: -0.3, hipZ: 0.1, hL: [-1.2, 0, 0.03], kL: [1.3, 0, 0], hR: [-1.2, 0, -0.03], kR: [1.3, 0, 0], spine: [0.5, 0, 0], chest: [0.2, 0, 0], neck: [-0.2, 0, 0], head: [-0.2, 0, 0], sR: [-0.6, 0, -0.25], eR: [-0.3, 0, 0], sL: [-0.6, 0, 0.25], eL: [-0.3, 0, 0] },
  calm: { sL: [-0.85, 0, 0.3], eL: [-0.85, 0, 0], wL: [0, 0, 0], sR: [-0.85, 0, -0.3], eR: [-0.85, 0, 0], wR: [0, 0, 0], spine: [-0.03, 0, 0], head: [-0.05, 0, 0] },
  bend: { hipY: -0.28, hipZ: -0.1, hL: [-0.95, 0, 0.05], kL: [1.0, 0, 0], hR: [-0.95, 0, -0.05], kR: [1.0, 0, 0], spine: [0.65, 0, 0], chest: [0.35, 0, 0], neck: [-0.4, 0, 0], head: [-0.25, 0, 0], sR: [0.35, 0, -0.1], eR: [-0.2, 0, 0], sL: [0.05, 0, 0.2], eL: [-0.3, 0, 0] },
  carry: { sR: [0.05, 0, -0.1], eR: [-0.25, 0, 0], sL: [0.05, 0, 0.1], eL: [-0.2, 0, 0], hL: [0, 0, 0.025], hR: [0, 0, -0.025], spine: [0.02, 0, 0.04] },
  alarmed: { sL: [-0.4, 0, 0.35], eL: [-0.9, 0, 0], sR: [-0.4, 0, -0.35], eR: [-0.9, 0, 0], spine: [-0.04, 0, 0], head: [-0.08, 0.3, 0], hL: [0, 0, 0.04], hR: [0, 0, -0.04] },
  reach: { sR: [-1.52, 0, -0.1], eR: [-0.12, 0, 0], wR: [0, 0, 0], sL: [0.1, 0, 0.18], eL: [-0.5, 0, 0], spine: [0.1, 0, 0], head: [0.05, 0, 0] },
  recoil: { sR: [-0.5, 0, -0.45], eR: [-1.7, 0, 0], sL: [0.2, 0, 0.3], eL: [-0.6, 0, 0], spine: [-0.12, 0, 0], chest: [-0.1, 0, 0], head: [-0.18, 0, 0], hL: [0.15, 0, 0.05], hR: [-0.35, 0, -0.1], kL: [0.2, 0, 0], kR: [0.35, 0, 0], hipZ: -0.08 },
  crouch: { hipY: -0.32, hipZ: -0.12, hL: [-0.85, 0, 0.05], kL: [1.05, 0, 0], hR: [-0.85, 0, -0.05], kR: [1.05, 0, 0], spine: [0.7, 0, 0], chest: [0.35, 0, 0], neck: [-0.55, 0, 0], head: [-0.3, 0, 0], sL: [-0.1, 0, 0.15], eL: [-0.5, 0, 0], sR: [-1.35, 0, -0.35], eR: [-1.9, 0, 0] },
  lookUp: { sL: [0.04, 0, 0.1], eL: [-0.2, 0, 0], sR: [0.04, 0, -0.1], eR: [-0.2, 0, 0], spine: [-0.05, 0, 0], neck: [-0.25, 0, 0], head: [-0.4, 0, 0] },
  point: { sR: [-1.3, 0, -0.2], eR: [-0.3, 0, 0], sL: [0.08, 0, 0.12], eL: [-0.25, 0, 0], spine: [0.04, 0.2, 0], head: [0, -0.25, 0] },
  pullDoor: { sR: [-1.0, 0, -0.55], eR: [-0.55, 0, 0], sL: [0.3, 0, 0.3], eL: [-0.6, 0, 0], spine: [0.12, -0.3, 0], head: [0.05, -0.3, 0], hL: [-0.1, 0, 0.05], kR: [0.3, 0, 0], hR: [0.15, 0, 0] },
  phone: { sR: [-0.9, 0, -0.55], eR: [-2.15, 0, 0], wR: [0, 0, 0], sL: [0.05, 0, 0.12], eL: [-0.35, 0, 0], head: [0.02, 0.15, 0.12], neck: [0, 0.05, 0.08] },
  stopHand: { sR: [-1.45, 0, -0.15], eR: [-0.5, 0, 0], sL: [0.05, 0, 0.12], eL: [-0.3, 0, 0], spine: [-0.05, 0, 0], head: [-0.05, 0.0, 0] },
  shrug: { sL: [-0.5, 0, 0.55], eL: [-1.1, 0, 0], sR: [-0.5, 0, -0.55], eR: [-1.1, 0, 0], neck: [0, 0, 0.1], head: [-0.05, 0, 0.18], spine: [-0.03, 0, 0] },
  run: { sL: [0, 0, 0.1], eL: [-1.1, 0, 0], sR: [0, 0, -0.1], eR: [-1.1, 0, 0], spine: [0.22, 0, 0] },
};
const FIN = {
  relax: { all: 0.25 }, fist: { all: 0.95, t: 0.8 }, flat: { all: 0.0, t: 0.1 }, point: { i: 0, m: 0.95, r: 0.95, p: 0.95, t: 0.7 }, grip: { all: 0.8, t: 0.7 }, open: { all: 0.1, t: 0.1, spread: 1 }, phone: { all: 0.65, t: 0.4 }, claw: { all: 0.5, t: 0.3, spread: 1 },
};
const FACE = { calm: {}, scared: { mouth: 0.35, brow: 1, eyes: 1, furrow: -0.3 }, hurt: { mouth: 0.45, brow: 0.6, furrow: 1, eyes: 0.4 }, focus: { brow: -0.4, furrow: 0.6, eyes: 0.8 }, talk: { mouth: 0.3, brow: 0.2 }, cough: { mouth: 0.6, eyes: 0.2, furrow: 0.8 } };

// keyframes: t, p:[x,z], y (extra world y), yaw, pose, lin (walk interpolation), wa (walk amplitude scale), fl/fr finger presets, face
const A = E.alarm, R1 = E.r1, D = E.drop, R2 = E.r2, TC = E.touch, HOT = E.hot, R3 = E.r3, UP = E.up, CR = E.crouch, R4 = E.r4, NL = E.nolift, ST = E.stairs, R5 = E.r5, CL = E.close, AIR = E.air, R6 = E.r6, CALL = E.call, NR = E.noret, CHK = E.chk, WH = E.where, SV = E.save;
const PI = Math.PI;
const SEAT = [0.42, 0.8];
const KF = [
  { t: -1, p: SEAT, yaw: PI, pose: "sitWrite", fl: "relax", fr: "grip", face: "calm" },
  { t: A + 0.7, p: SEAT, yaw: PI, pose: "sitWrite", fl: "relax", fr: "grip", face: "calm" },
  { t: A + 1.2, p: SEAT, yaw: PI - 0.2, pose: "sitAlert", fl: "open", fr: "open", face: "scared" },
  { t: A + 1.9, p: [SEAT[0], SEAT[1] + 0.12], yaw: PI - 0.5, pose: "sitRise", fl: "fist", fr: "fist", face: "scared" },
  { t: A + 2.5, p: [0.55, 1.15], yaw: PI - 0.9, pose: "alarmed", fl: "open", fr: "open", face: "scared" },
  { t: R1 + 0.35, p: [0.55, 1.15], yaw: PI - 0.2, pose: "calm", fl: "flat", fr: "flat", face: "focus" },
  { t: R1 + 1.15, p: [0.5, 1.2], yaw: PI - 0.3, pose: "bend", fl: "relax", fr: "grip", face: "focus" },
  { t: R1 + 1.9, p: [0.5, 1.2], yaw: PI - 0.2, pose: "carry", fl: "relax", fr: "grip", face: "scared" },
  { t: D + 0.1, p: [0.5, 1.2], yaw: PI - 0.2, pose: "carry", fl: "relax", fr: "grip", face: "focus" },
  { t: D + 0.35, p: [0.5, 1.2], yaw: PI - 0.2, pose: "carry", fl: "relax", fr: "open", face: "focus" },
  { t: D + 0.9, p: [0.9, 1.5], yaw: 0.9, pose: "stand", fl: "relax", fr: "open", face: "focus", wa: 0.8 },
  { t: R2 + 0.8, p: [2.0, 2.5], yaw: 0.2, pose: "stand", lin: true, fl: "relax", fr: "relax", face: "focus" },
  { t: TC - 0.2, p: [2.15, 3.85], yaw: 0, pose: "stand", lin: true, fl: "relax", fr: "relax", face: "focus" },
  { t: TC + 0.55, p: [2.15, 3.9], yaw: 0, pose: "reach", fl: "relax", fr: "flat", face: "focus" },
  { t: HOT - 0.15, p: [2.15, 3.9], yaw: 0, pose: "reach", fl: "relax", fr: "flat", face: "focus" },
  { t: HOT + 0.12, p: [2.15, 3.55], yaw: 0.2, pose: "recoil", fl: "fist", fr: "claw", face: "hurt" },
  { t: R3 - 0.2, p: [2.1, 3.4], yaw: 0.3, pose: "recoil", fl: "fist", fr: "claw", face: "hurt" },
  // corridor (door now open)
  { t: R3 + 0.01, p: [2.2, 5.3], yaw: -0.6, pose: "lookUp", fl: "relax", fr: "relax", face: "scared" },
  { t: UP + 1.0, p: [2.0, 5.6], yaw: -1.4, pose: "lookUp", fl: "relax", fr: "relax", face: "scared" },
  { t: CR - 0.1, p: [1.8, 5.7], yaw: -1.5, pose: "stand", fl: "relax", fr: "relax", face: "cough" },
  { t: CR + 0.5, p: [1.6, 5.8], yaw: -1.55, pose: "crouch", fl: "relax", fr: "flat", face: "cough", wa: 0.5 },
  { t: NL, p: [-3.2, 6.1], yaw: -1.55, pose: "crouch", lin: true, fl: "relax", fr: "flat", face: "cough", wa: 0.55 },
  { t: NL + 0.35, p: [-3.4, 6.2], yaw: 0, pose: "point", fl: "relax", fr: "point", face: "scared" },
  { t: ST - 0.2, p: [-3.4, 6.2], yaw: 0, pose: "point", fl: "relax", fr: "point", face: "focus" },
  { t: R5 - 0.15, p: [-6.4, 6.9], yaw: 0.0, pose: "run", lin: true, fl: "fist", fr: "fist", face: "focus", wa: 1.0 },
  // stairwell
  { t: R5 - 0.1, p: [0.0, 63.6], yaw: PI, pose: "run", fl: "fist", fr: "fist", face: "focus" },
  { t: R5 + 0.7, p: [0.0, 62.4], yaw: PI, pose: "run", lin: true, fl: "fist", fr: "fist", face: "scared", wa: 0.8 },
  { t: R5 + 1.1, p: [-0.3, 61.6], yaw: 0.1, pose: "pullDoor", fl: "open", fr: "grip", face: "focus" },
  { t: CL + 0.9, p: [-0.3, 61.6], yaw: 0.1, pose: "pullDoor", fl: "open", fr: "grip", face: "focus" },
  { t: AIR + 1.3, p: [0, 61.6], yaw: PI, pose: "stand", fl: "relax", fr: "relax", face: "scared" },
  // exterior (local z offset -120)
  { t: R6 - 0.2, p: [0.0, -121.2], yaw: 0, pose: "run", fl: "fist", fr: "fist", face: "scared" },
  { t: R6 + 1.8, p: [0.4, -108.0], yaw: 0.1, pose: "run", lin: true, fl: "fist", fr: "fist", face: "scared", wa: 1.0 },
  { t: CALL - 0.1, p: [0.8, -103.2], yaw: 0.6, pose: "stand", fl: "relax", fr: "phone", face: "scared" },
  { t: CALL + 1.0, p: [0.8, -103.2], yaw: 0.5, pose: "phone", fl: "relax", fr: "phone", face: "talk" },
  { t: NR - 0.2, p: [0.8, -103.2], yaw: PI + 0.4, pose: "phone", fl: "relax", fr: "phone", face: "talk" },
  { t: NR + 0.9, p: [0.8, -103.2], yaw: PI + 0.5, pose: "stopHand", fl: "relax", fr: "flat", face: "hurt" },
  { t: CHK - 0.1, p: [0.8, -103.2], yaw: PI + 0.5, pose: "stopHand", fl: "relax", fr: "flat", face: "hurt" },
  // evacuation plan (corridor, calm)
  { t: CHK + 0.05, p: [-1.0, 6.2], yaw: 0.3, pose: "stand", fl: "relax", fr: "relax", face: "calm" },
  { t: CHK + 1.0, p: [-0.5, 6.5], yaw: 0.25, pose: "point", fl: "relax", fr: "point", face: "focus" },
  { t: WH + 1.8, p: [-0.5, 6.5], yaw: 0.25, pose: "point", fl: "relax", fr: "point", face: "focus" },
  { t: SV - 0.2, p: [-0.6, 6.0], yaw: PI / 2, pose: "stand", fl: "relax", fr: "relax", face: "calm" },
  { t: SV + 0.8, p: [-0.6, 6.0], yaw: PI / 2, pose: "shrug", fl: "open", fr: "open", face: "scared" },
  { t: DUR + 1, p: [-0.6, 6.0], yaw: PI / 2, pose: "shrug", fl: "open", fr: "open", face: "scared" },
];
// resolve names
const getPose = (k) => (typeof k.pose === "string" ? PS[k.pose] : k.pose);
function angLerp(a, b, u) { let d = ((b - a + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI; return a + d * u; }
function blendPose(a, b, u) {
  const o = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (k === "hipY" || k === "hipX" || k === "hipZ") o[k] = lerp(a[k] || 0, b[k] || 0, u); else { const x = a[k] || Z, y = b[k] || Z; o[k] = [lerp(x[0], y[0], u), lerp(x[1], y[1], u), lerp(x[2], y[2], u)]; }
  } return o;
}
const fin = (n) => FIN[n] || FIN.relax; const finBlend = (a, b, u) => { const o = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) o[k] = lerp(a[k] ?? a.all ?? 0.2, b[k] ?? b.all ?? 0.2, u); return o; };
const faceBlend = (a, b, u) => { const o = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) o[k] = lerp(a[k] ?? (k === "eyes" ? 1 : 0), b[k] ?? (k === "eyes" ? 1 : 0), u); return o; };
function segAt(t) { let i = 0; for (let j = 0; j < KF.length - 1; j++) if (t >= KF[j].t) i = j; return i; }
function sample(t) {
  const i = segAt(t), a = KF[i], b = KF[Math.min(i + 1, KF.length - 1)]; const raw = clamp((t - a.t) / Math.max(1e-4, b.t - a.t)), u = ease(raw);
  const pu = b.lin ? raw : u; const px = lerp(a.p[0], b.p[0], pu), pz = lerp(a.p[1], b.p[1], pu);
  const dist = Math.hypot(b.p[0] - a.p[0], b.p[1] - a.p[1]), speed = (b.lin || a.lin) && b.t > a.t ? dist / (b.t - a.t) : (dist > 0.01 && b.t > a.t ? dist / (b.t - a.t) * 0.8 : 0);
  return { px, pz, yaw: angLerp(a.yaw, b.yaw, u), pose: blendPose(getPose(a), getPose(b), u), fl: finBlend(fin(a.fl), fin(b.fl), u), fr: finBlend(fin(a.fr), fin(b.fr), u), face: faceBlend(FACE[a.face] || {}, FACE[b.face] || {}, u), speed, wa: lerp(a.wa ?? 1, b.wa ?? 1, u), a, b, u };
}
// walk phase table
const PH_DT = 1 / 60, PHASE = []; { let ph = 0; for (let t = 0; t <= DUR + 2; t += PH_DT) { const s = sample(t); PHASE.push(ph); ph += (s.speed > 0.15 ? s.speed : 0) * PH_DT * (2 * PI / 1.45); } }
const phaseAt = (t) => { const f = clamp(t / PH_DT, 0, PHASE.length - 2), i = Math.floor(f); return lerp(PHASE[i], PHASE[i + 1], f - i); };
function walkOverlay(p, ph, amp) {
  const s = Math.sin(ph), c = Math.cos(ph); const o = JSON.parse(JSON.stringify(p));
  const add = (k, v) => { const b = o[k] || [0, 0, 0]; o[k] = [b[0] + v[0], b[1] + v[1], b[2] + v[2]]; };
  add("hL", [-0.55 * amp * s, 0, 0]); add("hR", [0.55 * amp * s, 0, 0]);
  add("kL", [amp * (0.08 + 0.8 * Math.max(0, c)), 0, 0]); add("kR", [amp * (0.08 + 0.8 * Math.max(0, -c)), 0, 0]);
  add("aL", [-0.25 * amp * Math.max(0, c) + 0.1 * amp * s, 0, 0]); add("aR", [-0.25 * amp * Math.max(0, -c) - 0.1 * amp * s, 0, 0]);
  add("sL", [0.5 * amp * s * 0.9, 0, 0]); add("sR", [-0.5 * amp * s * 0.9, 0, 0]); add("eL", [-0.25 * amp - 0.2 * amp * Math.max(0, -s), 0, 0]); add("eR", [-0.25 * amp - 0.2 * amp * Math.max(0, s), 0, 0]);
  add("spine", [0, 0.14 * amp * s, 0]); add("chest", [0, -0.08 * amp * s, 0]); add("head", [0, -0.05 * amp * s, 0]);
  o.hipY = (o.hipY || 0) + 0.028 * amp * (Math.cos(2 * ph) - 0.5); o.hipX = (o.hipX || 0) + 0.02 * amp * s;
  return o;
}
function stairsT(t) { return clamp((t - (AIR + 1.3)) / Math.max(0.1, (R6 - 0.4 - (AIR + 1.3)))); }

/* ---------- context (which set is active) ---------- */
function ctxAt(t) { return t < A ? "ext0" : t < R3 - 0.2 ? "class" : t < R5 - 0.05 ? "corr" : t < R6 - 0.1 ? "stairs" : t < CHK ? "ext1" : t < E.twist + 0.2 ? "plan" : "end"; }

/* ---------- cameras ---------- */
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const mixv = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const shot = (t0, t1, pa, pb, la, lb, fa, fb, e = 1) => (t) => { const u0 = clamp((t - t0) / (t1 - t0)), u = e ? ease(u0) : u0; return { p: mixv(pa, pb, u), l: mixv(la, lb, u), f: lerp(fa, fb, u) }; };
const char = (t) => { const s = sample(t); return [s.px, 0, s.pz, s.yaw]; };
const rel = (c, dx, dy, dz) => { const ys = Math.sin(c[3]), yc = Math.cos(c[3]); return [c[0] + dx * yc + dz * ys, c[1] + dy, c[2] - dx * ys + dz * yc]; };
const SH = [];
const add = (t0, t1, fn) => SH.push({ t0, t1, fn });
add(0, A, (t) => { const u = ease(clamp(t / A)); return { p: [lerp(-7, -6, u), lerp(1.5, 3.2, u), lerp(-93, -102, u)], l: [-5.2, lerp(5.2, 7.2, u), -120], f: lerp(64, 56, u) }; });
// classroom
add(A, A + 1.9, shot(A, A + 1.9, [-0.1, 1.5, -1.9], [0.15, 1.45, -1.3], [0.42, 1.1, 0.85], [0.42, 1.2, 0.85], 38, 34));
add(A + 1.9, R1 + 0.3, (t) => { const c = char(t); return { p: [lerp(-1.1, -0.6, win(t, A + 1.9, R1)), 1.5, lerp(-2.0, -1.5, win(t, A + 1.9, R1))], l: [c[0], 1.05, c[2]], f: 50 }; });
add(R1 + 0.3, D + 0.4, (t) => { const u = win(t, R1, D); return { p: [lerp(2.3, 1.9, u), lerp(1.0, 1.2, u), -1.5], l: [0.6, lerp(0.95, 1.1, u), 1.2], f: 50 }; });
add(D + 0.4, R2 + 1.6, (t) => { const c = char(t); const p = rel(c, 1.2, 1.3, -2.0); return { p, l: [c[0] + Math.sin(c[3]) * 1.2, 1.2, c[2] + Math.cos(c[3]) * 1.2], f: 52 }; });
add(R2 + 1.6, HOT - 0.1, shot(R2 + 1.6, HOT - 0.1, [0.2, 1.5, 2.6], [0.7, 1.45, 3.4], [2.0, 1.2, 4.2], [2.15, 1.3, 4.45], 46, 36));
add(HOT - 0.1, R3 - 0.15, shot(HOT - 0.1, R3 - 0.15, [0.9, 1.5, 2.3], [0.8, 1.55, 2.0], [2.1, 1.25, 3.7], [2.1, 1.3, 3.6], 48, 52));
// corridor
add(R3 - 0.15, CR - 0.1, shot(R3 - 0.15, CR - 0.1, [0.2, 0.55, 6.3], [-0.4, 0.8, 6.2], [3.5, 2.6, 5.6], [4.5, 2.7, 5.8], 62, 66));
add(CR - 0.1, NL, (t) => { const c = char(t); return { p: [c[0] + 2.3, 0.75, 5.95], l: [c[0] - 1.2, 0.95, 6.1], f: 58 }; });
add(NL, ST + 0.1, shot(NL, ST + 0.1, [-0.6, 1.5, 4.9], [-1.0, 1.5, 5.0], [-3.1, 1.5, 7.2], [-3.0, 1.55, 7.2], 62, 56));
add(ST + 0.1, R5 - 0.05, (t) => { const c = char(t); return { p: [c[0] + 1.8, 1.3, 5.3], l: [c[0] - 0.8, 1.2, 6.8], f: 55 }; });
// stairwell
add(R5 - 0.05, CL - 0.1, shot(R5 - 0.05, CL - 0.1, [1.0, 1.5, 58.6], [1.0, 1.5, 58.9], [0.0, 1.1, 62.5], [0.0, 1.1, 62.5], 62, 56));
add(CL - 0.1, AIR + 1.3, shot(CL - 0.1, AIR + 1.3, [1.6, 1.55, 58.9], [1.4, 1.55, 59.3], [-0.1, 1.2, 61.9], [-0.2, 1.3, 62.1], 44, 40));
add(AIR + 1.3, R6 - 0.1, (t) => { const u = stairsT(t), p = W.stairPoint(u); return { p: [p.x + 1.2, p.y + 2.3, p.z + 2.2], l: [p.x, p.y + 0.9, p.z - 0.8], f: 55 }; });
// exterior
add(R6 - 0.1, CALL - 0.1, (t) => { const u = win(t, R6 - 0.1, CALL); return { p: [lerp(3.5, 2.0, u), lerp(1.1, 1.5, u), lerp(-98, -96, u)], l: [lerp(0, 0.5, u), 1.5, lerp(-118, -106, u)], f: 52 }; });
add(CALL - 0.1, NR - 0.2, shot(CALL - 0.1, NR - 0.2, [-1.2, 1.55, -100.6], [-0.6, 1.55, -101.2], [0.8, 1.55, -103.2], [0.8, 1.55, -103.2], 40, 34));
add(NR - 0.2, CHK, shot(NR - 0.2, CHK, [2.2, 1.6, -100.6], [1.6, 1.8, -102.0], [-2.0, 4.8, -119], [-5.0, 5.2, -119], 52, 48));
// plan
add(CHK, WH, shot(CHK, WH, [-2.4, 1.6, 4.95], [-1.8, 1.6, 5.0], [-0.4, 1.4, 7.5], [-0.3, 1.5, 7.5], 52, 44));
add(WH, SV - 0.1, shot(WH, SV - 0.1, [-1.2, 1.6, 6.0], [-6.5, 1.7, 6.0], [-13.5, 2.4, 5.4], [-13.5, 2.6, 5.2], 50, 36));
add(SV - 0.1, E.twist + 0.2, shot(SV - 0.1, E.twist + 0.2, [4.4, 1.5, 5.95], [3.0, 1.5, 5.95], [-0.6, 1.3, 6.0], [-0.6, 1.4, 6.0], 34, 26));
add(E.twist + 0.2, DUR, (t) => ({ p: [3.0, 1.5, 5.95], l: [-0.6, 1.4, 6.0], f: 26 }));
function camAt(t) { for (const s of SH) if (t >= s.t0 && t < s.t1) return s.fn(t); return SH[SH.length - 1].fn(t); }

/* ---------- state per frame ---------- */
const kidsBase = W.kidsBase;
function setScene(ctx) {
  W.school.visible = ctx === "class" || ctx === "corr" || ctx === "plan" || ctx === "end"; W.stair.visible = ctx === "stairs"; W.ext.visible = ctx === "ext0" || ctx === "ext1"; W.sky.visible = ctx === "ext0" || ctx === "ext1";
  for (const f of fireEnd) f.g.visible = ctx === "corr" || ctx === "plan" || ctx === "end" || ctx === "class";
}
function lightsFor(ctx, t, c) {
  const fl = 0.9 + 0.1 * Math.sin(t * 12) + 0.06 * Math.sin(t * 29.7);
  for (const L of [camL, fillA, fillB, fireL, alarmL, accL]) L.intensity = 0; sun.intensity = 0; sun.castShadow = false;
  const camPos = cam.position;
  if (ctx === "ext0" || ctx === "ext1") {
    hemi.color.set(0xa9c4ee); hemi.groundColor.set(0x4a3a2c); hemi.intensity = 0.95; sun.color.set(0xffc58a); sun.intensity = 3.4; sun.castShadow = true;
    sun.position.set(-40, 26, -80); sun.target.position.set(0, 0, -105); const sc = sun.shadow.camera; sc.left = -28; sc.right = 28; sc.top = 28; sc.bottom = -28; sc.near = 1; sc.far = 140; sc.updateProjectionMatrix();
    const fw = ctx === "ext0" ? 1 : 0.55; fireL.position.set(-6, 5.2, -118); fireL.intensity = 260 * fl * fw; fireL.color.set(0xff7a2a); fireL.distance = 60;
    camL.intensity = 0; accL.position.set(0, 1.2, -97); accL.color.set(0xffd2a0); accL.intensity = ctx === "ext1" ? 14 : 0;
    if (ctx === "ext1") { alarmL.position.set(0, 3, -75); alarmL.color.set(Math.floor(t * 3) % 2 ? 0x2a6aff : 0xff2a1a); alarmL.intensity = 26; alarmL.distance = 60; }
  } else if (ctx === "class") {
    hemi.color.set(0xdde6ff); hemi.groundColor.set(0x7a5f45); hemi.intensity = 0.55; sun.color.set(0xfff0d8); sun.intensity = 2.2; sun.castShadow = true;
    sun.position.set(-13, 7.5, -1.5); sun.target.position.set(0, 0.6, 0.5); const sc = sun.shadow.camera; sc.left = -7; sc.right = 7; sc.top = 7; sc.bottom = -7; sc.near = 1; sc.far = 30; sc.updateProjectionMatrix();
    camL.intensity = 3; fillA.position.set(-0.4, 2.9, 0.4); fillA.intensity = 11; fillB.position.set(1.4, 2.9, 3.0); fillB.intensity = 6 * (0.85 + 0.15 * Math.sin(t * 3));
    const strobeOn = (Math.floor(t * 2.6) % 2) === 0; alarmL.position.set(1.0, 2.1, 3.6); alarmL.distance = 12; alarmL.color.set(0xff2a1a); alarmL.intensity = strobeOn ? 14 : 1;
    const heat = win(t, TC, HOT + 0.1); fireL.position.set(2.1, 0.6, 5.5); fireL.intensity = 40 * heat * fl; fireL.color.set(0xff7a2a); fireL.distance = 12;
  } else if (ctx === "corr" || ctx === "plan" || ctx === "end") {
    const calm = ctx !== "corr"; hemi.color.set(0x9db0d0); hemi.groundColor.set(0x3a3026); hemi.intensity = calm ? 0.7 : 0.38; camL.intensity = calm ? 8 : 6;
    const cx = camPos.x; fillA.position.set(cx - 1.5, 2.85, 6.0); fillA.intensity = (calm ? 30 : 16) * (calm ? 1 : (0.9 + 0.1 * Math.sin(t * 17) * Math.sin(t * 5))); fillA.distance = 12;
    fillB.position.set(cx + 3.5, 2.85, 6.0); fillB.intensity = calm ? 20 : 9; fillB.color.set(0xfff0d8);
    fireL.position.set(12, 1.4, 5.9); fireL.intensity = (calm ? 40 : 190) * fl; fireL.color.set(0xff6a1f); fireL.distance = 40;
    accL.position.set(-13, 1.7, 6.0); accL.color.set(0xfff2d6); accL.intensity = 34; accL.distance = 16;
    if (ctx === "end") { const k = win(t, E.twist + 0.2, E.twist + 1.0); const fk = (Math.sin(t * 40) > 0 ? 1 : 0.2) * (1 - k); fillA.intensity *= fk; fillB.intensity *= fk; camL.intensity *= fk; hemi.intensity *= fk * 0.8; alarmL.position.set(cx, 2.4, 5.6); alarmL.color.set(0xff2a1a); alarmL.intensity = 30 * (Math.floor(t * 4) % 2 ? 1 : 0.2); alarmL.distance = 14; }
  } else if (ctx === "stairs") {
    hemi.color.set(0xb0bfd8); hemi.groundColor.set(0x504a40); hemi.intensity = 0.5; camL.intensity = 7;
    fillA.position.set(0.6, 2.7, 61.6); fillA.intensity = 20; fillA.distance = 10; fillB.position.set(0.6, -1.0, 56.6); fillB.intensity = 18; fillB.distance = 10;
    const open = 1 - win(t, CL - 0.1, CL + 0.6); fireL.position.set(0.4, 1.3, 64.2); fireL.intensity = 170 * (0.25 + 0.75 * open) * fl; fireL.color.set(0xff6a1f); fireL.distance = 14;
    accL.position.set(0.6, -1.5, 52.0); accL.color.set(0xfff0d8); accL.intensity = 40; accL.distance = 14;
  }
}

function renderAt(t) {
  const ctx = ctxAt(t); setScene(ctx); { const c0 = camAt(t); cam.position.set(c0.p[0], c0.p[1], c0.p[2]); }
  // character
  const s = sample(t); const ph = phaseAt(t);
  let pose = s.pose; const moving = s.speed > 0.15; const amp = moving ? clamp(s.speed / 1.45) * s.wa * (ctx === "stairs" ? 0.9 : 1) : 0;
  if (ctx === "stairs" && t > AIR + 1.3) { const u = stairsT(t), p = W.stairPoint(u), p2 = W.stairPoint(Math.min(0.999, u + 0.02)); s.px = p.x; s.pz = p.z; s.yaw = Math.atan2(p2.x - p.x, p2.z - p.z); pose = walkOverlay(PS.stand, ph + u * 40, 0.8); H.root.position.set(p.x, p.y, p.z); }
  else { if (amp > 0.01) pose = walkOverlay(pose, ph, amp); H.root.position.set(s.px, 0, s.pz); }
  if (ctx === "stairs" && t > AIR + 1.3) { /* position already set */ } else { H.root.position.set(s.px, ctx === "stairs" && t < CL + 1 ? 0 : 0, s.pz); }
  // breathing / micro motion
  const br = Math.sin(t * 2.2) * 0.012; pose = { ...pose, chest: [(pose.chest || Z)[0] + br, (pose.chest || Z)[1], (pose.chest || Z)[2]] };
  H.root.rotation.y = s.yaw; RT.reset(); H.apply(pose); H.setFingers("L", s.fl); H.setFingers("R", s.fr); RT.calibrate(); RT.update();
  const face = { ...s.face }; const talk = (t > 0) ? 0 : 0; H.face(face);
  H.root.visible = ctx !== "ext0" && !(ctx === "end" && t > E.twist + 0.9);
  // props
  const pickT = R1 + 1.15, dropT = D + 0.3;
  if (t < pickT) { pack.parent !== scene && scene.add(pack); pack.position.set(0.92, 0.22, 1.28); pack.rotation.set(0, 2.2, 0); }
  else if (t < dropT) { if (pack.parent !== scene) scene.add(pack); gluePack(); }
  else { if (pack.parent !== scene) scene.add(pack); const dt = t - dropT, y0 = 0.7, g = 9.8; const bounce = (x) => Math.abs(Math.sin(x * 4.2)) * Math.exp(-x * 4.2) * 0.12; const y = Math.max(0.22, y0 - 0.5 * g * dt * dt + 0) ; pack.position.set(0.5 + 0.33 * Math.cos(0.3) + 0.2, dt < 0.33 ? y : 0.22 + bounce(dt - 0.33) , 1.25); pack.rotation.set(0, 2.2 + dt * 0.5 * (dt < 0.33 ? 1 : 0), dt < 0.33 ? -dt * 1.2 : -0.4); if (dt >= 0.33) pack.rotation.z = -1.35; }
  pack.visible = ctx === "class" || ctx === "corr";
  if (ctx === "corr" || ctx === "stairs") { /* hide pack */ pack.visible = false; }
  const clothOn = t > CR + 0.7 && t < E.twist; cloth.visible = clothOn && (ctx === "corr" || ctx === "stairs"); glueCloth(); const cl = win(t, CR + 0.5, CR + 0.9); cloth.scale.setScalar(lerp(0.3, 1, cl));
  drops.forEach((d, i) => { const k = (t * 1.6 + i * 0.2) % 1; d.visible = cloth.visible; const wp = new THREE.Vector3(); cloth.getWorldPosition(wp); d.position.set(wp.x + (i - 2) * 0.03, wp.y - 0.12 - k * 0.5, wp.z); d.scale.setScalar(1 - k * 0.3); });
  phone.visible = (ctx === "ext1") && t > CALL - 0.1; gluePhone();
  // doors
  const dOpen = win(t, R3 - 0.45, R3 - 0.05); W.anim.doorClass.rotation.y = ctx === "class" ? 0 : dOpen * 1.65 + (t < R3 - 0.45 ? 0 : 0);
  if (ctx === "class") W.anim.doorClass.rotation.y = 0; else W.anim.doorClass.rotation.y = 1.65;
  const sOpen = win(t, ST + 0.55, R5 - 0.15); W.anim.doorStairCor.rotation.y = ctx === "corr" ? sOpen * 1.6 : 0;
  const stOpen = ctx === "stairs" ? (1 - win(t, CL - 0.2, CL + 0.5)) * (t < R5 + 0.2 ? win(t, R5 - 0.1, R5 + 0.2) : 1) : 0; W.anim.doorStairTop.rotation.y = -1.3 * stOpen;
  const exOpen = win(t, R6 - 0.5, R6 + 0.2); W.anim.entL.position.x = W.anim.entL.userData.x0 - 1.2 * exOpen; W.anim.entR.position.x = W.anim.entR.userData.x0 + 1.2 * exOpen;
  // elevator indicator blink
  W.anim.call.visible = Math.floor(t * 3) % 2 === 0;
  // alarm strobe
  const so = (Math.floor(t * 2.6) % 2) === 0; W.anim.strobe.material.color.set(so ? 0xff4a3a : 0x5a0f0a);
  // door glow (heat)
  const heat = win(t, TC, HOT + 0.1); W.anim.doorGlow.material.opacity = 0.2 + 0.8 * heat * (0.85 + 0.15 * Math.sin(t * 20)); W.anim.doorGlowOut.visible = false;
  // fire + smoke
  const lvl = clamp(win(t, A, CHK) * 1.0); const fireK = ctx === "plan" ? 0.35 : 1;
  fireEnd.forEach((f, i) => f.update(t + i * 1.3, fireK * (ctx === "class" ? 0 : 1)));
  extFires.forEach((f, i) => f.update(t + i, ctx === "ext0" || ctx === "ext1" ? 1 : 0));
  stairGlowFire.update(t, ctx === "stairs" ? (1 - win(t, CL - 0.1, CL + 0.6) * 0.8) : 0);
  const corrLevel = ctx === "corr" ? clamp(0.45 + win(t, R3, CR) * 0.5) : (ctx === "plan" ? 0.12 : (ctx === "end" ? 0.1 + win(t, E.twist, E.twist + 1.2) * 0.8 : 0));
  smokeCorr.update(t, corrLevel, ctx === "corr" ? win(t, CR - 0.4, R4) * 0.3 : 0, cam.position); smokeCorr.g.visible = ctx === "corr" || ctx === "plan" || ctx === "end";
  smokeDoor.update(t, ctx === "class" ? clamp(win(t, R2, HOT) * 0.9) : 0, 0.7, cam.position); smokeDoor.g.visible = ctx === "class";
  smokeStair.update(t, ctx === "stairs" ? 0.8 * (1 - win(t, CL, CL + 1.2) * 0.85) : 0, 0.2, cam.position); smokeStair.g.visible = ctx === "stairs";
  plume.forEach((p, i) => p.update(t + i * 3, ctx === "ext0" || ctx === "ext1" ? 1 : 0)); smokeExtWin.update(t, ctx === "ext0" || ctx === "ext1" ? 1 : 0); plume.forEach((p) => (p.g.visible = ctx === "ext0" || ctx === "ext1")); smokeExtWin.g.visible = ctx === "ext0" || ctx === "ext1";
  W.fireWins.forEach((m, i) => m.color.setRGB(1, 0.45 + 0.2 * Math.sin(t * 9 + i * 2) + 0.1 * Math.sin(t * 23 + i), 0.12));
  // trucks + kids
  W.trucks.forEach((tr, i) => { const arr = win(t, R6 + 0.2, NR); const startZ = i ? 120 : 140, endZ = i ? 56 : 52; tr.g.position.z = lerp(startZ, endZ, ease(arr)); tr.g.position.x = i ? 9 : -8; const flash = Math.floor(t * 5) % 2; tr.lA.material.color.set(flash ? 0xff3a2a : 0x3a0a08); tr.lB.material.color.set(flash ? 0x0a1a3a : 0x3a7bff); });
  W.kids.forEach((k, i) => { const b = kidsBase[i]; k.g.position.y = Math.abs(Math.sin(t * 2 + i)) * 0.03; k.g.rotation.y = Math.PI + Math.sin(t * 0.7 + i) * 0.4; });
  // lights, camera
  const cs = camAt(t); const sh = 0.004 * (0.6 + noise1(t * 2)); const px = cs.p[0] + (noise1(t * 6) - 0.5) * sh * 2, py = cs.p[1] + (noise1(t * 6 + 20) - 0.5) * sh * 2;
  cam.fov = cs.f; cam.updateProjectionMatrix(); cam.position.set(px, py, cs.p[2]); const roll = (noise1(t * 3 + 70) - 0.5) * 0.01; cam.up.set(Math.sin(roll), Math.cos(roll), 0); cam.lookAt(cs.l[0], cs.l[1], cs.l[2]); cam.updateMatrixWorld(true);
  lightsFor(ctx, t, char(t));
  window.__ui && window.__ui(t, ctx);
  renderer.render(scene, cam);
}
const safeRender = (t) => { try { renderAt(t); } catch (e) { console.error("RENDERFAIL t=" + t + " " + e.stack); } };
window.__render = safeRender; window.__ctx = ctxAt;
window.addEventListener("hf-seek", (e) => safeRender(e.detail.time));
safeRender(+(params.get("t") || 0)); window.__ready = true;
