/**
 * Playfield — Slingshots.
 *
 * Deux murs statiques inclines juste au-dessus des flippers. Leur extremite
 * basse est collee au pivot du flipper, l'extremite haute s'appuie contre
 * la paroi laterale. Ils ferment le corridor lateral pour que la bille ne
 * se coince plus dans les coins et la renvoient vers le centre.
 */
import * as THREE from "three";
import {
  TABLE_WIDTH,
  WALL_HEIGHT,
  FLIPPER_PIVOT_X,
  FLIPPER_PIVOT_Z,
  SLINGSHOT_DEPTH,
  SLINGSHOT_TOP_OFFSET,
} from "./constants.js";
import { createStaticBoxBody } from "./physics.js";

const SLINGSHOT_COLOR = 0x8b4513;

function createOneSlingshot(scene, world, side, material) {
  const isLeft = side === "left";

  // Extremite basse : exactement au pivot du flipper.
  const lowX = isLeft ? -FLIPPER_PIVOT_X : FLIPPER_PIVOT_X;
  const lowZ = FLIPPER_PIVOT_Z;
  // Extremite haute : contre la paroi laterale, plus haut dans le plateau.
  const highX = isLeft
    ? -TABLE_WIDTH / 2 + SLINGSHOT_DEPTH / 2
    : TABLE_WIDTH / 2 - SLINGSHOT_DEPTH / 2;
  const highZ = FLIPPER_PIVOT_Z - SLINGSHOT_TOP_OFFSET;

  const centerX = (lowX + highX) / 2;
  const centerZ = (lowZ + highZ) / 2;
  const length = Math.hypot(lowX - highX, lowZ - highZ);
  // Rotation Y : le vecteur local +X doit pointer de highEnd vers lowEnd.
  const angle = Math.atan2(-(lowZ - highZ), lowX - highX);

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(length, WALL_HEIGHT, SLINGSHOT_DEPTH),
    material,
  );
  mesh.position.set(centerX, WALL_HEIGHT / 2, centerZ);
  mesh.rotation.y = angle;
  scene.add(mesh);

  const body = createStaticBoxBody(world, {
    width: length,
    height: WALL_HEIGHT,
    depth: SLINGSHOT_DEPTH,
    position: { x: centerX, y: WALL_HEIGHT / 2, z: centerZ },
    rotationY: angle,
  });

  return { mesh, body };
}

/**
 * Cree les deux slingshots (gauche + droit) et retourne les couples
 * { mesh, body } a pousser dans syncPairs.
 */
export function createSlingshots(scene, world) {
  const material = new THREE.MeshStandardMaterial({ color: SLINGSHOT_COLOR });
  return [
    createOneSlingshot(scene, world, "left", material),
    createOneSlingshot(scene, world, "right", material),
  ];
}
