import * as THREE from "three";
import { stdMat } from "./tex.js";
import { ctex, rng, fbm, lerp, clamp } from "./util.js";

function boxG(w, h, d, tx, ty) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv; const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) { const [a, b] = dims[f]; for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * a / tx, uv.getY(k) * b / ty); } }
  return g;
}

export function buildWorld(scene, T) {
  const W = { anim: {}, lights: {} };
  const M = {
    wall: stdMat(T.wallPanel, { roughness: 0.92 }, 0.6), parquet: stdMat(T.parquet, { roughness: 0.42 }, 0.5), tiles: stdMat(T.tiles, { roughness: 0.38 }, 0.5),
    ceil: stdMat(T.ceilingTile, { roughness: 0.95 }, 0.4), woodL: stdMat(T.woodLight, { roughness: 0.5 }, 0.4), woodD: stdMat(T.woodDark, { roughness: 0.55 }, 0.4),
    brick: stdMat(T.brick, { roughness: 0.92 }, 0.9), conc: stdMat(T.concrete, { roughness: 0.95 }, 0.8), asphalt: stdMat(T.asphalt, { roughness: 0.95 }, 0.8),
    grass: stdMat(T.grass, { roughness: 1 }, 0.5), pavers: stdMat(T.pavers, { roughness: 0.9 }, 0.7), plaster: stdMat(T.plaster, { roughness: 0.95 }, 0.5),
    steel: new THREE.MeshStandardMaterial({ color: 0xaab3bd, roughness: 0.45, metalness: 0.3 }), dark: new THREE.MeshStandardMaterial({ color: 0x1d1f23, roughness: 0.6, metalness: 0.4 }),
    white: new THREE.MeshStandardMaterial({ color: 0xe9e8e2, roughness: 0.55 }), red: stdMat(T.paintRed, { roughness: 0.4, metalness: 0.2 }, 0.2), locker: stdMat(T.locker, { roughness: 0.45, metalness: 0.5 }, 0.1),
    glass: new THREE.MeshStandardMaterial({ color: 0x9fc3d6, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.28 }), bluemetal: stdMat(T.steelBlue, { roughness: 0.5, metalness: 0.6 }, 0.2),
    lamp: new THREE.MeshBasicMaterial({ color: 0xfff6e2 }), yellow: new THREE.MeshStandardMaterial({ color: 0xe0b32a, roughness: 0.6 }), black: new THREE.MeshStandardMaterial({ color: 0x0d0d0f, roughness: 0.7 }),
  };
  W.M = M;
  const b = (w, h, d, mat, x, y, z, parent = scene, tile = [2, 2], shadow = true) => { const m = new THREE.Mesh(boxG(w, h, d, tile[0], tile[1]), mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m; };
  const plane = (w, h, mat, x, y, z, ry = 0, parent = scene) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.y = ry; parent.add(m); return m; };
  const cyl = (r, h, mat, x, y, z, parent = scene, seg = 12) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
  const basic = (tex) => new THREE.MeshBasicMaterial({ map: tex, toneMapped: true });
  const lit = (tex, o = {}) => new THREE.MeshStandardMaterial({ map: tex.map || tex, roughness: 0.7, ...o });
  const H = 3.2;

  /* ================= classroom + corridor ================= */
  const C = new THREE.Group(); scene.add(C); W.school = C;
  // floors / ceilings
  b(7, 0.1, 9, M.parquet, 0, -0.05, 0, C, [2.4, 2.4]); b(7, 0.1, 9, M.ceil, 0, H + 0.05, 0, C, [1.2, 1.2]);
  b(28, 0.1, 3.2, M.tiles, 0, -0.05, 6.0, C, [1.2, 1.2]); b(28, 0.1, 3.2, M.ceil, 0, H + 0.05, 6.0, C, [1.2, 1.2]);
  // classroom walls: front(-z), right(+x), left(-x) with windows
  b(7.2, H, 0.2, M.wall, 0, H / 2, -4.6, C, [2.4, H]); b(0.2, H, 9.2, M.wall, 3.6, H / 2, 0, C, [2.4, H]);
  const winXs = [-2.8, -0.9, 1.0, 2.9].map((z) => z); // window centers along z (left wall)
  const wz = [-2.9, -0.5, 1.9]; const winW = 1.5, sillY = 0.95, winH = 1.55;
  { // left wall built from segments around windows
    let z0 = -4.5; for (const c of wz) { const a = c - winW / 2, bb = c + winW / 2; b(0.2, H, a - z0, M.wall, -3.6, H / 2, (z0 + a) / 2, C, [2.4, H]); b(0.2, sillY, winW, M.wall, -3.6, sillY / 2, c, C, [2.4, H]); b(0.2, H - sillY - winH, winW, M.wall, -3.6, sillY + winH + (H - sillY - winH) / 2, c, C, [2.4, H]); z0 = bb; }
    b(0.2, H, 4.5 - z0, M.wall, -3.6, H / 2, (z0 + 4.5) / 2, C, [2.4, H]);
  }
  // exterior backdrop seen through windows
  const outTex = ctex(512, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#9ec6e8"); gr.addColorStop(0.7, "#d8e8f0"); gr.addColorStop(1, "#7aa05a"); g.fillStyle = gr; g.fillRect(0, 0, w, h); const r = rng(9); for (let i = 0; i < 26; i++) { g.fillStyle = "rgba(" + (30 + r() * 30) + "," + (80 + r() * 50) + ",40,.85)"; g.beginPath(); g.arc(r() * w, h * 0.62 + r() * 30, 26 + r() * 40, 0, 7); g.fill(); } }, { rep: false });
  const outM = new THREE.MeshBasicMaterial({ map: outTex, color: 0xffffff }); plane(9.0, 6, outM, -7, 1.7, 0.0, Math.PI / 2, C);
  for (const c of wz) { // frames, glass, sill, curtains, radiators
    for (const [dy, hh, ww] of [[sillY - 0.02, 0.05, winW + 0.1], [sillY + winH + 0.02, 0.05, winW + 0.1]]) b(0.28, hh, ww, M.white, -3.58, dy, c, C, [1, 1]);
    b(0.1, winH, 0.06, M.white, -3.62, sillY + winH / 2, c - winW / 2, C); b(0.1, winH, 0.06, M.white, -3.62, sillY + winH / 2, c + winW / 2, C); b(0.08, winH, 0.04, M.white, -3.6, sillY + winH / 2, c, C); b(0.08, 0.04, winW, M.white, -3.6, sillY + winH * 0.62, c, C);
    plane(winW, winH, M.glass, 0, 0, 0, 0, C).position.set(-3.62, sillY + winH / 2, c); C.children[C.children.length - 1].rotation.y = Math.PI / 2;
    b(0.22, 0.04, winW + 0.2, M.white, -3.5, sillY - 0.05, c, C); const rad = b(0.1, 0.55, 1.0, M.white, -3.42, 0.5, c, C, [1, 1]); for (let i = 0; i < 9; i++) b(0.1, 0.5, 0.02, M.white, -3.38, 0.5, c - 0.45 + i * 0.11, C, [1, 1], false);
    const cur = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.9), new THREE.MeshStandardMaterial({ color: 0xd9c9a0, roughness: 1, side: THREE.DoubleSide })); cur.position.set(-3.45, 1.95, c - winW / 2 - 0.15); cur.rotation.y = Math.PI / 2; C.add(cur);
    const cur2 = cur.clone(); cur2.position.z = c + winW / 2 + 0.15; C.add(cur2);
    b(0.04, 0.04, winW + 0.5, M.dark, -3.44, 2.9, c, C, [1, 1]);
  }
  // pots
  for (const c of wz.slice(0, 2)) { cyl(0.09, 0.14, M.red, -3.45, sillY + 0.02 + 0.07, c + 0.35, C); const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), new THREE.MeshStandardMaterial({ color: 0x3f7a35, roughness: 0.8 })); leaf.position.set(-3.45, sillY + 0.3, c + 0.35); leaf.scale.set(1, 0.9, 1); C.add(leaf); }

  // chalkboard + teacher desk + clock + posters
  b(5.0, 1.3, 0.05, M.woodD, 0, 1.75, -4.47, C, [1, 1]); plane(4.8, 1.18, lit(T.chalkboard, { roughness: 0.9 }), 0, 1.75, -4.44, 0, C);
  b(4.8, 0.05, 0.12, M.woodD, 0, 1.09, -4.4, C, [1, 1]);
  const clk = plane(0.5, 0.5, lit(T.clock, { roughness: 0.4 }), 2.7, 2.7, -4.48, 0, C);
  T.poster.forEach((p, i) => plane(0.7, 1.0, lit(p), 3.48, 1.7, -2.6 + i * 1.5, -Math.PI / 2, C));
  b(1.5, 0.05, 0.7, M.woodL, 0, 0.78, -3.4, C, [1.2, 0.8]); b(1.5, 0.7, 0.05, M.woodD, 0, 0.4, -3.1, C, [1, 1]); b(0.05, 0.75, 0.7, M.woodD, -0.7, 0.38, -3.4, C, [1, 1]); b(0.05, 0.75, 0.7, M.woodD, 0.7, 0.38, -3.4, C, [1, 1]);
  const lap = b(0.4, 0.02, 0.28, M.dark, 0.3, 0.82, -3.35, C, [1, 1]); const lapS = b(0.4, 0.26, 0.015, M.dark, 0.3, 0.95, -3.5, C, [1, 1]); lapS.rotation.x = -0.15;
  // student desks (3 rows x 2 cols) + chairs
  W.desks = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) {
    const x = -1.9 + c * 2.0, z = -1.3 + r * 1.5; const g = new THREE.Group(); g.position.set(x, 0, z); C.add(g);
    b(1.2, 0.04, 0.55, M.woodL, 0, 0.74, 0, g, [1.2, 0.8]); b(1.15, 0.34, 0.02, M.bluemetal, 0, 0.52, -0.25, g, [1, 1]);
    for (const sx of [-0.55, 0.55]) for (const sz of [-0.22, 0.22]) b(0.035, 0.72, 0.035, M.bluemetal, sx, 0.36, sz, g, [1, 1], false);
    for (const sx of [-0.3, 0.3]) { b(0.4, 0.04, 0.4, M.woodL, sx, 0.44, 0.62, g, [1, 1]); b(0.4, 0.28, 0.03, M.woodL, sx, 0.66, 0.82, g, [1, 1]); for (const dx of [-0.17, 0.17]) for (const dz of [-0.15, 0.15]) b(0.025, 0.42, 0.025, M.bluemetal, sx + dx, 0.21, 0.62 + dz, g, [1, 1], false); }
    // books/notebook
    if ((r + c) % 2 === 0) b(0.21, 0.025, 0.28, new THREE.MeshStandardMaterial({ color: 0x2b6aa8, roughness: 0.7 }), 0.1, 0.77, 0.02, g, [1, 1]); W.desks.push({ x, z, g });
  }
  // alarm strobe + bell (classroom back wall, left of door) and exit door
  const alarmBox = b(0.22, 0.18, 0.1, M.red, 1.0, 2.35, 4.35, C, [1, 1]); const strobeM = new THREE.MeshBasicMaterial({ color: 0xff2a1a }); const strobe = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), strobeM); strobe.position.set(1.0, 2.35, 4.27); C.add(strobe);
  W.anim.strobe = strobe; 

  /* corridor */
  // south wall (z=7.5) and end walls
  b(28.2, H, 0.2, M.wall, 0, H / 2, 7.6, C, [2.4, H]); b(0.2, H, 3.2, M.wall, 14.1, H / 2, 6.0, C, [2.4, H]); b(0.2, H, 3.2, M.wall, -14.1, H / 2, 6.0, C, [2.4, H]);
  // north wall (z=4.5) between classroom door and rest (classroom back wall lives here)
  const nz = 4.6; const door = { x0: 1.6, x1: 2.6, h: 2.2 };
  b(door.x0 + 14.1, H, 0.2, M.wall, (-14.1 + door.x0) / 2, H / 2, nz, C, [2.4, H]); b(14.1 - door.x1, H, 0.2, M.wall, (door.x1 + 14.1) / 2, H / 2, nz, C, [2.4, H]); b(door.x1 - door.x0, H - door.h, 0.2, M.wall, (door.x0 + door.x1) / 2, door.h + (H - door.h) / 2, nz, C, [2.4, H]);
  b(1.1, 2.3, 0.05, M.woodD, 2.1, 1.15, 4.52, C, [1, 1]); // doorway lining (frame)
  const mkDoor = (parent, w, h, glass) => { const piv = new THREE.Group(); parent.add(piv); const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), [M.woodD, M.woodD, M.woodD, M.woodD, lit(glass ? T.doorGlass : T.door, { roughness: 0.55 }), lit(glass ? T.doorGlass : T.door, { roughness: 0.55 })]); m.position.set(-w / 2, h / 2, 0); m.castShadow = true; m.receiveShadow = true; piv.add(m); const hd = b(0.12, 0.03, 0.08, M.steel, -w + 0.12, 1.05, 0.06, piv, [1, 1]); const hd2 = hd.clone(); hd2.position.z = -0.06; piv.add(hd2); return piv; };
  W.anim.doorClass = mkDoor(C, 1.0, 2.2, true); W.anim.doorClass.position.set(2.6, 0, 4.56);
  // other classroom doors in the corridor north wall + signs
  [[-5, 0], [-9, 1], [6, 2], [10, 0]].forEach(([x, k]) => { const d = mkDoor(C, 1.0, 2.2, k !== 1); d.position.set(x + 0.5, 0, 4.7); b(1.1, 2.3, 0.04, M.woodD, x, 1.15, 4.69, C, [1, 1]); plane(0.5, 0.25, lit([T.room1, T.room2, T.room3][k], { roughness: 0.5 }), x + 1.35, 2.0, 4.71, 0, C); });
  // lockers on south wall
  for (let i = 0; i < 12; i++) { const x = -13.4 + i * 0.45; if (x > -7.7 && x < -5.1) continue; const m = new THREE.Mesh(boxG(0.44, 1.95, 0.45, 1, 1), M.locker); m.geometry = new THREE.BoxGeometry(0.44, 1.95, 0.45); m.position.set(x, 0.98, 7.27); m.castShadow = true; m.receiveShadow = true; C.add(m); }
  for (let i = 0; i < 8; i++) { const x = 5.6 + i * 0.45; const m = new THREE.Mesh(new THREE.BoxGeometry(0.44, 1.95, 0.45), M.locker); m.position.set(x, 0.98, 7.27); m.castShadow = true; m.receiveShadow = true; C.add(m); }
  // benches
  b(2.2, 0.05, 0.4, M.woodL, -11.2, 0.45, 5.0, C, [1.2, 0.5]); b(0.05, 0.45, 0.35, M.dark, -12.0, 0.22, 5.0, C, [1, 1]); b(0.05, 0.45, 0.35, M.dark, -10.4, 0.22, 5.0, C, [1, 1]);
  // evacuation plan, extinguishers, bulletin board, exit sign, elevator, stairwell door
  W.plan = plane(0.9, 1.26, lit(T.fireplan, { roughness: 0.5 }), -0.2, 1.55, 7.49, Math.PI, C); b(0.96, 1.32, 0.03, M.dark, -0.2, 1.55, 7.51, C, [1, 1]);
  const extFor = (x) => { const g = new THREE.Group(); g.position.set(x, 0, 7.4); C.add(g); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.55, 14), M.red); body.position.y = 1.0; body.castShadow = true; g.add(body); cyl(0.045, 0.1, M.black, 0, 1.32, 0, g); b(0.08, 0.04, 0.12, M.black, 0.03, 1.38, 0.02, g, [1, 1]); plane(0.3, 0.3, lit(ctex(64, 64, (c, w, h) => { c.fillStyle = "#c2202b"; c.fillRect(0, 0, w, h); c.fillStyle = "#fff"; c.font = "900 30px Mont"; c.textAlign = "center"; c.fillText("🔥", 32, 44); }, { rep: false })), 0, 1.85, 0.08 - 0.02, Math.PI, g); return g; };
  W.extGroups = [extFor(8.2), extFor(-2.3)];
  b(1.6, 1.0, 0.04, M.woodD, 9.5, 1.6, 7.47, C, [1, 1]); plane(1.5, 0.9, lit(T.poster[1]), 9.5, 1.6, 7.44, Math.PI, C);
  const exitM = new THREE.MeshBasicMaterial({ map: T.exitSign.map || T.exitSign }); W.anim.exitM = exitM; b(0.7, 0.26, 0.08, M.dark, -13.5, 2.9, 5.0, C, [1, 1]); plane(0.66, 0.24, exitM, -13.5, 2.9, 5.05, 0, C); // faces +z
  b(0.7, 0.26, 0.08, M.dark, -6.4, 2.75, 7.4, C, [1, 1]); plane(0.66, 0.24, exitM, -6.4, 2.75, 7.35, Math.PI, C); const exSign2 = plane(0.66, 0.24, exitM, -2, 2.9, 7.0, Math.PI, C); exSign2.visible = false;
  b(0.7, 0.26, 0.08, M.dark, -3.6, 2.85, 7.4, C, [1, 1]); // elevator header
  { // elevator
    const ex = -3.6; b(2.0, 2.5, 0.1, M.steel, ex, 1.25, 7.46, C, [1, 1]); W.anim.elevL = b(0.5, 2.2, 0.03, M.steel, ex - 0.25, 1.1, 7.4, C, [1, 1]); W.anim.elevR = b(0.5, 2.2, 0.03, M.steel, ex + 0.25, 1.1, 7.4, C, [1, 1]);
    b(0.18, 0.4, 0.04, M.dark, ex + 1.2, 1.15, 7.45, C, [1, 1]); const call = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff3b1f })); call.position.set(ex + 1.2, 1.2, 7.42); C.add(call); W.anim.call = call;
    plane(0.34, 0.34, lit(T.noElevator, { roughness: 0.5 }), ex + 1.2, 1.7, 7.43, Math.PI, C);
  }
  // stairwell door (south wall) at x=-8.4
  b(1.3, 2.4, 0.06, M.dark, -6.4, 1.2, 7.52, C, [1, 1]); W.anim.doorStairCor = mkDoor(C, 1.1, 2.2, true); W.anim.doorStairCor.position.set(-5.95, 0, 7.44);
  // end door (exit to outside) with daylight beyond
  b(0.12, 0.12, 2.6, M.dark, -13.95, 2.2, 6.0, C, [1, 1]); const exL = mkDoor(C, 1.2, 2.2, true), exR = mkDoor(C, 1.2, 2.2, true); exL.position.set(-13.95, 0, 4.75); exL.rotation.y = Math.PI / 2; exR.position.set(-13.95, 0, 7.45); exR.rotation.y = -Math.PI / 2; W.anim.exitL = exL; W.anim.exitR = exR;
  const dayTex = ctex(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#bfe0ff"); gr.addColorStop(1, "#fff6e0"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, { rep: false });
  plane(3.4, 3.0, new THREE.MeshBasicMaterial({ map: dayTex, color: 0xb8b8b8 }), -15.0, 1.5, 6.0, Math.PI / 2, C);
  
  // fluorescent lamps in corridor and classroom
  W.lamps = [];
  const lamp = (x, y, z, l, w, parent) => { const m = new THREE.Mesh(new THREE.BoxGeometry(l, 0.06, w), new THREE.MeshBasicMaterial({ color: 0xfff6e2 })); m.position.set(x, y, z); parent.add(m); b(l + 0.1, 0.04, w + 0.1, M.white, x, y + 0.04, z, parent, [1, 1], false); W.lamps.push(m); return m; };
  for (let i = 0; i < 7; i++) lamp(-12 + i * 4, H - 0.02, 6.0, 1.4, 0.2, C); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) lamp(-1.8 + j * 3.6, H - 0.02, -2.6 + i * 2.8, 1.3, 0.2, C);
  // under-door glow + corridor fire at +x end
  W.anim.doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.12), new THREE.MeshBasicMaterial({ color: 0xff6a1a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); W.anim.doorGlow.position.set(2.1, 0.07, 4.545); C.add(W.anim.doorGlow);
  W.anim.doorGlowOut = W.anim.doorGlow.clone(); W.anim.doorGlowOut.material = W.anim.doorGlow.material.clone(); W.anim.doorGlowOut.position.set(2.1, 0.07, 4.6); W.anim.doorGlowOut.rotation.y = Math.PI; C.add(W.anim.doorGlowOut);
  // burning pile at corridor end
  W.fireEnd = [12.3, 0, 6.0];
  

  /* ================= stairwell ================= */
  const S = new THREE.Group(); S.position.set(0, 0, 60); scene.add(S); W.stair = S;
  const sw = 2.6; // clear width
  b(sw + 0.4, 0.2, 12.4, M.conc, 0.5, -0.1 - 0.0, -3.4, S, [2, 2]); // top landing slab (also under steps visually)
  const rise = 0.17, run = 0.28; W.stairPath = [];
  // flight 1: x in [-0.8,0.8], descends along -z from z=0.4
  for (let i = 1; i <= 12; i++) b(1.6, rise, run, M.conc, 0, -rise * i + rise / 2 - 0.0, -run * i + 0.4, S, [1, 1]);
  const landY = -rise * 12; b(2.8, 0.12, 1.6, M.conc, 0.6, landY - 0.06, -0.28 * 12 - 0.2, S, [2, 2]);
  for (let i = 1; i <= 12; i++) b(1.2, rise, run, M.conc, 1.2, landY - rise * i + rise / 2, -0.28 * 12 - 1.0 + run * i, S, [1, 1]);
  // yellow nosing strips
  for (let i = 1; i <= 12; i++) b(1.6, 0.012, 0.035, M.yellow, 0, -rise * i + 0.005, -run * i + 0.4 + run / 2 - 0.02, S, [1, 1], false);
  // walls (painted lower green) + floors
  b(0.2, 8.0, 12.2, M.wall, -1.1, -1.7, -3.2, S, [2.4, H]); b(0.2, 8.0, 12.2, M.wall, 2.3, -1.7, -3.2, S, [2.4, H]); b(3.4, 8.0, 0.2, M.wall, 0.6, -1.7, -9.4, S, [2.4, H]); b(3.4, 8.0, 0.2, M.wall, 0.6, -1.7, 2.4, S, [2.4, H]);
  b(3.4, 0.1, 12.2, M.ceil, 0.6, 2.9, -3.2, S, [1.2, 1.2]);
  // railing (between flights) + handrails
  for (let i = 0; i <= 12; i++) { cyl(0.018, 0.9, M.dark, 0.75, -rise * i + 0.45 - 0.0, -run * i + 0.4, S, 8); }
  const rail = b(0.05, 0.04, 3.7, M.dark, 0.75, 0.9, -1.4, S, [1, 1]); rail.rotation.x = Math.atan2(rise, run);
  // window with daylight on the landing wall (back wall at z=-9.4) and a lamp
  const winL = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.8), new THREE.MeshBasicMaterial({ map: dayTex, color: 0xffffff })); winL.position.set(0.6, landY + 1.8, -9.29); S.add(winL); b(1.7, 0.08, 0.12, M.white, 0.6, landY + 0.85, -9.3, S, [1, 1]);
  b(0.7, 0.26, 0.08, M.dark, 1.2, landY + 3.2 - 0.1, -9.2, S, [1, 1]); plane(0.66, 0.24, exitM, 1.2, landY + 3.1, -9.16, 0, S);
  W.stairLamps = [0, 1, 2].map((k) => lamp(0.6, 2.82 - k * 0.001, -1.2 - k * 3.4, 1.3, 0.2, S));
  W.anim.doorStairTop = mkDoor(S, 1.1, 2.2, true); W.anim.doorStairTop.position.set(0.55, 0.0, 2.3);
  
  W.stairPoint = (u) => { // u 0..1 along the path -> {x,y,z,yaw}
    const pts = [[0, 0, 3.4], [0, 0, 0.4], [0, -rise * 12, -0.28 * 12 + 0.4], [0.6, landY, -0.28 * 12 - 0.5], [1.2, landY, -0.28 * 12 - 1.0], [1.2, landY - rise * 12, -0.28 * 12 - 1.0 + 0.28 * 12]]; const n = pts.length - 1; const f = Math.min(0.9999, u) * n, i = Math.floor(f), k = f - i;
    const a = pts[i], c = pts[i + 1]; return { x: lerp(a[0], c[0], k), y: lerp(a[1], c[1], k), z: lerp(a[2], c[2], k) + 60 };
  };

  /* ================= exterior ================= */
  const X = new THREE.Group(); X.position.set(0, 0, -120); scene.add(X); W.ext = X;
  b(260, 0.3, 200, M.grass, 0, -0.17, 40, X, [6, 6]);
  b(80, 0.12, 30, M.pavers, 0, 0.0, 20, X, [4, 4]); b(260, 0.1, 22, M.asphalt, 0, -0.03, 62, X, [8, 8]);
  for (let i = -10; i < 10; i++) b(2.4, 0.01, 0.2, M.white, i * 8, 0.04, 62, X, [1, 1], false);
  const bw = 46, bh = 11.4; // building
  b(bw / 2 - 1.6, bh, 1.0, M.brick, -(bw / 2 + 1.6) / 2, bh / 2, 0, X, [4, 4]); b(bw / 2 - 1.6, bh, 1.0, M.brick, (bw / 2 + 1.6) / 2, bh / 2, 0, X, [4, 4]); b(3.2, bh - 2.9, 1.0, M.brick, 0, 2.9 + (bh - 2.9) / 2, 0, X, [4, 4]);
  b(3.2, 3.0, 0.1, new THREE.MeshBasicMaterial({ color: 0xffe2b0 }), 0, 1.5, -2.4, X, [1, 1], false); b(0.2, 3.0, 2.4, M.wall, -1.7, 1.5, -1.2, X, [2.4, 3.2]); b(0.2, 3.0, 2.4, M.wall, 1.7, 1.5, -1.2, X, [2.4, 3.2]); b(3.6, 0.1, 2.4, M.tiles, 0, -0.05, -1.2, X, [1.2, 1.2]); b(bw + 0.8, 0.5, 1.5, M.conc, 0, bh + 0.25, 0.2, X, [3, 3]); b(bw + 0.2, 0.7, 1.2, M.conc, 0, 0.35, 0.1, X, [3, 3]);
  for (let f = 1; f < 3; f++) b(bw + 0.2, 0.3, 1.2, M.conc, 0, f * 3.7 + 0.15, 0.1, X, [3, 3], false);
  const glassM = new THREE.MeshStandardMaterial({ color: 0x1e3550, roughness: 0.08, metalness: 0.6 }), warmM = new THREE.MeshBasicMaterial({ color: 0xffd9a0 });
  W.fireWins = []; W.winMats = [];
  for (let f = 0; f < 3; f++) for (let i = 0; i < 11; i++) {
    const x = -20 + i * 4, y = 2.0 + f * 3.7; if (f === 0 && (i === 5)) continue;
    const isFire = f === 1 && (i === 3 || i === 4); const m = isFire ? new THREE.MeshBasicMaterial({ color: 0xff8a2a }) : (hashW(f * 11 + i) > 0.55 ? warmM : glassM);
    plane(1.7, 2.0, m, x, y, 0.52, 0, X); if (isFire) W.fireWins.push(m);
    b(1.9, 0.12, 0.3, M.white, x, y - 1.05, 0.62, X, [1, 1], false); b(1.9, 0.1, 0.2, M.white, x, y + 1.05, 0.58, X, [1, 1], false); b(0.1, 2.1, 0.2, M.white, x - 0.9, y, 0.58, X, [1, 1], false); b(0.1, 2.1, 0.2, M.white, x + 0.9, y, 0.58, X, [1, 1], false); b(0.07, 2.0, 0.15, M.white, x, y, 0.56, X, [1, 1], false);
  }
  function hashW(n) { const s = Math.sin(n * 91.7) * 4375.5; return s - Math.floor(s); }
  // soot stains above fire windows
  const sootTex = ctex(128, 256, (g, w, h) => { const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, "rgba(10,8,6,.85)"); gr.addColorStop(1, "rgba(10,8,6,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, { rep: false });
  plane(9.5, 6.5, new THREE.MeshBasicMaterial({ map: sootTex, transparent: true, depthWrite: false }), -10 + 2 + 0.0, 7.2, 0.55, 0, X);
  // entrance porch
  b(8, 0.25, 3.5, M.conc, 0, 3.4, 2.1, X, [3, 3]); for (const cx of [-3.4, -1.15, 1.15, 3.4]) b(0.6, 3.3, 0.6, M.conc, cx, 1.65, 3.5, X, [2, 2]);
  for (let i = 0; i < 4; i++) b(8, 0.15, 0.4, M.conc, 0, 0.08 + i * 0.15, 4.6 - i * 0.4, X, [2, 2]);
  const doorGlass = new THREE.MeshStandardMaterial({ color: 0x516a7e, roughness: 0.35, metalness: 0.25 }); W.anim.entL = b(1.5, 2.6, 0.08, doorGlass, -0.8, 1.35, 0.56, X, [1, 1]); W.anim.entR = b(1.5, 2.6, 0.08, doorGlass, 0.8, 1.35, 0.56, X, [1, 1]); W.anim.entL.userData.x0 = -0.8; W.anim.entR.userData.x0 = 0.8;
  const signT = ctex(512, 128, (g, w, h) => { g.fillStyle = "#1f4d8a"; g.fillRect(0, 0, w, h); g.fillStyle = "#fff"; g.font = "900 64px Mont, sans-serif"; g.textAlign = "center"; g.fillText("ШКОЛА № 7", w / 2, 88); g.strokeStyle = "#fff"; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16); }, { rep: false });
  plane(4.8, 1.2, lit(signT, { roughness: 0.4 }), 0, 4.4, 0.55, 0, X);
  // fence + lamp posts + trees
  for (let i = -24; i <= 24; i++) { b(0.05, 1.5, 0.05, M.dark, i * 1.5, 0.75, 38, X, [1, 1], false); } b(74, 0.05, 0.05, M.dark, 0, 1.3, 38, X, [1, 1], false); b(74, 0.05, 0.05, M.dark, 0, 0.4, 38, X, [1, 1], false);
  const trunkM = new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 1 }); const leafMs = [0x3f7d32, 0x4f8f3a, 0x35682b].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 }));
  const tree = (x, z, s) => { const g = new THREE.Group(); g.position.set(x, 0, z); X.add(g); cyl(0.2 * s, 3.2 * s, trunkM, 0, 1.6 * s, 0, g, 8); const r = rng((x * 7 + z * 3) | 0); for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry((1.4 + r() * 0.9) * s, 1), leafMs[i % 3]); m.position.set((r() - 0.5) * 2.2 * s, (3.6 + r() * 2.2) * s, (r() - 0.5) * 2.2 * s); m.castShadow = true; g.add(m); } };
  [[-30, 12], [-24, 28], [-14, 24], [14, 26], [24, 14], [30, 30], [-34, 30], [36, 10], [-8, 44], [10, 46]].forEach(([x, z], i) => tree(x, z, 0.9 + (i % 3) * 0.2));
  // sky dome
  const skyT = ctex(512, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#27508a"); gr.addColorStop(0.45, "#8fb7da"); gr.addColorStop(0.62, "#f4d6a0"); gr.addColorStop(0.7, "#d98f5c"); gr.addColorStop(1, "#5a3b3b"); g.fillStyle = gr; g.fillRect(0, 0, w, h); const r = rng(4); for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(255,255,255," + (0.05 + r() * 0.12) + ")"; g.beginPath(); g.ellipse(r() * w, 100 + r() * 190, 40 + r() * 90, 8 + r() * 14, 0, 0, 7); g.fill(); } }, { rep: false });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(380, 24, 16), new THREE.MeshBasicMaterial({ map: skyT, side: THREE.BackSide, fog: false })); sky.position.set(0, 0, -60); scene.add(sky); W.sky = sky;
  /* fire trucks */
  W.trucks = [];
  const truck = (x, z, ry) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; X.add(g);
    b(2.5, 1.9, 5.6, M.red, 0, 1.55, -0.6, g, [2, 2]); b(2.5, 1.6, 2.0, M.red, 0, 1.35, 3.0, g, [2, 2]); b(2.3, 0.7, 0.05, new THREE.MeshStandardMaterial({ color: 0x1b2833, roughness: 0.1, metalness: 0.7 }), 0, 1.8, 4.05, g, [1, 1]);
    b(2.52, 0.18, 7.8, M.white, 0, 1.2, 0.4, g, [1, 1], false); b(2.2, 0.35, 0.4, M.dark, 0, 0.38, 3.6, g, [1, 1]);
    for (const sx of [-1.25, 1.25]) for (const sz of [-2.2, 2.8]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 18), M.black); w.rotation.z = Math.PI / 2; w.position.set(sx, 0.55, sz); w.castShadow = true; g.add(w); }
    const lad = b(0.5, 0.18, 6.0, M.steel, 0, 2.65, -0.7, g, [1, 1]); for (let i = 0; i < 9; i++) b(0.5, 0.05, 0.05, M.steel, 0, 2.58, -3.4 + i * 0.66, g, [1, 1], false);
    const lA = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff2a1a })), lB = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), new THREE.MeshBasicMaterial({ color: 0x2a6aff }));
    lA.position.set(-0.7, 2.28, 3.1); lB.position.set(0.7, 2.28, 3.1); g.add(lA); g.add(lB); W.trucks.push({ g, lA, lB }); return g;
  };
  truck(-8, 52, Math.PI + 0.25); truck(9, 56, Math.PI - 0.15); W.truckGroup = null;
  /* kids */
  W.kids = [];
  const kidCols = [0xd94c4c, 0x4c8fd9, 0xe0b32a, 0x58a55c, 0x9a5ac4, 0xe07a2b, 0x4cb8c4, 0xc45a8a];
  const kid = (x, z, c, s, i) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); X.add(g); const sk = new THREE.MeshStandardMaterial({ color: 0xe0ac8a, roughness: 0.7 }), cl = new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }), jn = new THREE.MeshStandardMaterial({ color: 0x2c3550, roughness: 0.9 });
    for (const sx of [-0.09, 0.09]) { const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.65, 3, 8), jn); l.position.set(sx, 0.42, 0); g.add(l); } const t = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.4, 4, 10), cl); t.position.y = 1.1; t.castShadow = true; g.add(t);
    for (const sx of [-0.23, 0.23]) { const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.45, 3, 8), cl); a.position.set(sx, 1.08, 0); g.add(a); } const hd = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), sk); hd.position.y = 1.58; hd.castShadow = true; g.add(hd);
    const hr = new THREE.Mesh(new THREE.SphereGeometry(0.135, 14, 8, 0, 7, 0, 1.3), new THREE.MeshStandardMaterial({ color: [0x2a1b10, 0x5a3a1f, 0xc9a050, 0x111][i % 4], roughness: 0.8 })); hr.position.y = 1.6; g.add(hr);
    const bp = b(0.3, 0.38, 0.14, new THREE.MeshStandardMaterial({ color: kidCols[(i + 3) % 8], roughness: 0.8 }), 0, 1.15, -0.2, g, [1, 1]); W.kids.push({ g, y0: 0, i }); return g; };
  for (let i = 0; i < 16; i++) { const r = rng(i * 13 + 5); kid(-14 + (i % 8) * 1.1 + r() * 0.6, 32 - Math.floor(i / 8) * 1.2 + r() * 0.6, kidCols[i % 8], 0.78 + r() * 0.18, i); }
  W.kidsBase = W.kids.map((k) => k.g.position.clone());
  // light posts
  [[-26, 30], [26, 30], [-26, 70], [26, 70]].forEach(([x, z]) => { cyl(0.07, 6, M.dark, x, 3, z, X, 8); b(0.8, 0.12, 0.3, M.dark, x + 0.4, 6, z, X, [1, 1], false); });
  W.extFire = { pos: [-10 + 2 + 0.0, 4.4, 120 - 120 + 0.7] };
  return W;
}
