import * as THREE from "three";
import { GLTFLoader } from "../assets/vendor/addons/loaders/GLTFLoader.js";
import { clone as skClone } from "../assets/vendor/addons/utils/SkeletonUtils.js";
import { prepareModel } from "./retarget.js";

/* Background classmates: Quaternius rigs playing their own clips, deterministic via mixer.setTime(t). */
const FILES = ["F_Casual", "M_Punk", "F_Punk", "M_Beach", "F_Formal", "Casual_2"];
const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4();

export async function loadExtras() {
  const L = new GLTFLoader(); const src = {};
  for (const f of FILES) { const g = await L.loadAsync(`assets/chars/${f}.glb`); prepareModel(g.scene); src[f] = g; }
  return src;
}

/* spec: { file, pos:[x,y,z], yaw, clip, phase, look:true, laugh:0..1, tint:{meshName:color} } */
export function spawn(scene, src, spec) {
  const g = src[spec.file]; const o = skClone(g.scene); o.position.set(...spec.pos); o.rotation.y = spec.yaw || 0; scene.add(o);
  if (spec.tint) o.traverse((m) => { if (m.isSkinnedMesh && spec.tint[m.material.name] !== undefined) { m.material = m.material.clone(); m.material.color.set(spec.tint[m.material.name]); } });
  const mixer = new THREE.AnimationMixer(o); const clip = g.animations.find((a) => a.name === (spec.clip || "Idle")) || g.animations[0];
  const act = mixer.clipAction(clip); act.play();
  const head = o.getObjectByName("Head"), chest = o.getObjectByName("Chest");
  return { o, mixer, clip, head, chest, spec };
}

export function updateExtra(e, t, target) {
  const s = e.spec; e.mixer.setTime(((t * (s.speed || 1)) + (s.phase || 0)) % e.clip.duration);
  if (s.laugh) { const k = s.laugh * (0.5 + 0.5 * Math.sin(t * 13 + (s.phase || 0) * 7)); e.chest.rotateX(0.12 * k); e.head.rotateX(-0.18 * k); }
  if (s.look && target) { // turn head toward target (yaw only, limited)
    e.o.updateMatrixWorld(true); e.head.getWorldPosition(_v); const dx = target.x - _v.x, dz = target.z - _v.z;
    const want = Math.atan2(dx, dz) - e.o.rotation.y; let d = ((want + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; d = Math.max(-1.1, Math.min(1.1, d));
    e.head.getWorldQuaternion(_q); const add = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), d * (s.look === true ? 1 : s.look));
    const pw = new THREE.Quaternion(); e.head.parent.getWorldQuaternion(pw); e.head.quaternion.copy(pw.invert().multiply(add.multiply(_q)));
  }
}
