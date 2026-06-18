/**
 * Playfield — Bumpers en asset GLB (bumper.glb) poses sur le plateau Three.js.
 *
 * Le GLB est normalise une fois (centre sur X/Z, base posee a y = 0, mis a
 * l'echelle d'une empreinte cible), puis instancie a chaque emplacement. Le
 * collider est un trimesh extrait de la geometrie du GLB (collision fidele),
 * type "bumper" pour declencher score + impulsion radiale cote collisionHandler.
 *
 * Chaque body est statique et place a l'emplacement du bumper ; le mesh est
 * synchronise dessus (syncPairs) afin que le panneau debug puisse le deplacer.
 */
import * as THREE from "three";
import { loadBumperModel } from "../adapters/renderer/modelLoader.js";
import { getRapier } from "../adapters/physics/rapier/init.js";
import { createBodyHandle } from "../adapters/physics/rapier/bodyHandle.js";
import { MATERIALS } from "../adapters/physics/index.js";

// Emplacements en coordonnees physiques (plateau centre sur l'origine,
// surface a y = 0 ; Z negatif = haut du plateau). Disposition classique en
// triangle de pop-bumpers dans la moitie haute.
const BUMPER_PLACEMENTS = [
  { x: 0, z: -9.0 },
  { x: -2.8, z: -6.5 },
  { x: 2.8, z: -6.5 },
];

// Diametre cible (unites monde) de l'empreinte du bumper apres normalisation.
const BUMPER_FOOTPRINT = 1.5;

export async function buildGLBBumpers(world) {
  const RAPIER = getRapier();
  const gltf = await loadBumperModel();

  // -- Normalisation du prototype ------------------------------------------
  const proto = gltf.scene;
  proto.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(proto);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const scale = BUMPER_FOOTPRINT / Math.max(size.x, size.z, 1e-6);

  const pivot = new THREE.Group();
  proto.scale.setScalar(scale);
  proto.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
  pivot.add(proto);
  pivot.updateMatrixWorld(true);

  // -- Extraction des trimesh en repere local (pivot a l'origine) ----------
  const parts = [];
  const tmp = new THREE.Vector3();
  pivot.traverse((obj) => {
    if (!obj.isMesh) return;
    const geo = obj.geometry;
    const pos = geo?.attributes?.position;
    if (!pos) return;
    const verts = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      tmp.fromBufferAttribute(pos, i).applyMatrix4(obj.matrixWorld);
      verts[i * 3] = tmp.x;
      verts[i * 3 + 1] = tmp.y;
      verts[i * 3 + 2] = tmp.z;
    }
    // Geometrie non-indexee : triangles sequentiels (0,1,2,3,...).
    const indices = geo.index
      ? new Uint32Array(geo.index.array)
      : Uint32Array.from({ length: pos.count }, (_, i) => i);
    parts.push({ verts, indices });
  });

  if (parts.length === 0) {
    console.warn("[bumper] aucun trimesh extrait de bumper.glb");
  }

  // -- Instanciation --------------------------------------------------------
  const mat = MATERIALS.bumper;
  const syncPairs = [];
  const bumperDefs = [];

  BUMPER_PLACEMENTS.forEach((p, i) => {
    const x = p.x;
    const yPos = 0;
    const z = p.z;

    const rb = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(x, yPos, z),
    );
    const colliders = parts.map((part) =>
      world.createCollider(
        RAPIER.ColliderDesc.trimesh(part.verts, part.indices)
          .setFriction(mat.friction)
          .setRestitution(mat.restitution)
          .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
        rb,
      ),
    );
    const body = createBodyHandle(rb, world, {
      userData: { type: "bumper" },
      colliders,
    });

    const mesh = pivot.clone(true);
    mesh.position.set(x, yPos, z);

    syncPairs.push({ mesh, body });
    bumperDefs.push({
      name: `Bumper ${i + 1}`,
      body,
      mesh,
      ix: x,
      iy: yPos,
      iz: z,
      iry: 0,
    });
  });

  return { syncPairs, bumperDefs };
}
