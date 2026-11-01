import * as THREE from "three";
import { GLTFLoader } from "../assets/vendor/addons/loaders/GLTFLoader.js";
import { ctex, rng } from "./util.js";

/* Teen bedroom at night, centred at (0,0,100). PBR materials from Poly Haven texture sets in assets/tex/<id>/{diff,nor,rough}.jpg */
const TL = new THREE.TextureLoader();
export function pbr(id, rep = [1, 1], o = {}) {
  const ld = (f, srgb) => { const t = TL.load(`assets/tex/${id}/${f}.jpg`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  return new THREE.MeshStandardMaterial({ map: ld("diff", true), normalMap: ld("nor"), roughnessMap: ld("rough"), roughness: 1, ...o });
}

export async function buildBedroom(scene) {
  const R = new THREE.Group(); R.position.set(0, 0, 100); scene.add(R);
  const B = { group: R, anim: {} };
  const H = 2.7;
  const box = (w, h, d, m, x, y, z, p = R, sh = true) => { const g = new THREE.BoxGeometry(w, h, d); const ms = new THREE.Mesh(g, m); ms.position.set(x, y, z); ms.castShadow = sh; ms.receiveShadow = true; p.add(ms); return ms; };
  const floorM = pbr("laminate_floor_02", [2, 2.5], { roughness: 0.8 });
  const wallM = pbr("painted_plaster_wall", [2, 1.4], { color: 0x8fa3c4 });
  const ceilM = pbr("white_plaster_02", [2, 2], { color: 0xd8dce4 });
  box(4.2, 0.1, 5.2, floorM, 0, -0.05, 0); box(4.2, 0.1, 5.2, ceilM, 0, H + 0.05, 0);
  // walls: back (z=-2.6) with window, left (x=-2.1), right (x=2.1), front (z=2.6)
  const win = { x: 0.75, w: 1.2, y0: 0.9, h: 1.35 };
  box(win.x - win.w / 2 + 2.1, H, 0.12, wallM, (-2.1 + win.x - win.w / 2) / 2, H / 2, -2.6); box(2.1 - (win.x + win.w / 2), H, 0.12, wallM, (win.x + win.w / 2 + 2.1) / 2, H / 2, -2.6);
  box(win.w, win.y0, 0.12, wallM, win.x, win.y0 / 2, -2.6); box(win.w, H - win.y0 - win.h, 0.12, wallM, win.x, win.y0 + win.h + (H - win.y0 - win.h) / 2, -2.6);
  box(0.12, H, 5.2, wallM, -2.1, H / 2, 0); box(0.12, H, 5.2, wallM, 2.1, H / 2, 0); box(4.2, H, 0.12, wallM, 0, H / 2, 2.6);
  const white = new THREE.MeshStandardMaterial({ color: 0xe8e8e4, roughness: 0.5 });
  box(win.w + 0.1, 0.06, 0.2, white, win.x, win.y0, -2.55); box(win.w + 0.1, 0.06, 0.12, white, win.x, win.y0 + win.h, -2.58); box(0.06, win.h, 0.12, white, win.x - win.w / 2, win.y0 + win.h / 2, -2.58); box(0.06, win.h, 0.12, white, win.x + win.w / 2, win.y0 + win.h / 2, -2.58); box(0.04, win.h, 0.08, white, win.x, win.y0 + win.h / 2, -2.58);
  // night city backdrop
  const cityT = ctex(1024, 768, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#060a18"); gr.addColorStop(0.6, "#122042"); gr.addColorStop(1, "#1d2a44"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(220,230,255,.95)"; g.beginPath(); g.arc(w * 0.72, h * 0.18, 34, 0, 7); g.fill(); const r = rng(11);
    for (let i = 0; i < 160; i++) { g.fillStyle = "rgba(255,255,255," + r() * 0.6 + ")"; g.fillRect(r() * w, r() * h * 0.4, 1.5, 1.5); }
    for (let b = 0; b < 14; b++) { const bw = 50 + r() * 90, bh = 160 + r() * 380, bx = b * 75 - 20; g.fillStyle = "#0a0f1c"; g.fillRect(bx, h - bh, bw, bh); for (let yy = h - bh + 12; yy < h - 10; yy += 18) for (let xx = bx + 8; xx < bx + bw - 10; xx += 14) if (r() > 0.82) { g.fillStyle = r() > 0.5 ? "#ffd38a" : "#9fc4ff"; g.fillRect(xx, yy, 7, 9); } }
  }, { rep: false });
  const city = new THREE.Mesh(new THREE.PlaneGeometry(6, 4.5), new THREE.MeshBasicMaterial({ map: cityT })); city.position.set(win.x, 1.6, -4.5); R.add(city);
  const curtM = new THREE.MeshStandardMaterial({ color: 0x2c3a5c, roughness: 1, side: THREE.DoubleSide });
  for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 2.2, 6, 1), curtM); const p = c.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 28) * 0.04); c.geometry.computeVertexNormals(); c.position.set(win.x + s * (win.w / 2 + 0.2), 1.45, -2.48); R.add(c); }
  // bed: frame, mattress, pillow, blanket (head toward -z)
  const bed = new THREE.Group(); bed.position.set(-1.2, 0, -1.45); R.add(bed); B.bed = bed;
  const woodM = pbr("wood_floor_worn", [1, 1], { color: 0x9a7a5a, roughness: 0.7 });
  box(1.1, 0.3, 2.1, woodM, 0, 0.2, 0, bed); box(1.12, 0.9, 0.08, woodM, 0, 0.45, -1.06, bed); box(1.12, 0.45, 0.06, woodM, 0, 0.27, 1.06, bed);
  const sheetM = new THREE.MeshStandardMaterial({ color: 0xc9cdd6, roughness: 0.95 });
  const mat = box(1.02, 0.2, 2.0, sheetM, 0, 0.45, 0, bed);
  const pil = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), sheetM); pil.scale.set(0.38, 0.08, 0.2); pil.position.set(0, 0.59, -0.8); pil.castShadow = true; bed.add(pil);
  const blanketM = pbr("fabric_pattern_07", [1.5, 1.5], { color: 0x8890b0, roughness: 1 });
  const bg = new THREE.PlaneGeometry(1.15, 1.45, 24, 30); const bp = bg.attributes.position;
  for (let i = 0; i < bp.count; i++) { const x = bp.getX(i), y = bp.getY(i); const ridge = Math.exp(-x * x / 0.08) * 0.13; const edge = Math.max(0, Math.abs(x) - 0.48) * 1.6; bp.setZ(i, ridge - edge + Math.sin(y * 9 + x * 4) * 0.01); }
  bg.computeVertexNormals(); const blanket = new THREE.Mesh(bg, blanketM); blanket.rotation.x = -Math.PI / 2; blanket.position.set(0, 0.6, 0.27); blanket.castShadow = true; blanket.receiveShadow = true; bed.add(blanket); B.blanket = blanket;
  // rug
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1), pbr("dirty_carpet", [1, 1], { color: 0x7d6a8a })); rug.rotation.x = -Math.PI / 2; rug.position.set(0.15, 0.005, -0.6); rug.receiveShadow = true; R.add(rug);
  // posters
  const poster = (draw, x, y, z, ry, w = 0.6, h = 0.85) => { const t = ctex(400, 560, draw, { rep: false }); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 })); m.position.set(x, y, z); m.rotation.y = ry; R.add(m); };
  poster((g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#ff3d6b"); gr.addColorStop(1, "#3b1d8f"); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = "#fff"; g.font = "900 74px Mont, sans-serif"; g.textAlign = "center"; g.fillText("NEON", w / 2, 160); g.fillText("NIGHTS", w / 2, 240); g.font = "800 28px Mont"; g.fillText("WORLD TOUR 2026", w / 2, 500); g.strokeStyle = "#fff"; g.lineWidth = 6; g.beginPath(); g.arc(w / 2, 360, 70, 0, 7); g.stroke(); }, -2.03, 1.75, -0.3, Math.PI / 2);
  poster((g, w, h) => { g.fillStyle = "#101820"; g.fillRect(0, 0, w, h); g.fillStyle = "#3dff9a"; g.font = "900 60px Mont, sans-serif"; g.textAlign = "center"; g.fillText("LEVEL", w / 2, 130); g.fillText("UP", w / 2, 200); const r = rng(5); for (let i = 0; i < 40; i++) { g.fillStyle = "hsl(" + (120 + r() * 60) + ",80%,50%)"; g.fillRect(40 + r() * 320, 240 + r() * 260, 20, 20); } }, -2.03, 1.7, 0.6, Math.PI / 2, 0.5, 0.7);
  // desk + chair on the right wall
  const deskM = new THREE.MeshStandardMaterial({ color: 0xe9e6df, roughness: 0.5 });
  box(1.3, 0.04, 0.6, deskM, 1.75, 0.75, -1.4); box(0.04, 0.73, 0.55, deskM, 1.12, 0.37, -1.4); box(0.04, 0.73, 0.55, deskM, 2.0, 0.37, -1.4);
  const laptopM = new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.4, metalness: 0.5 }); box(0.36, 0.015, 0.25, laptopM, 1.75, 0.78, -1.35); const lid = box(0.36, 0.24, 0.012, laptopM, 1.75, 0.9, -1.48); lid.rotation.x = -0.25;
  // digital alarm clock on the nightstand (display drawn per frame)
  const clockT = ctex(256, 128, () => {}, { rep: false }); B.clockT = clockT;
  const night = new THREE.Group(); night.position.set(-0.32, 0, -2.15); R.add(night); B.nightstand = night;
  box(0.2, 0.09, 0.09, new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.4 }), 0.1, 0.745, 0.05, night);
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.065), new THREE.MeshBasicMaterial({ map: clockT, toneMapped: false })); disp.position.set(0.1, 0.745, 0.096); night.add(disp);
  B.clockLight = new THREE.PointLight(0xff3a2a, 0.35, 1.2, 2); B.clockLight.position.set(0.1, 0.78, 0.25); night.add(B.clockLight);
  // phone resting on the nightstand (screen texture shared with main)
  B.phoneRest = new THREE.Vector3(-0.42, 0.7 + 0.006, -2.08).add(R.position);
  // glTF furniture
  const L = new GLTFLoader(); const put = async (id, x, y, z, ry = 0, s = 1, parent = R) => { const o = (await L.loadAsync(`assets/models/${id}/${id}.gltf`)).scene; o.position.set(x, y, z); o.rotation.y = ry; o.scale.setScalar(s); o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); parent.add(o); return o; };
  await put("ClassicNightstand_01", 0, 0, 0, 0, 1, night);
  await put("desk_lamp_arm_01", 2.0, 0.77, -1.55, -2.3); await put("alarm_clock_01", 1.4, 0.77, -1.5, 0.4); await put("book_encyclopedia_set_01", 1.35, 0.77, -1.62, 0);
  await put("modern_wooden_cabinet", 1.85, 0, 1.0, -Math.PI / 2, 0.7); await put("binder_notebook", 1.6, 0.77, -1.25, 0.6);
  return B;
}

export function drawClock(B, t, flipAt) {
  const { g, w, h } = B.clockT.userData; g.fillStyle = "#050303"; g.fillRect(0, 0, w, h); g.fillStyle = "#ff2b1c"; g.shadowColor = "#ff2b1c"; g.shadowBlur = 12;
  g.font = "900 92px Mont, monospace"; g.textAlign = "center"; g.fillText(t < flipAt ? "02:59" : "03:00", w / 2, 100); g.shadowBlur = 0; B.clockT.needsUpdate = true;
}
