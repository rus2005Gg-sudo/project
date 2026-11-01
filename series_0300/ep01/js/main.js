import * as THREE from "three";
import { clamp, lerp, ease, win, noise1, ctex } from "./util.js";
import { buildTextures } from "./tex.js";
import { buildWorld } from "./world.js";
import { furnish } from "./props.js";
import { makeHuman } from "./human.js";
import { GLTFLoader } from "../assets/vendor/addons/loaders/GLTFLoader.js";
import { prepareModel, makeRetarget, restAttach } from "./retarget.js";
import { buildBedroom, drawClock } from "./bedroom.js";
import { loadExtras, spawn, updateExtra } from "./extras.js";

/* «03:00» — episode 1 «Сообщение». Every frame is a pure function of t (seekable). */
const params = new URLSearchParams(location.search);
const PW = +(params.get("w") || 1080), PH = Math.round(PW * 16 / 9);
const CUE = window.CUE, E = CUE.e, DUR = CUE.dur, SG = CUE.seg;
const PI = Math.PI;

/* ---------- renderer / lights ---------- */
const canvas = document.getElementById("gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(PW, PH, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x05070c);
const cam = new THREE.PerspectiveCamera(50, PW / PH, 0.03, 400); scene.add(cam);
const hemi = new THREE.HemisphereLight(0xbcd2ff, 0x4a3a2a, 1.0); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; scene.add(sun); scene.add(sun.target);
const camL = new THREE.PointLight(0xfff1dc, 0, 10, 1.6); cam.add(camL); camL.position.set(0.2, 0.3, 0);
const fillA = new THREE.PointLight(0xfff4e0, 0, 14, 1.5); scene.add(fillA);
const fillB = new THREE.PointLight(0xfff4e0, 0, 14, 1.5); scene.add(fillB);
const phoneL = new THREE.PointLight(0x9cc4ff, 0, 3.0, 1.8); scene.add(phoneL);
const accL = new THREE.PointLight(0xffffff, 0, 12, 1.6); scene.add(accL);

/* ---------- sets ---------- */
const T = buildTextures(); const W = buildWorld(scene, T); await furnish(W);
W.stair.visible = false; W.ext.visible = false; W.sky.visible = false; W.anim.doorGlow.visible = false; W.anim.doorGlowOut.visible = false;
const B = await buildBedroom(scene);

/* ---------- hero: procedural rig drives the Quaternius hoodie model ---------- */
const H = makeHuman(T); scene.add(H.root); H.root.rotation.order = "YXZ";
H.root.traverse((o) => { if (o.isMesh) o.visible = false; });
const gltf = await new GLTFLoader().loadAsync("assets/chars/Casual_Hoodie.glb");
const hero = gltf.scene; prepareModel(hero, { Cube008_1: 0x2b4ea8, Cube000: 0x23252b, Cube000_1: 0xe8e8e8, Cube005_1: 0x2f3646 }); H.root.add(hero);
const RT = makeRetarget(H, hero);

/* ---------- phone with live chat screen ---------- */
const phoneTex = ctex(512, 1024, () => {}, { rep: false });
const phone = new THREE.Group(); scene.add(phone);
{ const body = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.152, 0.009), new THREE.MeshStandardMaterial({ color: 0x111316, roughness: 0.25, metalness: 0.6 })); body.castShadow = true; phone.add(body);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.144), new THREE.MeshBasicMaterial({ map: phoneTex, toneMapped: false })); scr.position.z = 0.0052; phone.add(scr); phone.userData.scr = scr; }
const gluePhone = restAttach(RT, phone, "WristR", [-0.02, -0.17, 0.05], new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.2, Math.PI / 2 + 0.25, 0)));
function bubble(g, x, y, w, txt, mine, alpha = 1) {
  g.globalAlpha = alpha; g.font = "600 30px Mont, sans-serif"; const words = txt.split(" "); const lines = []; let cur = "";
  for (const wd of words) { const tt = cur ? cur + " " + wd : wd; if (g.measureText(tt).width > w - 44) { lines.push(cur); cur = wd; } else cur = tt; } lines.push(cur);
  const h = 26 + lines.length * 38; g.fillStyle = mine ? "#2f6bff" : "#26272c"; const bx = mine ? 512 - 24 - w : 24; g.beginPath(); g.roundRect(bx, y, w, h, 26); g.fill();
  g.fillStyle = "#fff"; lines.forEach((l, i) => g.fillText(l, bx + 22, y + 46 + i * 38)); g.globalAlpha = 1; return y + h + 16;
}
function drawPhone(t, mode) {
  const { g, w, h } = phoneTex.userData; g.textAlign = "left";
  if (mode === "off") { g.fillStyle = "#000"; g.fillRect(0, 0, w, h); phoneTex.needsUpdate = true; return; }
  if (mode === "lock") { // lock screen with incoming notification
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#1a2a5a"); gr.addColorStop(1, "#05070f"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = "#fff"; g.textAlign = "center"; g.font = "300 150px Mont, sans-serif"; g.fillText(t < E.flip ? "02:59" : "03:00", w / 2, 270); g.font = "600 30px Mont"; g.fillText("суббота, 14 ноября", w / 2, 320);
    if (t >= E.buzz) { const a = clamp((t - E.buzz) / 0.3); g.globalAlpha = a; g.fillStyle = "rgba(40,42,50,.92)"; g.beginPath(); g.roundRect(30, 380, w - 60, 170, 30); g.fill(); g.fillStyle = "#ff4d4d"; g.beginPath(); g.arc(80, 430, 22, 0, 7); g.fill();
      g.textAlign = "left"; g.fillStyle = "#fff"; g.font = "800 30px Mont"; g.fillText("Неизвестный номер", 120, 440); g.font = "500 28px Mont"; g.fillStyle = "#cfd3dc"; g.fillText("Сделай задание до утра. Или…", 60, 500); g.globalAlpha = 1; }
    phoneTex.needsUpdate = true; return;
  }
  // chat
  g.fillStyle = "#0b0c10"; g.fillRect(0, 0, w, h); g.fillStyle = "#16171d"; g.fillRect(0, 0, w, 150);
  g.fillStyle = "#ff4d4d"; g.beginPath(); g.arc(80, 95, 34, 0, 7); g.fill(); g.fillStyle = "#fff"; g.font = "900 36px Mont"; g.textAlign = "center"; g.fillText("?", 80, 108);
  g.textAlign = "left"; g.font = "800 32px Mont"; g.fillText("Неизвестный номер", 130, 90); g.font = "500 24px Mont"; g.fillStyle = "#8a8f9c"; g.fillText(mode === "warn" ? "в сети" : "был(а) только что", 130, 124);
  let y = 190;
  const type = (txt, t0, dur) => txt.slice(0, Math.floor(clamp((t - t0) / dur) * txt.length));
  if (mode === "chat") {
    y = bubble(g, 0, y, 400, "Сделай задание до утра. Или все узнают.", false);
    if (t > E.msg2 - 0.2) y = bubble(g, 0, y, 420, "Задание 1: положи записку в шкафчик №14. Текст — «Я знаю».", false, clamp((t - E.msg2 + 0.2) / 0.25));
    if (t > E.prank - 0.1) { const s = type("Ты кто вообще?", E.prank - 0.1, 0.8); if (s) y = bubble(g, 0, y, 280, s, true); }
    if (t > E.prank + 1.1) { g.fillStyle = "#26272c"; g.beginPath(); g.roundRect(24, y, 120, 64, 26); g.fill(); for (let i = 0; i < 3; i++) { g.fillStyle = "rgba(255,255,255," + (0.35 + 0.65 * (Math.floor(t * 4 + i) % 3 === 0)) + ")"; g.beginPath(); g.arc(58 + i * 26, y + 32, 8, 0, 7); g.fill(); } }
  } else if (mode === "warn") {
    y = bubble(g, 0, y, 400, "Сделай задание до утра. Или все узнают.", false, 0.45);
    y = bubble(g, 0, y, 420, "Задание 1: положи записку в шкафчик №14. Текст — «Я знаю».", false, 0.45);
    y = bubble(g, 0, y, 280, "Ты кто вообще?", true, 0.45);
    if (t > E.whisper - 0.2) { const full = "Это было предупреждение.", k = type(full, E.whisper - 0.2, 1.0); g.fillStyle = "#3a0d10"; g.beginPath(); g.roundRect(24, y, 400, 130, 26); g.fill(); g.fillStyle = "#ff5a5a"; g.font = "800 34px Mont"; g.fillText(k.slice(0, 9), 46, y + 56); g.fillText(k.slice(9), 46, y + 100); }
    else { g.fillStyle = "#26272c"; g.beginPath(); g.roundRect(24, y, 120, 64, 26); g.fill(); for (let i = 0; i < 3; i++) { g.fillStyle = "rgba(255,255,255," + (0.35 + 0.65 * (Math.floor(t * 4 + i) % 3 === 0)) + ")"; g.beginPath(); g.arc(58 + i * 26, y + 32, 8, 0, 7); g.fill(); } }
  }
  g.fillStyle = "#16171d"; g.fillRect(0, h - 110, w, 110); g.fillStyle = "#26272c"; g.beginPath(); g.roundRect(24, h - 88, w - 120, 64, 32); g.fill(); g.fillStyle = "#6b7080"; g.font = "500 26px Mont"; g.fillText("Сообщение", 50, h - 46);
  phoneTex.needsUpdate = true;
}

