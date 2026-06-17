/**
 * Sol procédural du playfield — plan Three.js avec dégradé vertical simple.
 * Remplace le GLB-table comme surface visible. Les props (bumpers, rampes…)
 * viendront se poser dessus ensuite.
 */
import * as THREE from "three";

/** Texture canvas : dégradé vertical (haut → bas) de `top` vers `bottom`. */
function makeGradientTexture(top, bottom) {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Crée le sol dégradé couvrant le rectangle [minX,maxX]×[minZ,maxZ] (repère
 * local du levelGroup), élargi de `margin` pour ne pas laisser de bord visible.
 *
 * @param {object} opts
 * @param {number} opts.minX
 * @param {number} opts.maxX
 * @param {number} opts.minZ
 * @param {number} opts.maxZ
 * @param {number} [opts.y]        Hauteur du plan (surface de jeu ≈ 0).
 * @param {number} [opts.margin]   Débord ajouté tout autour.
 * @param {string} [opts.topColor] Couleur du haut (côté arche, -Z).
 * @param {string} [opts.bottomColor] Couleur du bas (côté joueur, +Z).
 */
export function createFloorMesh({
  minX,
  maxX,
  minZ,
  maxZ,
  y = 0,
  margin = 0.5,
  topColor = "#03130c",
  bottomColor = "#08291d",
} = {}) {
  const width = maxX - minX + margin * 2;
  const depth = maxZ - minZ + margin * 2;

  const geometry = new THREE.PlaneGeometry(width, depth);
  geometry.rotateX(-Math.PI / 2); // passe du plan XY au plan XZ (horizontal)

  const material = new THREE.MeshBasicMaterial({
    map: makeGradientTexture(topColor, bottomColor),
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "playfield-floor";
  mesh.position.set((minX + maxX) / 2, y, (minZ + maxZ) / 2);
  mesh.renderOrder = -1; // toujours dessiné en premier (sous les props)
  return mesh;
}
