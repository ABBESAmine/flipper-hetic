/**
 * Visuels néon du playfield — meshes Three.js stylisés posés sur les colliders
 * existants. Inspiré du style de PANDORMedia/fliphetic-pinball (vert émissif,
 * bumpers anneau + cap + halo, grille), adapté à notre convention d'axes
 * (X = largeur, Y = hauteur/gravité, Z = longueur).
 *
 * Principe : on ne recrée pas la géométrie à la main. On clone la géométrie des
 * meshes proxy (déjà calés sur les colliders) et on lit la transform depuis le
 * corps physique (fiable même si le proxy n'est positionné qu'au runtime).
 * Indépendant du système de debug : ces meshes-ci sont toujours visibles.
 */
import * as THREE from "three";

export const NEON = {
  green: 0x5dd86a,
  bright: 0xb6ffb6,
  dim: 0x1d6a2a,
};

/** Texture radiale réutilisée pour les halos (sprites additifs). */
export function glowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const g = canvas.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(210,255,210,1)");
  grad.addColorStop(0.28, "rgba(120,255,150,0.65)");
  grad.addColorStop(1, "rgba(0,40,10,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

/** Grille néon discrète posée sur le sol (repère visuel, style référence). */
export function createFloorGrid({ minX, maxX, minZ, maxZ, y = 0.02 }) {
  const size = Math.max(maxX - minX, maxZ - minZ);
  const divisions = Math.max(4, Math.round(size));
  const grid = new THREE.GridHelper(size, divisions, NEON.dim, 0x0c2c16);
  grid.position.set((minX + maxX) / 2, y, (minZ + maxZ) / 2);
  grid.material.opacity = 0.32;
  grid.material.transparent = true;
  return grid;
}