/* ---------- backpack on the hero's back (school scenes) ---------- */
const packM = new THREE.MeshStandardMaterial({ color: 0x1f2a24, roughness: 0.85 });
const pack = new THREE.Group(); scene.add(pack); { const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.15), packM); b.castShadow = true; pack.add(b); const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.05), packM); p2.position.set(0, -0.08, -0.09); pack.add(p2); }
const gluePack = restAttach(RT, pack, "Chest", [0, -0.05, -0.2]);

/* ---------- the old post on the projector screen (photo rendered from the hero in a silly pose) ---------- */
const photoRT = new THREE.WebGLRenderTarget(512, 512); photoRT.texture.colorSpace = THREE.SRGBColorSpace;
{
  const studio = new THREE.Group(); scene.add(studio); studio.position.set(60, 0, 0);
  const bgM = new THREE.MeshBasicMaterial({ map: ctex(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#ffb3d1"); gr.addColorStop(1, "#ffe08a"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, { rep: false }) });
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), bgM); bg.position.set(60, 1.4, -1.5); scene.add(bg);
  const ears = new THREE.Group(); scene.add(ears); const earM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }), inM = new THREE.MeshStandardMaterial({ color: 0xff9ec4, roughness: 0.8 });
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.2, 4, 10), earM); e.position.set(s * 0.06, 0.32, 0); e.rotation.z = -s * 0.25; ears.add(e); const i = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.15, 4, 8), inM); i.position.set(s * 0.06, 0.32, 0.025); i.rotation.z = -s * 0.25; ears.add(i); }
  H.root.position.set(60, 0, 0); H.root.rotation.set(0, 0.25, 0); RT.reset();
  H.apply({ sL: [-2.5, 0, 0.5], eL: [-0.15, 0, 0], sR: [-1.25, 0, 0.9], eR: [-2.3, 0, 0], neck: [0.25, 0.3, 0], head: [0.3, 0.35, 0.2], spine: [0.08, 0.25, 0], hL: [0, 0, 0.12], hR: [0, 0, -0.12] });
  H.setFingers("L", { all: 0, t: 0, spread: 1 }); H.setFingers("R", { all: 0.9, t: 0.8 }); RT.calibrate(); RT.update();
  const hb = RT.bone("Head"); const hp = new THREE.Vector3(); hb.getWorldPosition(hp); const hq = new THREE.Quaternion(); hb.getWorldQuaternion(hq); ears.position.copy(hp); ears.quaternion.copy(hq);
  const pc = new THREE.PerspectiveCamera(34, 1, 0.1, 20); pc.position.set(60.2, 1.45, 2.6); pc.lookAt(60, 1.3, 0);
  const pl = new THREE.DirectionalLight(0xffffff, 2.2); pl.position.set(62, 4, 4); pl.target.position.set(60, 1, 0); scene.add(pl); scene.add(pl.target); const ph = new THREE.HemisphereLight(0xffffff, 0x886677, 1.3); scene.add(ph);
  const vis = []; scene.traverse((o) => { if (o !== scene && o.parent === scene && o !== H.root && o !== studio && o !== bg && o !== ears && o !== pl && o !== ph && o !== pl.target && o !== cam) { vis.push([o, o.visible]); o.visible = false; } });
  renderer.setRenderTarget(photoRT); renderer.render(scene, pc); renderer.setRenderTarget(null);
  vis.forEach(([o, v]) => (o.visible = v)); scene.remove(bg, ears, pl, ph, pl.target, studio);
}
const postTex = ctex(720, 1000, (g, w, h) => {
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h); g.fillStyle = "#e14b8a"; g.beginPath(); g.arc(70, 70, 38, 0, 7); g.fill(); g.fillStyle = "#fff"; g.font = "900 36px Mont"; g.textAlign = "center"; g.fillText("T", 70, 83);
  g.textAlign = "left"; g.fillStyle = "#111"; g.font = "800 34px Mont"; g.fillText("tema_kot_2012", 125, 64); g.fillStyle = "#888"; g.font = "500 26px Mont"; g.fillText("3 года назад · удалено", 125, 100);
  g.fillStyle = "#111"; g.font = "800 34px Mont"; g.fillText("я лучший дэбер школы 😎🔥", 40, 870); g.fillStyle = "#e14b8a"; g.font = "700 28px Mont"; g.fillText("#dab #я_звезда #7Б", 40, 915); g.fillStyle = "#555"; g.font = "600 28px Mont"; g.fillText("❤ 3     💬 0", 40, 965);
}, { rep: false });
const screenG = new THREE.Group(); W.school.add(screenG); screenG.position.set(0, 1.78, -4.33);
{ const frame = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.0), new THREE.MeshBasicMaterial({ map: postTex, toneMapped: false })); screenG.add(frame);
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(1.34, 1.34), new THREE.MeshBasicMaterial({ map: photoRT.texture, toneMapped: false })); photo.position.set(0, 0.12, 0.002); screenG.add(photo);
  const glow = new THREE.PointLight(0xffffff, 0, 6, 1.6); glow.position.set(0, 0, 0.8); screenG.add(glow); screenG.userData.glow = glow;
  const stamp = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), new THREE.MeshBasicMaterial({ map: ctex(512, 128, (g, w, h) => { g.fillStyle = "rgba(225,20,30,.9)"; g.fillRect(0, 0, w, h); g.fillStyle = "#fff"; g.font = "900 58px Mont"; g.textAlign = "center"; g.fillText("СМОТРИТЕ ВСЕ 😂", w / 2, 86); }, { rep: false }), transparent: true, toneMapped: false })); stamp.position.set(0.1, -0.55, 0.004); stamp.rotation.z = 0.12; screenG.add(stamp); screenG.userData.stamp = stamp; }

