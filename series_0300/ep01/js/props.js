import * as THREE from "three";
import { GLTFLoader } from "../assets/vendor/addons/loaders/GLTFLoader.js";

/* Poly Haven CC0 models placed into the procedural sets */
export async function furnish(W) {
  const L = new GLTFLoader(); const cache = {};
  const get = async (id) => (cache[id] ??= (await L.loadAsync(`assets/models/${id}/${id}.gltf`)).scene);
  const put = async (id, parent, x, y, z, ry = 0, s = 1) => {
    const o = (await get(id)).clone(true); o.position.set(x, y, z); o.rotation.y = ry; o.scale.setScalar(s);
    o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); parent.add(o); return o;
  };
  const C = W.school, X = W.ext;
  // classroom: two single desks + chairs per original double-desk slot
  for (const d of W.desks) {
    d.g.children.forEach((c) => (c.visible = false));
    for (const sx of [-0.33, 0.33]) { await put("SchoolDesk_01", d.g, sx, 0, 0, Math.PI); await put("SchoolChair_01", d.g, sx, 0, 0.62, Math.PI); }
  }
  await put("binder_notebook", W.desks[3].g, 0.33, 0.76, 0.0, 0.3); await put("clipboard", W.desks[0].g, -0.3, 0.76, 0.05, -0.4);
  await put("clipboard", C, 0.0, 0.81, -3.35, 0.2);
  await put("potted_plant_02", C, 3.0, 0, -4.0, 0.6); await put("potted_plant_02", C, -13.3, 0, 7.1, 1.2);
  await put("fire_alarm", C, 1.0, 1.5, 4.49, Math.PI, 1.6); await put("fire_alarm", C, -1.4, 1.5, 7.49, Math.PI, 1.6);
  W.extGroups.forEach((g) => g.children.forEach((c, i) => { if (i < 3) c.visible = false; }));
  await put("korean_fire_extinguisher_01", C, 8.2, 0, 7.3, Math.PI); await put("korean_fire_extinguisher_01", C, -2.3, 0, 7.3, Math.PI);
  await put("metal_trash_can", C, 3.2, 0, 7.25, Math.PI, 0.8);
}
