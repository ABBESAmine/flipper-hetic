/**
 * Playfield — Meshes Three.js des flippers.
 *
 * Chaque flipper est un Group (l'objet synchronisé par la boucle) contenant la
 * batte procédurale nommée "flipper-bat". On peut ainsi masquer la batte et lui
 * substituer un GLB enfant qui suit la rotation (cf. buildRefLevel).
 */
import * as THREE from "three";
import {
  FLIPPER_LENGTH,
  FLIPPER_WIDTH,
  FLIPPER_HEIGHT,
  FLIPPER_PIVOT_X,
  FLIPPER_PIVOT_Z,
  FLIPPER_PIVOT_Y,
  FLIPPER_OFFSET_X,
} from "../../domain/constants.js";

function createOneFlipperMesh(scene, side) {
  const isLeft = side === "left";
  const pivotX = (isLeft ? -FLIPPER_PIVOT_X : FLIPPER_PIVOT_X) + FLIPPER_OFFSET_X;
  const shapeOffsetX = isLeft ? FLIPPER_LENGTH / 2 : -FLIPPER_LENGTH / 2;

  const group = new THREE.Group();
  group.name = `flipper-${side}`;
  group.position.set(pivotX, FLIPPER_PIVOT_Y, FLIPPER_PIVOT_Z);

  const geometry = new THREE.BoxGeometry(FLIPPER_LENGTH, FLIPPER_HEIGHT, FLIPPER_WIDTH);
  geometry.translate(shapeOffsetX, 0, 0);
  const bat = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0x5dd86a, emissive: 0x5dd86a, emissiveIntensity: 1.0,
      metalness: 0.35, roughness: 0.3,
    }),
  );
  bat.name = "flipper-bat";
  group.add(bat);

  scene.add(group);
  return group;
}

export function createFlipperMeshes(scene) {
  return {
    left: createOneFlipperMesh(scene, "left"),
    right: createOneFlipperMesh(scene, "right"),
  };
}