/* ---------- classmates ---------- */
const SRC = await loadExtras();
const X = [
  // corridor (watch Tёma pass)
  { file: "F_Casual", pos: [-6.2, 0, 7.05], yaw: PI, clip: "Idle", phase: 0.3, look: true, tint: { Purple: 0xd9667f } },
  { file: "M_Punk", pos: [-5.5, 0, 7.0], yaw: PI + 0.4, clip: "Idle_Gun_Pointing", phase: 1.1, look: 0.6 },
  { file: "F_Punk", pos: [-3.2, 0, 4.95], yaw: 0.2, clip: "Idle", phase: 0.7, look: true },
  { file: "M_Beach", pos: [-2.5, 0, 5.05], yaw: -0.3, clip: "Idle_Neutral", phase: 1.9, look: true, laugh: 0.6 },
  { file: "F_Formal", pos: [-9.5, 0, 7.0], yaw: PI - 0.3, clip: "Idle", phase: 0.2, look: true },
  { file: "Casual_2", pos: [-1.6, 0, 7.05], yaw: PI + 0.2, clip: "Wave", phase: 0.5, look: 0.5 },
  // classroom (facing the screen / laughing)
  { file: "M_Beach", pos: [-1.6, 0, -0.4], yaw: PI - 0.5, clip: "Idle", phase: 0.4, laugh: 1, look: 0.4 },
  { file: "F_Casual", pos: [0.6, 0, -0.9], yaw: PI + 0.6, clip: "Idle_Neutral", phase: 1.2, laugh: 1, look: 0.4, tint: { Purple: 0x5fa86a } },
  { file: "M_Punk", pos: [-0.6, 0, 1.9], yaw: PI + 0.3, clip: "Idle_Gun_Pointing", phase: 0.9, laugh: 0.6 },
  { file: "F_Punk", pos: [1.4, 0, 0.9], yaw: 2.4, clip: "Idle", phase: 1.6, laugh: 1, look: 0.8 },
  { file: "Casual_2", pos: [-2.6, 0, 1.2], yaw: 2.6, clip: "Idle", phase: 0.1, laugh: 1, look: 0.6, tint: { Purple: 0xc9a23b } },
].map((s) => spawn(W.school, SRC, s));

