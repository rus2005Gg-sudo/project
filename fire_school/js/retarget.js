import * as THREE from "three";
import { mergeVertices } from "../assets/vendor/addons/utils/BufferGeometryUtils.js";

/* Drives a skinned glTF character (Quaternius rig) from the procedural joint rig in human.js.
   Each mapped bone receives the driver joint's world-space rotation delta from its rest pose:
     boneWorld = driverWorld * inverse(driverRestWorld) * boneRestWorld
   so bone-axis conventions don't matter; only the two rest poses must agree, which calibrate() ensures
   by swinging the driver's limbs onto the model's rest-pose bone directions. */

const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _m = new THREE.Matrix4();
const wq = (o, out = new THREE.Quaternion()) => o.getWorldQuaternion(out);
const wp = (o, out = new THREE.Vector3()) => o.getWorldPosition(out);

export function prepareModel(gltfScene, colors = {}) {
  const meshes = [];
  gltfScene.traverse((o) => {
    if (!o.isSkinnedMesh) return;
    o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
    // smooth the faceted low-poly shading: weld, then rebuild normals
    const g = o.geometry; g.deleteAttribute("normal"); const mg = mergeVertices(g, 1e-4); mg.computeVertexNormals(); o.geometry = mg;
    const m = o.material.clone(); const c = colors[o.name] ?? colors[m.name]; if (c !== undefined) m.color.set(c); m.roughness = 0.75; m.metalness = 0; m.flatShading = false; m.side = THREE.DoubleSide; o.material = m; meshes.push(o);
  });
  return meshes;
}

export function makeRetarget(H, model) {
  const B = (n) => { const b = model.getObjectByName(n); if (!b) throw new Error("bone " + n); return b; };
  const F = H.fingers;
  const pairs = [["hips", H.J.hips, "Hips"], ["spine", H.J.spine, "Abdomen"], ["chest", H.J.chest, "Chest"], ["neck", H.J.neck, "Neck"], ["head", H.J.head, "Head"]];
  for (const s of ["L", "R"]) {
    pairs.push(["s" + s, H.J["s" + s], "UpperArm" + s], ["e" + s, H.J["e" + s], "LowerArm" + s], ["w" + s, H.hands[s], "Wrist" + s]);
    ["Index", "Middle", "Ring", "Pinky"].forEach((nm, f) => [0, 1, 2].forEach((k) => pairs.push([nm + s + k, F[s].f[f][k], nm + (k + 1) + s])));
    pairs.push(["tb" + s + 0, F[s].tb[0], "Thumb1" + s], ["tb" + s + 1, F[s].tb[1], "Thumb2" + s]);
    pairs.push(["h" + s, H.J["h" + s], "UpperLeg" + s], ["k" + s, H.J["k" + s], "LowerLeg" + s], ["a" + s, H.J["a" + s], "Foot" + s]);
  }
  const P = pairs.map(([key, drv, bone]) => ({ key, drv, bone: B(bone) }));
  // child bone used to read each bone's rest direction (for calibration of limb swing)
  const childOf = { UpperArm: "LowerArm", LowerArm: "Wrist", Wrist: "Middle1", UpperLeg: "LowerLeg", LowerLeg: "Foot" };
  const rootSave = { p: H.root.position.clone(), r: H.root.rotation.clone() };
  H.root.position.set(0, 0, 0); H.root.rotation.set(0, 0, 0); H.root.updateMatrixWorld(true); model.updateMatrixWorld(true);

  /* calibrate: zero pose, then swing driver limbs (parents first) onto the model's rest directions */
  H.apply({}); for (const s of ["L", "R"]) H.setFingers(s, { all: 0, t: 0 }); H.root.updateMatrixWorld(true);
  const swing = (drvJoint, boneA, boneB) => {
    const a = wp(boneA), b = wp(boneB); const want = b.sub(a).normalize();
    const cur = new THREE.Vector3(0, -1, 0).applyQuaternion(wq(drvJoint)).normalize();
    const qs = new THREE.Quaternion().setFromUnitVectors(cur, want);
    const pw = wq(drvJoint.parent); const jw = wq(drvJoint); const nw = qs.multiply(jw); drvJoint.quaternion.copy(pw.invert().multiply(nw)); drvJoint.updateMatrixWorld(true);
  };
  for (const s of ["L", "R"]) {
    swing(H.J["s" + s], B("UpperArm" + s), B("LowerArm" + s)); swing(H.J["e" + s], B("LowerArm" + s), B("Wrist" + s)); swing(H.J["w" + s], B("Wrist" + s), B("Middle1" + s));
    swing(H.J["h" + s], B("UpperLeg" + s), B("LowerLeg" + s)); swing(H.J["k" + s], B("LowerLeg" + s), B("Foot" + s));
    ["Index", "Middle", "Ring", "Pinky"].forEach((nm, f) => [0, 1, 2].forEach((k) => swing(F[s].f[f][k], B(nm + (k + 1) + s), B(nm + (k + 2) + s))));
    swing(F[s].tb[0], B("Thumb1" + s), B("Thumb2" + s)); swing(F[s].tb[1], B("Thumb2" + s), B("Thumb3" + s));
  }
  // record the calibrated driver rest as per-joint local offsets so poses are applied relative to it
  const calib = new Map(); for (const p of P) calib.set(p.drv, p.drv.quaternion.clone());
  H.root.updateMatrixWorld(true);
  for (const p of P) { p.drvRest = wq(p.drv); p.boneRest = wq(p.bone); }
  const hipsBone = B("Hips"); const hipsRestRoot = H.root.worldToLocal(wp(hipsBone)); const drvHipsRest = H.J.hips.position.clone();
  H.root.position.copy(rootSave.p); H.root.rotation.copy(rootSave.r);

  // per frame: reset() -> H.apply(pose) + setFingers -> calibrate() -> update(); pose angles are relative to the calibrated rest stance
  function reset() { for (const p of P) p.drv.quaternion.identity(); }
  function calibrate() { for (const p of P) { const c = calib.get(p.drv); p.drv.quaternion.premultiply(c); } }

  function update() {
    H.root.updateMatrixWorld(true);
    // hips translation
    const d = _v.copy(H.J.hips.position).sub(drvHipsRest); const target = H.root.localToWorld(_v2.copy(hipsRestRoot).add(d));
    hipsBone.parent.updateMatrixWorld(true); hipsBone.position.copy(hipsBone.parent.worldToLocal(target));
    for (const p of P) {
      const qd = wq(p.drv, _q); const delta = qd.multiply(_q2.copy(p.drvRest).invert()); const tw = delta.multiply(p.boneRest);
      const pw = wq(p.bone.parent, _q2); p.bone.quaternion.copy(pw.invert().multiply(tw)); p.bone.updateMatrixWorld(true);
    }
  }
  return { update, reset, calibrate, bone: B, pairs: P };
}

/* keep a prop glued to a model bone using an offset expressed in the model's rest (world, facing +Z) frame */
export function restAttach(retarget, prop, boneName, offset, restRot = new THREE.Quaternion()) {
  const bone = retarget.bone(boneName); const restQ = wq(bone).clone(); const restInv = restQ.clone().invert(); const off = new THREE.Vector3(...offset);
  return () => { const q = wq(bone); const d = q.clone().multiply(restInv); const p = off.clone().applyQuaternion(d).add(wp(bone)); prop.position.copy(p); prop.quaternion.copy(d).multiply(restRot); };
}
