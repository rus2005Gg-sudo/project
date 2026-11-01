import * as THREE from "three";
import { stdMat } from "./tex.js";
import { lerp, clamp } from "./util.js";

/* Procedural muscular human with a joint hierarchy: torso, neck, head with face, arms with five-finger hands, legs.
   Local frame: forward = +Z, up = +Y, character's left = +X. Joint rotations are Euler XYZ (radians).
   x<0 raises an arm/thigh forward; spine/head x>0 leans forward; knee/elbow flex: knee x>0, elbow x<0. */

const lathe = (pts, seg = 20) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
const sph = (r, ws = 16, hs = 12) => new THREE.SphereGeometry(r, ws, hs);

export function makeHuman(T) {
  const skinM = stdMat(T.skin, { roughness: 0.6 }, 0.1);
  const shirtM = stdMat(T.knit, { roughness: 0.8 }, 0.12);
  const jeansM = stdMat(T.denim, { roughness: 0.85 }, 0.12);
  const hairM = stdMat(T.hairTex, { roughness: 0.5 }, 0.25);
  const shoeM = stdMat(T.sneaker, { roughness: 0.6 }, 0.1);
  const soleM = new THREE.MeshStandardMaterial({ color: 0x2b2b2e, roughness: 0.9 });
  const whiteM = new THREE.MeshStandardMaterial({ color: 0xf2efe9, roughness: 0.3 });
  const irisM = new THREE.MeshStandardMaterial({ color: 0x3a2a1e, roughness: 0.2 });
  const lipM = new THREE.MeshStandardMaterial({ color: 0x8a4a46, roughness: 0.5 });
  const browM = new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.8 });

  const root = new THREE.Group();
  const J = {}; // joints
  const mk = (name, parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); J[name] = g; return g; };
  const add = (geo, mat, parent, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; parent.add(m); return m; };

  /* --- hips / torso --- */
  const hips = mk("hips", root, 0, 0.965, 0);
  add(sph(0.125, 20, 14), jeansM, hips, 0, -0.045, 0, 1.1, 0.8, 0.78);
  add(sph(0.075, 14, 10), jeansM, hips, 0.07, -0.07, -0.05, 1, 1.1, 1); add(sph(0.075, 14, 10), jeansM, hips, -0.07, -0.07, -0.05, 1, 1.1, 1);
  const spine = mk("spine", hips, 0, 0.04, 0);
  add(lathe([[0.001, -0.115], [0.15, -0.115], [0.145, -0.04], [0.145, 0.02], [0.15, 0.1], [0.162, 0.2], [0.001, 0.22]], 22), shirtM, spine, 0, 0, 0, 1, 1, 0.72);
  const chest = mk("chest", spine, 0, 0.18, 0);
  add(lathe([[0.001, -0.02], [0.158, -0.02], [0.19, 0.08], [0.205, 0.19], [0.2, 0.27], [0.15, 0.335], [0.07, 0.37], [0.001, 0.375]], 24), shirtM, chest, 0, 0, 0, 1, 1, 0.7);
  add(sph(0.088, 16, 12), shirtM, chest, 0.085, 0.2, 0.07, 1, 0.8, 0.62); add(sph(0.088, 16, 12), shirtM, chest, -0.085, 0.2, 0.07, 1, 0.8, 0.62); // pecs
  add(sph(0.11, 16, 12), shirtM, chest, 0.12, 0.14, -0.07, 0.9, 1.4, 0.55); add(sph(0.11, 16, 12), shirtM, chest, -0.12, 0.14, -0.07, 0.9, 1.4, 0.55); // lats
  add(sph(0.1, 16, 12), shirtM, chest, 0.07, 0.33, -0.03, 1.4, 0.55, 0.9); add(sph(0.1, 16, 12), shirtM, chest, -0.07, 0.33, -0.03, 1.4, 0.55, 0.9); // traps
  const neck = mk("neck", chest, 0, 0.355, 0.005);
  add(new THREE.CylinderGeometry(0.052, 0.058, 0.11, 14), skinM, neck, 0, 0.04, 0);
  add(new THREE.CylinderGeometry(0.056, 0.062, 0.05, 14), shirtM, neck, 0, -0.005, 0);

  /* --- head --- */
  const head = mk("head", neck, 0, 0.09, 0.01); head.scale.setScalar(1.1);
  add(lathe([[0.001, -0.012], [0.03, -0.006], [0.054, 0.02], [0.07, 0.06], [0.08, 0.1], [0.085, 0.14], [0.082, 0.18], [0.066, 0.215], [0.036, 0.232], [0.001, 0.237]], 32), skinM, head, 0, 0, 0.0, 1.02, 0.9, 1.1);
  add(sph(1, 14, 10), skinM, head, 0, 0.066, 0.092, 0.009, 0.018, 0.014); // nose bridge
  add(sph(1, 14, 10), skinM, head, 0, 0.05, 0.1, 0.012, 0.01, 0.012); // nose tip
  add(sph(1, 12, 10), skinM, head, 0.087, 0.098, -0.005, 0.014, 0.03, 0.02); add(sph(1, 12, 10), skinM, head, -0.087, 0.098, -0.005, 0.014, 0.03, 0.02); // ears
  const eyes = {};
  for (const s of [1, -1]) {
    const eye = mk("eye" + (s > 0 ? "L" : "R"), head, 0.034 * s, 0.112, 0.082);
    add(sph(1, 14, 10), whiteM, eye, 0, 0, 0, 0.0145, 0.011, 0.01); add(sph(1, 12, 10), irisM, eye, 0, 0, 0.007, 0.0075, 0.0075, 0.004); eyes[s] = eye;
    const lid = add(new THREE.BoxGeometry(0.034, 0.003, 0.006), skinM, head, 0.034 * s, 0.125, 0.087); lid.userData.lid = true; eyes["lid" + s] = lid;
    const brow = add(new THREE.BoxGeometry(0.036, 0.0075, 0.008), browM, head, 0.036 * s, 0.14, 0.087); brow.rotation.z = -0.1 * s; eyes["brow" + s] = brow;
  }
  const mouth = add(new THREE.BoxGeometry(0.036, 0.007, 0.01), lipM, head, 0, 0.026, 0.092); // mouth
  const mouthIn = add(new THREE.BoxGeometry(0.03, 0.002, 0.008), new THREE.MeshBasicMaterial({ color: 0x1a0a0a }), head, 0, 0.026, 0.095);
  // hair: top cap, nape, sideburns
  add(new THREE.SphereGeometry(1, 28, 18, 0, Math.PI * 2, 0, 1.0), hairM, head, 0, 0.108, -0.006, 0.1015, 0.118, 0.118);
  add(new THREE.SphereGeometry(1, 28, 14, Math.PI, Math.PI, 1.0, 0.95), hairM, head, 0, 0.108, -0.006, 0.1, 0.118, 0.116);
  

  /* --- arms --- */
  const fingers = { L: [], R: [] }; const hands = {};
  const ARM = [0.30, 0.27];
  for (const [side, s] of [["L", 1], ["R", -1]]) {
    const sh = mk("s" + side, chest, 0.215 * s, 0.30, 0);
    add(sph(0.07, 18, 14), shirtM, sh, 0.008 * s, -0.005, 0, 1.0, 1.12, 1.0); // deltoid
    add(lathe([[0.001, 0.01], [0.062, 0.0], [0.074, -0.09], [0.072, -0.17], [0.056, -0.25], [0.049, -ARM[0]], [0.001, -ARM[0] - 0.005]], 18), shirtM, sh);
    const el = mk("e" + side, sh, 0, -ARM[0], 0);
    add(sph(0.043, 12, 10), shirtM, el);
    add(lathe([[0.001, 0.005], [0.05, 0.0], [0.055, -0.05], [0.047, -0.15], [0.037, -ARM[1]], [0.001, -ARM[1] - 0.003]], 16), shirtM, el);
    add(new THREE.CylinderGeometry(0.0385, 0.0385, 0.012, 14), skinM, el, 0, -ARM[1] + 0.003, 0); // cuff gap skin
    const wr = mk("w" + side, el, 0, -ARM[1], 0);
    const hr = new THREE.Group(); hr.rotation.y = -s * Math.PI / 2; wr.add(hr); hands[side] = hr; // local +Z = palm direction, thumb on local +X for L
    add(sph(1, 16, 12), skinM, hr, 0, -0.045, 0, 0.037, 0.05, 0.018); // palm
    add(sph(1, 12, 10), skinM, hr, 0.027 * s * -1 * -1, -0.02, 0.006, 0.02, 0.03, 0.016); // thenar
    const lens = [[0.032, 0.022, 0.018, 0.0098], [0.036, 0.025, 0.019, 0.0102], [0.033, 0.023, 0.018, 0.0098], [0.026, 0.017, 0.015, 0.0088]];
    const xs = [0.03, 0.01, -0.01, -0.03], thumbSide = s; // thumb on +X for left hand, -X for right
    const fl = [];
    for (let f = 0; f < 4; f++) {
      const [l1, l2, l3, r] = lens[f]; const x = xs[f] * thumbSide;
      const j1 = new THREE.Group(); j1.position.set(x, -0.088, 0.003); hr.add(j1); add(new THREE.CapsuleGeometry(r, l1, 3, 8), skinM, j1, 0, -l1 / 2, 0);
      const j2 = new THREE.Group(); j2.position.set(0, -l1 - r * 0.6, 0); j1.add(j2); add(new THREE.CapsuleGeometry(r * 0.93, l2, 3, 8), skinM, j2, 0, -l2 / 2, 0);
      const j3 = new THREE.Group(); j3.position.set(0, -l2 - r * 0.55, 0); j2.add(j3); add(new THREE.CapsuleGeometry(r * 0.85, l3, 3, 8), skinM, j3, 0, -l3 / 2, 0);
      fl.push([j1, j2, j3]);
    }
    // thumb: 2 phalanges
    const tb1 = new THREE.Group(); tb1.position.set(0.032 * thumbSide, -0.035, 0.012); tb1.rotation.z = -0.55 * thumbSide; tb1.rotation.x = -0.25; hr.add(tb1);
    add(new THREE.CapsuleGeometry(0.0115, 0.032, 3, 8), skinM, tb1, 0, -0.018, 0);
    const tb2 = new THREE.Group(); tb2.position.set(0, -0.042, 0); tb1.add(tb2); add(new THREE.CapsuleGeometry(0.0105, 0.026, 3, 8), skinM, tb2, 0, -0.015, 0);
    fingers[side] = { f: fl, tb: [tb1, tb2], thumbSide, thumbBase: [tb1.rotation.x, tb1.rotation.z] };
  }

  /* --- legs --- */
  for (const [side, s] of [["L", 1], ["R", -1]]) {
    const hp = mk("h" + side, hips, 0.093 * s, -0.05, 0);
    add(lathe([[0.001, 0.02], [0.105, 0.0], [0.116, -0.1], [0.1, -0.25], [0.078, -0.36], [0.064, -0.43], [0.001, -0.435]], 18), jeansM, hp);
    const kn = mk("k" + side, hp, 0, -0.43, 0);
    add(sph(0.062, 12, 10), jeansM, kn);
    add(lathe([[0.001, 0.0], [0.064, -0.0], [0.07, -0.1], [0.06, -0.26], [0.044, -0.4], [0.001, -0.42]], 16), jeansM, kn);
    const an = mk("a" + side, kn, 0, -0.42, 0);
    add(sph(0.045, 12, 10), jeansM, an, 0, 0.0, 0);
    add(sph(1, 18, 12), shoeM, an, 0, -0.045, 0.04, 0.052, 0.045, 0.125); // sneaker body
    add(sph(1, 14, 10), shoeM, an, 0, -0.04, 0.1, 0.048, 0.036, 0.07); // toe box
    add(new THREE.BoxGeometry(0.098, 0.022, 0.255), soleM, an, 0, -0.082, 0.04);
  }

  /* --- mapping & posing --- */
  const names = ["hips", "spine", "chest", "neck", "head", "sL", "eL", "wL", "sR", "eR", "wR", "hL", "kL", "aL", "hR", "kR", "aR"];
  const hipBase = hips.position.y;
  // wrist joints: rotation applies to the wrist group (hand root sits inside it)
  function apply(p) {
    for (const n of names) { const r = p[n] || [0, 0, 0]; J[n].rotation.set(r[0], r[1], r[2]); }
    hips.position.y = hipBase + (p.hipY || 0); hips.position.x = p.hipX || 0; hips.position.z = p.hipZ || 0;
  }
  // fingers: values 0..1 curl per finger [index, middle, ring, pinky], thumb separately, spread
  function setFingers(side, c) {
    const F = fingers[side]; const k = [c.i ?? c.all ?? 0.2, c.m ?? c.all ?? 0.22, c.r ?? c.all ?? 0.25, c.p ?? c.all ?? 0.3];
    for (let f = 0; f < 4; f++) { const v = clamp(k[f]); const [j1, j2, j3] = F.f[f]; j1.rotation.x = -v * 1.35; j2.rotation.x = -v * 1.7; j3.rotation.x = -v * 1.0; j1.rotation.z = (c.spread || 0) * (f - 1.5) * 0.12 * F.thumbSide; }
    const t = clamp(c.t ?? c.all ?? 0.2); F.tb[0].rotation.x = F.thumbBase[0] - t * 0.5; F.tb[0].rotation.z = F.thumbBase[1] + t * 0.45 * F.thumbSide * 0 - t * 0.2 * F.thumbSide; F.tb[1].rotation.x = -t * 0.9;
  }
  function face(f = {}) {
    const open = f.mouth ?? 0, brow = f.brow ?? 0, lid = f.eyes ?? 1;
    mouth.scale.y = 0.6 + open * 7; mouthIn.scale.y = 0.4 + open * 12; mouthIn.visible = open > 0.05; mouth.scale.x = 1 + (f.wide || 0) * 0.2;
    for (const s of [1, -1]) { eyes["brow" + s].position.y = 0.14 + brow * 0.012; eyes["brow" + s].rotation.z = -0.1 * s + (f.furrow || 0) * 0.35 * s; eyes["lid" + s].position.y = lerp(0.108, 0.133, lid) + 0.001; eyes["lid" + s].scale.y = 1; eyes["lid" + s].visible = lid < 0.9; }
    // gaze
    const gx = f.gx || 0, gy = f.gy || 0; for (const s of [1, -1]) { eyes[s].rotation.set(-gy * 0.4, gx * 0.45, 0); }
  }
  return { root, J, hands, apply, setFingers, face, fingers };
}