/* ---------- hero animation ---------- */
const Z = [0, 0, 0];
const PS = {
  lie: { sL: [0.05, 0, 0.12], eL: [-0.2, 0, 0], sR: [0.05, 0, -0.12], eR: [-0.2, 0, 0], head: [0.05, 0, 0] },
  lieTurn: { sL: [0.05, 0, 0.12], eL: [-0.2, 0, 0], sR: [-0.3, 0, -0.25], eR: [-0.6, 0, 0], head: [0.15, 0.75, 0], neck: [0, 0.2, 0] },
  sitPhone: { spine: [0.8, 0, 0], chest: [0.45, 0, 0], neck: [0.12, 0, 0], head: [0.25, 0, 0], sR: [-0.85, 0, -0.05], eR: [-1.55, 0, 0], sL: [-0.6, 0, 0.25], eL: [-1.2, 0, 0] },
  sitScoff: { spine: [0.75, 0, 0], chest: [0.4, 0, 0], neck: [0.0, 0, 0], head: [-0.05, -0.25, 0.1], sR: [-0.7, 0, -0.1], eR: [-1.35, 0, 0], sL: [-0.2, 0, 0.25], eL: [-0.5, 0, 0] },
  stand: { sL: [0.04, 0, 0.1], eL: [-0.2, 0, 0], sR: [0.04, 0, -0.1], eR: [-0.2, 0, 0], hL: [0, 0, 0.025], hR: [0, 0, -0.025], spine: [0.02, 0, 0] },
  walkHunch: { sL: [0.0, 0, 0.1], eL: [-0.3, 0, 0], sR: [0.0, 0, -0.1], eR: [-0.3, 0, 0], spine: [0.1, 0, 0], neck: [0.15, 0, 0], head: [0.1, 0, 0] },
  shock: { sL: [0.0, 0, 0.12], eL: [-0.35, 0, 0], sR: [0.0, 0, -0.12], eR: [-0.35, 0, 0], spine: [-0.06, 0, 0], neck: [-0.08, 0, 0], head: [-0.06, 0, 0] },
  lookPhone: { sR: [-1.3, 0, -0.12], eR: [-1.15, 0, 0], sL: [0.05, 0, 0.12], eL: [-0.3, 0, 0], neck: [0.3, 0, 0], head: [0.4, 0, 0], spine: [0.08, 0, 0] },
};
const FIN = { relax: { all: 0.25 }, grip: { all: 0.75, t: 0.6 }, fist: { all: 0.95, t: 0.8 }, pinch: { all: 0.3, t: 0.45 } };
// bed / school coordinates
const LIE = { p: [-1.2, 99.47], y: 0.66, pitch: -PI / 2, yaw: 0 };
const KF = [
  { t: -1, ...LIE, pose: "lie", fr: "relax" },
  { t: E.wake + 0.2, ...LIE, pose: "lie", fr: "relax" },
  { t: E.wake + 1.0, ...LIE, pose: "lieTurn", fr: "relax" },
  { t: E.unknown - 0.2, ...LIE, pose: "lieTurn", fr: "grip" },
  { t: E.unknown + 0.7, ...LIE, pose: "sitPhone", fr: "grip" },
  { t: E.prank - 0.2, ...LIE, pose: "sitPhone", fr: "grip" },
  { t: E.prank + 0.6, ...LIE, pose: "sitScoff", fr: "grip" },
  { t: E.morning - 0.05, ...LIE, pose: "sitScoff", fr: "grip" },
  // corridor
  { t: E.morning, p: [-8.4, 6.0], y: 0, pitch: 0, yaw: PI / 2, pose: "walkHunch", fr: "relax" },
  { t: E.board - 0.05, p: [-5.2, 6.0], y: 0, pitch: 0, yaw: PI / 2, pose: "walkHunch", fr: "relax", lin: true },
  // classroom: stops in the doorway staring at the screen
  { t: E.board, p: [2.1, 3.7], y: 0, pitch: 0, yaw: PI, pose: "shock", fr: "relax" },
  { t: E.warn - 0.3, p: [2.1, 3.7], y: 0, pitch: 0, yaw: PI, pose: "shock", fr: "fist" },
  { t: E.warn + 0.4, p: [2.1, 3.7], y: 0, pitch: 0, yaw: PI, pose: "lookPhone", fr: "pinch" },
  { t: DUR + 1, p: [2.1, 3.7], y: 0, pitch: 0, yaw: PI, pose: "lookPhone", fr: "pinch" },
];
function angLerp(a, b, u) { const d = ((b - a + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI; return a + d * u; }
function blendPose(a, b, u) { const o = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { if (k.startsWith("hip")) o[k] = lerp(a[k] || 0, b[k] || 0, u); else { const x = a[k] || Z, y = b[k] || Z; o[k] = [lerp(x[0], y[0], u), lerp(x[1], y[1], u), lerp(x[2], y[2], u)]; } } return o; }
const finBlend = (a, b, u) => { const o = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) o[k] = lerp(a[k] ?? a.all ?? 0.2, b[k] ?? b.all ?? 0.2, u); return o; };
function sample(t) {
  let i = 0; for (let j = 0; j < KF.length - 1; j++) if (t >= KF[j].t) i = j; const a = KF[i], b = KF[Math.min(i + 1, KF.length - 1)];
  const raw = clamp((t - a.t) / Math.max(1e-4, b.t - a.t)), u = ease(raw), pu = b.lin ? raw : u;
  const dist = Math.hypot(b.p[0] - a.p[0], b.p[1] - a.p[1]), speed = b.lin ? dist / (b.t - a.t) : 0;
  return { px: lerp(a.p[0], b.p[0], pu), pz: lerp(a.p[1], b.p[1], pu), y: lerp(a.y, b.y, u), pitch: lerp(a.pitch, b.pitch, u), yaw: angLerp(a.yaw, b.yaw, u), pose: blendPose(PS[a.pose], PS[b.pose], u), fr: finBlend(FIN[a.fr], FIN[b.fr], u), speed, walkT0: a.t };
}
function walkOverlay(p, ph, amp) {
  const s = Math.sin(ph), c = Math.cos(ph); const o = JSON.parse(JSON.stringify(p)); const add = (k, v) => { const b = o[k] || [0, 0, 0]; o[k] = [b[0] + v[0], b[1] + v[1], b[2] + v[2]]; };
  add("hL", [-0.5 * amp * s, 0, 0]); add("hR", [0.5 * amp * s, 0, 0]); add("kL", [amp * (0.08 + 0.75 * Math.max(0, c)), 0, 0]); add("kR", [amp * (0.08 + 0.75 * Math.max(0, -c)), 0, 0]);
  add("aL", [-0.22 * amp * Math.max(0, c), 0, 0]); add("aR", [-0.22 * amp * Math.max(0, -c), 0, 0]); add("sL", [0.35 * amp * s, 0, 0]); add("sR", [-0.35 * amp * s, 0, 0]);
  add("spine", [0, 0.1 * amp * s, 0]); add("head", [0, -0.05 * amp * s, 0]); o.hipY = (o.hipY || 0) + 0.025 * amp * (Math.cos(2 * ph) - 0.5); return o;
}

/* ---------- cameras ---------- */
const mixv = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const shot = (t0, t1, pa, pb, la, lb, fa, fb) => (t) => { const u = ease(clamp((t - t0) / (t1 - t0))); return { p: mixv(pa, pb, u), l: mixv(la, lb, u), f: lerp(fa, fb, u) }; };
const SH = []; const add = (t0, t1, fn) => SH.push({ t0, t1, fn });
const NS = [-0.32, 0, 97.85]; // nightstand world pos
const phoneAt = () => { const v = new THREE.Vector3(); phone.getWorldPosition(v); return v; };
const phoneN = () => new THREE.Vector3(0, 0, 1).applyQuaternion(phone.quaternion);
const scrCam = (dist, up, f, side = 0) => { const p = phoneAt(), n = phoneN(), u = new THREE.Vector3(0, 1, 0).applyQuaternion(phone.quaternion); const r = new THREE.Vector3(1, 0, 0).applyQuaternion(phone.quaternion); const c = p.clone().addScaledVector(u, 0.02); return { p: [c.x + n.x * dist + r.x * side, c.y + n.y * dist + r.y * side, c.z + n.z * dist + r.z * side], l: [c.x, c.y, c.z], f, up: [u.x, u.y, u.z] }; };
add(0, E.wake, shot(0, E.wake, [0.25, 0.98, 98.85], [0.12, 0.93, 98.6], [-0.25, 0.74, 97.9], [-0.25, 0.74, 97.9], 40, 36));
add(E.wake, E.unknown, shot(E.wake, E.unknown, [0.75, 1.75, 99.9], [0.55, 1.6, 99.6], [-1.1, 0.75, 98.1], [-1.1, 0.8, 98.0], 46, 42));
add(E.unknown, E.msg2 + 1.5, (t) => scrCam(lerp(0.36, 0.27, win(t, E.unknown, E.msg2)), 0.03, 36));
add(E.msg2 + 1.5, E.prank + 0.8, shot(E.msg2 + 1.5, E.prank + 0.8, [-0.75, 1.05, 97.45], [-0.8, 1.08, 97.6], [-1.15, 1.12, 98.15], [-1.15, 1.1, 98.15], 36, 30));
add(E.prank + 0.8, E.morning, (t) => scrCam(lerp(0.34, 0.26, win(t, E.prank + 0.8, E.morning)), 0.03, 36));
// corridor: tracking in front of him while heads turn
add(E.morning, E.board, (t) => { const s = sample(t); return { p: [s.px + 2.6, 1.45, 6.15], l: [s.px, 1.25, 6.0], f: 52 }; });
// classroom: push-in on the screen, then his face
add(E.board, E.board + 2.0, shot(E.board, E.board + 2.0, [1.6, 1.6, 2.0], [1.0, 1.7, 0.4], [0.0, 1.75, -4.3], [0.0, 1.8, -4.3], 48, 40));
add(E.board + 2.0, E.who - 0.1, shot(E.board + 2.0, E.who - 0.1, [-1.8, 1.5, -2.0], [-1.5, 1.5, -1.5], [1.4, 1.2, 1.0], [1.6, 1.3, 2.0], 50, 46));
add(E.who - 0.1, E.warn, shot(E.who - 0.1, E.warn, [2.15, 1.62, 2.6], [2.15, 1.62, 2.85], [2.1, 1.6, 3.7], [2.1, 1.6, 3.7], 36, 30));
add(E.warn, DUR, (t) => scrCam(lerp(0.3, 0.2, win(t, E.warn, E.hit)), 0.03, 40, 0));
function camAt(t) { for (const s of SH) if (t >= s.t0 && t < s.t1) return s.fn(t); return SH[SH.length - 1].fn(t); }
const ctxAt = (t) => (t < E.morning ? "night" : t < E.end ? "day" : "card");

/* ---------- lighting per context ---------- */
function lights(ctx, t) {
  for (const L of [camL, fillA, fillB, phoneL, accL]) L.intensity = 0; sun.castShadow = false; sun.intensity = 0;
  if (ctx === "night") {
    hemi.color.set(0x3a4f80); hemi.groundColor.set(0x0a0c14); hemi.intensity = 0.22;
    sun.color.set(0x7d9cff); sun.intensity = 1.1; sun.castShadow = true; sun.position.set(1.5, 4.5, 94); sun.target.position.set(-0.8, 0.4, 98.6); const sc = sun.shadow.camera; sc.left = -4; sc.right = 4; sc.top = 4; sc.bottom = -4; sc.near = 0.5; sc.far = 15; sc.updateProjectionMatrix();
    const on = t >= E.buzz && t < E.off; const p = phoneAt(); phoneL.position.set(p.x, p.y + 0.06, p.z + 0.05); phoneL.intensity = on ? 2.6 + 0.4 * Math.sin(t * 2) : 0;
    camL.color.set(0x7d9cff); camL.intensity = 0.25;
  } else {
    hemi.color.set(0xdde6ff); hemi.groundColor.set(0x7a5f45); hemi.intensity = 0.75; sun.color.set(0xfff0d8); sun.intensity = 2.6; sun.castShadow = true;
    const corr = t < E.board; sun.position.set(corr ? -6 : -13, 8, corr ? 2 : -1.5); sun.target.position.set(corr ? -5 : 0, 0.6, corr ? 6 : 0.5); const sc = sun.shadow.camera; sc.left = -8; sc.right = 8; sc.top = 8; sc.bottom = -8; sc.near = 1; sc.far = 40; sc.updateProjectionMatrix();
    camL.color.set(0xfff1dc); camL.intensity = 2.5; const cx = cam.position.x;
    if (corr) { fillA.position.set(cx - 1.5, 2.85, 6.0); fillA.intensity = 22; fillB.position.set(cx - 5, 2.85, 6.0); fillB.intensity = 16; accL.position.set(-13, 1.7, 6.0); accL.color.set(0xfff2d6); accL.intensity = 10; }
    else { fillA.position.set(-0.4, 2.9, 0.4); fillA.intensity = 10; fillB.position.set(1.4, 2.9, 3.0); fillB.intensity = 6; }
    if (t >= E.warn) { const p = phoneAt(); phoneL.position.set(p.x, p.y + 0.08, p.z - 0.05); phoneL.color.set(t > E.whisper ? 0xff6a6a : 0x9cc4ff); phoneL.intensity = 1.6; }
  }
}

/* ---------- frame ---------- */
const PHT = []; { let ph = 0; for (let t = 0; t <= DUR + 1; t += 1 / 60) { PHT.push(ph); ph += sample(t).speed * (1 / 60) * (2 * PI / 1.4); } }
const phaseAt = (t) => { const f = clamp(t * 60, 0, PHT.length - 2), i = Math.floor(f); return lerp(PHT[i], PHT[i + 1], f - i); };
function renderAt(t) {
  const ctx = ctxAt(t);
  B.group.visible = ctx === "night"; W.school.visible = ctx === "day";
  // hero
  const s = sample(t); let pose = s.pose; if (s.speed > 0.1) pose = walkOverlay(pose, phaseAt(t), clamp(s.speed / 1.3));
  const br = Math.sin(t * 2.0) * 0.015; pose = { ...pose, chest: [(pose.chest || Z)[0] + br, (pose.chest || Z)[1], (pose.chest || Z)[2]] };
  H.root.position.set(s.px, s.y, s.pz); H.root.rotation.set(s.pitch, s.yaw, 0);
  RT.reset(); H.apply(pose); H.setFingers("L", FIN.relax); H.setFingers("R", s.fr); RT.calibrate(); RT.update();
  H.root.visible = ctx !== "card";
  // phone
  const inHand = t >= E.unknown - 0.2; if (inHand) { gluePhone(); const hp = new THREE.Vector3(); RT.bone("Head").getWorldPosition(hp); if (phoneN().dot(hp.sub(phoneAt())) < 0) phone.rotateY(PI); } else { phone.position.copy(B.phoneRest); phone.quaternion.setFromEuler(new THREE.Euler(-PI / 2, 0, 0.4)); if (t >= E.buzz && t < E.buzz + 1.2) phone.position.x += Math.sin(t * 90) * 0.0012; }
  if (t >= E.warn) { phone.position.set(2.1, 1.3, 3.22); phone.quaternion.setFromEuler(new THREE.Euler(-0.75, 0, 0.12)); }
  if (t >= E.warn - 0.1 && t < E.warn + 0.5) phone.position.x += Math.sin(t * 90) * 0.001;
  const mode = t < E.buzz - 0.01 ? (t < 0.6 ? "off" : "lock") : t < E.unknown + 0.6 ? "lock" : t < E.off ? "chat" : ctx === "night" ? "off" : t < E.warn - 0.1 ? "off" : "warn";
  drawPhone(t, mode); phone.visible = ctx !== "card" && (ctx === "night" || t >= E.warn - 0.4);
  pack.visible = ctx === "day"; if (pack.visible) gluePack();
  drawClock(B, t, E.flip); B.clockLight.intensity = 0.35;
  // classroom screen + classmates
  screenG.userData.glow.intensity = 3.2; screenG.userData.stamp.visible = Math.floor(t * 2) % 2 === 0 || t < E.board + 1;
  const tgt = new THREE.Vector3(s.px, 1.6, s.pz); for (const e of X) updateExtra(e, t, tgt);
  // camera
  const c = window.__camOverride || camAt(t); const sh = window.__camOverride ? 0 : 0.0035 * (0.6 + noise1(t * 2)); cam.fov = c.f; cam.updateProjectionMatrix();
  cam.position.set(c.p[0] + (noise1(t * 5) - 0.5) * sh * 2, c.p[1] + (noise1(t * 5 + 20) - 0.5) * sh * 2, c.p[2]); const roll = (noise1(t * 2.5 + 70) - 0.5) * 0.012; if (c.up) cam.up.set(c.up[0], c.up[1], c.up[2]); else cam.up.set(Math.sin(roll), Math.cos(roll), 0); cam.lookAt(c.l[0], c.l[1], c.l[2]); cam.updateMatrixWorld(true);
  lights(ctx, t); window.__ui && window.__ui(t, ctx);
  renderer.render(scene, cam);
}
const safeRender = (t) => { try { renderAt(t); } catch (e) { console.error("RENDERFAIL t=" + t + " " + e.stack); } };
window.__render = safeRender;
safeRender(+(params.get("t") || 0)); window.__ready = true;
