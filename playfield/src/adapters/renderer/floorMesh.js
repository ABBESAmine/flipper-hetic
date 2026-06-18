/**
 * Sol du playfield — plan Three.js. Soit une texture de fond (image peinte :
 * désert Breaking Bad, route, drain…), soit un dégradé vertical procédural en
 * fallback. Les props 3D (barils, rampes, anneaux…) se posent dessus.
 */
import * as THREE from "three";

const texLoader = new THREE.TextureLoader();

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
 * @param {string} [opts.topColor] Couleur du haut (côté arche, -Z) — fallback dégradé.
 * @param {string} [opts.bottomColor] Couleur du bas (côté joueur, +Z) — fallback dégradé.
 * @param {string} [opts.textureUrl] Image de fond peinte ; si fournie, remplace le dégradé.
 */
export function createFloorMesh({
  minX,
  maxX,
  minZ,
  maxZ,
  y = 0,
  margin = 0.5,
  topColor = "#1c130a",
  bottomColor = "#3c2a14",
  textureUrl = null,
} = {}) {
  const width = maxX - minX + margin * 2;
  const depth = maxZ - minZ + margin * 2;

  const geometry = new THREE.PlaneGeometry(width, depth);
  geometry.rotateX(-Math.PI / 2); // passe du plan XY au plan XZ (horizontal)

  // Texture peinte (haut image → -Z fond ; droite image → +X couloir/route) ou
  // dégradé procédural en l'absence d'image.
  let map;
  if (textureUrl) {
    map = texLoader.load(textureUrl);
    map.colorSpace = THREE.SRGBColorSpace;
  } else {
    map = makeGradientTexture(topColor, bottomColor);
  }

  const material = new THREE.MeshBasicMaterial({ map });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "playfield-floor";
  mesh.position.set((minX + maxX) / 2, y, (minZ + maxZ) / 2);
  mesh.renderOrder = -1; // toujours dessiné en premier (sous les props)
  return mesh;
}

/**
 * Plan « shadow-catcher » : transparent SAUF là où une ombre est projetée
 * (`ShadowMaterial`). Posé juste au-dessus du sol peint, il ajoute des ombres
 * portées (profondeur) sans altérer la texture du fond.
 */
export function createShadowCatcher({ minX, maxX, minZ, maxZ, y = 0.01, margin = 0.5, opacity = 0.38 } = {}) {
  const width = maxX - minX + margin * 2;
  const depth = maxZ - minZ + margin * 2;

  const geometry = new THREE.PlaneGeometry(width, depth);
  geometry.rotateX(-Math.PI / 2);

  const mesh = new THREE.Mesh(geometry, new THREE.ShadowMaterial({ opacity }));
  mesh.name = "playfield-shadow-catcher";
  mesh.position.set((minX + maxX) / 2, y, (minZ + maxZ) / 2);
  mesh.receiveShadow = true;
  return mesh;
}
