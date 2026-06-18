/**
 * Playfield — Environnement statique en Three.js : le fond (plateau 9:16) et
 * les murs d'extremite. Chaque mesh visible a un collider box statique Rapier
 * aligne. Les obstacles (bumpers) sont des assets GLB ajoutes par-dessus, cf.
 * buildGLBBumpers.js.
 *
 * Convention d'axes (cf. domain/constants.js) :
 *   X = gauche/droite, Y = hauteur, Z = profondeur (Z+ = bas/joueur).
 *   Le plateau est centre sur l'origine, sa surface superieure a y = 0.
 */
import * as THREE from "three";
import {
  TABLE_WIDTH,
  TABLE_DEPTH,
  TABLE_THICKNESS,
  WALL_HEIGHT,
  WALL_THICKNESS,
  DRAIN_OPENING_WIDTH,
} from "../domain/constants.js";
import { createStaticBoxBody } from "../adapters/physics/index.js";

export function buildEnvironment(world) {
  const group = new THREE.Group();
  group.name = "playfield-environment";

  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x14213d,
    roughness: 0.55,
    metalness: 0.25,
    emissive: 0x05070f,
    emissiveIntensity: 0.4,
  });
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x4466ff,
    roughness: 0.35,
    metalness: 0.55,
    emissive: 0x0a1633,
    emissiveIntensity: 0.6,
  });

  // -- Fond 9:16 ------------------------------------------------------------
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(TABLE_WIDTH, TABLE_THICKNESS, TABLE_DEPTH),
    floorMat,
  );
  floor.position.set(0, -TABLE_THICKNESS / 2, 0);
  group.add(floor);

  // Surface texturee posee sur le plateau. Plan tourne de -90° sur X : il est
  // a plat, face vers le haut, et le haut de l'image (UV V=1) pointe vers
  // l'avant du plateau (Z negatif = fond/horizon), le bas vers le joueur.
  const tex = new THREE.TextureLoader().load("/models/texture_fond.png");
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const topPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(TABLE_WIDTH, TABLE_DEPTH),
    new THREE.MeshStandardMaterial({
      map: tex,
      emissive: 0xffffff,
      emissiveMap: tex,
      emissiveIntensity: 0.4,
      roughness: 0.7,
      metalness: 0.0,
    }),
  );
  topPlane.rotation.x = -Math.PI / 2;
  topPlane.position.set(0, 0.01, 0);
  group.add(topPlane);

  createStaticBoxBody(world, {
    width: TABLE_WIDTH,
    height: TABLE_THICKNESS,
    depth: TABLE_DEPTH,
    position: { x: 0, y: -TABLE_THICKNESS / 2, z: 0 },
    material: "table",
    type: "table",
  });

  // -- Murs d'extremite -----------------------------------------------------
  const hw = TABLE_WIDTH / 2;
  const hd = TABLE_DEPTH / 2;
  const wt = WALL_THICKNESS;
  const y = WALL_HEIGHT / 2;

  function addWall(w, h, d, x, wy, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    mesh.position.set(x, wy, z);
    group.add(mesh);
    createStaticBoxBody(world, {
      width: w,
      height: h,
      depth: d,
      position: { x, y: wy, z },
      type: "wall",
    });
    return mesh;
  }

  // Lateraux (couvrent toute la profondeur + epaisseur des murs haut/bas)
  addWall(wt, WALL_HEIGHT, TABLE_DEPTH + wt * 2, -hw - wt / 2, y, 0);
  addWall(wt, WALL_HEIGHT, TABLE_DEPTH + wt * 2, hw + wt / 2, y, 0);

  // Haut
  addWall(TABLE_WIDTH + wt * 2, WALL_HEIGHT, wt, 0, y, -hd - wt / 2);

  // Bas — deux segments avec l'ouverture du drain au centre
  const seg = (TABLE_WIDTH - DRAIN_OPENING_WIDTH) / 2;
  const bz = hd + wt / 2;
  addWall(seg, WALL_HEIGHT, wt, -(DRAIN_OPENING_WIDTH / 2 + seg / 2), y, bz);
  addWall(seg, WALL_HEIGHT, wt, DRAIN_OPENING_WIDTH / 2 + seg / 2, y, bz);

  return { group };
}
